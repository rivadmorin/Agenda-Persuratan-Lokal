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
        <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">Ringkasan Agenda</h1>
        <p className="text-sm text-slate-500">Statistik surat masuk dan log aktivitas sistem terbaru.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Agenda', value: stats.total, sub: `${stats.recentCount} dalam 7 hari terakhir`, icon: 'inbox', color: 'teal', tab: 'mails' },
          { label: 'Dengan Lampiran', value: stats.withPdf, sub: `${stats.total > 0 ? Math.round((stats.withPdf / stats.total) * 100) : 0}% memiliki PDF`, icon: 'picture_as_pdf', color: 'indigo', tab: 'mails' },
          { label: 'Efisiensi Arsip', value: '100%', sub: 'Penyimpanan lokal ter-enkripsi', icon: 'bolt', color: 'amber', tab: 'dashboard' },
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => onNavigateToTab(stat.tab)}
            className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex items-center gap-6 cursor-pointer hover:border-teal-500/50 hover:shadow-[0_8px_30px_rgba(13,148,136,0.04)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl material-symbols-outlined bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100 shrink-0 font-fill`}>
              {stat.icon}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 leading-none mb-1.5">{stat.value}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Entri Surat (Terbaru)</h3>
          <div className="h-[280px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-sm">
                <span className="material-symbols-outlined text-5xl mb-2">analytics</span>
                Belum ada data grafik
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                      padding: '10px 14px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                    itemStyle={{ color: '#0d9488', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" name="Jumlah Surat" dataKey="count" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200/60 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Aktivitas Terbaru</h3>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[280px] pr-1">
            {mails.slice(-5).reverse().map(mail => (
              <div
                key={mail.id}
                onClick={() => onSelectMail(mail)}
                className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-teal-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.01)] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{mail.type}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{new Date(mail.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-xs font-bold text-slate-700 truncate">{mail.metadata.perihal || mail.metadata.isi || 'Tanpa Perihal'}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Dari: {mail.metadata.pengirim || '-'}</p>
              </div>
            ))}
            {mails.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-slate-400 opacity-60 italic text-xs">
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
