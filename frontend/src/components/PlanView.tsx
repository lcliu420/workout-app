import { PlusCircle, Trash2, Save } from 'lucide-react';
import { TrainingSession, Exercise } from '../types';

interface PlanViewProps {
  weekNumber: number;
  sessions: TrainingSession[];
  onUpdateSession: (sessionId: string, exercises: Exercise[]) => void;
  onAddSession: () => void;
  onRemoveSession: (sessionId: string) => void;
  onSave: () => void;
}

export default function PlanView({
  weekNumber,
  sessions,
  onUpdateSession,
  onAddSession,
  onRemoveSession,
  onSave,
}: PlanViewProps) {
  const handleInputChange = (
    sessionId: string,
    exerciseId: string,
    field: keyof Exercise,
    value: string | number,
  ) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const updatedExercises = session.exercises.map((exercise) => {
      if (exercise.id === exerciseId) {
        return { ...exercise, [field]: value };
      }
      return exercise;
    });

    onUpdateSession(sessionId, updatedExercises);
  };

  const handleAddRow = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const newExercise: Exercise = {
      id: Math.random().toString(36).slice(2, 11),
      name: '新动作',
      sets: 0,
      reps: 0,
      load: '0kg',
    };

    onUpdateSession(sessionId, [...session.exercises, newExercise]);
  };

  const handleRemoveRow = (sessionId: string, exerciseId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const updatedExercises = session.exercises.filter((exercise) => exercise.id !== exerciseId);
    onUpdateSession(sessionId, updatedExercises);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">本周计划</h2>
        <div className="flex items-center gap-3">
          <div className="text-blue-600 dark:text-blue-400 font-medium text-sm mr-2">第 {weekNumber} 周</div>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 text-sm font-bold"
          >
            <Save className="w-4 h-4" />
            <span>保存</span>
          </button>
        </div>
      </div>

      {sessions.map((session) => (
        <section key={session.id} className="space-y-4 relative group/session">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{session.title}</h3>
            </div>
            <button
              onClick={() => onRemoveSession(session.id)}
              className="opacity-0 group-hover/session:opacity-100 flex items-center gap-1 text-red-500 hover:text-red-600 transition-all text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除训练</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="w-1/3 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">动作</th>
                  <th className="w-24 px-2 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">负荷</th>
                  <th className="w-16 px-2 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">组数</th>
                  <th className="w-16 px-2 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">次数</th>
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {session.exercises.map((exercise) => (
                  <tr key={exercise.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(event) =>
                          handleInputChange(session.id, exercise.id, 'name', event.target.value)
                        }
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={exercise.load}
                        onChange={(event) =>
                          handleInputChange(session.id, exercise.id, 'load', event.target.value)
                        }
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 text-sm font-semibold text-blue-600 dark:text-blue-400 text-center"
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
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 text-sm text-slate-600 dark:text-slate-400 text-center"
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
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 text-sm text-slate-600 dark:text-slate-400 text-center"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(session.id, exercise.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-4 mt-3 px-1">
            <button
              onClick={() => handleAddRow(session.id)}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="text-sm font-bold">添加动作</span>
            </button>
          </div>
        </section>
      ))}

      <div className="pt-4 pb-8 flex justify-center">
        <button
          onClick={onAddSession}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-95 text-base font-bold w-full max-w-xs justify-center"
        >
          <PlusCircle className="w-5 h-5" />
          <span>增加训练</span>
        </button>
      </div>
    </div>
  );
}
