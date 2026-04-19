import type { AuthResponse, TrainingOverview, UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  body?: unknown;
  token?: string;
};

type SaveWeekInput = {
  sessions: Array<{
    id?: string;
    title: string;
    orderIndex: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      load: string;
      orderIndex: number;
    }>;
  }>;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string } & T;

  if (!response.ok) {
    throw new ApiError(payload.message ?? '请求失败，请稍后再试。');
  }

  return payload;
}

export function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function loginUser(input: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function getCurrentUser(token: string) {
  return request<{ user: UserProfile }>('/auth/me', { token });
}

export function updateProfile(
  token: string,
  input: { displayName: string; avatarUrl: string | null },
) {
  return request<{ user: UserProfile }>('/profile', {
    method: 'PATCH',
    body: input,
    token,
  });
}

export function requestEmailChange(
  token: string,
  input: { email: string; refreshToken: string },
) {
  return request<{ message: string }>('/profile/email', {
    method: 'PATCH',
    body: input,
    token,
  });
}

export function getTrainingOverview(token: string) {
  return request<TrainingOverview>('/training/weeks', { token });
}

export function saveCurrentWeek(token: string, input: SaveWeekInput) {
  return request<TrainingOverview>('/training/weeks/current', {
    method: 'PUT',
    body: input,
    token,
  });
}

export function advanceCurrentWeek(token: string, input: SaveWeekInput) {
  return request<TrainingOverview>('/training/weeks/current/advance', {
    method: 'POST',
    body: input,
    token,
  });
}

export function saveTrainingWeek(token: string, weekId: string, input: SaveWeekInput) {
  return request<TrainingOverview>(`/training/weeks/${weekId}`, {
    method: 'PUT',
    body: input,
    token,
  });
}
