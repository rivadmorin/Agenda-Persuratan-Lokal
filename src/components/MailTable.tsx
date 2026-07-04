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
