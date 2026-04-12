import React, { useState } from 'react';
import { Edit2, User, LogOut, ChevronRight, X, Camera } from 'lucide-react';

interface AccountViewProps {
  onAction: (msg: string) => void;
  onLogout: () => void;
}

export default function AccountView({ onAction, onLogout }: AccountViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userName, setUserName] = useState('张益达');
  const [avatarUrl, setAvatarUrl] = useState('https://picsum.photos/seed/fitness-user/200/200');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const settings = [
    { id: 'profile', label: '个人资料', sub: '修改头像、昵称', icon: User },
    { id: 'logout', label: '退出登录', sub: '退出当前账户', icon: LogOut, danger: true },
  ];

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    setIsEditModalOpen(false);
    onAction('个人资料已更新');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="pt-8"></div>

      <section className="flex flex-col items-center mb-10">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-md">
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-800 flex items-center justify-center"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{userName}</h2>
        <p className="text-slate-500 text-sm font-medium">高级会员 · 已坚持 128 天</p>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800">
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">
            账户设置
          </h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {settings.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'logout') onLogout();
                  else if (item.id === 'profile') setIsEditModalOpen(true);
                  else onAction(`打开: ${item.label}`);
                }}
                className={`w-full flex items-center px-6 py-5 transition-colors duration-200 group text-left ${
                  item.danger
                    ? 'hover:bg-red-50 dark:hover:bg-red-900/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    item.danger
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-4 flex-grow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-base font-semibold ${
                          item.danger ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.sub}</p>
                    </div>
                  </div>
                </div>
                {!item.danger && <ChevronRight className="w-5 h-5 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </section>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">修改个人资料</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800">
                    <img
                      src={avatarUrl}
                      alt="Preview Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  >
                    <Camera className="text-white w-6 h-6" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">点击头像上传本地图片</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">昵称</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl px-4 py-3 text-slate-900 dark:text-slate-100"
                  placeholder="请输入昵称"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">健身笔记 v2.4.1</p>
      </div>
    </div>
  );
}
