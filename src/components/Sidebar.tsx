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
    <aside className="w-80 h-screen sticky top-0 flex flex-col border-r border-slate-200 bg-slate-50/80 backdrop-blur-md p-6 justify-between z-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
            <span className="material-symbols-outlined text-3xl font-fill">mail</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-800 text-lg leading-tight tracking-tight">{appName}</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{onlineCount} ONLINE</span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {filteredItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600 shadow-sm pl-3'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'font-fill text-teal-600' : 'text-slate-400'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            title="Keluar Sesi"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
