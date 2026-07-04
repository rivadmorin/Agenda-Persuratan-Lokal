import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { MailRecord, AppConfig } from '../types';

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
    return { total, withPdf };
  }, [mails]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    mails.slice(-20).forEach(m => {
      const date = m.createdAt.split('T')[0];
      groups[date] = (groups[date] || 0) + 1;
    });
    return Object.entries(groups).map(([name, count]) => ({ name, count }));
  }, [mails]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)]">Ringkasan Agenda</h1>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">Statistik surat dan aktivitas terbaru.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Agenda', value: stats.total, icon: 'inbox', color: 'primary', tab: 'mails' },
          { label: 'Dengan Lampiran', value: stats.withPdf, icon: 'picture_as_pdf', color: 'secondary', tab: 'mails' },
          { label: 'Efisiensi Arsip', value: '98%', icon: 'bolt', color: 'tertiary', tab: 'dashboard' },
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => onNavigateToTab(stat.tab)}
            className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[28px] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-6 cursor-pointer hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl material-symbols-outlined bg-[var(--md-sys-color-${stat.color}-container)] text-[var(--md-sys-color-on-${stat.color}-container)]`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]">{stat.label}</p>
              <p className="text-3xl font-black text-[var(--md-sys-color-on-surface)]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--md-sys-color-surface-container)] p-8 rounded-[32px] border border-[var(--md-sys-color-outline-variant)]">
          <h3 className="text-xl font-bold mb-8">Tren Entri Surat (Terbaru)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--md-sys-color-outline-variant)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--md-sys-color-on-surface-variant)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--md-sys-color-on-surface-variant)'}} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: '16px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    boxShadow: 'none'
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--md-sys-color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--md-sys-color-surface-container-high)] p-8 rounded-[32px] border border-[var(--md-sys-color-outline-variant)]">
          <h3 className="text-xl font-bold mb-6">Aktivitas Terbaru</h3>
          <div className="flex flex-col gap-4">
            {mails.slice(-5).reverse().map(mail => (
              <div
                key={mail.id}
                onClick={() => onSelectMail(mail)}
                className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <p className="text-xs font-bold text-[var(--md-sys-color-primary)] mb-1 uppercase tracking-wider">{mail.type}</p>
                <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">{mail.metadata.perihal || mail.metadata.isi || 'Tanpa Perihal'}</p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 italic">{new Date(mail.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {mails.length === 0 && <p className="text-center py-10 opacity-30 italic">Belum ada aktivitas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
