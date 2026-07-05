import React, { useState, useEffect } from 'react';
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

  const handleSubmit = () => {
    if (!signerLeft.trim() || !signerRight.trim()) return;
    onConfirm(signerLeft, signerRight);
    onClose();
  };

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
            className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-[2px] flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[28px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 pb-2">
                <h2 className="text-xl font-bold font-display text-[var(--md-sys-color-on-surface)]">
                  Konfirmasi Tanda Terima Surat
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 pt-2 flex flex-col gap-6">
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold tracking-wider">
                  Masukkan nama penandatangan untuk dicantumkan pada dokumen PDF.
                </p>
                
                <md-filled-text-field
                  label="Yang Menyerahkan (Sisi Kiri)"
                  required
                  value={signerLeft}
                  onInput={(e: any) => setSignerLeft(e.target.value)}
                >
                  <md-icon slot="leading-icon">person</md-icon>
                </md-filled-text-field>

                <md-filled-text-field
                  label="Yang Menerima (Sisi Kanan)"
                  required
                  value={signerRight}
                  onInput={(e: any) => setSignerRight(e.target.value)}
                >
                  <md-icon slot="leading-icon">person</md-icon>
                </md-filled-text-field>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-end gap-2">
                <md-text-button onClick={onClose}>Batal</md-text-button>
                <md-filled-button 
                  onClick={handleSubmit} 
                  disabled={!signerLeft.trim() || !signerRight.trim() ? true : undefined}
                >
                  <span slot="icon" className="material-symbols-outlined">print</span>
                  Cetak PDF
                </md-filled-button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
