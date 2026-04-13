import { HttpError } from '../../lib/http-error.js';
import { supabaseAdmin } from '../../lib/supabase.js';
import { getIsoWeekParts } from '../../utils/date.js';
import type { SaveCurrentWeekInput } from './training.schemas.js';

type WeekRow = {
  id: string;
  training_year: number;
  week_number: number;
  created_at: string;
};

type SessionRow = {
  id: string;
  week_id: string;
  title: string;
  order_index: number;
  created_at: string;
};

type ExerciseRow = {
  id: string;
  session_id: string;
  name: string;
  sets: number;
  reps: number;
  load: string;
  order_index: number;
};

async function getOrCreateCurrentWeek(userId: string) {
  const { year, weekNumber } = getIsoWeekParts();

  const { data: existingWeek, error: existingError } = await supabaseAdmin
    .from('training_weeks')
    .select('id, training_year, week_number, created_at')
    .eq('user_id', userId)
    .eq('training_year', year)
    .eq('week_number', weekNumber)
    .maybeSingle<WeekRow>();

  if (existingError) {
    throw new HttpError(500, `读取当前训练周失败: ${existingError.message}`);
  }

  if (existingWeek) {
    return existingWeek;
  }

  const { data: createdWeek, error: createError } = await supabaseAdmin
    .from('training_weeks')
    .insert({
      user_id: userId,
      training_year: year,
      week_number: weekNumber,
    })
    .select('id, training_year, week_number, created_at')
    .single<WeekRow>();

  if (createError || !createdWeek) {
    throw new HttpError(500, `创建当前训练周失败: ${createError?.message ?? '未知错误'}`);
  }

  return createdWeek;
}

async function getWeekOrThrow(userId: string, weekId: string) {
  const { data, error } = await supabaseAdmin
    .from('training_weeks')
    .select('id, training_year, week_number, created_at')
    .eq('id', weekId)
    .eq('user_id', userId)
    .maybeSingle<WeekRow>();

  if (error) {
    throw new HttpError(500, `读取训练周失败: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(404, '未找到指定训练周');
  }

  return data;
}

async function fetchWeekIds(userId: string) {
  const { data, error } = await supabaseAdmin.from('training_weeks').select('id').eq('user_id', userId);

  if (error) {
    throw new HttpError(500, `读取训练周列表失败: ${error.message}`);
  }

  return (data ?? []).map((item) => item.id as string);
}

async function fetchTrainingGraph(userId: string) {
  const weekIds = await fetchWeekIds(userId);

  const { data: weeks, error: weeksError } = await supabaseAdmin
    .from('training_weeks')
    .select('id, training_year, week_number, created_at')
    .eq('user_id', userId)
    .order('training_year', { ascending: false })
    .order('week_number', { ascending: false });

  if (weeksError) {
    throw new HttpError(500, `读取训练周失败: ${weeksError.message}`);
  }

  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('training_sessions')
    .select('id, week_id, title, order_index, created_at')
    .in('week_id', weekIds.length > 0 ? weekIds : ['00000000-0000-0000-0000-000000000000'])
    .order('order_index', { ascending: true });

  if (sessionsError) {
    throw new HttpError(500, `读取训练课表失败: ${sessionsError.message}`);
  }

  const sessionIds = (sessions ?? []).map((item) => item.id);

  const { data: exercises, error: exercisesError } = await supabaseAdmin
    .from('training_exercises')
    .select('id, session_id, name, sets, reps, load, order_index')
    .in('session_id', sessionIds.length > 0 ? sessionIds : ['00000000-0000-0000-0000-000000000000'])
    .order('order_index', { ascending: true });

  if (exercisesError) {
    throw new HttpError(500, `读取训练动作失败: ${exercisesError.message}`);
  }

  return {
    weeks: (weeks ?? []) as WeekRow[],
    sessions: (sessions ?? []) as SessionRow[],
    exercises: (exercises ?? []) as ExerciseRow[],
  };
}

function buildTrainingResponse(
  graph: { weeks: WeekRow[]; sessions: SessionRow[]; exercises: ExerciseRow[] },
  currentWeekId: string,
) {
  return graph.weeks.map((week) => ({
    id: week.id,
    year: week.training_year,
    weekNumber: week.week_number,
    isLatest: week.id === currentWeekId,
    sessions: graph.sessions
      .filter((session) => session.week_id === week.id)
      .sort((left, right) => left.order_index - right.order_index)
      .map((session) => ({
        id: session.id,
        title: session.title,
        orderIndex: session.order_index,
        exercises: graph.exercises
          .filter((exercise) => exercise.session_id === session.id)
          .sort((left, right) => left.order_index - right.order_index)
          .map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            load: exercise.load,
            orderIndex: exercise.order_index,
          })),
      })),
  }));
}

async function replaceExercises(
  sessionId: string,
  exercises: SaveCurrentWeekInput['sessions'][number]['exercises'],
) {
  const { error: deleteError } = await supabaseAdmin
    .from('training_exercises')
    .delete()
    .eq('session_id', sessionId);

  if (deleteError) {
    throw new HttpError(500, `重建训练动作失败: ${deleteError.message}`);
  }

  if (exercises.length === 0) {
    return;
  }

  const { error: insertError } = await supabaseAdmin.from('training_exercises').insert(
    exercises.map((exercise, index) => ({
      session_id: sessionId,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      load: exercise.load,
      order_index: exercise.orderIndex ?? index,
    })),
  );

  if (insertError) {
    throw new HttpError(500, `保存训练动作失败: ${insertError.message}`);
  }
}

async function saveWeekData(weekId: string, input: SaveCurrentWeekInput) {
  const { data: existingSessions, error: sessionsError } = await supabaseAdmin
    .from('training_sessions')
    .select('id')
    .eq('week_id', weekId);

  if (sessionsError) {
    throw new HttpError(500, `读取现有训练失败: ${sessionsError.message}`);
  }

  const existingIds = new Set((existingSessions ?? []).map((item) => item.id as string));
  const incomingIds = new Set(input.sessions.map((session) => session.id).filter(Boolean) as string[]);

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabaseAdmin.from('training_sessions').delete().in('id', toDelete);
    if (deleteError) {
      throw new HttpError(500, `删除训练失败: ${deleteError.message}`);
    }
  }

  for (let index = 0; index < input.sessions.length; index += 1) {
    const session = input.sessions[index];

    if (session.id && existingIds.has(session.id)) {
      const { error: updateError } = await supabaseAdmin
        .from('training_sessions')
        .update({
          title: session.title,
          order_index: session.orderIndex ?? index,
        })
        .eq('id', session.id)
        .eq('week_id', weekId);

      if (updateError) {
        throw new HttpError(500, `更新训练失败: ${updateError.message}`);
      }

      await replaceExercises(session.id, session.exercises);
      continue;
    }

    const { data: createdSession, error: insertError } = await supabaseAdmin
      .from('training_sessions')
      .insert({
        week_id: weekId,
        title: session.title,
        order_index: session.orderIndex ?? index,
      })
      .select('id')
      .single<{ id: string }>();

    if (insertError || !createdSession) {
      throw new HttpError(500, `创建训练失败: ${insertError?.message ?? '未知错误'}`);
    }

    await replaceExercises(createdSession.id, session.exercises);
  }
}

export async function getTrainingOverview(userId: string) {
  const currentWeek = await getOrCreateCurrentWeek(userId);
  const graph = await fetchTrainingGraph(userId);

  return {
    currentWeekId: currentWeek.id,
    currentWeekNumber: currentWeek.week_number,
    currentYear: currentWeek.training_year,
    weeks: buildTrainingResponse(graph, currentWeek.id),
  };
}

export async function saveCurrentWeek(userId: string, input: SaveCurrentWeekInput) {
  const currentWeek = await getOrCreateCurrentWeek(userId);
  await saveWeekData(currentWeek.id, input);
  return getTrainingOverview(userId);
}

export async function saveWeekById(userId: string, weekId: string, input: SaveCurrentWeekInput) {
  await getWeekOrThrow(userId, weekId);
  await saveWeekData(weekId, input);
  return getTrainingOverview(userId);
}
