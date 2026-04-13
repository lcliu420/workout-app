export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  load: string;
  orderIndex: number;
}

export interface TrainingSession {
  id: string;
  title: string;
  exercises: Exercise[];
  orderIndex: number;
}

export interface WeeklyGroup {
  id: string;
  year: number;
  weekNumber: number;
  sessions: TrainingSession[];
  isLatest?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface TrainingOverview {
  currentWeekId: string;
  currentWeekNumber: number;
  currentYear: number;
  weeks: WeeklyGroup[];
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  requiresEmailConfirmation: boolean;
  message: string;
  user: UserProfile;
}

export interface PersistedSession {
  accessToken: string;
  refreshToken: string;
}

export type View = 'plan' | 'summary' | 'account';
