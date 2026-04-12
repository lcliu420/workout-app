/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { View, WeeklyGroup, Exercise, TrainingSession } from './types';
import TopAppBar from './components/TopAppBar';
import BottomNavBar from './components/BottomNavBar';
import SummaryView from './components/SummaryView';
import PlanView from './components/PlanView';
import AccountView from './components/AccountView';
import AuthView from './components/AuthView';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';
import { motion, AnimatePresence } from 'motion/react';

const SESSION_NUMERALS = ['一', '二', '三', '四', '五', '六', '七'];

const MOCK_DATA: WeeklyGroup[] = [
  {
    weekNumber: 40,
    isLatest: true,
    sessions: [
      {
        id: 's1',
        title: '第一次训练',
        exercises: [
          { id: 'e1', name: '杠铃深蹲', sets: 4, reps: 8, load: '100kg' },
          { id: 'e2', name: '腿举', sets: 3, reps: 12, load: '180kg' },
          { id: 'e3', name: '坐姿提踵', sets: 4, reps: 15, load: '40kg' },
        ],
      },
      {
        id: 's2',
        title: '第二次训练',
        exercises: [
          { id: 'e4', name: '卧推', sets: 5, reps: 5, load: '85kg' },
          { id: 'e5', name: '上斜哑铃推举', sets: 3, reps: 10, load: '28kg' },
          { id: 'e6', name: '绳索夹胸', sets: 3, reps: 15, load: '15kg' },
        ],
      },
      {
        id: 's3',
        title: '第三次训练',
        exercises: [
          { id: 'e7', name: '硬拉', sets: 3, reps: 5, load: '140kg' },
          { id: 'e8', name: '引体向上', sets: 4, reps: 8, load: '自重' },
          { id: 'e9', name: '杠铃划船', sets: 4, reps: 10, load: '70kg' },
        ],
      },
    ],
  },
  {
    weekNumber: 39,
    sessions: [
      {
        id: 's4',
        title: '第一次训练',
        exercises: [
          { id: 'e10', name: '推举', sets: 4, reps: 8, load: '50kg' },
          { id: 'e11', name: '侧平举', sets: 4, reps: 12, load: '10kg' },
          { id: 'e12', name: '面拉', sets: 3, reps: 15, load: '20kg' },
        ],
      },
      {
        id: 's5',
        title: '第二次训练',
        exercises: [
          { id: 'e13', name: '直腿硬拉', sets: 4, reps: 10, load: '90kg' },
          { id: 'e14', name: '腿屈伸', sets: 3, reps: 15, load: '60kg' },
          { id: 'e15', name: '俯卧腿弯举', sets: 3, reps: 12, load: '45kg' },
        ],
      },
    ],
  },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<View>('summary');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [trainingData, setTrainingData] = useState<WeeklyGroup[]>(MOCK_DATA);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    sessionId: string | null;
    sessionTitle: string | null;
  }>({
    isOpen: false,
    sessionId: null,
    sessionTitle: null,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  };

  const handleUpdateSession = (sessionId: string, exercises: Exercise[]) => {
    setTrainingData((prev) =>
      prev.map((group) => ({
        ...group,
        sessions: group.sessions.map((session) =>
          session.id === sessionId ? { ...session, exercises } : session,
        ),
      })),
    );
  };

  const handleAddSession = () => {
    setTrainingData((prev) => {
      const newData = [...prev];
      const latestWeek = newData[0];
      const nextSessionNum = latestWeek.sessions.length + 1;
      const newSession: TrainingSession = {
        id: Math.random().toString(36).slice(2, 11),
        title: `第${SESSION_NUMERALS[nextSessionNum - 1] ?? nextSessionNum}次训练`,
        exercises: [],
      };

      newData[0] = {
        ...latestWeek,
        sessions: [...latestWeek.sessions, newSession],
      };

      return newData;
    });
  };

  const initiateRemoveSession = (sessionId: string) => {
    const session = trainingData[0].sessions.find((item) => item.id === sessionId);
    if (session) {
      setConfirmState({
        isOpen: true,
        sessionId,
        sessionTitle: session.title,
      });
    }
  };

  const handleConfirmRemove = () => {
    if (confirmState.sessionId) {
      setTrainingData((prev) =>
        prev.map((group) => ({
          ...group,
          sessions: group.sessions.filter((session) => session.id !== confirmState.sessionId),
        })),
      );
      showToast(`已删除 ${confirmState.sessionTitle}`);
    }

    setConfirmState({ isOpen: false, sessionId: null, sessionTitle: null });
  };

  const handleSaveData = () => {
    showToast('正在保存到数据库...');
    setTimeout(() => {
      showToast('保存成功！');
    }, 1000);
  };

  const handleLogin = (message: string) => {
    setIsLoggedIn(true);
    setActiveView('account');
    showToast(message);
  };

  if (!isLoggedIn) {
    return <AuthView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'plan':
        return (
          <PlanView
            weekNumber={40}
            sessions={trainingData[0].sessions}
            onUpdateSession={handleUpdateSession}
            onAddSession={handleAddSession}
            onRemoveSession={initiateRemoveSession}
            onSave={handleSaveData}
          />
        );
      case 'summary':
        return <SummaryView data={trainingData} />;
      case 'account':
        return <AccountView onAction={showToast} onLogout={() => setIsLoggedIn(false)} />;
      default:
        return <SummaryView data={trainingData} />;
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case 'plan':
        return '训练计划';
      case 'summary':
        return '健身备忘录';
      case 'account':
        return '个人中心';
      default:
        return '健身备忘录';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      <TopAppBar title={getTitle()} />

      <main className="pt-20 pb-32 px-4 max-w-5xl mx-auto">
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
        message={`您确定要删除“${confirmState.sessionTitle}”吗？此操作不可撤销，该训练下的所有动作记录都会被清除。`}
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmState({ isOpen: false, sessionId: null, sessionTitle: null })}
      />
    </div>
  );
}
