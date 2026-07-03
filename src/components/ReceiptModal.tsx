import React, { useState, useEffect } from 'react';
import { FileText, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signerLeft: string, signerRight: string) => void;
  defaultSignerLeft: string;
  defaultSignerRight: string;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  onConfirm,
  defaultSignerLeft,
  defaultSignerRight,
}: ReceiptModalProps) {
  const [signerLeft, setSignerLeft] = useState('');
  const [signerRight, setSignerRight] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSignerLeft(defaultSignerLeft);
      setSignerRight(defaultSignerRight);
    }
  }, [isOpen, defaultSignerLeft, defaultSignerRight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(signerLeft, signerRight);
    onClose();
  };

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
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-200 z-10"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center border mb-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-100 dark:border-blue-900/30">
                <FileText className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Konfirmasi Tanda Terima Surat
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                Masukkan nama penandatangan untuk dicantumkan pada dokumen PDF tanda terima.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Yang Menyerahkan (Sisi Kiri)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={signerLeft}
                    onChange={(e) => setSignerLeft(e.target.value)}
                    placeholder="Nama Pengirim / Operator"
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Yang Menerima (Sisi Kanan)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={signerRight}
                    onChange={(e) => setSignerRight(e.target.value)}
                    placeholder="Nama Penerima / Administrator"
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 dark:shadow-none transition-all cursor-pointer active:scale-95"
                >
                  Cetak PDF
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
