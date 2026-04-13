import { env } from '../config/env.js';

export function getIsoWeekParts(date = new Date()) {
  if (env.TRAINING_WEEK_OVERRIDE) {
    return {
      year: env.TRAINING_YEAR_OVERRIDE ?? date.getFullYear(),
      weekNumber: env.TRAINING_WEEK_OVERRIDE,
    };
  }

  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return {
    year: target.getUTCFullYear(),
    weekNumber,
  };
}
