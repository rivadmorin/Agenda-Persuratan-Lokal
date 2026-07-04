
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User;
  appName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onlineCount: number;
}

export default function Sidebar({
  currentUser,
  appName,
  activeTab,
  setActiveTab,
  onLogout,
  onlineCount
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
    <md-navigation-drawer opened={true} style={{ height: '100vh', position: 'sticky', top: 0 }}>
      <div className="p-6 flex flex-col h-full bg-[var(--md-sys-color-surface-container-low)]">
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">mail</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-[var(--md-sys-color-on-surface)] leading-tight">{appName}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">{onlineCount} ONLINE</span>
            </div>
          </div>
        </div>

        <md-list className="bg-transparent p-0 flex-grow">
          {filteredItems.map((item) => (
            <md-list-item
              key={item.id}
              type="button"
              active={activeTab === item.id ? true : undefined}
              onClick={() => setActiveTab(item.id)}
              className="rounded-full mb-1"
              style={{
                '--md-list-item-container-color': activeTab === item.id ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                '--md-list-item-label-text-color': activeTab === item.id ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
              } as any}
            >
              <span slot="start" className="material-symbols-outlined">{item.icon}</span>
              <div slot="headline" className="font-medium">{item.label}</div>
            </md-list-item>
          ))}
        </md-list>

        <md-divider className="my-4"></md-divider>

        <div className="px-2 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center font-bold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">{currentUser.name}</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">{currentUser.role}</p>
            </div>
          </div>

          <md-text-button onClick={onLogout} className="w-full" style={{ '--md-text-button-container-shape': '12px' }}>
            <span slot="icon" className="material-symbols-outlined">logout</span>
            Keluar Sesi
          </md-text-button>
        </div>
      </div>
    </md-navigation-drawer>
  );
}
