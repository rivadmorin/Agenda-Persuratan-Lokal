import React, { useState, useEffect } from 'react';

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

  if (!isOpen) return null;

  return (
    <md-dialog open={true} onClose={onClose}>
      <div slot="headline" className="font-display">Konfirmasi Tanda Terima Surat</div>
      <div slot="content" className="flex flex-col gap-6 py-2 min-w-[320px]">
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2">
          Masukkan nama penandatangan untuk dicantumkan pada dokumen PDF tanda terima.
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
      <div slot="actions">
        <md-text-button onClick={onClose}>Batal</md-text-button>
        <md-filled-button onClick={handleSubmit} disabled={!signerLeft.trim() || !signerRight.trim() ? true : undefined}>
          <span slot="icon" className="material-symbols-outlined">print</span>
          Cetak PDF
        </md-filled-button>
      </div>
    </md-dialog>
  );
}
