import { Download, History, PlusCircle, Save, Trash2, Verified } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Exercise, WeeklyGroup } from '../types';

interface SummaryViewProps {
  data: WeeklyGroup[];
  savingWeekId: string | null;
  onUpdateSession: (weekId: string, sessionId: string, exercises: Exercise[]) => void;
  onAddExercise: (weekId: string, sessionId: string) => void;
  onAddSession: (weekId: string) => void;
  onRemoveSession: (weekId: string, sessionId: string) => void;
  onSaveWeek: (weekId: string) => Promise<void>;
}

const SESSION_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八'];

function getSessionTitle(index: number) {
  const numeral = SESSION_NUMERALS[index];
  return `第${numeral ?? index + 1}次训练`;
}

export default function SummaryView({
  data,
  savingWeekId,
  onUpdateSession,
  onAddExercise,
  onAddSession,
  onRemoveSession,
  onSaveWeek,
}: SummaryViewProps) {
  const handleExport = () => {
    const aoa: string[][] = [];

    data.forEach((group) => {
      const headerRow: string[] = [`第${group.weekNumber}周`];
      group.sessions.forEach((_, sessionIndex) => {
        headerRow.push(getSessionTitle(sessionIndex), '', '');
      });
      aoa.push(headerRow);

      const maxExercises = Math.max(0, ...group.sessions.map((session) => session.exercises.length));
      for (let index = 0; index < maxExercises; index += 1) {
        const row: string[] = [''];
        group.sessions.forEach((session) => {
          const exercise = session.exercises[index];
          if (!exercise) {
            row.push('', '', '');
            return;
          }

          row.push(exercise.name, exercise.load, `${exercise.sets}x${exercise.reps}`);
        });
        aoa.push(row);
      }

      aoa.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '训练总览');
    XLSX.writeFile(workbook, `健身训练总览_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExerciseChange = (
    weekId: string,
    sessionId: string,
    exercises: Exercise[],
    exerciseId: string,
    field: keyof Exercise,
    value: string | number,
  ) => {
    const nextExercises = exercises.map((exercise, index) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            [field]: value,
            orderIndex: index,
          }
        : {
            ...exercise,
            orderIndex: index,
          },
    );

    onUpdateSession(weekId, sessionId, nextExercises);
  };

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            训练总览
          </h2>
          <p className="mt-1 text-xs text-slate-500">总览里的训练按周分别保存。</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          <span>导出 Excel</span>
        </button>
      </section>

      {data.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-slate-500">
          暂无训练记录，先去计划页创建本周训练吧。
        </div>
      )}

      {data.map((group) => (
        <section key={group.id} className={`space-y-3 ${!group.isLatest ? 'opacity-90' : ''}`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                第{group.weekNumber}周训练
              </h3>
              {group.isLatest ? (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  当前周
                </span>
              ) : (
                <History className="h-4 w-4 text-slate-300" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddSession(group.id)}
                title="新增训练"
                aria-label="新增训练"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => void onSaveWeek(group.id)}
                disabled={savingWeekId === group.id}
                title={savingWeekId === group.id ? '保存中' : '保存本周'}
                aria-label={savingWeekId === group.id ? '保存中' : '保存本周'}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Save className={`h-3.5 w-3.5 ${savingWeekId === group.id ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-2 pb-3 md:grid-cols-2 xl:grid-cols-3">
            {group.sessions.map((session, sessionIndex) => (
              <div
                key={session.id}
                className="min-w-0 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {getSessionTitle(sessionIndex)}
                  </h4>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => onAddExercise(group.id, session.id)}
                      title="添加动作"
                      aria-label="添加动作"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveSession(group.id, session.id)}
                      title="删除训练"
                      aria-label="删除训练"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <table className="w-full table-auto border-collapse text-center">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
                      <th className="px-1.5 pb-1.5 text-center">动作</th>
                      <th className="px-1.5 pb-1.5 text-center">负荷</th>
                      <th className="px-1.5 pb-1.5 text-center">组数</th>
                      <th className="px-1.5 pb-1.5 text-center">次数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.exercises.map((exercise) => (
                      <tr
                        key={exercise.id}
                        className="border-b border-slate-50 last:border-0 dark:border-slate-800/70"
                      >
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            value={exercise.name}
                            onChange={(event) =>
                              handleExerciseChange(
                                group.id,
                                session.id,
                                session.exercises,
                                exercise.id,
                                'name',
                                event.target.value,
                              )
                            }
                            className="w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-center text-[10px] font-medium text-slate-700 outline-none focus:border-blue-200 focus:bg-blue-50/40 dark:text-slate-200 dark:focus:bg-blue-900/20"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            value={exercise.load}
                            onChange={(event) =>
                              handleExerciseChange(
                                group.id,
                                session.id,
                                session.exercises,
                                exercise.id,
                                'load',
                                event.target.value,
                              )
                            }
                            className="w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-center text-[10px] font-semibold text-blue-600 outline-none focus:border-blue-200 focus:bg-blue-50/40 dark:text-blue-400 dark:focus:bg-blue-900/20"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(event) =>
                              handleExerciseChange(
                                group.id,
                                session.id,
                                session.exercises,
                                exercise.id,
                                'sets',
                                Number.parseInt(event.target.value, 10) || 0,
                              )
                            }
                            className="w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-center text-[10px] text-slate-600 outline-none focus:border-blue-200 focus:bg-blue-50/40 dark:text-slate-300 dark:focus:bg-blue-900/20"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            value={exercise.reps}
                            onChange={(event) =>
                              handleExerciseChange(
                                group.id,
                                session.id,
                                session.exercises,
                                exercise.id,
                                'reps',
                                Number.parseInt(event.target.value, 10) || 0,
                              )
                            }
                            className="w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-center text-[10px] text-slate-600 outline-none focus:border-blue-200 focus:bg-blue-50/40 dark:text-slate-300 dark:focus:bg-blue-900/20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      ))}

      {data.length > 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
            <Verified className="h-7 w-7 text-blue-300 dark:text-blue-500" />
          </div>
          <p className="text-xs text-slate-400">所有历史周训练都可以在这里统一维护。</p>
        </div>
      )}
    </div>
  );
}
