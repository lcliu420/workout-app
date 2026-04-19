import { CalendarPlus, PlusCircle, Save, Trash2 } from 'lucide-react';
import type { Exercise, TrainingSession } from '../types';

interface PlanViewProps {
  weekNumber: number;
  sessions: TrainingSession[];
  isSaving: boolean;
  isAdvancingWeek: boolean;
  onUpdateSession: (sessionId: string, exercises: Exercise[]) => void;
  onAddSession: () => void;
  onRemoveSession: (sessionId: string) => void;
  onSave: () => Promise<void>;
  onAdvanceWeek: () => void;
}

function createEmptyExercise(): Exercise {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `exercise-${crypto.randomUUID()}`
        : `exercise-${Math.random().toString(36).slice(2, 11)}`,
    name: '新动作',
    sets: 0,
    reps: 0,
    load: '0kg',
    orderIndex: 0,
  };
}

export default function PlanView({
  weekNumber,
  sessions,
  isSaving,
  isAdvancingWeek,
  onUpdateSession,
  onAddSession,
  onRemoveSession,
  onSave,
  onAdvanceWeek,
}: PlanViewProps) {
  const handleInputChange = (
    sessionId: string,
    exerciseId: string,
    field: keyof Exercise,
    value: string | number,
  ) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const updatedExercises = session.exercises.map((exercise, index) => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          [field]: value,
          orderIndex: index,
        };
      }

      return {
        ...exercise,
        orderIndex: index,
      };
    });

    onUpdateSession(sessionId, updatedExercises);
  };

  const handleAddRow = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const nextExercise = {
      ...createEmptyExercise(),
      orderIndex: session.exercises.length,
    };

    onUpdateSession(sessionId, [...session.exercises, nextExercise]);
  };

  const handleRemoveRow = (sessionId: string, exerciseId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const updatedExercises = session.exercises
      .filter((exercise) => exercise.id !== exerciseId)
      .map((exercise, index) => ({
        ...exercise,
        orderIndex: index,
      }));

    onUpdateSession(sessionId, updatedExercises);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">本周训练计划</h2>
          <p className="mt-1 text-sm text-slate-500">第 {weekNumber} 周的训练安排会同步保存到云端。</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAdvanceWeek}
            disabled={isSaving || isAdvancingWeek}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition-all active:scale-95 disabled:opacity-60 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>{isAdvancingWeek ? '开启中...' : '开启新一周'}</span>
          </button>
          <button
            onClick={() => void onSave()}
            disabled={isSaving || isAdvancingWeek}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-slate-500">
          当前周还没有训练课表，先添加一节训练开始规划吧。
        </div>
      )}

      {sessions.map((session) => (
        <section key={session.id} className="group/session relative space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-blue-600"></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{session.title}</h3>
            </div>
            <button
              onClick={() => onRemoveSession(session.id)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>删除训练</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="w-1/3 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    动作
                  </th>
                  <th className="w-24 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    负荷
                  </th>
                  <th className="w-16 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    组数
                  </th>
                  <th className="w-16 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    次数
                  </th>
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {session.exercises.map((exercise) => (
                  <tr
                    key={exercise.id}
                    className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(event) =>
                          handleInputChange(session.id, exercise.id, 'name', event.target.value)
                        }
                        className="w-full rounded border-none bg-transparent px-2 py-1 text-sm font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={exercise.load}
                        onChange={(event) =>
                          handleInputChange(session.id, exercise.id, 'load', event.target.value)
                        }
                        className="w-full rounded border-none bg-transparent px-2 py-1 text-center text-sm font-semibold text-blue-600 focus:ring-1 focus:ring-blue-500 dark:text-blue-400"
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(event) =>
                          handleInputChange(
                            session.id,
                            exercise.id,
                            'sets',
                            Number.parseInt(event.target.value, 10) || 0,
                          )
                        }
                        className="w-full rounded border-none bg-transparent px-1 py-1 text-center text-sm text-slate-600 focus:ring-1 focus:ring-blue-500 dark:text-slate-400"
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        type="number"
                        value={exercise.reps}
                        onChange={(event) =>
                          handleInputChange(
                            session.id,
                            exercise.id,
                            'reps',
                            Number.parseInt(event.target.value, 10) || 0,
                          )
                        }
                        className="w-full rounded border-none bg-transparent px-1 py-1 text-center text-sm text-slate-600 focus:ring-1 focus:ring-blue-500 dark:text-slate-400"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(session.id, exercise.id)}
                        className="text-slate-300 transition-all hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-end gap-4 px-1">
            <button
              onClick={() => handleAddRow(session.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="text-sm font-bold">添加动作</span>
            </button>
          </div>
        </section>
      ))}

      <div className="flex justify-center pb-8 pt-4">
        <button
          onClick={onAddSession}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg transition-all active:scale-95 hover:bg-blue-700"
        >
          <PlusCircle className="h-5 w-5" />
          <span>新增训练</span>
        </button>
      </div>
    </div>
  );
}
