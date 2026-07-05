import React, { useState } from 'react';
import { MailRecord, AppConfig } from '../types';

interface MailTableProps {
  mails: MailRecord[];
  config: AppConfig;
  onAdd: () => void;
  onEdit: (mail: MailRecord) => void;
  onDelete: (id: string) => void;
  onViewMail: (mail: MailRecord) => void;
  onExportExcel: () => void;
  onBatchDownload: (ids: string[]) => void;
  onPrintReceipt: (ids: string[]) => void;
  isBatchLoading?: boolean;
  onRefresh: () => void;
  onError?: (title: string, message: string) => void;
}

export default function MailTable(props: MailTableProps) {
  const {
    mails,
    config,
    onAdd,
    onEdit,
    onDelete,
    onViewMail,
    onExportExcel,
    onBatchDownload,
    onPrintReceipt,
    onRefresh,
    isBatchLoading
  } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadingMailId, setUploadingMailId] = useState<string | null>(null);

  const filteredMails = mails.filter(mail => {
    const searchStr = `${mail.metadata.nomorSurat} ${mail.metadata.perihal} ${mail.metadata.pengirim} ${mail.metadata.penerima}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMails.map(m => m.id));
    }
  };

  const handleInlineUpload = async (mailId: string, file: File) => {
    setUploadingMailId(mailId);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await fetch(`/api/mails/${mailId}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfData: base64 })
        });
        if (res.ok) {
          onRefresh();
        } else {
          props.onError?.('Upload Gagal', 'Terjadi kesalahan saat mengunggah PDF.');
        }
        setUploadingMailId(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed', err);
      setUploadingMailId(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-premium-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-outline)] transition-premium group-focus-within:text-[var(--md-sys-color-primary)]">search</span>
          <input
            type="text"
            placeholder="Cari agenda surat..."
            value={searchTerm}
            onInput={(e: any) => setSearchTerm(e.target.value)}
            aria-label="Cari agenda surat"
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20 transition-premium"
          />
          {searchTerm && (
            <md-icon-button
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSearchTerm('')}
              aria-label="Hapus pencarian"
            >
              <span className="material-symbols-outlined">close</span>
            </md-icon-button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          {selectedIds.length > 0 && (
             <>
               <md-filled-button disabled={isBatchLoading ? true : undefined} onClick={() => onPrintReceipt(selectedIds)} style={{ '--md-filled-button-container-color': 'var(--md-sys-color-tertiary)' }}>
                 <span slot="icon" className="material-symbols-outlined">receipt_long</span>
                 Tanda Terima
               </md-filled-button>
               <md-outlined-button disabled={isBatchLoading ? true : undefined} onClick={() => onBatchDownload(selectedIds)}>
                 <span slot="icon" className="material-symbols-outlined">download_for_offline</span>
                 ZIP
               </md-outlined-button>
             </>
          )}
          <md-outlined-button onClick={onExportExcel}>
            <span slot="icon" className="material-symbols-outlined">description</span>
            Excel
          </md-outlined-button>
          <md-filled-button onClick={onAdd}>
            <span slot="icon" className="material-symbols-outlined">add</span>
            Tambah Surat
          </md-filled-button>
        </div>
      </div>

      <div className="m3-table-container shadow-sm border border-[var(--md-sys-color-outline-variant)] flex-1 overflow-auto bg-[var(--md-sys-color-surface-container)] rounded-3xl transition-premium">
        {isBatchLoading && <md-linear-progress indeterminate style={{ position: 'sticky', top: 0, zIndex: 10, width: '100%' }}></md-linear-progress>}
        <table className="m3-table min-w-full">
          <thead className="bg-[var(--md-sys-color-surface-container-high)] sticky top-0 z-1">
            <tr>
              <th className="px-4 py-4 w-12">
                <md-checkbox
                  checked={selectedIds.length === filteredMails.length && filteredMails.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredMails.length ? true : undefined}
                  onClick={toggleSelectAll}
                ></md-checkbox>
              </th>
              {config.columns.sort((a,b) => a.order - b.order).map(col => {
                const isSecondary = col.key === 'catatan' || col.key === 'disposisi' || col.key === 'penomoran';
                return (
                  <th 
                    key={col.key} 
                    className={`px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--md-sys-color-on-surface-variant)] ${isSecondary ? 'hidden lg:table-cell' : ''}`}
                  >
                    {col.label}
                  </th>
                );
              })}
              <th className="px-4 py-4 text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-black uppercase tracking-[0.15em] w-24">LAMPIRAN</th>
              <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.15em] text-[var(--md-sys-color-on-surface-variant)] w-64">AKSI</th>
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
                      className="flex items-center gap-1 text-[var(--md-sys-color-primary)] font-bold transition-premium"
                    >
                      <span slot="icon" className="material-symbols-outlined text-sm font-fill">picture_as_pdf</span>
                      <span>PDF</span>
                    </md-outlined-button>
                  ) : (
                    <label className="text-xs text-[var(--md-sys-color-primary)] font-bold cursor-pointer underline decoration-dotted transition-premium">
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
                    <md-icon-button
                      onClick={mail.pdfPath ? () => window.open(`/api/files/${mail.pdfPath}`, '_blank') : undefined}
                      disabled={mail.pdfPath ? undefined : true}
                      aria-label={mail.pdfPath ? "Unduh PDF" : "Tidak ada PDF"}
                    >
                      <span className="material-symbols-outlined text-[20px]">{mail.pdfPath ? "download" : "download_off"}</span>
                    </md-icon-button>
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
