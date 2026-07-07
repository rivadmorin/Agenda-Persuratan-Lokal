import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User & { password?: string }) => Promise<void> | void;
  userToEdit?: User | null;
}

export default function UserDialog({ isOpen, onClose, onSave, userToEdit }: UserDialogProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'operator'>('operator');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      if (userToEdit) {
        setName(userToEdit.name);
        setUsername(userToEdit.username);
        setPassword('');
        setRole(userToEdit.role);
      } else {
        setName('');
        setUsername('');
        setPassword('');
        setRole('operator');
      }
      setErrors({});
    }
  }, [isOpen, userToEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!username.trim()) newErrors.username = 'Username wajib diisi';
    if (!userToEdit && !password.trim()) newErrors.password = 'Password wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave({
        name,
        username,
        password: password || undefined,
        role
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-[32px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-6 scale-95 animate-zoom-in z-50">
        <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-4">
          <h2 className="text-xl font-display font-bold text-[var(--md-sys-color-on-surface)]">
            {userToEdit ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-on-surface)]/10 text-[var(--md-sys-color-on-surface-variant)] transition-premium cursor-pointer active:scale-95"
            aria-label="Tutup panel"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--md-sys-color-primary)] tracking-wide">Nama Lengkap **</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`px-4 py-3 bg-[var(--md-sys-color-surface-container)] border rounded-2xl text-sm text-[var(--md-sys-color-on-surface)] transition-premium focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] ${
                errors.name ? 'border-[var(--md-sys-color-error)]' : 'border-[var(--md-sys-color-outline-variant)]'
              }`}
              required
            />
            {errors.name && <span className="text-[10px] text-[var(--md-sys-color-error)] font-bold">{errors.name}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--md-sys-color-primary)] tracking-wide">Username **</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!!userToEdit}
              className={`px-4 py-3 bg-[var(--md-sys-color-surface-container)] border rounded-2xl text-sm text-[var(--md-sys-color-on-surface)] disabled:opacity-50 transition-premium focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] ${
                errors.username ? 'border-[var(--md-sys-color-error)]' : 'border-[var(--md-sys-color-outline-variant)]'
              }`}
              required
            />
            {errors.username && <span className="text-[10px] text-[var(--md-sys-color-error)] font-bold">{errors.username}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--md-sys-color-primary)] tracking-wide">
              Password {userToEdit ? '' : '**'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={userToEdit ? 'Kosongkan jika tidak ingin mengubah' : undefined}
              className={`px-4 py-3 bg-[var(--md-sys-color-surface-container)] border rounded-2xl text-sm text-[var(--md-sys-color-on-surface)] transition-premium focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] ${
                errors.password ? 'border-[var(--md-sys-color-error)]' : 'border-[var(--md-sys-color-outline-variant)]'
              }`}
              required={!userToEdit}
            />
            {errors.password && <span className="text-[10px] text-[var(--md-sys-color-error)] font-bold">{errors.password}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--md-sys-color-primary)] tracking-wide">Peran</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="px-4 py-3 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl text-sm text-[var(--md-sys-color-on-surface)] transition-premium focus:outline-none focus:border-[var(--md-sys-color-primary)] cursor-pointer"
            >
              <option value="operator" className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">Operator</option>
              <option value="admin" className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">Administrator</option>
            </select>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-[var(--md-sys-color-outline-variant)] pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/10 transition-premium cursor-pointer active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-sm font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:shadow-md hover:brightness-110 disabled:opacity-50 transition-premium cursor-pointer active:scale-95 flex items-center gap-2"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
