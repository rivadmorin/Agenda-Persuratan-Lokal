import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User & { password?: string }) => void;
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
        setPassword(''); // Don't show old password
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

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    onSave({
      name,
      username,
      password: password || undefined,
      role
    });
  };

  return (
    <md-dialog open={isOpen ? true : undefined} onClose={onClose}>
      <span slot="headline">
        {userToEdit ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}
      </span>
      <form slot="content" className="flex flex-col gap-4 py-2 min-w-[300px]" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <md-filled-text-field
          label="Nama Lengkap"
          value={name}
          onInput={(e: any) => setName(e.target.value)}
          error={!!errors.name ? true : undefined}
          errorText={errors.name}
          required
        ></md-filled-text-field>

        <md-filled-text-field
          label="Username"
          value={username}
          onInput={(e: any) => setUsername(e.target.value)}
          error={!!errors.username ? true : undefined}
          errorText={errors.username}
          disabled={userToEdit ? true : undefined}
          required
        ></md-filled-text-field>

        <md-filled-text-field
          label="Password"
          type="password"
          value={password}
          onInput={(e: any) => setPassword(e.target.value)}
          error={!!errors.password ? true : undefined}
          errorText={errors.password}
          supporting-text={userToEdit ? 'Kosongkan jika tidak ingin mengubah password' : ''}
          required={userToEdit ? undefined : true}
        ></md-filled-text-field>

        <md-filled-select
          label="Peran"
          value={role}
          onInput={(e: any) => setRole(e.target.value as any)}
        >
          <md-select-option value="operator">Operator</md-select-option>
          <md-select-option value="admin">Administrator</md-select-option>
        </md-filled-select>
      </form>
      <div slot="actions">
        <md-text-button onClick={onClose}>Batal</md-text-button>
        <md-filled-button onClick={handleSave} disabled={isSaving ? true : undefined}>
          {isSaving ? (
            <>
              <md-circular-progress indeterminate slot="icon" style={{ '--md-circular-progress-size': '18px' }}></md-circular-progress>
              Menyimpan...
            </>
          ) : 'Simpan'}
        </md-filled-button>
      </div>
    </md-dialog>
  );
}
