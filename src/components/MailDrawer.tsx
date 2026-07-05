import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MailRecord, ColumnDefinition } from '../types';

interface MailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  mailToEdit: MailRecord | null;
  onSave: (data: any) => Promise<void> | void;
  mode: 'edit' | 'view';
  onError?: (title: string, message: string) => void;
}

export default function MailDrawer({
  isOpen,
  onClose,
  columns,
  mailToEdit,
  onSave,
  mode,
  onError
}: MailDrawerProps) {
  const [type, setType] = useState('Masuk');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [deletedPdf, setDeletedPdf] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewTab, setPreviewTab] = useState<'details' | 'pdf' | 'markdown'>('details');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opening / changing mailToEdit
  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      if (mailToEdit) {
        setType(mailToEdit.type || 'Masuk');
        setFormData(mailToEdit.metadata || {});
        setPdfFile(null);
        setPdfBase64(null);
        setDeletedPdf(false);
      } else {
        setType('Masuk');
        setFormData({});
        setPdfFile(null);
        setPdfBase64(null);
        setDeletedPdf(false);
      }
      setErrors({});
    }

    // Manage iframe rendering delay
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isOpen) {
      timeoutId = setTimeout(() => setIsAnimationComplete(true), 400);
    } else {
      setIsAnimationComplete(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, mailToEdit]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[key];
        return newErrs;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      onError?.('Format Berkas Tidak Sesuai', 'Hanya berkas PDF yang diperbolehkan.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      onError?.('Berkas Terlalu Besar', 'Maksimal ukuran berkas adalah 50MB.');
      return;
    }

    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPdfBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    columns.forEach(col => {
      if (col.required && !formData[col.key]) {
        newErrors[col.key] = `${col.label} wajib diisi.`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave({
        type,
        metadata: formData,
        pdfData: pdfBase64 || undefined,
        deletePdf: deletedPdf,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatMarkdown = (mail: MailRecord) => {
    let md = `# Agenda Surat: ${mail.metadata.nomorSurat || 'Tanpa Nomor'}\n\n`;
    md += `**Tipe:** ${mail.type}\n`;
    columns.sort((a,b) => a.order - b.order).forEach(col => {
      const val = mail.metadata[col.key] || '-';
      md += `**${col.label}:** ${val}\n`;
    });
    return md;
  };

  const pdfSource = pdfBase64 || (mailToEdit?.pdfPath && !deletedPdf ? `/api/files/${mailToEdit.pdfPath}` : null);
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px]"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full bg-[var(--md-sys-color-surface)] shadow-2xl z-[101] border-l border-[var(--md-sys-color-outline-variant)] flex flex-col transition-all duration-400 ease-premium ${
               mode === 'view' ? 'w-full max-w-[550px]' : 'w-full max-w-[600px]'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)]">
              <div className="flex flex-col">
                <h2 className="text-2xl font-display font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
                  {mode === 'edit' ? (mailToEdit ? 'Ubah Agenda Surat' : 'Tambah Agenda Surat') : 'Rincian Agenda Surat'}
                </h2>
                {mailToEdit && (
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest font-black mt-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">history</span>
                    Terakhir diubah: {new Date(mailToEdit.updatedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
              <md-icon-button onClick={onClose} aria-label="Tutup panel">
                <span className="material-symbols-outlined">close</span>
              </md-icon-button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {mode === 'edit' ? (
                  <form className="p-6 flex flex-col gap-8 pb-32" onSubmit={handleSubmit}>
                    {/* Tipe Surat Toggle */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-widest px-1">Tipe Surat</label>
                      <md-outlined-select
                        label="Tipe Surat"
                        value={type}
                        onInput={(e: any) => setType(e.target.value)}
                        className="w-full"
                      >
                        <md-select-option value="Masuk">Surat Masuk</md-select-option>
                        <md-select-option value="Keluar">Surat Keluar</md-select-option>
                        <md-select-option value="Masuk / Keluar">Surat Masuk / Keluar</md-select-option>
                      </md-outlined-select>
                    </div>

                    {/* Metadata Fields */}
                    <div className="flex flex-col gap-6">
                      {sortedColumns.map(col => (
                        <div key={col.key} className="flex flex-col gap-1">
                          {(col.type as any) === 'textarea' ? (
                            <md-outlined-text-field
                              type="textarea"
                              label={col.label + (col.required ? ' **' : '')}
                              value={formData[col.key] || ''}
                              onInput={(e: any) => handleInputChange(col.key, e.target.value)}
                              error={!!errors[col.key] ? true : undefined}
                              errorText={errors[col.key]}
                              rows={3}
                            ></md-outlined-text-field>
                          ) : (
                            <md-outlined-text-field
                              type={col.type === 'date' ? 'date' : 'text'}
                              label={col.label + (col.required ? ' **' : '')}
                              value={formData[col.key] || ''}
                              onInput={(e: any) => handleInputChange(col.key, e.target.value)}
                              error={!!errors[col.key] ? true : undefined}
                              errorText={errors[col.key]}
                            ></md-outlined-text-field>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* PDF Upload Section */}
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-widest px-1">Berkas Lampiran PDF</label>
                         {pdfSource && (
                           <md-text-button onClick={() => window.open(pdfSource, '_blank')}>
                             <span slot="icon" className="material-symbols-outlined">visibility</span>
                             Lihat PDF
                           </md-text-button>
                         )}
                      </div>

                      <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="pdf-drawer-input" />

                      {!pdfSource ? (
                        <label htmlFor="pdf-drawer-input" className="border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl p-10 text-center cursor-pointer hover:bg-[var(--md-sys-color-primary-container)]/10 transition-all flex flex-col items-center justify-center gap-3 group">
                          <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-primary)] group-hover:scale-110 transition-transform">upload_file</span>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold">Pilih PDF atau Seret ke sini</span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">MAKS 50MB</span>
                          </div>
                        </label>
                      ) : (
                        <div className="p-4 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl flex items-center justify-between border border-[var(--md-sys-color-outline-variant)] shadow-sm">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-red-600 font-fill">picture_as_pdf</span>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold truncate text-[var(--md-sys-color-on-surface)]">{pdfFile ? pdfFile.name : 'Berkas Tersimpan'}</p>
                              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase tracking-tighter">
                                {pdfFile ? `${(pdfFile.size/1024/1024).toFixed(2)} MB` : 'Sistem Penyimpanan Cloud'}
                              </p>
                            </div>
                          </div>
                          <md-icon-button onClick={() => { setPdfFile(null); setPdfBase64(null); setDeletedPdf(true); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                            <span className="material-symbols-outlined text-[var(--md-sys-color-error)]">delete</span>
                          </md-icon-button>
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] shrink-0">
                      <md-tabs active-tab-index={previewTab === 'details' ? 0 : (previewTab === 'markdown' ? 1 : 2)} className="w-full">
                        <md-primary-tab onClick={() => setPreviewTab('details')}>
                          <md-icon slot="icon">info</md-icon>
                          Rincian
                        </md-primary-tab>
                        <md-primary-tab onClick={() => setPreviewTab('markdown')}>
                          <md-icon slot="icon">description</md-icon>
                          Markdown
                        </md-primary-tab>
                        <md-primary-tab onClick={() => setPreviewTab('pdf')} disabled={!pdfSource ? true : undefined}>
                          <md-icon slot="icon">picture_as_pdf</md-icon>
                          Preview PDF
                        </md-primary-tab>
                      </md-tabs>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[var(--md-sys-color-surface)]">
                      {previewTab === 'details' && (
                        <div className="p-6 flex flex-col gap-4">
                           <div className="p-4 rounded-2xl bg-[var(--md-sys-color-secondary-container)] border border-[var(--md-sys-color-secondary)]/10">
                              <span className="text-[9px] font-black text-[var(--md-sys-color-on-secondary-container)] uppercase tracking-[0.2em] opacity-70">Tipe Agenda</span>
                              <p className="text-lg font-bold text-[var(--md-sys-color-on-secondary-container)] mt-1">{type}</p>
                           </div>
                           {sortedColumns.map(col => (
                             <div key={col.key} className="flex flex-col gap-1 p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50">
                               <span className="text-[9px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-[0.2em] opacity-80">{col.label}</span>
                               <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)] leading-relaxed whitespace-pre-wrap">
                                 {col.type === 'date' && mailToEdit?.metadata[col.key]
                                   ? new Date(mailToEdit.metadata[col.key]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                                   : String(mailToEdit?.metadata[col.key] || '-')}
                               </span>
                             </div>
                           ))}
                        </div>
                      )}

                      {previewTab === 'markdown' && mailToEdit && (
                        <div className="p-6">
                           <div className="relative p-6 bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-inner">
                              <md-icon-button
                                className="absolute right-3 top-3 bg-[var(--md-sys-color-surface)] shadow-sm"
                                aria-label="Salin Markdown"
                                onClick={() => {
                                  navigator.clipboard.writeText(formatMarkdown(mailToEdit));
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                              >
                                <span className="material-symbols-outlined">{copied ? 'done' : 'content_copy'}</span>
                              </md-icon-button>
                              <pre className="font-mono text-xs whitespace-pre-wrap select-text pr-12 leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                                {formatMarkdown(mailToEdit)}
                              </pre>
                           </div>
                        </div>
                      )}

                      {previewTab === 'pdf' && pdfSource && (
                        <div className="h-full min-h-[500px] flex items-center justify-center">
                          {isAnimationComplete ? (
                            <iframe src={pdfSource} className="w-full h-full border-none animate-premium-in" title="PDF Preview" />
                          ) : (
                            <md-circular-progress indeterminate></md-circular-progress>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-end gap-3 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
               <md-text-button onClick={onClose}>Batal</md-text-button>
               {mode === 'edit' ? (
                 <md-filled-button onClick={handleSubmit} disabled={isSaving ? true : undefined}>
                    {isSaving ? (
                      <>
                        <md-circular-progress indeterminate slot="icon" style={{ '--md-circular-progress-size': '18px' }}></md-circular-progress>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span slot="icon" className="material-symbols-outlined">save</span>
                        {mailToEdit ? 'Simpan Perubahan' : 'Tambah Agenda'}
                      </>
                    )}
                 </md-filled-button>
               ) : (
                 <md-filled-button onClick={() => onSave({ isSwitchToEdit: true })}>
                    <span slot="icon" className="material-symbols-outlined">edit</span>
                    Edit Data
                 </md-filled-button>
               )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
