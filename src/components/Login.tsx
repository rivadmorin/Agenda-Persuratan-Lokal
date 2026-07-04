
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  appName: string;
  onLoginSuccess: (user: User) => void;
}

export default function Login({ appName, onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) onLoginSuccess(data.user);
      else setError('Username atau Password Salah');
    } catch (err) {
      setError('Gagal menghubungkan ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--md-sys-color-surface)]">
      <div className="w-full max-w-md bg-[var(--md-sys-color-surface-container)] rounded-[28px] p-10 border border-[var(--md-sys-color-outline-variant)] shadow-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] mb-6 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
             <span className="material-symbols-outlined text-5xl">mail</span>
          </div>
          <h1 className="text-3xl font-black text-[var(--md-sys-color-on-surface)] font-display tracking-tight">{appName}</h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-2">Masuk untuk mengelola agenda kantor</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <md-filled-text-field
            label="Username"
            value={username}
            onInput={(e: any) => setUsername(e.target.value)}
            style={{ '--md-filled-text-field-container-shape': '12px' }}
          >
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Password"
            type="password"
            value={password}
            onInput={(e: any) => setPassword(e.target.value)}
            style={{ '--md-filled-text-field-container-shape': '12px' }}
          >
            <md-icon slot="leading-icon">key</md-icon>
          </md-filled-text-field>

          <md-filled-button
            type="submit"
            disabled={loading}
            style={{ height: '56px', '--md-filled-button-container-shape': '16px' }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
          </md-filled-button>
        </form>
      </div>
    </div>
  );
}
