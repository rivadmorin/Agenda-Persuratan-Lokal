import React, { useMemo } from 'react';
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
  }
};

interface DashboardProps {
  mails: MailRecord[];
  config: AppConfig;
  onNavigateToTab: (tab: string) => void;
  onSelectMail: (mail: MailRecord) => void;
}

export default function Dashboard({ mails, onNavigateToTab, onSelectMail }: DashboardProps) {
  const stats = useMemo(() => {
    const total = mails.length;
    const withPdf = mails.filter(m => !!m.pdfPath).length;
    
    // Count entries from the last 7 days for dynamic trend indicator
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = mails.filter(m => new Date(m.createdAt) >= sevenDaysAgo).length;
    
    return { total, withPdf, recentCount };
  }, [mails]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    // Group last 20 mail entries by date
    mails.slice(-20).forEach(m => {
      const date = m.createdAt.split('T')[0];
      groups[date] = (groups[date] || 0) + 1;
    });
    return Object.entries(groups).map(([name, count]) => {
      const [y, month, d] = name.split('-');
      return { name: `${d}/${month}`, count };
    });
  }, [mails]);

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Ringkasan Agenda</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Statistik surat masuk dan log aktivitas sistem terbaru.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Agenda', value: stats.total, sub: `${stats.recentCount} dalam 7 hari terakhir`, icon: 'inbox', color: 'teal', tab: 'mails' },
          { label: 'Dengan Lampiran', value: stats.withPdf, sub: `${stats.total > 0 ? Math.round((stats.withPdf / stats.total) * 100) : 0}% memiliki PDF`, icon: 'picture_as_pdf', color: 'indigo', tab: 'mails' },
          { label: 'Efisiensi Arsip', value: '100%', sub: 'Penyimpanan lokal terstruktur', icon: 'bolt', color: 'amber', tab: 'dashboard' },
        ].map((stat, i) => {
          const colors = colorClasses[stat.color] || { bg: 'bg-[var(--md-sys-color-surface-container)]', text: 'text-[var(--md-sys-color-on-surface)]', border: 'border-[var(--md-sys-color-outline-variant)]' };
          return (
            <div
              key={i}
              onClick={() => onNavigateToTab(stat.tab)}
              className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[28px] border border-[var(--md-sys-color-outline-variant)] shadow-sm flex items-center gap-6 cursor-pointer hover:border-[var(--md-sys-color-primary)] hover:shadow-md transition-all duration-300 active:scale-[0.98]"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text} ${colors.border} border shrink-0`}>
                <span className="material-symbols-outlined text-2xl font-fill">
                  {stat.icon}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] leading-none mb-1.5">{stat.value}</p>
                <p className="text-[10px] text-[var(--md-sys-color-outline)] font-medium truncate">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--md-sys-color-surface-container)] p-8 rounded-[28px] border border-[var(--md-sys-color-outline-variant)] shadow-sm">
          <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mb-6">Tren Entri Surat (Terbaru)</h3>
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
            {mails.slice(-5).reverse().map(mail => (
              <div
                key={mail.id}
                onClick={() => onSelectMail(mail)}
                className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="text-[9px] font-bold text-[var(--md-sys-color-on-primary-container)] bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-md uppercase tracking-wider">{mail.type}</span>
                  <span className="text-[9px] text-[var(--md-sys-color-outline)] font-medium">{new Date(mail.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">{mail.metadata.perihal || mail.metadata.isi || 'Tanpa Perihal'}</p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 truncate">Dari: {mail.metadata.pengirim || '-'}</p>
              </div>
            ))}
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
