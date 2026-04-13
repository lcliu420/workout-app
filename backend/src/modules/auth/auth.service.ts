import type { AuthResponse } from '../../types/auth.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { supabaseAdmin, supabaseAuth } from '../../lib/supabase.js';
import { HttpError } from '../../lib/http-error.js';
import { translateSupabaseAuthError } from './auth.errors.js';

type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
};

async function getProfileOrThrow(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, avatar_url')
    .eq('id', userId)
    .single<ProfileRow>();

  if (error || !data) {
    throw new HttpError(404, '未找到用户资料');
  }

  return data;
}

async function syncProfileEmailIfNeeded(userId: string, authEmail: string) {
  const profile = await getProfileOrThrow(userId);
  if (profile.email === authEmail) {
    return profile;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ email: authEmail })
    .eq('id', userId)
    .select('id, email, display_name, avatar_url')
    .single<ProfileRow>();

  if (error || !data) {
    throw new HttpError(500, `同步邮箱资料失败: ${error?.message ?? '未知错误'}`);
  }

  return data;
}

function buildAuthResponse(
  session: { access_token: string; refresh_token: string } | null,
  profile: ProfileRow,
  options?: {
    requiresEmailConfirmation?: boolean;
    message?: string;
  },
): AuthResponse {
  return {
    accessToken: session?.access_token ?? null,
    refreshToken: session?.refresh_token ?? null,
    requiresEmailConfirmation: options?.requiresEmailConfirmation ?? false,
    message: options?.message ?? '操作成功',
    user: {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    },
  };
}

export async function register(input: RegisterInput) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    throw new HttpError(400, translateSupabaseAuthError(error?.message ?? '注册失败'));
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    email: input.email,
    display_name: input.displayName,
    avatar_url: null,
  });

  if (profileError) {
    throw new HttpError(500, `创建用户资料失败: ${profileError.message}`);
  }

  const profile = await getProfileOrThrow(data.user.id);
  return buildAuthResponse(data.session, profile, {
    requiresEmailConfirmation: !data.session,
    message: data.session ? '注册成功。' : '注册成功，请先完成邮箱验证后再登录。',
  });
}

export async function login(input: LoginInput) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user || !data.session) {
    throw new HttpError(401, translateSupabaseAuthError(error?.message ?? '邮箱或密码错误'));
  }

  const profile = await getProfileOrThrow(data.user.id);
  return buildAuthResponse(data.session, profile, {
    message: '登录成功。',
  });
}

export async function getCurrentUser(userId: string, authEmail?: string) {
  const profile = authEmail
    ? await syncProfileEmailIfNeeded(userId, authEmail)
    : await getProfileOrThrow(userId);

  return {
    user: {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    },
  };
}
