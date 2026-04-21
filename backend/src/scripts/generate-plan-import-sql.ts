import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const require = createRequire(import.meta.url);
const XLSX = require('../../../frontend/node_modules/xlsx');

type Exercise = {
  name: string;
  load: string;
  sets: number;
  reps: number;
  orderIndex: number;
};

type Session = {
  title: string;
  orderIndex: number;
  exercises: Exercise[];
};

type WeekPayload = {
  weekNumber: number;
  sessions: Session[];
};

const SESSION_START_COLUMNS = [1, 4, 7, 10, 13, 16];
const WEEK_ROW_MARKER_FIRST = 31532;
const WEEK_ROW_MARKER_LAST = 21608;
const SESSION_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八'];

function resolveWorkbookPath() {
  const configuredPath = process.env.PLAN_IMPORT_FILE?.trim();
  if (!configuredPath) {
    return path.resolve(process.cwd(), '../plan-import.xlsx');
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function resolveOutputPath() {
  const configuredPath = process.env.PLAN_IMPORT_SQL_OUTPUT?.trim();
  if (!configuredPath) {
    return path.resolve(process.cwd(), 'plan-import.generated.sql');
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function resolveWeekFilter() {
  const configuredWeek = process.env.PLAN_IMPORT_ONLY_WEEK?.trim();
  if (!configuredWeek) {
    return null;
  }

  const weekNumber = Number.parseInt(configuredWeek, 10);
  if (Number.isNaN(weekNumber) || weekNumber <= 0) {
    throw new Error(`Invalid PLAN_IMPORT_ONLY_WEEK value: ${configuredWeek}`);
  }

  return weekNumber;
}

function resolveWeekRange() {
  const startRaw = process.env.PLAN_IMPORT_START_WEEK?.trim();
  const endRaw = process.env.PLAN_IMPORT_END_WEEK?.trim();

  if (!startRaw && !endRaw) {
    return null;
  }

  if (!startRaw || !endRaw) {
    throw new Error('PLAN_IMPORT_START_WEEK and PLAN_IMPORT_END_WEEK must be set together.');
  }

  const startWeek = Number.parseInt(startRaw, 10);
  const endWeek = Number.parseInt(endRaw, 10);

  if (Number.isNaN(startWeek) || Number.isNaN(endWeek) || startWeek <= 0 || endWeek <= 0) {
    throw new Error(`Invalid week range: ${startRaw}-${endRaw}`);
  }

  if (startWeek > endWeek) {
    throw new Error(`Invalid week range: start week ${startWeek} is greater than end week ${endWeek}`);
  }

  return { startWeek, endWeek };
}

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

function parsePrescription(rawPrescription: string) {
  const normalized = rawPrescription.replace(/[xX×]/g, '*').trim();
  const [setsText = '0', repsText = '0'] = normalized.split('*');

  return {
    sets: Number.parseInt(setsText, 10) || 0,
    reps: Number.parseInt(repsText, 10) || 0,
  };
}

function parseSessions(headerRow: string[], bodyRows: string[][]): Session[] {
  return SESSION_START_COLUMNS.map((startColumn, sessionIndex) => {
    const title = String(headerRow[startColumn] ?? '').trim();
    const exercises: Exercise[] = [];
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
      const { sets, reps } = parsePrescription(rawPrescription);

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

    const normalizedTitle = `第${SESSION_NUMERALS[sessionIndex] ?? sessionIndex + 1}次训练`;

    return {
      title: normalizedTitle || title || `Session ${sessionIndex + 1}`,
      orderIndex: sessionIndex,
      exercises,
    };
  }).filter(Boolean) as Session[];
}

function buildWeekPayloads(rows: string[][]): WeekPayload[] {
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

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildSql(weekPayloads: WeekPayload[], workbookPath: string) {
  const targetEmail = process.env.PLAN_IMPORT_TARGET_EMAIL?.trim() || 'YOUR_LOGIN_EMAIL@example.com';
  const importYear = Number.parseInt(process.env.PLAN_IMPORT_YEAR ?? '', 10) || new Date().getFullYear();

  const lines: string[] = [];
  lines.push('-- Generated by backend/src/scripts/generate-plan-import-sql.ts');
  lines.push(`-- Source workbook: ${workbookPath}`);
  lines.push(`-- Generated at: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('begin;');
  lines.push('');
  lines.push('do $$');
  lines.push('declare');
  lines.push(`  target_email text := ${sqlString(targetEmail)};`);
  lines.push(`  import_year int := ${importYear};`);
  lines.push('  target_profile_id uuid;');
  lines.push('  current_week_id uuid;');
  lines.push('  current_session_id uuid;');
  lines.push('begin');
  lines.push('  select id into target_profile_id');
  lines.push('  from public.profiles');
  lines.push('  where email = target_email;');
  lines.push('');
  lines.push('  if target_profile_id is null then');
  lines.push("    raise exception 'Target profile not found for email: %', target_email;");
  lines.push('  end if;');
  lines.push('');
  lines.push("  delete from public.training_weeks where user_id = target_profile_id;");
  lines.push('');

  for (const week of weekPayloads) {
    lines.push('  insert into public.training_weeks (user_id, training_year, week_number)');
    lines.push(`  values (target_profile_id, import_year, ${week.weekNumber})`);
    lines.push('  returning id into current_week_id;');
    lines.push('');

    for (const session of week.sessions) {
      lines.push('  insert into public.training_sessions (week_id, title, order_index)');
      lines.push(
        `  values (current_week_id, ${sqlString(session.title)}, ${session.orderIndex})`,
      );
      lines.push('  returning id into current_session_id;');

      if (session.exercises.length > 0) {
        lines.push('');
        lines.push(
          '  insert into public.training_exercises (session_id, name, sets, reps, load, order_index)',
        );
        lines.push('  values');
        session.exercises.forEach((exercise, index) => {
          const suffix = index === session.exercises.length - 1 ? ';' : ',';
          lines.push(
            `    (current_session_id, ${sqlString(exercise.name)}, ${exercise.sets}, ${exercise.reps}, ${sqlString(exercise.load)}, ${exercise.orderIndex})${suffix}`,
          );
        });
      } else {
        lines.push('');
      }
    }
  }

  lines.push('end $$;');
  lines.push('');
  lines.push('commit;');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const workbookPath = resolveWorkbookPath();
  const outputPath = resolveOutputPath();
  const onlyWeek = resolveWeekFilter();
  const weekRange = resolveWeekRange();

  if (onlyWeek && weekRange) {
    throw new Error('PLAN_IMPORT_ONLY_WEEK cannot be used together with PLAN_IMPORT_START_WEEK/PLAN_IMPORT_END_WEEK.');
  }

  const workbook = XLSX.readFile(workbookPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const allWeekPayloads = buildWeekPayloads(rows);
  const weekPayloads = onlyWeek
    ? allWeekPayloads.filter((weekPayload) => weekPayload.weekNumber === onlyWeek)
    : weekRange
      ? allWeekPayloads.filter(
          (weekPayload) =>
            weekPayload.weekNumber >= weekRange.startWeek &&
            weekPayload.weekNumber <= weekRange.endWeek,
        )
      : allWeekPayloads;

  if (weekPayloads.length === 0) {
    throw new Error(
      onlyWeek
        ? `No training plan data found for week ${onlyWeek}`
        : weekRange
          ? `No training plan data found for weeks ${weekRange.startWeek}-${weekRange.endWeek}`
        : 'No training plan data found in workbook',
    );
  }

  const sql = buildSql(weekPayloads, workbookPath);

  await fs.writeFile(outputPath, sql, 'utf8');

  console.log(
    JSON.stringify(
      {
        workbookPath,
        outputPath,
        importedWeeks: weekPayloads.length,
        onlyWeek,
        weekRange,
        latestWeekNumber: weekPayloads.reduce(
          (maxWeekNumber, weekPayload) => Math.max(maxWeekNumber, weekPayload.weekNumber),
          0,
        ),
      },
      null,
      2,
    ),
  );
}

await main();
