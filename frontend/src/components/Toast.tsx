import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-24 left-1/2 z-[100] flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl min-w-[280px]"
        >
          <Info className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium flex-grow">{message}</span>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
