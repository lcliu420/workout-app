import { Dumbbell } from 'lucide-react';

export default function TopAppBar({ title }: { title: string }) {
  return (
    <header className="fixed top-0 w-full bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 h-16 z-50">
      <div className="flex items-center gap-3">
        <Dumbbell className="text-blue-600 dark:text-blue-400 w-6 h-6" />
        <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
          {title}
        </h1>
      </div>
    </header>
  );
}
