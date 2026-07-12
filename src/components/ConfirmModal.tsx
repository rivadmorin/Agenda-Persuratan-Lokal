import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
}: ConfirmModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-w: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const containerVariants = {
    hidden: isMobile ? { y: '100%', opacity: 1, scale: 1 } : { scale: 0.9, opacity: 0, y: 20 },
    visible: { y: 0, opacity: 1, scale: 1 },
    exit: isMobile ? { y: '100%', opacity: 1, scale: 1 } : { scale: 0.9, opacity: 0, y: 20 },
  };

  const containerTransition = isMobile 
    ? { type: 'spring' as const, damping: 30, stiffness: 300 }
    : { duration: 0.2 };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-[2px] flex items-end justify-center p-0 md:items-center md:p-4"
          >
            {/* Modal Container */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={containerTransition}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-t-[32px] md:rounded-[28px] rounded-b-none shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
            >
              {/* Drag Handle visually indicating Bottom Sheet on Mobile */}
              {isMobile && (
                <div className="w-12 h-1.5 rounded-full bg-[var(--md-sys-color-outline-variant)] mx-auto mt-3 mb-1 shrink-0" />
              )}

              {/* Header */}
              <div className="p-6 pb-2">
                <h2 className="text-xl font-bold font-display text-[var(--md-sys-color-on-surface)]">
                  {title}
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 pt-2 text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                {message}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-end gap-3 pb-6 md:pb-4">
                <md-text-button onClick={onClose}>{cancelText}</md-text-button>
                <md-filled-button 
                  onClick={() => { onConfirm(); onClose(); }}
                  style={confirmText === 'Hapus' ? { '--md-filled-button-container-color': 'var(--md-sys-color-error)' } : undefined}
                >
                  {confirmText}
                </md-filled-button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
