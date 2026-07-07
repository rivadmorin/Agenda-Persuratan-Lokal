import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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
}

export default function Dashboard({ mails, onNavigateToTab, onSelectMail }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [currentTime, setCurrentTime] = useState(new Date());

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Ringkasan Agenda</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Statistik surat masuk dan log aktivitas sistem terbaru.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Reading this as: Premium document archival dashboard for administrative personnel, featuring structural Material 3 design tokens, clean geometric layouts with concentric double-bezel curves, and responsive spring-based hover feedback. */}
        {[
          { label: 'Total Agenda', value: stats.total, sub: `${stats.recentCount} dalam 7 hari terakhir`, icon: 'inbox', color: 'teal', tab: 'mails' },
          { label: 'Dengan Lampiran', value: stats.withPdf, sub: `${stats.total > 0 ? Math.round((stats.withPdf / stats.total) * 100) : 0}% memiliki PDF`, icon: 'picture_as_pdf', color: 'indigo', tab: 'mails' },
          { label: 'Status Disposisi', value: stats.disposedCount, sub: `${stats.disposedPercent}% telah ditindaklanjut`, icon: 'assignment', color: 'green', tab: 'mails' },
          { label: 'Instansi Teraktif', value: stats.activeSender, sub: stats.activeSenderCount > 0 ? `Mengirim ${stats.activeSenderCount} surat` : 'Belum ada data', icon: 'business', color: 'blue', tab: 'mails' },
          { label: 'Efisiensi Arsip', value: '100%', sub: 'Penyimpanan lokal terstruktur', icon: 'bolt', color: 'amber', tab: 'dashboard' },
          { label: 'Waktu & Tanggal', value: formattedTime, sub: `${formattedDay}, ${formattedDate}`, icon: 'schedule', color: 'rose', tab: 'dashboard' },
        ].map((stat, i) => {
          const colors = colorClasses[stat.color] || { bg: 'bg-[var(--md-sys-color-surface-container)]', text: 'text-[var(--md-sys-color-on-surface)]', border: 'border-[var(--md-sys-color-outline-variant)]' };
          const isLongValue = typeof stat.value === 'string' && stat.value.length > 12;
          
          // Concentric Radii Math: Outer R = 32px, Padding = 8px (p-2) -> Inner R = 24px (rounded-[24px])
          return (
            <div
              key={i}
              onClick={() => onNavigateToTab(stat.tab)}
              className="p-2 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[32px] cursor-pointer hover:border-[var(--md-sys-color-primary)] hover:shadow-md transition-premium active:scale-[0.98] group flex flex-col justify-stretch"
            >
              <div className="p-4 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.06)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.02)] rounded-[24px] flex items-center gap-3.5 w-full h-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text} ${colors.border} border shrink-0`}>
                  <span className="material-symbols-outlined text-xl font-fill">
                    {stat.icon}
                  </span>
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider leading-none truncate">{stat.label}</p>
                    {i === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-pulse shrink-0" title="Sinkronisasi Live" />
                    )}
                  </div>
                  <p 
                    className={`${isLongValue ? 'text-[11px] font-bold leading-tight' : 'text-xl font-black leading-none'} text-[var(--md-sys-color-on-surface)] mb-1 truncate`}
                    title={String(stat.value)}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[9px] text-[var(--md-sys-color-outline)] font-medium truncate">{stat.sub}</p>
                </div>
                {stat.tab !== 'dashboard' && !isLongValue && (
                  <div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-premium text-[var(--md-sys-color-on-surface-variant)] shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--md-sys-color-surface-container)] p-8 rounded-[28px] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
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
    </div>
  );
}
