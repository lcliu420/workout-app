import { BarChart3, CalendarDays, User } from 'lucide-react';
import type { View } from '../types';

interface BottomNavBarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export default function BottomNavBar({ activeView, onViewChange }: BottomNavBarProps) {
  const tabs = [
    { id: 'plan' as View, label: '计划', icon: CalendarDays },
    { id: 'summary' as View, label: '总览', icon: BarChart3 },
    { id: 'account' as View, label: '账户', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-slate-100 bg-white/80 px-4 pb-6 pt-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`tap-highlight-transparent flex flex-col items-center justify-center rounded-xl px-5 py-1 transition-all ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-400 hover:text-blue-500 dark:text-slate-500'
            }`}
          >
            <Icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="mt-0.5 text-[11px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
