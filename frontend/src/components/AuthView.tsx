import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowRight, X } from 'lucide-react';

export default function AuthView({ onLogin }: { onLogin: (msg: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleResetPassword = (event: React.FormEvent) => {
    event.preventDefault();
    alert(`重置密码邮件已发送至: ${resetEmail}`);
    setIsForgotModalOpen(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const successMessage = mode === 'login' ? '登录成功！' : '注册成功！';
    onLogin(successMessage);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between px-6 h-16 w-full">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-blue-600 w-6 h-6 fill-current" />
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100">健身笔记</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        <div className="w-full mb-10 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Dumbbell className="text-blue-600 dark:text-blue-400 text-4xl w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
            {mode === 'login' ? '欢迎回来' : '开启旅程'}
          </h1>
          <p className="text-slate-500 font-medium">
            {mode === 'login' ? '请登录以继续你的健身之旅' : '创建一个账户来记录你的训练'}
          </p>
        </div>

        <div className="w-full flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full mb-8">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            注册
          </button>
        </div>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">电子邮箱</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Mail className="text-slate-400 w-5 h-5" />
              </div>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-slate-300"
                placeholder="电子邮箱地址"
                type="email"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="text-slate-400 w-5 h-5" />
              </div>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-slate-300"
                placeholder="请输入密码"
                type={showPassword ? 'text' : 'password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                忘记密码？
              </button>
            </div>
          )}

          <div className="pt-4">
            <button
              className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              type="submit"
            >
              <span>{mode === 'login' ? '登录' : '注册'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        {isForgotModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">找回密码</h3>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-6 space-y-6">
                <p className="text-sm text-slate-500">
                  请输入你的注册邮箱，我们将向你发送重置密码的链接。
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">电子邮箱</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl px-4 py-3 text-slate-900 dark:text-slate-100"
                    placeholder="请输入邮箱地址"
                    required
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                  >
                    发送邮件
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-8 text-center">
        <p className="text-slate-400 text-xs tracking-wide uppercase">© 2024 健身笔记 · 隐私政策</p>
      </footer>
    </div>
  );
}
