import React, { useState, useEffect } from 'react';
import { User } from '../types';
import ConfirmModal from './ConfirmModal';
import UserDialog from './UserDialog';

/**
 * BOLT OPTIMIZATION: Optimistic UI Updates
 * The UI updates immediately before the server responds to provide a lag-free experience.
 * If the server request fails, the state is rolled back.
 */

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    username: '',
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
  });
  const [userDialog, setUserDialog] = useState<{
    isOpen: boolean;
    userToEdit: User | null;
  }>({
    isOpen: false,
    userToEdit: null,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error(`Server returned code ${res.status}`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      setErrorModal({
        isOpen: true,
        title: 'Gagal Memuat Pengguna',
        message: error.message || 'Gagal memuat daftar pengguna dari server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData: User & { password?: string }) => {
    const isEditing = !!userDialog.userToEdit;
    const previousUsers = [...users];

    // Optimistic Update
    if (isEditing) {
      setUsers(users.map(u => u.username === userData.username ? { ...u, ...userData } : u));
    } else {
      setUsers([{ ...userData, role: userData.role as any }, ...users]);
    }

    setUserDialog({ isOpen: false, userToEdit: null });

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/users/${userData.username}` : '/api/users';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menyimpan pengguna');
      }

      // Refresh to get actual state
      fetchUsers();
    } catch (error: any) {
      // Rollback on error
      setUsers(previousUsers);
      setErrorModal({
        isOpen: true,
        title: 'Gagal Simpan User',
        message: error.message || 'Terjadi kesalahan saat menghubungi server.',
      });
    }
  };

  const handleDelete = async () => {
    const usernameToDelete = confirmModal.username;
    const previousUsers = [...users];

    // Optimistic Delete
    setUsers(users.filter(u => u.username !== usernameToDelete));
    setConfirmModal({ isOpen: false, username: '' });

    try {
      const res = await fetch(`/api/users/${usernameToDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menghapus pengguna');
      }
    } catch (error: any) {
      // Rollback on error
      setUsers(previousUsers);
      setErrorModal({
        isOpen: true,
        title: 'Gagal Hapus User',
        message: error.message || 'Gagal menghapus pengguna dari server.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Manajemen Pengguna</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm">Kelola akun operator dan administrator.</p>
        </div>
        <md-filled-button onClick={() => setUserDialog({ isOpen: true, userToEdit: null })}>
          <span slot="icon" className="material-symbols-outlined">person_add</span>
          Tambah User
        </md-filled-button>
      </div>

      <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] overflow-hidden border border-[var(--md-sys-color-outline-variant)] shadow-sm">
        <md-list className="p-0 bg-transparent">
          {users.map(user => (
            <React.Fragment key={user.username}>
              <md-list-item>
                <div slot="start" className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold shadow-sm border border-[var(--md-sys-color-outline-variant)]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div slot="headline" className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  {user.name}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    user.role === 'admin'
                      ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary-outline)]'
                      : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary-outline)]'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <div slot="supporting-text" className="tracking-wide text-xs text-[var(--md-sys-color-on-surface-variant)]">@{user.username}</div>
                <div slot="end" className="flex items-center gap-1">
                   <md-icon-button
                     onClick={() => setUserDialog({ isOpen: true, userToEdit: user })}
                     aria-label={`Ubah pengguna ${user.name}`}
                   >
                     <span className="material-symbols-outlined text-[var(--md-sys-color-primary)]">edit</span>
                   </md-icon-button>
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
        {loading && users.length === 0 && <md-linear-progress indeterminate></md-linear-progress>}
        {!loading && users.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-outline)]">person_off</span>
            <p className="text-sm italic text-[var(--md-sys-color-on-surface-variant)]">Tidak ada pengguna lain ditemukan.</p>
          </div>
        )}
      </div>

      <UserDialog
        isOpen={userDialog.isOpen}
        userToEdit={userDialog.userToEdit}
        onClose={() => setUserDialog({ isOpen: false, userToEdit: null })}
        onSave={handleSaveUser}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna @${confirmModal.username}? Tindakan ini tidak dapat dibatalkan.`}
        onClose={() => setConfirmModal({ isOpen: false, username: '' })}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
      />
    </div>
  );
}
