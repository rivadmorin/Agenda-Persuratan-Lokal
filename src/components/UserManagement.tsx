import React, { useState, useEffect } from 'react';
import { User } from '../types';
import ConfirmModal from './ConfirmModal';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    username: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/users/${confirmModal.username}`, { method: 'DELETE' });
    setConfirmModal({ isOpen: false, username: '' });
    fetchUsers();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Manajemen Pengguna</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm">Kelola akun operator dan administrator.</p>
        </div>
        <div className="relative group">
          <md-filled-button disabled aria-describedby="add-user-tooltip">
            <span slot="icon" className="material-symbols-outlined">person_add</span>
            Tambah User
          </md-filled-button>
          <div
            id="add-user-tooltip"
            role="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md"
          >
            Fitur Tambah User Segera Hadir
          </div>
        </div>
      </div>

      <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] overflow-hidden border border-[var(--md-sys-color-outline-variant)] shadow-sm">
        <md-list className="p-0 bg-transparent">
          {users.map(user => (
            <React.Fragment key={user.username}>
              <md-list-item>
                <div slot="start" className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold shadow-sm border border-[var(--md-sys-color-outline-variant)]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div slot="headline" className="font-bold text-[var(--md-sys-color-on-surface)]">{user.name}</div>
                <div slot="supporting-text" className="uppercase tracking-widest text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-semibold mt-0.5">{user.role} • @{user.username}</div>
                <div slot="end" className="flex items-center gap-1">
                   <md-icon-button
                     onClick={() => setConfirmModal({ isOpen: true, username: user.username })}
                     disabled={user.username === 'admin' ? true : undefined}
                     aria-label={`Hapus pengguna ${user.name}`}
                     style={{ '--md-icon-button-icon-color': 'var(--md-sys-color-error)' }}
                   >
                     <span className="material-symbols-outlined">delete</span>
                   </md-icon-button>
                </div>
              </md-list-item>
              <md-divider></md-divider>
            </React.Fragment>
          ))}
        </md-list>
        {loading && <md-linear-progress indeterminate></md-linear-progress>}
        {!loading && users.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-outline)]">person_off</span>
            <p className="text-sm italic text-[var(--md-sys-color-on-surface-variant)]">Tidak ada pengguna lain ditemukan.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna @${confirmModal.username}? Tindakan ini tidak dapat dibatalkan.`}
        onClose={() => setConfirmModal({ isOpen: false, username: '' })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
