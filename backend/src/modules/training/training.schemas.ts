import { z } from 'zod';

export const exerciseInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, '动作名称不能为空').max(60, '动作名称过长'),
  sets: z.number().int().min(0).max(99),
  reps: z.number().int().min(0).max(999),
  load: z.string().trim().max(40),
  orderIndex: z.number().int().min(0).optional(),
});

export const sessionInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, '训练标题不能为空').max(60),
  orderIndex: z.number().int().min(0).optional(),
  exercises: z.array(exerciseInputSchema).max(30),
});

export const saveCurrentWeekSchema = z.object({
  sessions: z.array(sessionInputSchema).max(14),
});

export type SaveCurrentWeekInput = z.infer<typeof saveCurrentWeekSchema>;
