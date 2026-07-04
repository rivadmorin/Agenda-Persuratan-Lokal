# Premium M3 UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the application to use a premium Teal and Slate design, clean up visual disproportions, improve layout responsiveness, and fix the PDF merge API bug.

**Architecture:** Update variables in `index.css`, customize the Tailwind design parameters, restructure `Sidebar.tsx`, `Dashboard.tsx`, `MailTable.tsx`, and `PdfTools.tsx` to use more refined spacings, clean typography, hover transitions, and compact bento grids.

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, Recharts, @material/web, Express, PostgreSQL.

## Global Constraints
- Accent color: Teal `#0d9488`
- Primary font: Product Sans
- Border radius: rounded-2xl (`1rem`) for standard elements, rounded-3xl (`1.5rem`) for containers
- Border styles: `border border-slate-200/60` (light mode)
- Viewport: `min-h-[100dvh]` for layout views

---

### Task 1: Theme & Typography Updates

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Tailwind v4 config, Material Web CSS variables
- Produces: CSS color variables and utility classes

- [ ] **Step 1: Write a test stylesheet verify script**
Run a compilation command check.
Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Update index.css variables and container styles**
Modify `src/index.css` to update the primary colors to Teal, configure surface container values, and add custom glassmorphism borders.
Target code modification in `src/index.css`:
```css
:root {
  --md-sys-color-primary: #0d9488;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #ccfbf1;
  --md-sys-color-on-primary-container: #115e59;
  --md-sys-color-background: #f8fafc;
  --md-sys-color-on-background: #0f172a;
  --md-sys-color-surface: #f8fafc;
  --md-sys-color-on-surface: #0f172a;
  --md-sys-color-surface-container-low: #f1f5f9;
  --md-sys-color-surface-container: #e2e8f0;
  --md-sys-color-surface-container-high: #cbd5e1;
  --md-sys-color-outline-variant: #e2e8f0;
  --md-sys-color-outline: #94a3b8;
  --md-icon-font: 'Material Symbols Outlined Variable';
}
```

- [ ] **Step 3: Run build to verify compilation**
Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit changes**
```bash
git add src/index.css
git commit -m "style: update primary colors to teal and slate"
```

---

### Task 2: Sidebar UI Overhaul

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: User info, appName, onlineCount, activeTab state
- Produces: Proportional glassmorphic sidebar layout

- [ ] **Step 1: Check compilation prior to change**
Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Redesign Sidebar.tsx container and active item styles**
Modify `src/components/Sidebar.tsx` to replace `md-navigation-drawer` with a clean `aside` bar, style items with left-accent borders, and group user/logout buttons into a unified profile card.
Target code structure:
```tsx
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
```

- [ ] **Step 3: Run build to verify compilation**
Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit changes**
```bash
git add src/components/Sidebar.tsx
git commit -m "feat(sidebar): style custom glassmorphic navigation bar"
```

---

### Task 3: Dashboard Layout (Bento Grid & AreaChart)

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: Mails list, AppConfig, navigation tabs callbacks
- Produces: Proportional bento summary dashboard

- [ ] **Step 1: Check compilation prior to change**
Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Redesign Dashboard.tsx with bento cards, dynamic trend, and chart tooltips**
Update `src/components/Dashboard.tsx` to style the area chart with teal colors, custom tooltips, dynamic stats comparison, and elegant list items.
Target code structure:
```tsx
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
```

- [ ] **Step 3: Run build to verify compilation**
Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit changes**
```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): convert to bento stats grid and clean area chart styling"
```

---

### Task 4: MailTable Cleanup & Column Restructuring

**Files:**
- Modify: `src/components/MailTable.tsx`

**Interfaces:**
- Consumes: Mails record list, AppConfig
- Produces: Responsive data table with collapsed actions dropdown

- [ ] **Step 1: Check compilation prior to change**
Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Modify MailTable.tsx to introduce action menus and hidden secondary columns**
Update `src/components/MailTable.tsx` to wrap secondary columns in Tailwind responsive classes (e.g. `hidden xl:table-cell`), and group the 4 button icons into 2 principal buttons and a custom native dropdown popover/inline toggle for other options.
Target code snippet:
```tsx
import React, { useState, useMemo } from 'react';
import { MailRecord, AppConfig } from '../types';

interface MailTableProps {
  mails: MailRecord[];
  config: AppConfig;
  onEdit: (mail: MailRecord) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onExportExcel: () => void;
  onBatchDownload: (ids: string[]) => void;
  onPrintReceipt: (ids: string[]) => void;
  onViewPdf: (path: string) => void;
}

export default function MailTable({
  mails,
  config,
  onEdit,
  onDelete,
  onAdd,
  onExportExcel,
  onBatchDownload,
  onPrintReceipt,
  onViewPdf
}: MailTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredMails = useMemo(() => {
    if (!searchTerm) return mails;
    const lowerSearch = searchTerm.toLowerCase();
    return mails.filter(m =>
      m.type.toLowerCase().includes(lowerSearch) ||
      Object.values(m.metadata).some(v => String(v).toLowerCase().includes(lowerSearch))
    );
  }, [mails, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMails.length) setSelectedIds([]);
    else setSelectedIds(filteredMails.map(m => m.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col h-full gap-6 py-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <md-outlined-text-field
          placeholder="Cari agenda surat..."
          onInput={(e: any) => setSearchTerm(e.target.value)}
          className="flex-grow max-w-md"
          style={{ '--md-outlined-text-field-container-shape': '28px' }}
        >
          <span slot="leading-icon" className="material-symbols-outlined">search</span>
        </md-outlined-text-field>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          {selectedIds.length > 0 && (
             <>
               <md-filled-button onClick={() => onPrintReceipt(selectedIds)} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-tertiary)' }}>
                 <span slot="icon" className="material-symbols-outlined">receipt_long</span>
                 Tanda Terima ({selectedIds.length})
               </md-filled-button>
               <md-outlined-button onClick={() => onBatchDownload(selectedIds)}>
                 <span slot="icon" className="material-symbols-outlined">download_for_offline</span>
                 ZIP
               </md-outlined-button>
             </>
          )}
          <md-outlined-button onClick={onExportExcel}>
            <span slot="icon" className="material-symbols-outlined">table_view</span>
            Excel
          </md-outlined-button>
          <md-filled-button onClick={onAdd}>
            <span slot="icon" className="material-symbols-outlined">add</span>
            Tambah Surat
          </md-filled-button>
        </div>
      </div>

      <div className="m3-table-container shadow-sm border border-slate-200/60 overflow-x-auto bg-white">
        <table className="m3-table min-w-full">
          <thead>
            <tr>
              <th className="w-12 px-4 py-4">
                <md-checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === filteredMails.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredMails.length ? true : undefined}
                  onClick={toggleSelectAll}
                ></md-checkbox>
              </th>
              {config.columns.sort((a,b) => a.order - b.order).map(col => {
                // Hide notes/disposisi/penomoran on smaller displays
                const isSecondary = col.key === 'catatan' || col.key === 'disposisi' || col.key === 'penomoran';
                return (
                  <th 
                    key={col.key} 
                    className={`px-4 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 ${isSecondary ? 'hidden lg:table-cell' : ''}`}
                  >
                    {col.label}
                  </th>
                );
              })}
              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-500 w-28">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredMails.map(mail => (
              <tr key={mail.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4">
                  <md-checkbox
                    checked={selectedIds.includes(mail.id)}
                    onClick={() => toggleSelect(mail.id)}
                  ></md-checkbox>
                </td>
                {config.columns.map(col => {
                  const isSecondary = col.key === 'catatan' || col.key === 'disposisi' || col.key === 'penomoran';
                  return (
                    <td key={col.key} className={`px-4 py-4 text-sm text-slate-700 max-w-[200px] truncate ${isSecondary ? 'hidden lg:table-cell' : ''}`}>
                      {col.type === 'date' && mail.metadata[col.key]
                        ? new Date(mail.metadata[col.key]).toLocaleDateString('id-ID')
                        : String(mail.metadata[col.key] || '-')}
                    </td>
                  );
                })}
                <td className="px-4 py-4 text-right w-28 relative">
                  <div className="flex items-center justify-end gap-1">
                    {mail.pdfPath && (
                      <md-icon-button onClick={() => onViewPdf(mail.pdfPath!)} className="text-teal-600">
                        <span className="material-symbols-outlined">visibility</span>
                      </md-icon-button>
                    )}
                    <md-icon-button onClick={() => onEdit(mail)} className="text-slate-500">
                      <span className="material-symbols-outlined">edit</span>
                    </md-icon-button>
                    
                    <div className="inline-block relative">
                      <md-icon-button onClick={() => setActiveMenuId(activeMenuId === mail.id ? null : mail.id)} className="text-slate-400">
                        <span className="material-symbols-outlined">more_vert</span>
                      </md-icon-button>
                      
                      {activeMenuId === mail.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)}></div>
                          <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                            <button
                              onClick={() => { onPrintReceipt([mail.id]); setActiveMenuId(null); }}
                              className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <span className="material-symbols-outlined text-sm text-slate-400">receipt_long</span>
                              Tanda Terima
                            </button>
                            <button
                              onClick={() => { onDelete(mail.id); setActiveMenuId(null); }}
                              className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                            >
                              <span className="material-symbols-outlined text-sm text-rose-500">delete</span>
                              Hapus Agenda
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMails.length === 0 && (
          <div className="py-24 text-center text-slate-400">
             <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">inventory_2</span>
             <p className="text-sm font-medium">Tidak ada data surat ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run build to verify compilation**
Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit changes**
```bash
git add src/components/MailTable.tsx
git commit -m "feat(table): condense columns and replace flat action icons with custom dropdown menu"
```

---

### Task 5: PDF Tools (Layout, Drag-Drop Uploader, API Bug Fix)

**Files:**
- Modify: `src/components/PdfTools.tsx`
- Modify: `server.ts`

**Interfaces:**
- Consumes: pdfFiles or files base64 payload
- Produces: Correct merge endpoint mapping & styled drop uploader

- [ ] **Step 1: Check compilation prior to change**
Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Update PdfTools.tsx tools navigation and file uploader drag state**
Modify `src/components/PdfTools.tsx` to condense tool tabs and add `isDragOver` styling on the upload area, plus update the POST body key to `pdfFiles`.
Target code modification snippet:
```tsx
  const [isDragOver, setIsDragOver] = useState(false);
  // Change inside executeTool:
  // endpoint = '/api/pdf/merge';
  // body = { pdfFiles: mergeFiles.map(f => f.base64) }; // Send base64 strings directly in array matching server.ts
```
Let's make sure the file uploader handles drag states:
```tsx
         {activeTool === 'merge' && (
            <div className="flex flex-col gap-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Gabungkan PDF</h3>
                  <div className="flex gap-2">
                    <md-outlined-button onClick={() => setMergeFiles([])} disabled={mergeFiles.length === 0}>
                      Hapus Semua
                    </md-outlined-button>
                    <div className="relative">
                       <md-filled-button>
                         <span slot="icon" className="material-symbols-outlined">add</span>
                         Tambah File
                       </md-filled-button>
                       <input type="file" multiple accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onFileSelect(e, 'merge')} />
                    </div>
                  </div>
               </div>

               <div 
                 onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                 onDragLeave={() => setIsDragOver(false)}
                 onDrop={async (e) => {
                   e.preventDefault();
                   setIsDragOver(false);
                   const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'));
                   const newFiles = await Promise.all(files.map(async f => ({
                     name: f.name,
                     base64: await handleFileToBase64(f)
                   })));
                   setMergeFiles([...mergeFiles, ...newFiles]);
                 }}
                 className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                   isDragOver ? 'border-teal-500 bg-teal-50/20' : 'border-slate-200 hover:border-teal-500/40 bg-slate-50/50'
                 }`}
               >
                 <span className={`material-symbols-outlined text-4xl ${isDragOver ? 'text-teal-600 font-fill' : 'text-slate-400'}`}>upload_file</span>
                 <div className="text-center">
                   <p className="font-bold text-sm text-slate-700">Tarik berkas PDF ke sini</p>
                   <p className="text-xs text-slate-400 mt-1">Atau klik Tambah File di atas untuk memilih berkas</p>
                 </div>
               </div>

               <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                  <md-list className="p-0">
                    {mergeFiles.map((file, idx) => (
                      <React.Fragment key={idx}>
                        <md-list-item>
                          <span slot="start" className="material-symbols-outlined opacity-50">description</span>
                          <div slot="headline" className="text-sm font-medium">{file.name}</div>
                          <div slot="supporting-text" className="text-[10px]">Urutan ke-{idx + 1}</div>
                          <div slot="end" className="flex items-center gap-1">
                             <md-icon-button onClick={() => {
                                const newFiles = [...mergeFiles];
                                if (idx > 0) {
                                  [newFiles[idx-1], newFiles[idx]] = [newFiles[idx], newFiles[idx-1]];
                                  setMergeFiles(newFiles);
                                }
                             }} disabled={idx === 0}>
                               <span className="material-symbols-outlined">arrow_upward</span>
                             </md-icon-button>
                             <md-icon-button onClick={() => {
                                const newFiles = [...mergeFiles];
                                if (idx < mergeFiles.length - 1) {
                                  [newFiles[idx+1], newFiles[idx]] = [newFiles[idx], newFiles[idx+1]];
                                  setMergeFiles(newFiles);
                                }
                             }} disabled={idx === mergeFiles.length - 1}>
                               <span className="material-symbols-outlined">arrow_downward</span>
                             </md-icon-button>
                             <md-icon-button onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))} className="text-rose-500">
                               <span className="material-symbols-outlined text-error">delete</span>
                             </md-icon-button>
                          </div>
                        </md-list-item>
                        <md-divider></md-divider>
                      </React.Fragment>
                    ))}
                  </md-list>
                  {mergeFiles.length === 0 && (
                    <div className="p-16 text-center opacity-30 italic text-sm text-slate-400">
                       <p>Belum ada file dipilih</p>
                    </div>
                  )}
               </div>
            </div>
         )}
```

- [ ] **Step 3: Run build to verify compilation**
Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit changes**
```bash
git add src/components/PdfTools.tsx server.ts
git commit -m "feat(pdf-tools): restyle layout, add drag-drop events and fix API payload mismatch"
```
