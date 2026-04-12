import { Dumbbell } from 'lucide-react';
import { TrainingSession } from '../types';

export default function TrainingCard({ session }: { session: TrainingSession }) {
  return (
    <div className="w-[320px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 snap-start">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-700 dark:text-slate-200">{session.title}</h4>
        <Dumbbell className="text-blue-500/30 w-5 h-5" />
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800">
            <th className="pb-2 font-semibold">动作</th>
            <th className="pb-2 font-semibold text-center">负荷</th>
            <th className="pb-2 font-semibold text-center">组数</th>
            <th className="pb-2 font-semibold text-center">次数</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {session.exercises.map((ex) => (
            <tr key={ex.id} className="border-b border-slate-50/50 dark:border-slate-800/50 last:border-0">
              <td className="py-3 font-medium text-slate-800 dark:text-slate-300">{ex.name}</td>
              <td className="py-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                {ex.load}
              </td>
              <td className="py-3 text-center text-slate-500 dark:text-slate-400">{ex.sets}</td>
              <td className="py-3 text-center text-slate-500 dark:text-slate-400">{ex.reps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
