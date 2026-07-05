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
  onRefresh: () => void;
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
  onViewPdf,
  onRefresh
}: MailTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMail, setSelectedMail] = useState<MailRecord | null>(null);
  const [previewTab, setPreviewTab] = useState<'details' | 'pdf' | 'markdown'>('details');
  const [copied, setCopied] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

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
      alert('Hanya file PDF yang diperbolehkan.');
      return;
    }

    setUploadLoading(true);
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
          // Update selectedMail preview state if currently viewed
          if (selectedMail && selectedMail.id === mailId) {
            const updated = await res.json();
            setSelectedMail(updated.mail || updated);
          }
        } else {
          const err = await res.json();
          alert(err.message || 'Gagal mengunggah PDF');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Gagal membaca berkas.');
    } finally {
      setUploadLoading(false);
    }
  };

  const formatMarkdown = (mail: MailRecord) => {
    let r = `# 📄 Rincian Agenda Surat\n\n`;
    r += `| Atribut | Detail Informasi |\n`;
    r += `| :--- | :--- |\n`;
    r += `| **ID Surat** | \`${mail.id}\` |\n`;
    config.columns.forEach(col => {
      let val = mail.metadata[col.key];
      if (val == null || val === "") val = "-";
      else if (col.type === "date") {
        try {
          val = new Date(val).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
        } catch {}
      }
      r += `| **${col.label}** | ${val} |\n`;
    });
    return r;
  };

  return (
    <div className="flex flex-col h-full gap-6 py-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
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
                    className={`px-4 py-4 text-xs font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] ${isSecondary ? 'hidden lg:table-cell' : ''}`}
                  >
                    {col.label}
                  </th>
                );
              })}
              <th className="px-4 py-4 text-[var(--md-sys-color-on-surface-variant)] text-xs font-bold uppercase tracking-widest w-24">LAMPIRAN</th>
              <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] w-64">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredMails.map(mail => (
              <tr 
                key={mail.id} 
                onClick={() => setSelectedMail(mail)}
                className={`border-b border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-premium cursor-pointer ${
                  selectedMail?.id === mail.id ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold shadow-sm' : ''
                }`}
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
                  {mail.pdfPath ? (
                    <button 
                      onClick={() => onViewPdf(mail.pdfPath!)}
                      className="flex items-center gap-1 text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)]/80 font-bold transition-premium hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm font-fill">picture_as_pdf</span>
                      <span>PDF</span>
                    </button>
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
                <td className="px-4 py-4 text-right w-64" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(mail)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-xs font-bold text-[var(--md-sys-color-on-surface)] shadow-sm transition-premium active:scale-95 cursor-pointer"
                    >
                      Edit
                    </button>
                    {mail.pdfPath ? (
                      <button
                        onClick={() => window.open(`/api/files/${mail.pdfPath}`, '_blank')}
                        className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-xs font-bold text-[var(--md-sys-color-on-surface)] shadow-sm transition-premium active:scale-95 cursor-pointer"
                      >
                        Unduh
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs font-bold text-[var(--md-sys-color-outline)] opacity-50 cursor-not-allowed"
                        title="Tidak ada lampiran PDF untuk diunduh"
                      >
                        Unduh
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(mail.id)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-error)]/30 bg-[var(--md-sys-color-error-container)]/10 hover:bg-[var(--md-sys-color-error-container)]/20 text-xs font-bold text-[var(--md-sys-color-error)] shadow-sm transition-premium active:scale-95 cursor-pointer"
                    >
                      Hapus
                    </button>
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

      {selectedMail && (
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-lg h-[450px] shrink-0 mt-6">
          <div className="w-full h-full bg-[var(--md-sys-color-surface-container-high)] rounded-[calc(2.5rem-0.375rem)] flex flex-col overflow-hidden">
             {/* Header */}
             <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                   <h4 className="font-bold text-[var(--md-sys-color-on-surface)] text-sm font-display truncate">Pratinjau Lampiran</h4>
                   <span className="text-[10px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider font-mono">ID: {selectedMail.id}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button
                     onClick={() => onEdit(selectedMail)}
                     className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-xs font-bold text-[var(--md-sys-color-on-surface)] transition-premium active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                   >
                     <span className="material-symbols-outlined text-sm">edit</span>
                     Ubah Rincian
                   </button>
                   {selectedMail.pdfPath && (
                     <button
                       onClick={() => window.open(`/api/files/${selectedMail.pdfPath}`, '_blank')}
                       className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-xs font-bold text-[var(--md-sys-color-on-surface)] transition-premium active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                     >
                       <span className="material-symbols-outlined text-sm">open_in_new</span>
                       Maksimalkan Pratinjau
                     </button>
                   )}
                   <button 
                     onClick={() => setSelectedMail(null)}
                     className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-premium active:scale-90"
                   >
                     <span className="material-symbols-outlined text-lg">close</span>
                   </button>
                </div>
             </div>
             
             {/* Tabs & Content */}
             <div className="flex-grow flex flex-col overflow-hidden">
                <div className="flex border-b border-[var(--md-sys-color-outline-variant)] px-4 bg-[var(--md-sys-color-surface-container)] shrink-0">
                  <md-tabs active-tab-index={previewTab === 'details' ? 0 : previewTab === 'pdf' ? 1 : 2} className="w-full">
                    <md-primary-tab onClick={() => setPreviewTab('details')}>
                      <md-icon slot="icon">info</md-icon>
                      Rincian
                    </md-primary-tab>
                    <md-primary-tab onClick={() => setPreviewTab('pdf')}>
                      <md-icon slot="icon">picture_as_pdf</md-icon>
                      Berkas PDF
                    </md-primary-tab>
                    <md-primary-tab onClick={() => setPreviewTab('markdown')}>
                      <md-icon slot="icon">description</md-icon>
                      Markdown
                    </md-primary-tab>
                  </md-tabs>
                </div>
                
                <div className="flex-grow overflow-auto p-6 bg-[var(--md-sys-color-surface-container-high)]">
                   {previewTab === 'details' && (
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
                        {config.columns.map(col => (
                          <div key={col.key} className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">{col.label}</span>
                            <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                              {col.type === 'date' && selectedMail.metadata[col.key]
                                ? new Date(selectedMail.metadata[col.key]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                                : String(selectedMail.metadata[col.key] || '-')}
                            </span>
                          </div>
                        ))}
                     </div>
                   )}
                   
                   {previewTab === 'pdf' && (
                     selectedMail.pdfPath ? (
                       <iframe
                         src={`/api/files/${selectedMail.pdfPath}`}
                         className="w-full h-full border-none rounded-xl bg-[var(--md-sys-color-surface-container)]"
                         title="PDF Review"
                       />
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl p-6 bg-[var(--md-sys-color-surface-container)] gap-2">
                          <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-outline)]">upload_file</span>
                          <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Pilih berkas PDF atau Seret ke sini</span>
                          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Format dokumen PDF wajib di bawah 50MB</span>
                          <label className="mt-2">
                            <span className="px-4 py-2 bg-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/80 text-[var(--md-sys-color-on-primary)] rounded-xl text-xs font-bold transition-premium active:scale-95 inline-block cursor-pointer shadow-sm">
                              Choose File
                            </span>
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleInlineUpload(selectedMail.id, file);
                              }}
                            />
                          </label>
                       </div>
                     )
                   )}
                   
                   {previewTab === 'markdown' && (
                     <div className="relative h-full flex flex-col bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 overflow-hidden">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(formatMarkdown(selectedMail));
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute right-4 top-4 px-3 py-1.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] rounded-lg text-xs font-bold text-[var(--md-sys-color-on-surface)] transition-premium shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copied ? 'done' : 'content_copy'}
                          </span>
                          {copied ? 'Tersalin!' : 'Salin'}
                        </button>
                        <pre className="font-mono text-xs text-[var(--md-sys-color-on-surface)] overflow-auto whitespace-pre-wrap max-w-full flex-grow select-text pr-20">
                           {formatMarkdown(selectedMail)}
                        </pre>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
