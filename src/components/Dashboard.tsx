import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { MailRecord, AppConfig } from '../types';

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  teal: { 
    bg: 'bg-[var(--md-sys-color-primary-container)]', 
    text: 'text-[var(--md-sys-color-on-primary-container)]', 
    border: 'border-[var(--md-sys-color-outline-variant)]' 
  },
  indigo: { 
    bg: 'bg-[var(--md-sys-color-secondary-container)]', 
    text: 'text-[var(--md-sys-color-on-secondary-container)]', 
    border: 'border-[var(--md-sys-color-outline-variant)]' 
  },
  amber: { 
    bg: 'bg-[var(--md-sys-color-tertiary-container)]', 
    text: 'text-[var(--md-sys-color-on-tertiary-container)]', 
    border: 'border-[var(--md-sys-color-outline-variant)]' 
  },
  rose: { 
    bg: 'bg-[var(--md-sys-color-error-container)]', 
    text: 'text-[var(--md-sys-color-on-error-container)]', 
    border: 'border-[var(--md-sys-color-outline-variant)]' 
  },
  green: { 
    bg: 'bg-emerald-100/80 dark:bg-emerald-950/40', 
    text: 'text-emerald-800 dark:text-emerald-300', 
    border: 'border-emerald-200 dark:border-emerald-800/40' 
  },
  blue: { 
    bg: 'bg-sky-100/80 dark:bg-sky-950/40', 
    text: 'text-sky-800 dark:text-sky-300', 
    border: 'border-sky-200 dark:border-sky-800/40' 
  }
};

interface DashboardProps {
  mails: MailRecord[];
  config: AppConfig;
  onNavigateToTab: (tab: string) => void;
  onSelectMail: (mail: MailRecord) => void;
  isOffline?: boolean;
}

export default function Dashboard({ mails, onNavigateToTab, onSelectMail, isOffline = false }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Network details state
  const [networkInterfaces, setNetworkInterfaces] = useState<any[]>([]);
  const [publicIp, setPublicIp] = useState<string | null>(null);
  const [networkType, setNetworkType] = useState<'local' | 'tailscale' | 'public'>('local');
  const [selectedInterface, setSelectedInterface] = useState<any | null>(null);
  const [isRefreshingNetwork, setIsRefreshingNetwork] = useState(false);
  const [showCopiedSnackbar, setShowCopiedSnackbar] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);
  const [qrKey, setQrKey] = useState(0);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  const fetchNetworkInfo = async () => {
    setIsRefreshingNetwork(true);
    setQrError(false);
    setQrKey(prev => prev + 1);
    try {
      const res = await fetch('/api/network-info');
      if (res.ok) {
        const data = await res.json();
        setNetworkInterfaces(data.interfaces || []);
        setPublicIp(data.publicIp);
      }
    } catch (err) {
      console.error('Gagal mengambil info jaringan:', err);
    } finally {
      setIsRefreshingNetwork(false);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  const localInterfaces = useMemo(() => {
    return networkInterfaces.filter(i => i.type === 'wifi' || i.type === 'ethernet' || i.type === 'other');
  }, [networkInterfaces]);

  const tailscaleInterfaces = useMemo(() => {
    return networkInterfaces.filter(i => i.type === 'tailscale');
  }, [networkInterfaces]);

  useEffect(() => {
    if (networkType === 'local') {
      const preferred = localInterfaces.find((i: any) => i.type === 'wifi') ||
                        localInterfaces.find((i: any) => i.type === 'ethernet') ||
                        localInterfaces[0];
      setSelectedInterface(preferred || null);
    } else if (networkType === 'tailscale') {
      setSelectedInterface(tailscaleInterfaces[0] || null);
    } else if (networkType === 'public') {
      if (publicIp) {
        setSelectedInterface({ address: publicIp, type: 'public', name: 'Public IP', port: 3000 });
      } else {
        setSelectedInterface(null);
      }
    }
  }, [networkType, localInterfaces, tailscaleInterfaces, publicIp]);

  useEffect(() => {
    if (selectedInterface) {
      setQrLoading(true);
      setQrError(false);
    }
  }, [selectedInterface, qrKey]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setShowCopiedSnackbar(true);
      setTimeout(() => setShowCopiedSnackbar(false), 2000);
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDay = useMemo(() => {
    return currentTime.toLocaleDateString('id-ID', { weekday: 'long' });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const hours = pad(currentTime.getHours());
    const minutes = pad(currentTime.getMinutes());
    const seconds = pad(currentTime.getSeconds());
    return `${hours}:${minutes}:${seconds}`;
  }, [currentTime]);

  const stats = useMemo(() => {
    const total = mails.length;
    const withPdf = mails.filter(m => !!m.pdfPath).length;
    
    // Count entries from the last 7 days for dynamic trend indicator
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = mails.filter(m => new Date(m.createdAt) >= sevenDaysAgo).length;

    // 1. Disposition count
    const disposedMails = mails.filter(m => {
      const disp = m.metadata?.disposisi;
      return disp && typeof disp === 'string' && disp.trim() !== '' && disp.trim() !== '-';
    });
    const disposedCount = disposedMails.length;
    const disposedPercent = total > 0 ? Math.round((disposedCount / total) * 100) : 0;

    // 2. Most active sender (suratDari)
    const senderCounts: Record<string, number> = {};
    mails.forEach(m => {
      const sender = m.metadata?.suratDari;
      if (sender && typeof sender === 'string' && sender.trim() !== '' && sender.trim() !== '-') {
        const cleaned = sender.trim();
        senderCounts[cleaned] = (senderCounts[cleaned] || 0) + 1;
      }
    });

    let activeSender = 'Tidak ada';
    let activeSenderCount = 0;
    Object.entries(senderCounts).forEach(([sender, count]) => {
      if (count > activeSenderCount) {
        activeSender = sender;
        activeSenderCount = count;
      }
    });
    
    return { 
      total, 
      withPdf, 
      recentCount,
      disposedCount,
      disposedPercent,
      activeSender,
      activeSenderCount
    };
  }, [mails]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    const today = new Date();

    // Pre-populate with default ranges for visual continuity
    if (timeRange === 'daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        groups[key] = 0;
      }
    } else if (timeRange === 'weekly') {
      // Last 6 weeks
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i * 7);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.getFullYear(), d.getMonth(), diff);
        const key = monday.toISOString().split('T')[0];
        groups[key] = 0;
      }
    } else if (timeRange === 'monthly') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        groups[key] = 0;
      }
    } else {
      // Last 3 years
      for (let i = 2; i >= 0; i--) {
        const key = `${today.getFullYear() - i}`;
        groups[key] = 0;
      }
    }

    // Sort all mails chronologically ascending using fast string comparison instead of expensive Date object constructions
    const sortedMails = [...mails].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    
    sortedMails.forEach(m => {
      const dateObj = new Date(m.createdAt);
      if (isNaN(dateObj.getTime())) return;

      let key = '';
      if (timeRange === 'daily') {
        key = m.createdAt.split('T')[0]; // YYYY-MM-DD
      } else if (timeRange === 'weekly') {
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(dateObj.getFullYear(), dateObj.getMonth(), diff);
        key = monday.toISOString().split('T')[0]; // YYYY-MM-DD (Monday start of week)
      } else if (timeRange === 'monthly') {
        key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      } else {
        key = `${dateObj.getFullYear()}`; // YYYY
      }

      groups[key] = (groups[key] || 0) + 1;
    });

    const entries = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));

    // Slice for optimal layout density in different ranges
    let slicedEntries = entries;
    if (timeRange === 'daily') {
      slicedEntries = entries.slice(-30); // Last 30 active days
    } else if (timeRange === 'weekly') {
      slicedEntries = entries.slice(-12); // Last 12 weeks
    } else if (timeRange === 'monthly') {
      slicedEntries = entries.slice(-12); // Last 12 months
    }

    return slicedEntries.map(([key, count]) => {
      let displayName = key;
      if (timeRange === 'daily') {
        const parts = key.split('-');
        displayName = parts.length === 3 ? `${parts[2]}/${parts[1]}` : key;
      } else if (timeRange === 'weekly') {
        const parts = key.split('-');
        displayName = parts.length === 3 ? `Mgg ${parts[2]}/${parts[1]}` : key;
      } else if (timeRange === 'monthly') {
        const parts = key.split('-');
        if (parts.length === 2) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const monthIdx = parseInt(parts[1], 10) - 1;
          displayName = `${months[monthIdx]} ${parts[0].slice(-2)}`;
        }
      } else if (timeRange === 'yearly') {
        displayName = key;
      }
      return { name: displayName, count };
    });
  }, [mails, timeRange]);

  // Memoize the recent activities list, pre-rendering local date strings and sorting correctly
  const recentActivities = useMemo(() => {
    return [...mails]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map(mail => {
        let formattedDate = '-';
        try {
          const d = new Date(mail.createdAt);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            formattedDate = `${day}/${month}/${year}`;
          }
        } catch (e) {
          // ignore
        }
        return {
          ...mail,
          formattedDate
        };
      });
  }, [mails]);

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Ringkasan Agenda</h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Statistik surat masuk dan log aktivitas sistem terbaru.</p>
        </div>
        
        {/* Connection Status Badge */}
        <div className="self-start sm:self-center shrink-0">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 ${
            isOffline
              ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border-[var(--md-sys-color-error)]/40 shadow-sm'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isOffline 
                ? 'bg-[var(--md-sys-color-error)] animate-pulse' 
                : 'bg-emerald-500 animate-pulse'
            }`} />
            {isOffline ? 'Terputus dari Server' : 'Terhubung'}
          </span>
        </div>
      </div>

      {/* Local, Tailscale & Public IP Connection Banner (Double-Bezel Architecture) */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-1.5 transition-premium shadow-sm hover:shadow-md hover:border-[var(--md-sys-color-primary)]/40"
      >
        <div className="p-6 bg-[var(--md-sys-color-surface-container)] rounded-[calc(2rem-0.375rem)] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
          {/* Decorative Background Ambient Glow */}
          <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-[var(--md-sys-color-primary-container)] opacity-10 blur-3xl group-hover:scale-115 transition-transform duration-700 pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-[var(--md-sys-color-tertiary-container)] opacity-10 blur-3xl group-hover:scale-115 transition-transform duration-700 pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 w-full">
            <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl font-fill">settings_ethernet</span>
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  Akses Jaringan & Integrasi Multi-IP
                </h3>
                
                {/* Refresh Button with Elastic Rotation */}
                <button
                  type="button"
                  onClick={fetchNetworkInfo}
                  disabled={isRefreshingNetwork}
                  className="w-7 h-7 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center cursor-pointer hover:bg-[var(--md-sys-color-surface-container-highest)] hover:border-[var(--md-sys-color-primary)] active:scale-90 transition-all shrink-0"
                  title="Segarkan jaringan"
                >
                  <motion.span
                    animate={{ rotate: isRefreshingNetwork ? 360 : 0 }}
                    transition={isRefreshingNetwork ? { repeat: Infinity, duration: 1, ease: 'linear' } : { type: 'spring', stiffness: 200, damping: 15 }}
                    className="material-symbols-outlined text-sm font-bold"
                  >
                    refresh
                  </motion.span>
                </button>
              </div>
              
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1 max-w-2xl">
                Bagi akses aplikasi persuratan Anda ke perangkat luar (HP/Tablet/Laptop). Pilih kategori jaringan di bawah untuk memperbarui QR Code secara instan.
              </p>

              {/* Network Category Switcher (Capsule Pills) */}
              <div className="mt-4 flex p-0.5 bg-[var(--md-sys-color-surface-container-high)] rounded-full border border-[var(--md-sys-color-outline-variant)]/60 relative w-fit">
                {[
                  { id: 'local', label: 'Jaringan Lokal' },
                  { id: 'tailscale', label: 'Tailscale VPN' },
                  { id: 'public', label: 'IP Publik (Internet)' }
                ].map((category) => {
                  const isActive = networkType === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setNetworkType(category.id as any)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-300 relative z-10 ${
                        isActive 
                          ? 'text-[var(--md-sys-color-on-primary)] font-black' 
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNetworkCategory"
                          className="absolute inset-0 bg-[var(--md-sys-color-primary)] rounded-full -z-10"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      {category.label}
                    </button>
                  );
                })}
              </div>

              {/* Category-specific content panels */}
              {networkType === 'local' && (
                <div className="mt-3">
                  {localInterfaces.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {localInterfaces.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider font-black text-[var(--md-sys-color-outline)]">Pilih Interface:</span>
                          <div className="flex p-0.5 bg-[var(--md-sys-color-surface-container-high)] rounded-full border border-[var(--md-sys-color-outline-variant)]/60 relative">
                            {localInterfaces.map((item, idx) => {
                              const isSelected = selectedInterface?.address === item.address;
                              const displayName = item.type === 'wifi' ? `Wi-Fi (${item.name})` : 
                                                  item.type === 'ethernet' ? 'LAN (Ethernet)' : item.name;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedInterface(item)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-300 ${
                                    isSelected 
                                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-black' 
                                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                                  }`}
                                >
                                  {displayName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[var(--md-sys-color-error-container)]/10 border border-[var(--md-sys-color-error)]/20 text-[11px] text-[var(--md-sys-color-error)] flex items-center gap-2 max-w-lg">
                      <span className="material-symbols-outlined text-sm font-fill">warning</span>
                      <span>Jaringan Wi-Fi/Lokal tidak terdeteksi. Hubungkan komputer host ke Wi-Fi untuk berbagi akses.</span>
                    </div>
                  )}
                </div>
              )}

              {networkType === 'tailscale' && (
                <div className="mt-3">
                  {tailscaleInterfaces.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 mb-1.5">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Interface VPN Tailscale Terdeteksi Aktif
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[var(--md-sys-color-error-container)]/10 border border-[var(--md-sys-color-error)]/20 text-[11px] text-[var(--md-sys-color-error)] flex flex-col gap-1 max-w-lg">
                      <div className="flex items-center gap-2 font-bold">
                        <span className="material-symbols-outlined text-sm font-fill">warning</span>
                        <span>Interface VPN Tailscale Tidak Aktif</span>
                      </div>
                      <span>Silakan aktifkan aplikasi Tailscale pada komputer host Anda untuk membagi akses aman lewat VPN virtual.</span>
                    </div>
                  )}
                </div>
              )}

              {networkType === 'public' && (
                <div className="mt-3">
                  {publicIp ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-[var(--md-sys-color-primary)] font-bold flex items-center gap-1.5 mb-1.5">
                        <span className="material-symbols-outlined text-xs">public</span>
                        IP Publik Terdeteksi
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex flex-col gap-1 max-w-lg">
                      <div className="flex items-center gap-2 font-bold text-[var(--md-sys-color-on-surface)]">
                        <span className="material-symbols-outlined text-sm font-fill">cloud_off</span>
                        <span>IP Publik Offline / Tidak Terdeteksi</span>
                      </div>
                      <span>Pastikan komputer host Anda terhubung ke internet untuk mendapatkan alamat IP Publik.</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Connection Link & Details */}
              {selectedInterface && (
                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-3 py-1.5 rounded-full font-mono border border-[var(--md-sys-color-outline-variant)]/60 shadow-sm">
                      {`http://${selectedInterface.address}:${selectedInterface.type === 'public' ? 3000 : 3000}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(`http://${selectedInterface.address}:${selectedInterface.type === 'public' ? 3000 : 3000}`)}
                      className="text-[10px] font-black text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 cursor-pointer group px-2.5 py-1 rounded-md hover:bg-[var(--md-sys-color-primary)]/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                        content_copy
                      </span> 
                      Salin Alamat
                    </button>
                  </div>
                  {selectedInterface.type === 'tailscale' && (
                    <p className="text-[9.5px] text-[var(--md-sys-color-outline)] font-bold italic mt-1.5">
                      * Pastikan perangkat klien (seperti HP Android) juga telah login ke akun Tailscale yang sama.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* QR Code Card with double bezel, skeleton shimmer, double click zoom, and error fallback */}
          {selectedInterface && (
            <div 
              onDoubleClick={() => setIsQrZoomed(true)}
              title="Double click untuk memperbesar"
              className="relative shrink-0 w-28 h-32 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/60 p-1.5 rounded-3xl hover:scale-[1.03] active:scale-98 transition-premium shadow-sm flex flex-col items-center justify-center cursor-pointer group/qr"
            >
              {/* Skeleton Loading State */}
              {qrLoading && (
                <div className="absolute inset-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden flex items-center justify-center z-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  <span className="material-symbols-outlined text-neutral-400 animate-spin">progress_activity</span>
                </div>
              )}
              
              {/* Error Fallback */}
              {qrError ? (
                <div className="w-full h-[100px] bg-[var(--md-sys-color-surface-container-highest)] rounded-2xl flex flex-col items-center justify-center text-center p-2 text-[var(--md-sys-color-error)]">
                  <span className="material-symbols-outlined text-2xl font-fill">error</span>
                  <span className="text-[8px] font-bold uppercase tracking-tighter mt-1">Gagal Memuat QR</span>
                </div>
              ) : (
                <div className="bg-white p-1.5 rounded-2xl w-full h-[100px] flex items-center justify-center overflow-hidden">
                  <img
                    src={`/api/network-info/qr?url=${encodeURIComponent(`http://${selectedInterface.address}:3000`)}&t=${qrKey}`}
                    alt="QR Code Akses Jaringan"
                    onLoad={() => setQrLoading(false)}
                    onError={() => {
                      setQrError(true);
                      setQrLoading(false);
                    }}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${qrLoading ? 'opacity-0' : 'opacity-100'}`}
                  />
                </div>
              )}
              <span className="text-[8px] font-black text-[var(--md-sys-color-outline)] uppercase tracking-wider mt-1.5 leading-none select-none group-hover/qr:text-[var(--md-sys-color-primary)] transition-colors">
                Klik 2x Zoom
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left: Metrics Bento Grid (2/3 width) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Agenda', value: stats.total, sub: `${stats.recentCount} dalam 7 hari terakhir`, icon: 'inbox', color: 'teal', tab: 'mails', span: 'sm:col-span-2' },
            { label: 'Dengan Lampiran', value: stats.withPdf, sub: `${stats.total > 0 ? Math.round((stats.withPdf / stats.total) * 100) : 0}% memiliki PDF`, icon: 'picture_as_pdf', color: 'indigo', tab: 'mails', span: 'sm:col-span-1' },
            { label: 'Status Disposisi', value: stats.disposedCount, sub: `${stats.disposedPercent}% telah ditindaklanjut`, icon: 'assignment', color: 'green', tab: 'mails', span: 'sm:col-span-1' },
            { label: 'Instansi Teraktif', value: stats.activeSender, sub: stats.activeSenderCount > 0 ? `Mengirim ${stats.activeSenderCount} surat` : 'Belum ada data', icon: 'business', color: 'blue', tab: 'mails', span: 'sm:col-span-1' },
            { label: 'Efisiensi Arsip', value: '100%', sub: 'Penyimpanan lokal terstruktur', icon: 'bolt', color: 'amber', tab: 'dashboard', span: 'sm:col-span-1' },
          ].map((stat, i) => {
            const colors = colorClasses[stat.color] || { bg: 'bg-[var(--md-sys-color-surface-container)]', text: 'text-[var(--md-sys-color-on-surface)]', border: 'border-[var(--md-sys-color-outline-variant)]' };
            const isLongValue = typeof stat.value === 'string' && stat.value.length > 12;
            
            // Concentric Radii Math: Outer R = 32px, Padding = 8px (p-2) -> Inner R = 24px (rounded-[24px])
            return (
              <div
                key={i}
                onClick={() => onNavigateToTab(stat.tab)}
                className={`p-2 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[32px] cursor-pointer hover:border-[var(--md-sys-color-primary)] hover:shadow-md transition-premium active:scale-[0.98] group flex flex-col justify-stretch ${stat.span}`}
              >
                <div className="p-5 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.06)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.02)] rounded-[24px] flex flex-col justify-between items-start w-full h-full gap-5">
                  {/* Top Row: Icon + Link Button */}
                  <div className="flex justify-between items-center w-full">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text} ${colors.border} border shrink-0`}>
                      <span className="material-symbols-outlined text-xl font-fill">
                        {stat.icon}
                      </span>
                    </div>
                    {stat.tab !== 'dashboard' && !isLongValue && (
                      <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-premium text-[var(--md-sys-color-on-surface-variant)] shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </div>
                    )}
                  </div>
                  {/* Bottom: Text Info Stacked Vertically */}
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider leading-none">{stat.label}</p>
                      {i === 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-pulse shrink-0" title="Sinkronisasi Live" />
                      )}
                    </div>
                    <p 
                      className={`${isLongValue ? 'text-sm font-bold leading-tight break-words' : 'text-2xl font-black leading-none'} text-[var(--md-sys-color-on-surface)]`}
                      title={String(stat.value)}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-[var(--md-sys-color-outline)] font-medium leading-normal">{stat.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Right: Large Clock & Date Hero Card (1/3 width) */}
        <div className="p-2 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[32px] flex flex-col justify-stretch">
          <div className="p-6 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.06)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.02)] rounded-[24px] flex flex-col justify-center items-center text-center w-full h-full relative overflow-hidden group">
            {/* Decorative background ambient glow */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[var(--md-sys-color-error-container)] opacity-10 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-[var(--md-sys-color-primary-container)] opacity-10 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-outline-variant)] mb-5 shadow-sm">
              <span className="material-symbols-outlined text-3xl font-fill animate-pulse">
                schedule
              </span>
            </div>
            
            <p className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest leading-none mb-3">Waktu & Tanggal</p>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--md-sys-color-primary)] font-mono tracking-tight leading-none mb-3 drop-shadow-sm select-none">
              {formattedTime}
            </h2>
            
            <p className="text-lg font-black text-[var(--md-sys-color-on-surface)] tracking-tight">{formattedDay}</p>
            <p className="text-xs sm:text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] mt-1.5">{formattedDate}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--md-sys-color-surface-container)] p-4 md:p-8 rounded-[28px] border border-[var(--md-sys-color-outline-variant)] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
              Tren Entri Surat ({timeRange === 'daily' ? 'Harian' : timeRange === 'weekly' ? 'Mingguan' : timeRange === 'monthly' ? 'Bulanan' : 'Tahunan'})
            </h3>
            <div className="flex p-1 bg-[var(--md-sys-color-surface-container-high)] rounded-full border border-[var(--md-sys-color-outline-variant)] shrink-0">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((range) => {
                const labels = {
                  daily: 'Harian',
                  weekly: 'Mingguan',
                  monthly: 'Bulanan',
                  yearly: 'Tahunan'
                };
                const isActive = timeRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm font-black'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {labels[range]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-[280px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] italic text-sm">
                <span className="material-symbols-outlined text-5xl mb-2">analytics</span>
                Belum ada data grafik
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--md-sys-color-outline-variant)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--md-sys-color-outline)', fontWeight: 500}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--md-sys-color-outline)', fontWeight: 500}} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      borderRadius: '16px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                      padding: '10px 14px',
                      fontSize: '12px',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}
                    itemStyle={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" name="Jumlah Surat" dataKey="count" stroke="var(--md-sys-color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[var(--md-sys-color-surface-container-low)] p-8 rounded-[28px] border border-[var(--md-sys-color-outline-variant)] flex flex-col">
          <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mb-6">Aktivitas Terbaru</h3>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[280px] pr-1">
            {recentActivities.map(mail => {
              const isOut = mail.metadata.type === 'Keluar' || mail.metadata.jenisSurat?.toLowerCase().includes('keluar');
              const iconName = 'mail';
              const iconColorClass = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]';

              return (
                <div
                  key={mail.id}
                  onClick={() => onSelectMail(mail)}
                  className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-premium active:scale-[0.98] flex items-center gap-4 group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--md-sys-color-outline-variant)] ${iconColorClass}`}>
                    <span className="material-symbols-outlined text-xl font-fill">
                      {iconName}
                    </span>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                        {mail.metadata.perihal || mail.metadata.isi || 'Tanpa Perihal'}
                      </p>
                      <span className="text-[9px] text-[var(--md-sys-color-outline)] font-medium shrink-0">{mail.formattedDate}</span>
                    </div>
                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {isOut ? `Penerima: ${mail.metadata.penerima || mail.metadata.tujuan || '-'}` : `Dari: ${mail.metadata.pengirim || '-'}`}
                    </p>
                  </div>
                </div>
              );
            })}
            {mails.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-[var(--md-sys-color-outline)] opacity-60 italic text-xs">
                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                Belum ada aktivitas.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copied Success Snackbar */}
      <AnimatePresence>
        {showCopiedSnackbar && (
          <motion.div
            initial={{ y: 30, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 30, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2100] px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full shadow-lg border border-neutral-800 dark:border-neutral-200 flex items-center gap-2.5 text-xs font-bold select-none"
          >
            <span className="material-symbols-outlined text-sm text-emerald-500 font-fill">check_circle</span>
            Alamat berhasil disalin ke papan klip!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoomed QR Code Modal */}
      <AnimatePresence>
        {isQrZoomed && selectedInterface && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsQrZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-8 max-w-sm w-full flex flex-col items-center gap-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsQrZoomed(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center cursor-pointer hover:bg-[var(--md-sys-color-error)]/10 hover:text-[var(--md-sys-color-error)] transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="text-center flex flex-col gap-2 mt-4">
                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                  Pindai QR Code
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Akses langsung aplikasi agenda surat ini dengan memindai kode di bawah.
                </p>
              </div>

              {/* Large QR Box */}
              <div className="bg-white p-4 rounded-[2rem] w-60 h-60 border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src={`/api/network-info/qr?url=${encodeURIComponent(`http://${selectedInterface.address}:3000`)}&t=${qrKey}`}
                  alt="Enlarged QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="w-full bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/40 p-4 rounded-2xl text-center">
                <p className="text-xs font-mono font-bold text-[var(--md-sys-color-primary)] truncate selection:bg-transparent">
                  {`http://${selectedInterface.address}:3000`}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
