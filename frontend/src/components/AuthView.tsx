import React, { useState } from 'react';
import { ArrowRight, Dumbbell, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';

interface AuthViewProps {
  onAuthenticate: (input: {
    mode: 'login' | 'register';
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  isPending: boolean;
  errorMessage: string | null;
}

export default function AuthView({ onAuthenticate, isPending, errorMessage }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onAuthenticate({
      mode,
      email: email.trim(),
      password,
      displayName: mode === 'register' ? displayName.trim() : undefined,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex h-16 w-full items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 fill-current text-blue-600" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            健身系统
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-grow flex-col items-center justify-center px-6">
        <div className="mb-10 w-full text-center">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Dumbbell className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {mode === 'login' ? '欢迎回来' : '创建你的训练账户'}
          </h1>
          <p className="font-medium text-slate-500">
            {mode === 'login'
              ? '登录后即可同步训练计划、历史记录和个人资料。'
              : '注册后，训练计划将保存到 Supabase 云端数据库。'}
          </p>
        </div>

        <div className="mb-8 flex w-full rounded-full bg-slate-200/50 p-1 dark:bg-slate-800/50">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
              mode === 'register'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            注册
          </button>
        </div>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                昵称
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <UserRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-900"
                  placeholder="请输入昵称"
                  type="text"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-500">
              电子邮箱
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-900"
                placeholder="电子邮箱地址"
                type="email"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-500">
              密码
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl bg-white py-3.5 pl-12 pr-12 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-900"
                placeholder="请输入密码"
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="pt-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600"
              type="submit"
              disabled={isPending}
            >
              <span>{isPending ? '处理中...' : mode === 'login' ? '登录' : '注册并开始使用'}</span>
              {!isPending && <ArrowRight className="h-5 w-5" />}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
