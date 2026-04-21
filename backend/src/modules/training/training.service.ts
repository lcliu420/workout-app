import { HttpError } from '../../lib/http-error.js';
import { supabaseAdmin } from '../../lib/supabase.js';
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

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';
const PAGE_SIZE = 1000;

async function getOrCreateCurrentWeek(userId: string) {
  const { data: existingWeek, error: existingError } = await supabaseAdmin
    .from('training_weeks')
    .select('id, training_year, week_number, created_at')
    .eq('user_id', userId)
    .order('training_year', { ascending: false })
    .order('week_number', { ascending: false })
    .limit(1)
    .maybeSingle<WeekRow>();

  if (existingError) {
    throw new HttpError(500, `Failed to read current training week: ${existingError.message}`);
  }

  if (existingWeek) {
    return existingWeek;
  }

  const fallbackYear = new Date().getFullYear();

  const { data: createdWeek, error: createError } = await supabaseAdmin
    .from('training_weeks')
    .insert({
      user_id: userId,
      training_year: fallbackYear,
      week_number: 1,
    })
    .select('id, training_year, week_number, created_at')
    .single<WeekRow>();

  if (createError || !createdWeek) {
    throw new HttpError(
      500,
      `Failed to create current training week: ${createError?.message ?? 'unknown error'}`,
    );
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
    throw new HttpError(500, `Failed to read training week: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(404, 'Training week not found');
  }

  return data;
}

async function getOrCreateNextWeek(userId: string, currentWeek: WeekRow) {
  const nextWeekNumber = currentWeek.week_number + 1;

  const { data: existingWeek, error: existingError } = await supabaseAdmin
    .from('training_weeks')
    .select('id, training_year, week_number, created_at')
    .eq('user_id', userId)
    .eq('training_year', currentWeek.training_year)
    .eq('week_number', nextWeekNumber)
    .maybeSingle<WeekRow>();

  if (existingError) {
    throw new HttpError(500, `Failed to read next training week: ${existingError.message}`);
  }

  if (existingWeek) {
    return existingWeek;
  }

  const { data: createdWeek, error: createError } = await supabaseAdmin
    .from('training_weeks')
    .insert({
      user_id: userId,
      training_year: currentWeek.training_year,
      week_number: nextWeekNumber,
    })
    .select('id, training_year, week_number, created_at')
    .single<WeekRow>();

  if (createError || !createdWeek) {
    throw new HttpError(
      500,
      `Failed to create next training week: ${createError?.message ?? 'unknown error'}`,
    );
  }

  return createdWeek;
}

async function fetchWeekIds(userId: string) {
  const weekIds: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('training_weeks')
      .select('id')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new HttpError(500, `Failed to read training week ids: ${error.message}`);
    }

    const batch = (data ?? []).map((item) => item.id as string);
    weekIds.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return weekIds;
}

async function fetchTrainingGraph(userId: string) {
  const weekIds = await fetchWeekIds(userId);
  const filterWeekIds = weekIds.length > 0 ? weekIds : [EMPTY_UUID];

  const weeks: WeekRow[] = [];
  let weekFrom = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('training_weeks')
      .select('id, training_year, week_number, created_at')
      .eq('user_id', userId)
      .order('training_year', { ascending: false })
      .order('week_number', { ascending: false })
      .order('id', { ascending: true })
      .range(weekFrom, weekFrom + PAGE_SIZE - 1);

    if (error) {
      throw new HttpError(500, `Failed to read training weeks: ${error.message}`);
    }

    const batch = (data ?? []) as WeekRow[];
    weeks.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    weekFrom += PAGE_SIZE;
  }

  const sessions: SessionRow[] = [];
  let sessionFrom = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('training_sessions')
      .select('id, week_id, title, order_index, created_at')
      .in('week_id', filterWeekIds)
      .order('week_id', { ascending: true })
      .order('order_index', { ascending: true })
      .order('id', { ascending: true })
      .range(sessionFrom, sessionFrom + PAGE_SIZE - 1);

    if (error) {
      throw new HttpError(500, `Failed to read training sessions: ${error.message}`);
    }

    const batch = (data ?? []) as SessionRow[];
    sessions.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    sessionFrom += PAGE_SIZE;
  }

  const sessionIds = sessions.map((item) => item.id);
  const filterSessionIds = sessionIds.length > 0 ? sessionIds : [EMPTY_UUID];
  const exercises: ExerciseRow[] = [];
  let exerciseFrom = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('training_exercises')
      .select('id, session_id, name, sets, reps, load, order_index')
      .in('session_id', filterSessionIds)
      .order('session_id', { ascending: true })
      .order('order_index', { ascending: true })
      .order('id', { ascending: true })
      .range(exerciseFrom, exerciseFrom + PAGE_SIZE - 1);

    if (error) {
      throw new HttpError(500, `Failed to read training exercises: ${error.message}`);
    }

    const batch = (data ?? []) as ExerciseRow[];
    exercises.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    exerciseFrom += PAGE_SIZE;
  }

  return {
    weeks,
    sessions,
    exercises,
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
    throw new HttpError(500, `Failed to rebuild training exercises: ${deleteError.message}`);
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
    throw new HttpError(500, `Failed to save training exercises: ${insertError.message}`);
  }

  const { data: savedExercises, error: verifyError } = await supabaseAdmin
    .from('training_exercises')
    .select('order_index')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true });

  if (verifyError) {
    throw new HttpError(500, `Failed to verify saved exercises: ${verifyError.message}`);
  }

  if ((savedExercises ?? []).length !== exercises.length) {
    throw new HttpError(
      500,
      `Exercise row count mismatch: expected ${exercises.length}, got ${(savedExercises ?? []).length}.`,
    );
  }
}

async function saveWeekData(weekId: string, input: SaveCurrentWeekInput) {
  const { data: existingSessions, error: sessionsError } = await supabaseAdmin
    .from('training_sessions')
    .select('id')
    .eq('week_id', weekId);

  if (sessionsError) {
    throw new HttpError(500, `Failed to read existing training sessions: ${sessionsError.message}`);
  }

  const existingIds = new Set((existingSessions ?? []).map((item) => item.id as string));
  const incomingIds = new Set(input.sessions.map((session) => session.id).filter(Boolean) as string[]);

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from('training_sessions')
      .delete()
      .in('id', toDelete);

    if (deleteError) {
      throw new HttpError(500, `Failed to delete training sessions: ${deleteError.message}`);
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
        throw new HttpError(500, `Failed to update training session: ${updateError.message}`);
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
      throw new HttpError(
        500,
        `Failed to create training session: ${insertError?.message ?? 'unknown error'}`,
      );
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

export async function advanceCurrentWeek(userId: string, input: SaveCurrentWeekInput) {
  const currentWeek = await getOrCreateCurrentWeek(userId);
  await saveWeekData(currentWeek.id, input);

  const nextWeek = await getOrCreateNextWeek(userId, currentWeek);
  const graph = await fetchTrainingGraph(userId);

  return {
    currentWeekId: nextWeek.id,
    currentWeekNumber: nextWeek.week_number,
    currentYear: nextWeek.training_year,
    weeks: buildTrainingResponse(graph, nextWeek.id),
  };
}
