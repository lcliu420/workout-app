import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { supabaseAdmin } from '../../lib/supabase.js';
import { HttpError } from '../../lib/http-error.js';
import { translateSupabaseAuthError } from '../auth/auth.errors.js';
import type { RequestEmailChangeInput, UpdateProfileInput } from './profile.schemas.js';

type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
};

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      display_name: input.displayName,
      avatar_url: input.avatarUrl,
    })
    .eq('id', userId)
    .select('id, email, display_name, avatar_url')
    .single<ProfileRow>();

  if (error || !data) {
    throw new HttpError(500, `更新资料失败: ${error?.message ?? '未知错误'}`);
  }

  return {
    user: {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
    },
  };
}

export async function requestEmailChange(
  userId: string,
  accessToken: string,
  input: RequestEmailChangeInput,
) {
  const userScopedClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: sessionError } = await userScopedClient.auth.setSession({
    access_token: accessToken,
    refresh_token: input.refreshToken,
  });

  if (sessionError) {
    throw new HttpError(401, '登录状态已失效，请重新登录后再修改邮箱');
  }

  const { error: updateError } = await userScopedClient.auth.updateUser({
    email: input.email,
  });

  if (updateError) {
    throw new HttpError(400, translateSupabaseAuthError(updateError.message));
  }

  await supabaseAdmin
    .from('profiles')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', userId);

  return {
    message: '验证邮件已发送到新邮箱，请按邮件提示完成验证。验证完成后重新登录即可同步邮箱。',
  };
}
