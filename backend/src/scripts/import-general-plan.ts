import { createRequire } from 'module';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const require = createRequire(import.meta.url);
const XLSX = require('../../../frontend/node_modules/xlsx');

const workbookPath = path.resolve(process.cwd(), '../plan-import.xlsx');
const workbook = XLSX.readFile(workbookPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_EMAIL = '1328119115@qq.com';
const SESSION_START_COLUMNS = [1, 4, 7, 10, 13, 16];
const WEEK_ROW_MARKER_FIRST = 31532;
const WEEK_ROW_MARKER_LAST = 21608;
const YEAR = new Date().getFullYear();

function isWeekLabel(value: string) {
  return (
    value.length >= 3 &&
    value.charCodeAt(0) === WEEK_ROW_MARKER_FIRST &&
    value.charCodeAt(value.length - 1) === WEEK_ROW_MARKER_LAST
  );
}

function extractWeekNumber(label: string) {
  const matched = label.match(/\d+/);
  if (!matched) {
    throw new Error(`Unable to parse week number from label: ${label}`);
  }

  return Number(matched[0]);
}

function parseSessions(headerRow: string[], bodyRows: string[][]) {
  return SESSION_START_COLUMNS.map((startColumn, sessionIndex) => {
    const title = String(headerRow[startColumn] ?? '').trim();
    const exercises: Array<{
      name: string;
      load: string;
      sets: number;
      reps: number;
      orderIndex: number;
    }> = [];

    let lastExerciseName = '';

    for (const row of bodyRows) {
      const rawName = String(row[startColumn] ?? '').trim();
      const rawLoad = String(row[startColumn + 1] ?? '').trim();
      const rawPrescription = String(row[startColumn + 2] ?? '').trim();

      if (!rawName && !rawLoad && !rawPrescription) {
        continue;
      }

      const name = rawName || lastExerciseName;
      if (!name) {
        continue;
      }

      lastExerciseName = name;

      const [setsText = '0', repsText = '0'] = rawPrescription.split('*');
      const sets = Number.parseInt(setsText, 10) || 0;
      const reps = Number.parseInt(repsText, 10) || 0;

      exercises.push({
        name,
        load: rawLoad,
        sets,
        reps,
        orderIndex: exercises.length,
      });
    }

    if (!title && exercises.length === 0) {
      return null;
    }

    return {
      title: title || `Session ${sessionIndex + 1}`,
      orderIndex: sessionIndex,
      exercises,
    };
  }).filter(Boolean) as Array<{
    title: string;
    orderIndex: number;
    exercises: Array<{
      name: string;
      load: string;
      sets: number;
      reps: number;
      orderIndex: number;
    }>;
  }>;
}

function buildWeekPayloads() {
  const weekRows: Array<{ rowIndex: number; label: string }> = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const label = String(rows[rowIndex]?.[0] ?? '').trim();
    if (isWeekLabel(label)) {
      weekRows.push({ rowIndex, label });
    }
  }

  return weekRows.map((week, index) => {
    const nextWeek = weekRows[index + 1];
    const headerRow = rows[week.rowIndex];
    const bodyRows = rows.slice(week.rowIndex + 1, nextWeek ? nextWeek.rowIndex : rows.length);

    return {
      weekNumber: extractWeekNumber(week.label),
      sessions: parseSessions(headerRow, bodyRows),
    };
  });
}

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', TARGET_EMAIL)
    .single<{ id: string; email: string }>();

  if (profileError || !profile) {
    throw new Error(`Target user not found: ${TARGET_EMAIL}: ${profileError?.message ?? 'unknown error'}`);
  }

  const { error: deleteError } = await supabase.from('training_weeks').delete().eq('user_id', profile.id);
  if (deleteError) {
    throw new Error(`Failed to clear existing training data: ${deleteError.message}`);
  }

  const weekPayloads = buildWeekPayloads();

  for (const weekPayload of weekPayloads) {
    const { data: week, error: weekError } = await supabase
      .from('training_weeks')
      .insert({
        user_id: profile.id,
        training_year: YEAR,
        week_number: weekPayload.weekNumber,
      })
      .select('id')
      .single<{ id: string }>();

    if (weekError || !week) {
      throw new Error(`Failed to create week ${weekPayload.weekNumber}: ${weekError?.message ?? 'unknown error'}`);
    }

    for (const session of weekPayload.sessions) {
      const { data: sessionRow, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          week_id: week.id,
          title: session.title,
          order_index: session.orderIndex,
        })
        .select('id')
        .single<{ id: string }>();

      if (sessionError || !sessionRow) {
        throw new Error(`Failed to create session ${session.title}: ${sessionError?.message ?? 'unknown error'}`);
      }

      if (session.exercises.length > 0) {
        const { error: exerciseError } = await supabase.from('training_exercises').insert(
          session.exercises.map((exercise) => ({
            session_id: sessionRow.id,
            name: exercise.name,
            load: exercise.load,
            sets: exercise.sets,
            reps: exercise.reps,
            order_index: exercise.orderIndex,
          })),
        );

        if (exerciseError) {
          throw new Error(`Failed to import exercises for ${session.title}: ${exerciseError.message}`);
        }
      }
    }
  }

  const latestWeekNumber = weekPayloads.reduce(
    (maxWeekNumber, weekPayload) => Math.max(maxWeekNumber, weekPayload.weekNumber),
    0,
  );

  console.log(
    JSON.stringify(
      {
        importedWeeks: weekPayloads.length,
        latestWeekNumber,
        targetEmail: TARGET_EMAIL,
      },
      null,
      2,
    ),
  );
}

await main();
