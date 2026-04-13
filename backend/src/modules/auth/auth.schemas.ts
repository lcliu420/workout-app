import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('请输入合法邮箱'),
  password: z.string().min(6, '密码至少需要 6 位'),
  displayName: z.string().trim().min(2, '昵称至少需要 2 个字符').max(24, '昵称不能超过 24 个字符'),
});

export const loginSchema = z.object({
  email: z.string().email('请输入合法邮箱'),
  password: z.string().min(6, '密码至少需要 6 位'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
