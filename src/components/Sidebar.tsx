import React, { useState } from 'react';
import { 
  Inbox, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Network, 
  UsersRound, 
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ServerInfo } from '../types';

interface SidebarProps {
  currentUser: User;
  appName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onlineCount: number;
  onlineUsers: { username: string; name: string; role: string }[];
  serverInfo: ServerInfo | null;
  onLogout: () => void;
  darkMode?: boolean;
  setDarkMode?: (darkMode: boolean) => void;
}

export default function Sidebar({
  currentUser,
  appName,
  activeTab,
  setActiveTab,
  onlineCount,
  onlineUsers,
  serverInfo,
  onLogout,
  darkMode = false,
  setDarkMode,
}: SidebarProps) {
  const [showUsersPopup, setShowUsersPopup] = useState(false);

  const menuItems = [
    { id: 'agenda', label: 'Agenda Surat', icon: Inbox, roles: ['admin', 'operator'] },
    { id: 'dashboard', label: 'Statistik & Analisis', icon: LayoutDashboard, roles: ['admin', 'operator'] },
    { id: 'pdf-tools', label: 'PDF Perkakas', icon: FileText, roles: ['admin', 'operator'] },
    { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon, roles: ['admin'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen shrink-0 select-none relative z-20 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-200 dark:shadow-none">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-slate-900 dark:text-white tracking-tight text-base font-display truncate">
              {appName}
            </h2>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
              Server Lokal
            </span>
          </div>
        </div>
        {setDarkMode && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User Card Profile */}
      <div className="p-5 mx-4 my-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold uppercase font-display">
          {currentUser.name.substring(0, 2)}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{currentUser.name}</h4>
          <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{currentUser.role === 'admin' ? 'Administrator' : 'Operator'}</span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 space-y-1">
        {visibleMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:scale-105'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-1.5 h-6 rounded-full bg-blue-600 absolute right-3"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3.5 relative">
        {/* SSE Active Users */}
        <div className="relative">
          <button
            onClick={() => setShowUsersPopup(!showUsersPopup)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 p-2.5 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{onlineCount} Pengguna Aktif</span>
            </div>
            <UsersRound className="w-4 h-4 text-slate-400" />
          </button>

          <AnimatePresence>
            {showUsersPopup && (
              <>
                {/* Backdrop to dismiss */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUsersPopup(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-12 left-2 right-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xl z-50 space-y-3"
                >
                  <h5 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UsersRound className="w-3.5 h-3.5 text-blue-600" />
                    Operator Online
                  </h5>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {onlineUsers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Tidak ada user online.</p>
                    ) : (
                      onlineUsers.map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</span>
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-semibold uppercase">{user.role}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Server & IP Info */}
        {serverInfo && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>IP Pengguna:</span>
            </div>
            <div className="font-mono text-[10px] space-y-1 break-all bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              {serverInfo.ips.filter(ip => ip !== 'localhost' && ip !== '127.0.0.1').map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1 py-0.5">
                  <span className="text-slate-400 dark:text-slate-500">IP:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 select-all">{ip}</span>
                </div>
              ))}
              {serverInfo.ips.filter(ip => ip !== 'localhost' && ip !== '127.0.0.1').length === 0 && (
                <div className="flex items-center justify-between gap-1 py-0.5">
                  <span className="text-slate-400 dark:text-slate-500">IP:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 select-all">127.0.0.1</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-100 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </div>
  );
}
