import { z } from 'zod';

const dataUrlPattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, '昵称至少需要 2 个字符')
    .max(24, '昵称不能超过 24 个字符'),
  avatarUrl: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || /^https?:\/\//.test(value) || dataUrlPattern.test(value),
      '头像必须是有效的图片地址或本地图片数据',
    )
    .transform((value) => value || null)
    .nullable(),
});

export const requestEmailChangeSchema = z.object({
  email: z.string().trim().email('请输入有效的邮箱地址'),
  refreshToken: z.string().trim().min(1, '缺少刷新令牌'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
