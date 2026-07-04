import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  KeyRound, 
  Check, 
  Loader, 
  X,
  AlertCircle,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import ConfirmModal from './ConfirmModal';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete confirm state
  const [userToDeleteConfirm, setUserToDeleteConfirm] = useState<string | null>(null);

  // Dialog Add/Edit states
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'operator'>('operator');
  const [password, setPassword] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Gagal memuat daftar operator pengguna.');
      }
    } catch (err) {
      setError('Koneksi terputus dengan server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleOpenAdd = () => {
    setDialogMode('add');
    setUsername('');
    setName('');
    setRole('operator');
    setPassword('');
    setDialogError('');
    setShowDialog(true);
  };

  const handleOpenEdit = (user: User) => {
    setDialogMode('edit');
    setUsername(user.username);
    setName(user.name);
    setRole(user.role);
    setPassword(''); // leave blank for no password change
    setDialogError('');
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError('');

    if (!username.trim() || !name.trim()) {
      setDialogError('Mohon isi semua bidang utama.');
      return;
    }

    if (dialogMode === 'add' && !password) {
      setDialogError('Sediakan password inisial untuk akun baru.');
      return;
    }

    setSaving(true);
    try {
      const url = dialogMode === 'add' ? '/api/users' : `/api/users/${username}`;
      const method = dialogMode === 'add' ? 'POST' : 'PUT';
      const body = { username, name, role, ...(password ? { password } : {}) };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchUsers();
        setShowDialog(false);
        triggerSuccess(
          dialogMode === 'add'
            ? 'Operator pengguna baru berhasil terdaftar!'
            : 'Detail operator berhasil diperbarui!'
        );
      } else {
        const errData = await response.json();
        setDialogError(errData.message || 'Gagal menyimpan data pengguna.');
      }
    } catch (err) {
      setDialogError('Terjadi kegagalan koneksi server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userToDelete: string) => {
    if (userToDelete === 'admin') {
      alert('Default admin tidak dapat dihapus.');
      return;
    }
    setUserToDeleteConfirm(userToDelete);
  };

  const executeDelete = async (userToDelete: string) => {
    try {
      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchUsers();
        triggerSuccess('Operator berhasil dihapus dari database.');
      } else {
        alert('Gagal menghapus pengguna.');
      }
    } catch (err) {
      alert('Gagal menyambung ke server.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden p-6 select-none bg-slate-50 dark:bg-slate-950 gap-5 transition-colors duration-200">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm dark:shadow-none flex items-center justify-between shrink-0 transition-colors duration-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1">
            Manajemen Pengguna & Operator
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Daftarkan akun operator baru, atur level hak akses kerja, atau perbarui kata sandi login di sini.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-100 dark:shadow-none transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Operator</span>
        </button>
      </div>

      {/* Floating success toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl z-50 flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-emerald-100 dark:shadow-none"
          >
            <Check className="w-4.5 h-4.5" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* User Accounts Grid Table */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm dark:shadow-none overflow-hidden flex flex-col relative transition-colors duration-200">
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-sm table-fixed min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr className="divide-x divide-slate-200 dark:divide-slate-800">
                <th className="w-16 px-4 py-3.5 text-center">No</th>
                <th className="px-6 py-3.5">Nama Lengkap</th>
                <th className="w-44 px-6 py-3.5">Username</th>
                <th className="w-44 px-6 py-3.5">Tipe Akses</th>
                <th className="w-32 px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center bg-white dark:bg-slate-900">
                    <div className="flex flex-col items-center gap-2">
                      <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                      <span className="text-xs font-semibold text-slate-450">Memuat profil operator...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center bg-white dark:bg-slate-900">
                    <p className="text-sm text-slate-400">Tidak ada operator terdaftar.</p>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.username} className="divide-x divide-slate-200 dark:divide-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                    <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500">{idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.name}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-xs text-slate-600 dark:text-slate-400 select-all">{user.username}</td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-450 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Administrator</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                          <Briefcase className="w-4 h-4" />
                          <span>Operator Kerja</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all cursor-pointer"
                          title="Ubah Profil"
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.username)}
                          disabled={user.username === 'admin'}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all disabled:opacity-20 cursor-pointer"
                          title="Hapus Operator"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          ADD / EDIT OPERATOR DIALOG
          ========================================== */}
      <AnimatePresence>
        {showDialog && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-200"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-blue-600" />
                {dialogMode === 'add' ? 'Tambah Operator Baru' : 'Perbarui Profil Operator'}
              </h3>

              {dialogError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                  <span>{dialogError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="w-full">
                  <md-outlined-text-field
                    label="Username Login"
                    value={username}
                    oninput={(e: any) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    disabled={dialogMode === 'edit' ? true : undefined}
                    className="w-full font-mono"
                    placeholder="Contoh: andi_agenda"
                    required
                  />
                </div>

                {/* Name */}
                <div className="w-full">
                  <md-outlined-text-field
                    label="Nama Lengkap"
                    value={name}
                    oninput={(e: any) => setName(e.target.value)}
                    className="w-full"
                    placeholder="Contoh: Andi Wijaya"
                    required
                  />
                </div>

                {/* Role / Hak Akses */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Tipe Hak Akses
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={username === 'admin'} // cannot change primary admin role
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-55"
                  >
                    <option value="operator">Operator Kerja (Agenda, PDF, Ekspor)</option>
                    <option value="admin">Administrator (Semua Hak Akses)</option>
                  </select>
                </div>

                {/* Password */}
                <div className="w-full">
                  <md-outlined-text-field
                    label={dialogMode === 'add' ? "Password Inisial" : "Password Baru (Kosongkan jika tidak diubah)"}
                    type="password"
                    value={password}
                    oninput={(e: any) => setPassword(e.target.value)}
                    className="w-full"
                    placeholder="Masukkan sandi baru"
                  >
                    <span slot="leading-icon" className="flex items-center pl-1">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                    </span>
                  </md-outlined-text-field>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <md-outlined-button
                    type="button"
                    onClick={() => {
                      setShowDialog(false);
                      setDialogError('');
                    }}
                    className="cursor-pointer"
                  >
                    Batal
                  </md-outlined-button>
                  <md-filled-button
                    type="submit"
                    disabled={saving ? true : undefined}
                    className="cursor-pointer font-bold"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Profil'}
                  </md-filled-button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={userToDeleteConfirm !== null}
        onClose={() => setUserToDeleteConfirm(null)}
        onConfirm={() => {
          if (userToDeleteConfirm) {
            executeDelete(userToDeleteConfirm);
          }
        }}
        title="Hapus Operator Pengguna"
        message={`Apakah Anda yakin ingin menghapus operator "${userToDeleteConfirm}" secara permanen? Akun ini tidak akan bisa login lagi.`}
        confirmText="Hapus Akun"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
