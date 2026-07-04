import React, { useState, useEffect } from 'react';
import { User } from '../types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleDelete = async (username: string) => {
    if (confirm(`Hapus pengguna ${username}?`)) {
      await fetch(`/api/users/${username}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)]">Manajemen Pengguna</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)]">Kelola akun operator dan administrator.</p>
        </div>
        <md-filled-button>
          <span slot="icon" className="material-symbols-outlined">person_add</span>
          Tambah User
        </md-filled-button>
      </div>

      <div className="bg-[var(--md-sys-color-surface-container)] rounded-[32px] overflow-hidden border border-[var(--md-sys-color-outline-variant)]">
        <md-list>
          {users.map(user => (
            <React.Fragment key={user.username}>
              <md-list-item>
                <div slot="start" className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div slot="headline" className="font-bold">{user.name}</div>
                <div slot="supporting-text" className="uppercase tracking-widest text-[10px]">{user.role} • @{user.username}</div>
                <div slot="end" className="flex items-center gap-1">
                   <md-icon-button onClick={() => handleDelete(user.username)} disabled={user.username === 'admin'}>
                     <span className="material-symbols-outlined text-error">delete</span>
                   </md-icon-button>
                </div>
              </md-list-item>
              <md-divider></md-divider>
            </React.Fragment>
          ))}
        </md-list>
        {loading && <md-linear-progress indeterminate></md-linear-progress>}
      </div>
    </div>
  );
}
