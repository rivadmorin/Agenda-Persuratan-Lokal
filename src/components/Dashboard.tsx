import React, { useState, useMemo } from 'react';
import {
  Inbox,
  FileText,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  Building2,
  Calendar,
  Layers,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MailRecord, AppConfig } from '../types';

interface DashboardProps {
  mails: MailRecord[];
  config: AppConfig | null;
  onNavigateToTab: (tab: string) => void;
  onSelectMail: (mail: MailRecord) => void;
}

export default function Dashboard({ mails, config, onNavigateToTab, onSelectMail }: DashboardProps) {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [timeRange, setTimeRange] = useState<'6' | '12' | 'all'>('6');
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');
  const [dailyRange, setDailyRange] = useState<'7' | '14' | '30'>('7');

  // Colors for theme
  const COLORS = {
    primary: '#3b82f6', // blue
    total: '#10b981', // emerald
  };

  const PIE_COLORS = ['#3b82f6', '#94a3b8'];

  // Process data for Month-over-Month chart
  const monthlyChartData = useMemo(() => {
    // Determine the month of a record
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const now = new Date();
    const rangeLength = timeRange === 'all' ? 24 : Number(timeRange);
    
    // Generate empty list of months in order
    const list: any[] = [];
    for (let i = rangeLength - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        monthLabel: months[d.getMonth()].substring(0, 3), // short label
        fullMonth: months[d.getMonth()],
        label: `${months[d.getMonth()].substring(0, 3)} ${d.getFullYear()}`,
        Volume: 0,
        Total: 0
      });
    }

    // Populate actual mail records count
    mails.forEach(mail => {
      let dateStr = mail.metadata.tanggalSurat || mail.metadata.tanggalTerima || mail.metadata.tanggal_surat || mail.metadata.tanggal_terima || mail.createdAt;
      if (!dateStr) dateStr = mail.createdAt;

      const mailDate = new Date(dateStr);
      if (isNaN(mailDate.getTime())) return;

      const mY = mailDate.getFullYear();
      const mM = mailDate.getMonth();

      // Find if this month exists in our chart list
      const targetMonth = list.find(item => item.year === mY && item.month === mM);
      if (targetMonth) {
        targetMonth.Volume += 1;
        targetMonth.Total += 1;
      }
    });

    return list;
  }, [mails, timeRange]);

  // Process data for Daily trend chart
  const dailyChartData = useMemo(() => {
    const now = new Date();
    const rangeLength = dailyRange === '30' ? 30 : dailyRange === '14' ? 14 : 7;
    
    // Generate empty list of days in order (last N days)
    const list: any[] = [];
    for (let i = rangeLength - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStr = d.getDate();
      const monthsShort = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const monthStr = monthsShort[d.getMonth()];
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      list.push({
        dateKey,
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        label: `${dayStr} ${monthStr}`,
        Volume: 0,
        Total: 0
      });
    }

    // Populate actual mail records count
    mails.forEach(mail => {
      let dateStr = mail.metadata.tanggalSurat || mail.metadata.tanggalTerima || mail.metadata.tanggal_surat || mail.metadata.tanggal_terima || mail.createdAt;
      if (!dateStr) dateStr = mail.createdAt;

      const mailDate = new Date(dateStr);
      if (isNaN(mailDate.getTime())) return;

      const mY = mailDate.getFullYear();
      const mM = mailDate.getMonth();
      const mD = mailDate.getDate();
      const key = `${mY}-${String(mM + 1).padStart(2, '0')}-${String(mD).padStart(2, '0')}`;

      // Find if this day exists in our chart list
      const targetDay = list.find(item => item.dateKey === key);
      if (targetDay) {
        targetDay.Volume += 1;
        targetDay.Total += 1;
      }
    });

    return list;
  }, [mails, dailyRange]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = mails.length;
    const withPdf = mails.filter(m => m.pdfPath).length;
    const pdfCoverage = total > 0 ? Math.round((withPdf / total) * 100) : 0;

    // Calculate percentage differences vs last month for trend indicator
    // Filter mails of this month vs last month
    const now = new Date();
    const thisMonthY = now.getFullYear();
    const thisMonthM = now.getMonth();

    const lastMonthY = thisMonthM === 0 ? thisMonthY - 1 : thisMonthY;
    const lastMonthM = thisMonthM === 0 ? 11 : thisMonthM - 1;

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    mails.forEach(m => {
      let dateStr = m.metadata.tanggalSurat || m.metadata.tanggalTerima || m.metadata.tanggal_surat || m.metadata.tanggal_terima || m.createdAt;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      if (d.getFullYear() === thisMonthY && d.getMonth() === thisMonthM) {
        thisMonthCount++;
      } else if (d.getFullYear() === lastMonthY && d.getMonth() === lastMonthM) {
        lastMonthCount++;
      }
    });

    let trendPercent = 0;
    let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
    
    if (lastMonthCount > 0) {
      trendPercent = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
      trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'neutral';
    } else if (thisMonthCount > 0) {
      trendPercent = 100;
      trendDirection = 'up';
    }

    return {
      total,
      withPdf,
      pdfCoverage,
      thisMonthCount,
      trendPercent: Math.abs(trendPercent),
      trendDirection
    };
  }, [mails]);

  // Ratio Pie Data: PDF presence comparison
  const ratioData = useMemo(() => {
    const withPdf = stats.withPdf;
    const withoutPdf = Math.max(0, stats.total - withPdf);
    return [
      { name: 'Dengan Lampiran', value: withPdf },
      { name: 'Tanpa Lampiran', value: withoutPdf }
    ].filter(item => item.value > 0);
  }, [stats]);

  // Top Senders Breakdown
  const topSenders = useMemo(() => {
    const counts: Record<string, number> = {};
    mails.forEach(m => {
      const senderVal = m.metadata.suratDari || m.metadata.pengirim || m.metadata.surat_dari || m.metadata.dari;
      if (senderVal) {
        const sender = String(senderVal).trim();
        counts[sender] = (counts[sender] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [mails]);

  // Latest Agendas Feed
  const latestMails = useMemo(() => {
    return [...mails]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [mails]);

  // Dynamic CSS helper based on current app configuration theme
  const mainThemeColor = config?.themeColor || '#2563eb';

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6 md:space-y-8 select-none transition-colors duration-200">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 dark:border-slate-900 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1.5 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Statistik & Analisis Agenda
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pemantauan langsung volume surat masuk/keluar, keaktifan persuratan, dan status berkas lampiran instansi.
          </p>
        </div>

        {/* Filters/Actions row */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shrink-0">
            {viewMode === 'monthly' ? (
              <>
                <button
                  onClick={() => setTimeRange('6')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    timeRange === '6'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  6 Bulan
                </button>
                <button
                  onClick={() => setTimeRange('12')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    timeRange === '12'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  12 Bulan
                </button>
                <button
                  onClick={() => setTimeRange('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    timeRange === 'all'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  2 Tahun
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setDailyRange('7')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    dailyRange === '7'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setDailyRange('14')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    dailyRange === '14'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  14 Hari
                </button>
                <button
                  onClick={() => setDailyRange('30')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    dailyRange === '30'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  30 Hari
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* Card 1: Total Agenda */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none flex items-center justify-between transition-colors duration-200 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Agenda Surat</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-mono">{stats.total}</h3>
            <div className="flex items-center gap-1">
              {stats.trendDirection === 'up' && (
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{stats.trendPercent}%
                </span>
              )}
              {stats.trendDirection === 'down' && (
                <span className="inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-450 gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  -{stats.trendPercent}%
                </span>
              )}
              {stats.trendDirection === 'neutral' && (
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-400">Stagnan</span>
              )}
              <span className="text-[10px] text-slate-400">vs bulan lalu</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Berkas Dengan PDF */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none flex items-center justify-between transition-colors duration-200 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Berkas Dengan PDF</span>
            <h3 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">{stats.withPdf}</h3>
            <span className="text-[10px] text-slate-400 block font-medium">
              {stats.total > 0 ? Math.round((stats.withPdf / stats.total) * 100) : 0}% dari seluruh berkas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Surat Bulanan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none flex items-center justify-between transition-colors duration-200 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Surat Bulanan</span>
            <h3 className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">{stats.thisMonthCount}</h3>
            <span className="text-[10px] text-slate-400 block font-medium">
              Surat terdaftar di bulan berjalan
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 5: PDF Attachment Coverage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none flex items-center justify-between transition-colors duration-200 hover:border-slate-300 dark:hover:border-slate-700">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Kelengkapan PDF</span>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{stats.pdfCoverage}%</h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.pdfCoverage}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Primary Graphs Row: MoM volume and ratio pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main monthly/daily trend chart (66% width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm dark:shadow-none flex flex-col transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base font-display">
                  {viewMode === 'monthly' ? 'Trafik Persuratan Bulanan' : 'Trafik Persuratan Harian'}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {viewMode === 'monthly' ? 'Volume akumulasi agenda surat per bulan' : 'Volume akumulasi agenda surat per hari'}
                </p>
              </div>

              {/* View Mode Toggle Button Group */}
              <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg shrink-0 mt-1 sm:mt-0">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    viewMode === 'monthly'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    viewMode === 'daily'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Harian
                </button>
              </div>
            </div>

            {/* Toggle bar/area */}
            <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilkan Diagram Batang"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  chartType === 'area'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilkan Diagram Area"
              >
                <AreaChartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[320px] w-full text-xs font-semibold">
            {stats.total === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-16 gap-3">
                <Calendar className="w-10 h-10 stroke-1" />
                <span>Belum ada agenda surat tercatat untuk divisualisasikan.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={viewMode === 'monthly' ? monthlyChartData : dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis 
                      dataKey="label" 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="#94a3b8" 
                      dy={10}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="#94a3b8" 
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      itemStyle={{ fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar dataKey="Volume" name="Volume Surat" fill={COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                ) : (
                  <AreaChart data={viewMode === 'monthly' ? monthlyChartData : dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.00}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis 
                      dataKey="label" 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="#94a3b8" 
                      dy={10}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="#94a3b8" 
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      itemStyle={{ fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area type="monotone" dataKey="Volume" name="Volume Surat" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right ratio donut chart (34% width) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm dark:shadow-none flex flex-col justify-between transition-colors duration-200">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base font-display">Rasio Lampiran Berkas</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">Perbandingan surat dengan vs tanpa PDF</p>
          </div>

          <div className="flex-1 min-h-[220px] w-full flex items-center justify-center relative my-4">
            {stats.total === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
                <PieChartIcon className="w-8 h-8 stroke-1" />
                <span>Rasio kosong</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ratioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centered label inside donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-mono">{stats.total}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Surat</span>
                </div>
              </>
            )}
          </div>

          {/* Legend breakdown stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-slate-600 dark:text-slate-350">Dengan PDF</span>
              </div>
              <span className="font-mono text-slate-800 dark:text-white font-bold">
                {stats.withPdf} <span className="text-slate-400 text-[10px]">({stats.pdfCoverage}%)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#94a3b8' }} />
                <span className="text-slate-600 dark:text-slate-350">Tanpa PDF</span>
              </div>
              <span className="font-mono text-slate-800 dark:text-white font-bold">
                {Math.max(0, stats.total - stats.withPdf)} <span className="text-slate-400 text-[10px]">({stats.total > 0 ? 100 - stats.pdfCoverage : 0}%)</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Active Senders and Recent Agendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Senders Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm dark:shadow-none transition-colors duration-200 flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base font-display">Pengirim Teraktif</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Instansi pengirim surat terbanyak</p>
            </div>
            <Building2 className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>

          <div className="flex-1 space-y-4">
            {topSenders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12 gap-2">
                <Building2 className="w-8 h-8 stroke-1" />
                <span className="text-xs">Belum ada pengirim terdaftar.</span>
              </div>
            ) : (
              topSenders.map((sender, idx) => {
                const maxCount = topSenders[0]?.count || 1;
                const percentage = Math.round((sender.count / maxCount) * 100);
                return (
                  <div key={sender.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 truncate max-w-[240px]">{idx + 1}. {sender.name}</span>
                      <span className="font-mono font-bold text-slate-500 dark:text-slate-400">{sender.count} berkas</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-lg overflow-hidden">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-lg transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Latest Agenda Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm dark:shadow-none transition-colors duration-200 flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base font-display">Agenda Terbaru</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Agenda surat yang baru saja ditambahkan</p>
            </div>
            <button
              onClick={() => onNavigateToTab('agenda')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {latestMails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12 gap-2">
                <Inbox className="w-8 h-8 stroke-1" />
                <span className="text-xs">Belum ada agenda surat tercatat.</span>
              </div>
            ) : (
              latestMails.map((mail) => {
                const mailDate = new Date(mail.createdAt);
                return (
                  <div 
                    key={mail.id} 
                    onClick={() => {
                      onNavigateToTab('agenda');
                      onSelectMail(mail);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        <Inbox className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {mail.metadata.isiSurat || mail.metadata.perihal || mail.metadata.nomorSurat || mail.metadata.noSurat || mail.metadata.no_surat || 'Surat Tanpa Perihal'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono block mt-0.5">
                          ID: {mail.id.substring(5, 12)}... • {mail.metadata.suratDari || mail.metadata.pengirim || mail.metadata.surat_dari || mail.metadata.dari || 'Instansi Lokal'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 font-mono text-right shrink-0 whitespace-nowrap pl-2">
                      {isNaN(mailDate.getTime()) ? '-' : mailDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
