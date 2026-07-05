import React from 'react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User;
  appName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onlineCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function Sidebar({
  currentUser,
  appName,
  activeTab,
  setActiveTab,
  onLogout,
  onlineCount,
  darkMode,
  setDarkMode
}: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'mails', label: 'Agenda Surat', icon: 'inbox' },
    { id: 'pdf-tools', label: 'PDF Tools', icon: 'build' },
    { id: 'users', label: 'Pengguna', icon: 'group', adminOnly: true },
    { id: 'settings', label: 'Pengaturan', icon: 'settings' },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || currentUser.role === 'admin');

  return (
    <aside className="w-80 h-screen sticky top-0 flex flex-col border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-6 justify-between z-10 transition-premium">
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center border border-[var(--md-sys-color-outline-variant)] shrink-0">
              <span className="material-symbols-outlined text-2xl font-fill">mail</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-[var(--md-sys-color-on-surface)] text-base leading-tight tracking-tight">{appName}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">{onlineCount} ONLINE</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-sm transition-premium active:scale-90 cursor-pointer shrink-0"
            title={darkMode ? "Mode Terang" : "Mode Gelap"}
          >
            <span className="material-symbols-outlined text-lg">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
 
        <nav className="flex flex-col gap-1.5">
          {filteredItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-4 px-6 py-3.5 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden group active:scale-[0.98] text-left ${
                  isActive
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold shadow-sm'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? 'font-fill text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-outline)] group-hover:text-[var(--md-sys-color-on-surface)] transition-colors'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
 
      <div className="flex flex-col gap-4 border-t border-[var(--md-sys-color-outline-variant)] pt-6">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">{currentUser.name}</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium uppercase tracking-widest mt-0.5">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--md-sys-color-outline)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors shrink-0"
            title="Keluar Sesi"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
