import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  confirmTone?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = '确认',
  cancelLabel = '取消',
  isPending = false,
  confirmTone = 'danger',
}: ConfirmDialogProps) {
  const iconContainerClassName =
    confirmTone === 'primary'
      ? 'w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20'
      : 'w-10 h-10 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-900/20';
  const iconClassName = confirmTone === 'primary' ? 'w-6 h-6 text-blue-600' : 'w-6 h-6 text-red-600';
  const confirmButtonClassName =
    confirmTone === 'primary'
      ? 'flex-1 px-4 py-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-l border-slate-100 dark:border-slate-800 disabled:opacity-60'
      : 'flex-1 px-4 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-slate-100 dark:border-slate-800 disabled:opacity-60';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isPending) {
                onCancel();
              }
            }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className={iconContainerClassName}>
                    <AlertTriangle className={iconClassName} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{message}</p>
              </div>
              <div className="flex border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onCancel}
                  disabled={isPending}
                  className="flex-1 px-4 py-4 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className={confirmButtonClassName}
                >
                  {isPending ? '处理中...' : confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
