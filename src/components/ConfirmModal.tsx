import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  type = 'danger',
}: ConfirmModalProps) {
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          primary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100 dark:shadow-none',
          accent: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-100 dark:border-rose-900/30',
          topBar: 'bg-rose-600',
        };
      case 'warning':
        return {
          primary: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100 dark:shadow-none',
          accent: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900/30',
          topBar: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 dark:shadow-none',
          accent: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-100 dark:border-blue-900/30',
          topBar: 'bg-blue-600',
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 select-none">
          {/* Backdrop Click */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-sm relative overflow-hidden transition-colors duration-200 z-10"
          >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${colors.topBar}`} />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 ${colors.accent}`}>
                {type === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {title}
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 ${colors.primary}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
