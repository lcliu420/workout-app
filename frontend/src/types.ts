export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  load: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface WeeklyGroup {
  weekNumber: number;
  sessions: TrainingSession[];
  isLatest?: boolean;
}

export type View = 'plan' | 'summary' | 'account' | 'auth';
