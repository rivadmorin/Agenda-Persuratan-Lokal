import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';

export default function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="fixed bottom-6 right-6 z-[2000] p-1.5 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl shadow-2xl"
        >
          <div className="p-5 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(1.5rem-0.375rem)] flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 border border-[var(--md-sys-color-outline-variant)]/60">
                <span className="material-symbols-outlined">system_update</span>
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold truncate">Pembaruan Tersedia</h4>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-relaxed">
                  Versi baru aplikasi telah diunduh di latar belakang.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNeedRefresh(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] cursor-pointer transition-colors active:scale-95"
              >
                Nanti
              </button>
              <button
                type="button"
                onClick={() => updateServiceWorker(true)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:shadow-md cursor-pointer active:scale-95 transition-all duration-300"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
