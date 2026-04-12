import { CalendarDays, BarChart3, User } from 'lucide-react';
import { View } from '../types';

interface BottomNavBarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export default function BottomNavBar({ activeView, onViewChange }: BottomNavBarProps) {
  const tabs = [
    { id: 'plan' as View, label: '计划', icon: CalendarDays },
    { id: 'summary' as View, label: '汇总', icon: BarChart3 },
    { id: 'account' as View, label: '账户', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center pt-2 pb-6 px-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex flex-col items-center justify-center px-5 py-1 rounded-xl transition-all tap-highlight-transparent ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : 'text-slate-400 dark:text-slate-500 hover:text-blue-500'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-medium mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
