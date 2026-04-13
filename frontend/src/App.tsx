import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  Exercise,
  PersistedSession,
  TrainingOverview,
  TrainingSession,
  UserProfile,
  View,
  WeeklyGroup,
} from './types';
import {
  ApiError,
  getCurrentUser,
  getTrainingOverview,
  loginUser,
  requestEmailChange,
  registerUser,
  saveCurrentWeek,
  saveTrainingWeek,
  updateProfile,
} from './lib/api';
import TopAppBar from './components/TopAppBar';
import BottomNavBar from './components/BottomNavBar';
import SummaryView from './components/SummaryView';
import PlanView from './components/PlanView';
import AccountView from './components/AccountView';
import AuthView from './components/AuthView';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';

const SESSION_STORAGE_KEY = 'fitness-app-session';
const SESSION_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八'];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readStoredSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed.accessToken || !parsed.refreshToken) return null;

    return parsed;
  } catch {
    return null;
  }
}

function persistSession(session: PersistedSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function createLocalId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

function createExercise(orderIndex: number): Exercise {
  return {
    id: createLocalId('exercise'),
    name: '新动作',
    sets: 0,
    reps: 0,
    load: '0kg',
    orderIndex,
  };
}

function getLatestWeek(weeks: WeeklyGroup[]) {
  return weeks.find((week) => week.isLatest) ?? weeks[0] ?? null;
}

function getSessionTitle(index: number) {
  const numeral = SESSION_NUMERALS[index];
  return `第${numeral ?? index + 1}次训练`;
}

function sanitizeSessionsForSave(sessions: TrainingSession[]) {
  return sessions.map((session, sessionIndex) => ({
    ...(UUID_PATTERN.test(session.id) ? { id: session.id } : {}),
    title: getSessionTitle(sessionIndex),
    orderIndex: sessionIndex,
    exercises: session.exercises.map((exercise, exerciseIndex) => ({
      name: exercise.name.trim() || '未命名动作',
      sets: Math.max(0, exercise.sets),
      reps: Math.max(0, exercise.reps),
      load: exercise.load.trim() || '0kg',
      orderIndex: exerciseIndex,
    })),
  }));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '请求失败，请稍后再试。';
}

export default function App() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>(
    'loading',
  );
  const [authSession, setAuthSession] = useState<PersistedSession | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<View>('summary');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [trainingOverview, setTrainingOverview] = useState<TrainingOverview | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isTrainingLoading, setIsTrainingLoading] = useState(false);
  const [isSavingWeek, setIsSavingWeek] = useState(false);
  const [savingSummaryWeekId, setSavingSummaryWeekId] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    weekId: string | null;
    sessionId: string | null;
    sessionTitle: string | null;
  }>({
    isOpen: false,
    weekId: null,
    sessionId: null,
    sessionTitle: null,
  });

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const bootstrap = async () => {
      const storedSession = readStoredSession();
      if (!storedSession) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        setIsTrainingLoading(true);
        const [me, overview] = await Promise.all([
          getCurrentUser(storedSession.accessToken),
          getTrainingOverview(storedSession.accessToken),
        ]);

        setAuthSession(storedSession);
        setUser(me.user);
        setTrainingOverview(overview);
        setAuthStatus('authenticated');
      } catch {
        persistSession(null);
        setAuthSession(null);
        setUser(null);
        setTrainingOverview(null);
        setAuthStatus('unauthenticated');
      } finally {
        setIsTrainingLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const currentWeeks = trainingOverview?.weeks ?? [];
  const currentWeek = getLatestWeek(currentWeeks);

  const updateWeek = (weekId: string, updater: (week: WeeklyGroup) => WeeklyGroup) => {
    setTrainingOverview((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        weeks: previous.weeks.map((week) => (week.id === weekId ? updater(week) : week)),
      };
    });
  };

  const resetConfirmState = () => {
    setConfirmState({
      isOpen: false,
      weekId: null,
      sessionId: null,
      sessionTitle: null,
    });
  };

  const handleAuthentication = async (input: {
    mode: 'login' | 'register';
    email: string;
    password: string;
    displayName?: string;
  }) => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);

      const response =
        input.mode === 'register'
          ? await registerUser({
              email: input.email,
              password: input.password,
              displayName: input.displayName ?? '',
            })
          : await loginUser({
              email: input.email,
              password: input.password,
            });

      if (response.requiresEmailConfirmation || !response.accessToken || !response.refreshToken) {
        setAuthStatus('unauthenticated');
        showToast(response.message || '注册成功，请完成邮箱验证后再登录。');
        return;
      }

      const nextSession: PersistedSession = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };

      persistSession(nextSession);
      setAuthSession(nextSession);
      setUser(response.user);
      setAuthStatus('authenticated');
      setActiveView('summary');

      setIsTrainingLoading(true);
      const overview = await getTrainingOverview(response.accessToken);
      setTrainingOverview(overview);
      showToast(response.message || (input.mode === 'register' ? '注册成功。' : '登录成功。'));
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsAuthenticating(false);
      setIsTrainingLoading(false);
    }
  };

  const handleLogout = () => {
    persistSession(null);
    setAuthSession(null);
    setUser(null);
    setTrainingOverview(null);
    setAuthError(null);
    setActiveView('summary');
    setAuthStatus('unauthenticated');
    showToast('已退出登录。');
  };

  const handleUpdateCurrentWeekSession = (sessionId: string, exercises: Exercise[]) => {
    if (!currentWeek) return;

    updateWeek(currentWeek.id, (week) => ({
      ...week,
      sessions: week.sessions.map((session) =>
        session.id === sessionId ? { ...session, exercises } : session,
      ),
    }));
  };

  const handleUpdateSummarySession = (
    weekId: string,
    sessionId: string,
    exercises: Exercise[],
  ) => {
    updateWeek(weekId, (week) => ({
      ...week,
      sessions: week.sessions.map((session) =>
        session.id === sessionId ? { ...session, exercises } : session,
      ),
    }));
  };

  const handleAddSession = () => {
    if (!currentWeek) return;

    updateWeek(currentWeek.id, (week) => {
      const newSession: TrainingSession = {
        id: createLocalId('session'),
        title: getSessionTitle(week.sessions.length),
        orderIndex: week.sessions.length,
        exercises: [],
      };

      return {
        ...week,
        sessions: [...week.sessions, newSession],
      };
    });
  };

  const handleAddSummarySession = (weekId: string) => {
    updateWeek(weekId, (week) => {
      const newSession: TrainingSession = {
        id: createLocalId('session'),
        title: getSessionTitle(week.sessions.length),
        orderIndex: week.sessions.length,
        exercises: [createExercise(0)],
      };

      return {
        ...week,
        sessions: [...week.sessions, newSession],
      };
    });
  };

  const handleAddSummaryExercise = (weekId: string, sessionId: string) => {
    updateWeek(weekId, (week) => ({
      ...week,
      sessions: week.sessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        return {
          ...session,
          exercises: [...session.exercises, createExercise(session.exercises.length)],
        };
      }),
    }));
  };

  const initiateRemoveSession = (weekId: string, sessionId: string) => {
    const week = trainingOverview?.weeks.find((item) => item.id === weekId);
    const session = week?.sessions.find((item) => item.id === sessionId);
    if (!week || !session) return;

    setConfirmState({
      isOpen: true,
      weekId,
      sessionId,
      sessionTitle: session.title,
    });
  };

  const handleConfirmRemove = () => {
    if (!confirmState.sessionId || !confirmState.weekId) return;

    updateWeek(confirmState.weekId, (week) => ({
      ...week,
      sessions: week.sessions
        .filter((session) => session.id !== confirmState.sessionId)
        .map((session, index) => ({
          ...session,
          title: getSessionTitle(index),
          orderIndex: index,
        })),
    }));

    showToast(`已移除 ${confirmState.sessionTitle}`);
    resetConfirmState();
  };

  const handleSaveData = async () => {
    if (!authSession || !currentWeek) return;

    try {
      setIsSavingWeek(true);
      const overview = await saveCurrentWeek(authSession.accessToken, {
        sessions: sanitizeSessionsForSave(currentWeek.sessions),
      });
      setTrainingOverview(overview);
      showToast('本周训练计划已同步到云端。');
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setIsSavingWeek(false);
    }
  };

  const handleSaveSummaryWeek = async (weekId: string) => {
    if (!authSession || !trainingOverview) return;

    const week = trainingOverview.weeks.find((item) => item.id === weekId);
    if (!week) return;

    try {
      setSavingSummaryWeekId(weekId);
      const overview = await saveTrainingWeek(authSession.accessToken, weekId, {
        sessions: sanitizeSessionsForSave(week.sessions),
      });
      setTrainingOverview(overview);
      showToast(`第 ${week.weekNumber} 周的训练已保存。`);
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setSavingSummaryWeekId(null);
    }
  };

  const handleSaveProfile = async (input: { displayName: string; avatarUrl: string | null }) => {
    if (!authSession) return;

    try {
      setIsSavingProfile(true);
      const response = await updateProfile(authSession.accessToken, input);
      setUser(response.user);
      showToast('个人资料已更新。');
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestEmailChange = async (input: { email: string }) => {
    if (!authSession) {
      throw new Error('当前登录状态已失效，请重新登录后再试。');
    }

    try {
      setIsUpdatingEmail(true);
      const response = await requestEmailChange(authSession.accessToken, {
        email: input.email,
        refreshToken: authSession.refreshToken,
      });
      showToast(response.message);
    } catch (error) {
      const message = getErrorMessage(error);
      showToast(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          <p className="text-sm text-slate-500">正在初始化训练系统...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <AuthView
        onAuthenticate={handleAuthentication}
        isPending={isAuthenticating}
        errorMessage={authError}
      />
    );
  }

  const renderView = () => {
    if (isTrainingLoading || !trainingOverview || !user || !currentWeek) {
      return (
        <div className="space-y-3 py-24 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          <p className="text-sm text-slate-500">正在同步云端训练数据...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'plan':
        return (
          <PlanView
            weekNumber={trainingOverview.currentWeekNumber}
            sessions={currentWeek.sessions}
            isSaving={isSavingWeek}
            onUpdateSession={handleUpdateCurrentWeekSession}
            onAddSession={handleAddSession}
            onRemoveSession={(sessionId) => initiateRemoveSession(currentWeek.id, sessionId)}
            onSave={handleSaveData}
          />
        );
      case 'account':
        return (
          <AccountView
            user={user}
            isSaving={isSavingProfile}
            isUpdatingEmail={isUpdatingEmail}
            onSaveProfile={handleSaveProfile}
            onRequestEmailChange={handleRequestEmailChange}
            onLogout={handleLogout}
          />
        );
      case 'summary':
      default:
        return (
          <SummaryView
            data={trainingOverview.weeks}
            savingWeekId={savingSummaryWeekId}
            onUpdateSession={handleUpdateSummarySession}
            onAddExercise={handleAddSummaryExercise}
            onAddSession={handleAddSummarySession}
            onRemoveSession={initiateRemoveSession}
            onSaveWeek={handleSaveSummaryWeek}
          />
        );
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case 'plan':
        return '训练计划';
      case 'account':
        return '个人中心';
      case 'summary':
      default:
        return '训练总览';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopAppBar title={getTitle()} />

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavBar activeView={activeView} onViewChange={setActiveView} />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title="确认删除训练？"
        message={`你确定要删除“${confirmState.sessionTitle ?? ''}”吗？这次删除会在下次保存时同步到云端。`}
        onConfirm={handleConfirmRemove}
        onCancel={resetConfirmState}
      />
    </div>
  );
}
