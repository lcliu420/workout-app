import React, { useEffect, useRef, useState } from 'react';
import { Camera, ChevronRight, Edit2, LogOut, Mail, User, X } from 'lucide-react';
import type { UserProfile } from '../types';

interface AccountViewProps {
  user: UserProfile;
  isSaving: boolean;
  isUpdatingEmail: boolean;
  onSaveProfile: (input: { displayName: string; avatarUrl: string | null }) => Promise<void>;
  onRequestEmailChange: (input: { email: string }) => Promise<void>;
  onLogout: () => void;
}

const AVATAR_SIZE = 256;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function createDefaultAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eff6ff&color=2563eb`;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('头像图片读取失败，请换一张图片重试。'));
    image.src = source;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('头像文件读取失败，请重试。'));
    reader.readAsDataURL(file);
  });
}

async function createAvatarDataUrl(file: File) {
  const fileDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(fileDataUrl);

  const cropSize = Math.min(image.width, image.height);
  const cropX = (image.width - cropSize) / 2;
  const cropY = (image.height - cropSize) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('当前浏览器不支持头像处理。');
  }

  context.clearRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  context.drawImage(
    image,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  return canvas.toDataURL('image/webp', 0.9);
}

export default function AccountView({
  user,
  isSaving,
  isUpdatingEmail,
  onSaveProfile,
  onRequestEmailChange,
  onLogout,
}: AccountViewProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [nextEmail, setNextEmail] = useState(user.email);
  const [emailError, setEmailError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayName(user.displayName);
    setAvatarUrl(user.avatarUrl ?? '');
    setAvatarError(null);
    setSelectedFileName(null);
    setNextEmail(user.email);
    setEmailError(null);
  }, [user]);

  const previewAvatar = avatarUrl.trim() || createDefaultAvatar(displayName || user.displayName);

  const settings = [
    { id: 'profile', label: '个人资料', sub: '修改头像与昵称', icon: User },
    { id: 'email', label: '邮箱账户', sub: user.email, icon: Mail },
    { id: 'logout', label: '退出登录', sub: '退出当前登录状态', icon: LogOut, danger: true },
  ];

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAvatarError(null);

      if (!file.type.startsWith('image/')) {
        throw new Error('请选择图片文件作为头像。');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('头像文件不能超过 2MB。');
      }

      const nextAvatarUrl = await createAvatarDataUrl(file);
      setAvatarUrl(nextAvatarUrl);
      setSelectedFileName(file.name);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : '头像处理失败，请重试。');
    } finally {
      event.target.value = '';
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSaveProfile({
      displayName: displayName.trim(),
      avatarUrl: avatarUrl.trim() || null,
    });
    setIsProfileModalOpen(false);
  };

  const handleRequestEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setEmailError(null);
      await onRequestEmailChange({ email: nextEmail.trim() });
      setIsEmailModalOpen(false);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : '邮箱修改失败，请重试。');
    }
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setAvatarError(null);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailError(null);
    setNextEmail(user.email);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="pt-8"></div>

      <section className="mb-10 flex flex-col items-center">
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md transition-transform hover:scale-[1.02] dark:border-slate-800"
          >
            <img
              src={previewAvatar}
              alt="User Avatar"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-white bg-blue-600 p-1.5 text-white shadow-lg dark:border-slate-800"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
        <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {user.displayName}
        </h2>
        <p className="text-sm font-medium text-slate-500">{user.email}</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-50 px-6 py-4 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
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
                  if (item.id === 'profile') setIsProfileModalOpen(true);
                  if (item.id === 'email') setIsEmailModalOpen(true);
                }}
                className={`group flex w-full items-center px-6 py-5 text-left transition-colors duration-200 ${
                  item.danger
                    ? 'hover:bg-red-50 dark:hover:bg-red-900/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    item.danger
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                      : 'bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:group-hover:bg-blue-900/20'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-grow">
                  <p
                    className={`text-base font-semibold ${
                      item.danger ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.sub}</p>
                </div>
                {!item.danger && <ChevronRight className="h-5 w-5 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </section>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                修改个人资料
              </h3>
              <button
                onClick={closeProfileModal}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 p-6">
              <div className="flex flex-col items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />

                <button type="button" onClick={openFilePicker} className="group relative">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-800">
                    <img
                      src={previewAvatar}
                      alt="Preview Avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={openFilePicker}
                  className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  从本地选择头像
                </button>

                {selectedFileName && (
                  <p className="mt-2 text-xs text-slate-500">已选择：{selectedFileName}</p>
                )}

                <p className="mt-2 text-center text-xs text-slate-400">
                  点击头像或按钮选择本地图片，系统会自动裁成头像尺寸后保存。
                </p>

                {avatarError && <p className="mt-2 text-xs text-red-500">{avatarError}</p>}
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                  昵称
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="请输入昵称"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="flex-1 rounded-2xl bg-slate-100 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving || Boolean(avatarError)}
                  className="flex-1 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                修改邮箱账户
              </h3>
              <button
                onClick={closeEmailModal}
                className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRequestEmailChange} className="space-y-6 p-6">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                  当前邮箱
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                  新邮箱
                </label>
                <input
                  type="email"
                  value={nextEmail}
                  onChange={(event) => setNextEmail(event.target.value)}
                  className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="请输入新的邮箱地址"
                  required
                />
                <p className="text-xs text-slate-400">
                  提交后会向新邮箱发送验证邮件，完成验证后重新登录即可生效。
                </p>
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEmailModal}
                  className="flex-1 rounded-2xl bg-slate-100 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="flex-1 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {isUpdatingEmail ? '发送中...' : '发送验证邮件'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
