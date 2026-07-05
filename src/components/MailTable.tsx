import React, { useState, useMemo } from 'react';
import { MailRecord, AppConfig } from '../types';

interface MailTableProps {
  mails: MailRecord[];
  config: AppConfig;
  onEdit: (mail: MailRecord) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onViewMail: (mail: MailRecord) => void;
  onExportExcel: () => void;
  onBatchDownload: (ids: string[]) => void;
  onPrintReceipt: (ids: string[]) => void;
  onRefresh: () => void;
  onError?: (title: string, message: string) => void;
}

export default function MailTable(props: MailTableProps) {
  const {
    mails,
    config,
    onEdit,
    onDelete,
    onAdd,
    onViewMail,
    onExportExcel,
    onBatchDownload,
    onPrintReceipt,
    onRefresh
  } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadingMailId, setUploadingMailId] = useState<string | null>(null);

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

  const handleInlineUpload = async (mailId: string, file: File) => {
    if (file.type !== 'application/pdf') {
      if (props.onError) props.onError('Format Salah', 'Hanya file PDF yang diperbolehkan.');
      else alert('Hanya file PDF yang diperbolehkan.');
      return;
    }

    setUploadingMailId(mailId);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Find existing record to preserve its data
        const existing = mails.find(m => m.id === mailId);
        if (!existing) return;

        const res = await fetch(`/api/mails/${mailId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: existing.type,
            metadata: existing.metadata,
            pdfData: base64,
            pdfName: file.name,
            versionId: existing.versionId
          })
        });

        if (res.ok) {
          onRefresh();
        } else {
          const err = await res.json();
          if (props.onError) props.onError('Gagal Unggah', err.message || 'Gagal mengunggah PDF');
          else alert(err.message || 'Gagal mengunggah PDF');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      if (props.onError) props.onError('Kesalahan Sistem', 'Gagal membaca berkas.');
      else alert('Gagal membaca berkas.');
    } finally {
      setUploadingMailId(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 py-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
        <md-outlined-text-field
          placeholder="Cari agenda surat..."
          value={searchTerm}
          onInput={(e: any) => setSearchTerm(e.target.value)}
          className="flex-grow max-w-md"
          aria-label="Cari agenda surat"
          style={{ '--md-outlined-text-field-container-shape': '28px' }}
        >
          <span slot="leading-icon" className="material-symbols-outlined">search</span>
          {searchTerm && (
            <md-icon-button slot="trailing-icon" onClick={() => setSearchTerm('')} aria-label="Bersihkan pencarian">
              <span className="material-symbols-outlined">close</span>
            </md-icon-button>
          )}
        </md-outlined-text-field>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          {selectedIds.length > 0 && (
             <>
               <md-filled-button onClick={() => onPrintReceipt(selectedIds)} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-tertiary)' }}>
                 <span slot="icon" className="material-symbols-outlined">receipt_long</span>
                 Tanda Terima
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

      <div className="m3-table-container shadow-sm border border-[var(--md-sys-color-outline-variant)] flex-1 overflow-auto bg-[var(--md-sys-color-surface-container)] rounded-3xl transition-premium">
        <table className="m3-table min-w-full">
          <thead className="bg-[var(--md-sys-color-surface-container-high)] sticky top-0 z-1">
            <tr>
              <th className="w-12 px-4 py-4" onClick={(e) => e.stopPropagation()}>
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
                    className={`px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface-variant)] ${isSecondary ? 'hidden lg:table-cell' : ''}`}
                  >
                    {col.label}
                  </th>
                );
              })}
              <th className="px-4 py-4 text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-black uppercase tracking-[0.15em] text-[var(--md-sys-color-primary)] w-24">LAMPIRAN</th>
              <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.15em] text-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface-variant)] w-64">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredMails.map(mail => (
              <tr 
                key={mail.id} 
                onClick={() => onViewMail(mail)}
                className="border-b border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-premium cursor-pointer"
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <md-checkbox
                    checked={selectedIds.includes(mail.id)}
                    onClick={() => toggleSelect(mail.id)}
                  ></md-checkbox>
                </td>
                {config.columns.map(col => {
                  const isSecondary = col.key === 'catatan' || col.key === 'disposisi' || col.key === 'penomoran';
                  return (
                    <td key={col.key} className={`px-4 py-4 text-sm text-[var(--md-sys-color-on-surface)] max-w-[200px] truncate ${isSecondary ? 'hidden lg:table-cell' : ''}`}>
                      {col.type === 'date' && mail.metadata[col.key]
                        ? new Date(mail.metadata[col.key]).toLocaleDateString('id-ID')
                        : String(mail.metadata[col.key] || '-')}
                    </td>
                  );
                })}
                <td className="px-4 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                  {uploadingMailId === mail.id ? (
                    <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)] animate-pulse">
                      <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '18px' }}></md-circular-progress>
                      <span className="text-[10px] font-bold uppercase">Mengunggah</span>
                    </div>
                  ) : mail.pdfPath ? (
                    <md-outlined-button
                      onClick={() => onViewMail(mail)}
                      className="flex items-center gap-1 text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)]/80 font-bold transition-premium hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm font-fill">picture_as_pdf</span>
                      <span>PDF</span>
                    </md-outlined-button>
                  ) : (
                    <label className="text-xs text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)]/80 font-bold cursor-pointer underline decoration-dotted transition-premium">
                      Unggah
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleInlineUpload(mail.id, file);
                        }}
                      />
                    </label>
                  )}
                </td>
                <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-0.5">
                    <md-icon-button onClick={() => onEdit(mail)} aria-label="Edit Agenda">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </md-icon-button>
                    {mail.pdfPath ? (
                      <md-icon-button onClick={() => window.open(`/api/files/${mail.pdfPath}`, '_blank')} aria-label="Unduh PDF">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </md-icon-button>
                    ) : (
                      <md-icon-button disabled aria-label="Tidak ada PDF">
                        <span className="material-symbols-outlined text-[20px]">download_off</span>
                      </md-icon-button>
                    )}
                    <md-icon-button
                      onClick={() => onDelete(mail.id)}
                      aria-label="Hapus Agenda"
                      style={{ '--md-icon-button-icon-color': 'var(--md-sys-color-error)' }}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </md-icon-button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMails.length === 0 && (
          <div className="py-24 text-center text-[var(--md-sys-color-outline)] animate-premium-in">
             <span className="material-symbols-outlined text-6xl mb-4 text-[var(--md-sys-color-primary)] opacity-20 font-fill">inventory_2</span>
             <p className="text-sm font-medium">Tidak ada data surat ditemukan.</p>
          </div>
        )}
      </div>

    </div>
  );
}
