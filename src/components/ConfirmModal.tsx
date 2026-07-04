import React from 'react';

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
  if (!isOpen) return null;

  return (
    <md-dialog
      open={isOpen}
      onClose={onClose}
      style={{ minWidth: '320px' }}
    >
      <div slot="headline">{title}</div>
      <form slot="content" method="dialog">
        {message}
      </form>
      <div slot="actions">
        <md-text-button onClick={onClose}>{cancelText}</md-text-button>
        <md-filled-button onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </md-filled-button>
      </div>
    </md-dialog>
  );
}
