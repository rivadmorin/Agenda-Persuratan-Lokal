import React, { useState } from 'react';
import { KeyRound, User as UserIcon, AlertCircle, Sparkles, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { LogoMap } from './Sidebar';

interface LoginProps {
  appName: string;
  logoType?: 'lucide' | 'emoji' | 'image';
  logoUrl?: string;
  onLoginSuccess: (user: User) => void;
  darkMode?: boolean;
  setDarkMode?: (darkMode: boolean) => void;
}

export default function Login({ 
  appName, 
  logoType = 'lucide',
  logoUrl = 'Sparkles',
  onLoginSuccess, 
  darkMode = false, 
  setDarkMode 
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Mohon isi semua bidang.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Username atau password salah.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  const renderLogo = () => {
    if (logoType === 'emoji') {
      return (
        <span className="text-3xl select-none leading-none">
          {logoUrl || '📬'}
        </span>
      );
    }
    if (logoType === 'image') {
      return (
        <img 
          src={logoUrl || ''} 
          alt="Logo" 
          className="w-10 h-10 object-contain rounded-xl" 
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    const SelectedIcon = LogoMap[logoUrl] || Sparkles;
    return <SelectedIcon className="w-6 h-6 animate-pulse" />;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 select-none relative overflow-hidden transition-colors duration-200">
      {/* Floating Dark Mode Toggle */}
      {setDarkMode && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-100/40 dark:bg-blue-900/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 dark:bg-indigo-900/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden transition-colors duration-200">
          <div 
            style={{ backgroundColor: 'var(--theme-base, #2563eb)' }}
            className="absolute top-0 left-0 right-0 h-1.5" 
          />
          
          <div className="text-center mb-8">
            <div 
              style={{ 
                color: 'var(--theme-base, #2563eb)',
                backgroundColor: 'var(--theme-light, rgba(37, 99, 235, 0.08))',
                borderColor: 'var(--theme-light-border, rgba(37, 99, 235, 0.15))'
              }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 border"
            >
              {renderLogo()}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1">
              {appName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sistem Agenda Persuratan Lokal Terintegrasi
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <md-outlined-text-field
                label="Username"
                value={username}
                oninput={(e: any) => setUsername(e.target.value)}
                className="w-full"
                style={{ 
                  '--md-outlined-text-field-container-shape': '16px',
                  '--md-outlined-text-field-focus-outline-color': 'var(--theme-base, #2563eb)',
                  '--md-outlined-text-field-hover-outline-color': 'var(--theme-hover, #1d4ed8)',
                  '--md-outlined-text-field-focus-label-text-color': 'var(--theme-base, #2563eb)',
                } as React.CSSProperties}
                placeholder="Masukkan username"
                required
              >
                <span slot="leading-icon" className="flex items-center pl-1">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </span>
              </md-outlined-text-field>
            </div>

            <div className="relative">
              <md-outlined-text-field
                label="Password"
                type="password"
                value={password}
                oninput={(e: any) => setPassword(e.target.value)}
                className="w-full"
                style={{ 
                  '--md-outlined-text-field-container-shape': '16px',
                  '--md-outlined-text-field-focus-outline-color': 'var(--theme-base, #2563eb)',
                  '--md-outlined-text-field-hover-outline-color': 'var(--theme-hover, #1d4ed8)',
                  '--md-outlined-text-field-focus-label-text-color': 'var(--theme-base, #2563eb)',
                } as React.CSSProperties}
                placeholder="Masukkan password"
                required
              >
                <span slot="leading-icon" className="flex items-center pl-1">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                </span>
              </md-outlined-text-field>
            </div>

            <div className="pt-2">
              <md-filled-button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer h-12"
                style={{ 
                  '--md-filled-button-container-color': 'var(--theme-base, #2563eb)',
                  '--md-filled-button-container-shape': '100px',
                  '--md-filled-button-label-text-font': 'var(--font-sans)',
                  '--md-filled-button-label-text-weight': '700',
                  width: '100%'
                } as React.CSSProperties}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '24px', '--md-circular-progress-active-indicator-color': '#ffffff' } as React.CSSProperties} />
                    <span>Memproses...</span>
                  </span>
                ) : (
                  'Masuk ke Sistem'
                )}
              </md-filled-button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Default Admin: <span className="font-semibold text-slate-500 dark:text-slate-400">admin</span> / Password: <span className="font-semibold text-slate-500 dark:text-slate-400">admin123</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
