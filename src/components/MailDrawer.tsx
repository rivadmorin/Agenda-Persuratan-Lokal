import React, { useState, useEffect, useRef } from 'react';
import { MailRecord, ColumnDefinition } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface MailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mailToEdit: MailRecord | null;
  columns: ColumnDefinition[];
  onSave: (data: any) => void;
  onError?: (title: string, message: string) => void;
  mode?: 'edit' | 'view';
}

export default function MailDrawer({
  isOpen,
  onClose,
  mailToEdit,
  columns,
  onSave,
  onError,
  mode = 'edit'
}: MailDrawerProps) {
  const [type, setType] = useState<'Masuk' | 'Keputusan'>('Masuk');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [deleteExistingPdf, setDeleteExistingPdf] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewTab, setPreviewTab] = useState<'details' | 'pdf' | 'markdown'>('details');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opening / changing mailToEdit
  useEffect(() => {
    if (isOpen) {
      if (mailToEdit) {
        setType(mailToEdit.type || 'Masuk');
        setFormData(mailToEdit.metadata || {});
        setDeleteExistingPdf(false);
      } else {
        setType('Masuk');
        const initialData: Record<string, any> = {};
        columns.forEach(col => {
          if (col.type === 'date') {
            initialData[col.key] = new Date().toISOString().split('T')[0];
          }
        });
        setFormData(initialData);
        setDeleteExistingPdf(false);
      }
      setPdfFile(null);
      setPdfBase64('');
      setErrors({});
      setPreviewTab('details');
    }
  }, [isOpen, mailToEdit, columns]);

  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPdfPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfPreviewUrl('');
    }
  }, [pdfFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        if (onError) onError('Format Salah', 'Hanya file PDF yang diperbolehkan.');
        setErrors(prev => ({ ...prev, pdf: 'Hanya file PDF yang diperbolehkan.' }));
        return;
      }
      setPdfFile(file);
      setDeleteExistingPdf(false);
      setErrors(prev => ({ ...prev, pdf: '' }));

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPdfBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveUploadedFile = () => {
    setPdfFile(null);
    setPdfBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    columns.forEach(col => {
      if (col.required && !formData[col.key]?.toString().trim()) {
        newErrors[col.key] = `${col.label} wajib diisi.`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      type,
      metadata: formData,
      pdfData: pdfBase64 || undefined,
      pdfName: pdfFile ? pdfFile.name : undefined,
      deletePdf: deleteExistingPdf,
      versionId: mailToEdit?.versionId
    });
  };

  const formatMarkdown = (mail: MailRecord) => {
    let r = `# 📄 Rincian Agenda Surat\n\n`;
    r += `| Atribut | Detail Informasi |\n`;
    r += `| :--- | :--- |\n`;
    r += `| **ID Surat** | \`${mail.id}\` |\n`;
    columns.forEach(col => {
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

  const pdfSource = pdfPreviewUrl || (mailToEdit?.pdfPath && !deleteExistingPdf ? `/api/files/${mailToEdit.pdfPath}` : '');
  const hasPdf = !!pdfSource;
  const isWide = hasPdf || mode === 'view';

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
          
          {/* Side Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full bg-[var(--md-sys-color-surface)] shadow-2xl z-[101] flex flex-col border-l border-[var(--md-sys-color-outline-variant)] overflow-hidden`}
            style={{ 
              width: isWide ? 'min(1100px, 95vw)' : 'min(550px, 95vw)',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between shrink-0 bg-[var(--md-sys-color-surface-container-low)]">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold font-display text-[var(--md-sys-color-on-surface)]">
                  {mode === 'view' ? 'Rincian Agenda Surat' : (mailToEdit ? 'Ubah Agenda Surat' : 'Tambah Agenda Surat')}
                </h2>
                {mailToEdit && (
                  <span className="text-[9px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-[0.2em] opacity-80 uppercase tracking-widest mt-1">ID: {mailToEdit.id}</span>
                )}
              </div>
              <md-icon-button onClick={onClose} aria-label="Tutup panel">
                <span className="material-symbols-outlined">close</span>
              </md-icon-button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* PDF Preview (Left when wide) */}
              {(hasPdf || (mode === 'view' && mailToEdit?.pdfPath)) && (
                <div className="flex-1 min-w-0 border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] overflow-hidden flex flex-col">
                   <div className="p-3 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)] shrink-0">
                      <span className="text-xs font-bold truncate max-w-[200px] ml-1">
                        {pdfFile ? pdfFile.name : (mailToEdit?.pdfPath ? mailToEdit.pdfPath.split('/').pop() : 'Lampiran PDF')}
                      </span>
                      <md-outlined-button onClick={() => window.open(pdfSource, '_blank')}>
                        <span slot="icon" className="material-symbols-outlined text-sm">open_in_new</span>
                        Tab Baru
                      </md-outlined-button>
                   </div>
                   <iframe
                     src={pdfSource}
                     className="flex-grow w-full h-full border-none bg-white"
                     title="PDF Preview"
                   />
                </div>
              )}

              {/* Form / Details (Right) */}
              <div className={`${isWide ? 'w-full lg:w-[450px]' : 'w-full'} flex flex-col bg-[var(--md-sys-color-surface)] overflow-y-auto`}>
                {mode === 'edit' ? (
                  <form className="p-6 flex flex-col gap-5 pb-24" onSubmit={handleSubmit}>
                    <md-filled-select
                      label="Tipe Surat"
                      value={type}
                      onInput={(e: any) => setType(e.target.value as 'Masuk' | 'Keputusan')}
                      className="w-full"
                    >
                      <md-select-option value="Masuk">Surat Masuk / Keluar</md-select-option>
                      <md-select-option value="Keputusan">Surat Keputusan</md-select-option>
                    </md-filled-select>

                    {sortedColumns.map(col => {
                      const hasError = !!errors[col.key];
                      const isLongText = col.key === 'perihal' || col.key === 'catatan' || col.key === 'disposisi' || col.key === 'isi';
                      const maxLength = isLongText ? 255 : 100;
                      return (
                        <md-filled-text-field
                          key={col.key}
                          label={`${col.label}${col.required ? ' *' : ''}`}
                          type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
                          value={formData[col.key] || ''}
                          error={hasError ? true : undefined}
                          errorText={errors[col.key]}
                          onInput={(e: any) => setFormData({ ...formData, [col.key]: e.target.value })}
                          required={col.required ? true : undefined}
                          className="w-full"
                          maxLength={maxLength}
                          supportingText={`${(formData[col.key] || '').length}/${maxLength}`}
                        ></md-filled-text-field>
                      );
                    })}

                    <md-divider className="my-2"></md-divider>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] ml-1 uppercase tracking-wider">Berkas Lampiran PDF</label>
                      <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="pdf-panel-input" />

                      {!pdfSource ? (
                        <label htmlFor="pdf-panel-input" className="border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[var(--md-sys-color-primary-container)]/10 transition-all flex flex-col items-center justify-center gap-2 group">
                          <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-primary)] group-hover:scale-110 transition-transform">upload_file</span>
                          <span className="text-sm font-bold">Pilih PDF atau Seret ke sini</span>
                          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase">Maks 50MB</span>
                        </label>
                      ) : (
                        <div className="p-4 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl flex items-center justify-between border border-[var(--md-sys-color-outline-variant)] shadow-sm">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="material-symbols-outlined text-red-500 text-3xl font-fill">picture_as_pdf</span>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold truncate">{pdfFile ? pdfFile.name : 'Tersimpan'}</p>
                              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">{pdfFile ? `${(pdfFile.size/1024/1024).toFixed(2)} MB` : 'Cloud Storage'}</p>
                            </div>
                          </div>
                          <md-icon-button onClick={() => pdfFile ? handleRemoveUploadedFile() : setDeleteExistingPdf(true)}>
                            <span className="material-symbols-outlined text-red-500">delete</span>
                          </md-icon-button>
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] shrink-0">
                      <md-tabs active-tab-index={previewTab === 'details' ? 0 : 1} className="w-full">
                        <md-primary-tab onClick={() => setPreviewTab('details')}>
                          <md-icon slot="icon">info</md-icon>
                          Rincian
                        </md-primary-tab>
                        <md-primary-tab onClick={() => setPreviewTab('markdown')}>
                          <md-icon slot="icon">description</md-icon>
                          Markdown
                        </md-primary-tab>
                      </md-tabs>
                    </div>

                    <div className="p-6 overflow-y-auto pb-24">
                      {previewTab === 'details' && (
                        <div className="flex flex-col gap-6">
                           {sortedColumns.map(col => (
                             <div key={col.key} className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50">
                               <span className="text-[9px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-[0.2em] opacity-80 uppercase tracking-widest">{col.label}</span>
                               <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)] leading-relaxed">
                                 {col.type === 'date' && mailToEdit?.metadata[col.key]
                                   ? new Date(mailToEdit.metadata[col.key]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                                   : String(mailToEdit?.metadata[col.key] || '-')}
                               </span>
                             </div>
                           ))}
                        </div>
                      )}

                      {previewTab === 'markdown' && mailToEdit && (
                        <div className="relative p-4 bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl">
                           <md-icon-button 
                             className="absolute right-2 top-2" 
                            aria-label="Salin Markdown"
                             onClick={() => {
                               navigator.clipboard.writeText(formatMarkdown(mailToEdit));
                               setCopied(true);
                               setTimeout(() => setCopied(false), 2000);
                             }}
                           >
                             <span className="material-symbols-outlined">{copied ? 'done' : 'content_copy'}</span>
                           </md-icon-button>
                           <pre className="font-mono text-xs whitespace-pre-wrap select-text pr-10">
                             {formatMarkdown(mailToEdit)}
                           </pre>
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
                 <md-filled-button onClick={handleSubmit}>
                    <span slot="icon" className="material-symbols-outlined">save</span>
                    {mailToEdit ? 'Simpan Perubahan' : 'Tambah Agenda'}
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
