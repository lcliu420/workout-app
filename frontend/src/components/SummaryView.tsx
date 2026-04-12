import { History, Verified, Download } from 'lucide-react';
import { WeeklyGroup } from '../types';
import TrainingCard from './TrainingCard';
import * as XLSX from 'xlsx';

interface SummaryViewProps {
  data: WeeklyGroup[];
}

export default function SummaryView({ data }: SummaryViewProps) {
  const currentYear = new Date().getFullYear();

  const handleExport = () => {
    const aoa: string[][] = [];

    data.forEach((group) => {
      const headerRow: string[] = [`第${group.weekNumber}周`];
      group.sessions.forEach((session) => {
        headerRow.push(session.title, '', '');
      });
      aoa.push(headerRow);

      const maxExercises = Math.max(0, ...group.sessions.map((session) => session.exercises.length));

      for (let i = 0; i < maxExercises; i += 1) {
        const row: string[] = [''];
        group.sessions.forEach((session) => {
          const exercise = session.exercises[i];
          if (exercise) {
            const prevExercise = i > 0 ? session.exercises[i - 1] : null;
            const displayName = prevExercise?.name === exercise.name ? '' : exercise.name;

            row.push(displayName, exercise.load, `${exercise.sets}*${exercise.reps}`);
          } else {
            row.push('', '', '');
          }
        });
        aoa.push(row);
      }

      aoa.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '训练记录');
    XLSX.writeFile(workbook, `健身训练记录_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="space-y-10">
      <section className="px-2 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {currentYear} 年度训练
          </h2>
          <p className="text-sm text-slate-500 mt-1">年度健身历程记录</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 text-sm font-bold"
        >
          <Download className="w-4 h-4" />
          <span>导出 Excel</span>
        </button>
      </section>

      {data.map((group) => (
        <section key={group.weekNumber} className={`space-y-4 ${!group.isLatest ? 'opacity-80' : ''}`}>
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              第 {group.weekNumber} 周
            </h3>
            {group.isLatest ? (
              <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full uppercase tracking-wider">
                最新记录
              </span>
            ) : (
              <History className="text-slate-300 w-5 h-5" />
            )}
          </div>

          <div className="flex overflow-x-auto gap-4 px-2 pb-4 hide-scrollbar snap-x scroll-pl-2">
            {group.sessions.map((session) => (
              <div key={session.id} className="flex-none snap-start">
                <TrainingCard session={session} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="py-12 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <Verified className="text-blue-300 dark:text-blue-500 w-8 h-8" />
        </div>
        <p className="text-slate-400 text-sm">已加载全部历史记录</p>
      </div>
    </div>
  );
}
