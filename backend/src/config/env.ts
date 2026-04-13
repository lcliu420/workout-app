import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://127.0.0.1:3000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TRAINING_YEAR_OVERRIDE: z.coerce.number().int().positive().optional(),
  TRAINING_WEEK_OVERRIDE: z.coerce.number().int().positive().optional(),
});

export const env = envSchema.parse(process.env);
