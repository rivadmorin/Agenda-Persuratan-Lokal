import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MailRecord, ColumnDefinition } from '../types';

function getNextNoUrut(mails: MailRecord[]): string {
  if (mails.length === 0) return '001';

  let latestVal = '';
  let maxNum = -1;

  mails.forEach(m => {
    const val = m.metadata.noUrut;
    if (val) {
      const match = val.match(/(\d+)/g);
      if (match) {
        const lastNumGroup = match[match.length - 1];
        const num = parseInt(lastNumGroup, 10);
        if (num > maxNum) {
          maxNum = num;
          latestVal = val;
        }
      }
    }
  });

  if (maxNum === -1 || !latestVal) return '001';

  // Increment bagian angka terakhir
  return latestVal.replace(/(\d+)(?!.*\d)/, (digitsStr) => {
    const length = digitsStr.length;
    const nextNum = parseInt(digitsStr, 10) + 1;
    return String(nextNum).padStart(length, '0');
  });
}

interface MailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  mails: MailRecord[];
  penomoranSuggestions?: string[];
  mailToEdit: MailRecord | null;
  onSave: (data: any) => Promise<void> | void;
  mode: 'edit' | 'view';
  onError?: (title: string, message: string) => void;
  isOffline?: boolean;
}

export default function MailDrawer({
  isOpen,
  onClose,
  columns,
  mails,
  penomoranSuggestions = ['ROJEMENGAR 1', 'ROJEMENGAR 2', 'ROJEMENGAR 3', 'WAAS 1', 'WAAS 2', 'WAAS 3'],
  mailToEdit,
  onSave,
  mode,
  onError,
  isOffline = false
}: MailDrawerProps) {
  const [type, setType] = useState('Masuk');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [deletedPdf, setDeletedPdf] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewTab, setPreviewTab] = useState<'details' | 'markdown' | 'qr' | 'pdf'>('details');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pdfSource = pdfBase64 || (mailToEdit?.pdfPath && !deletedPdf ? `/api/files/${mailToEdit.pdfPath}` : null);


  // Auto shift preview tab from details to pdf/markdown when expanded on desktop
  useEffect(() => {
    if (isExpanded && previewTab === 'details') {
      setPreviewTab(pdfSource ? 'pdf' : 'markdown');
    }
  }, [isExpanded, pdfSource]);


  // State for PWA multi-IP network and QR download
  const [networkInfo, setNetworkInfo] = useState<{
    interfaces: Array<{ name: string; address: string; type: 'local' | 'tailscale' | 'public' | 'unknown'; active: boolean }>;
    activeType: 'local' | 'tailscale' | 'public';
  } | null>(null);
  const [selectedInterface, setSelectedInterface] = useState<{ name: string; address: string; type: 'local' | 'tailscale' | 'public' | 'unknown'; active: boolean } | null>(null);
  const [qrKey, setQrKey] = useState(0);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [showCopiedSnackbar, setShowCopiedSnackbar] = useState(false);
  const [isQrSectionOpen, setIsQrSectionOpen] = useState(true);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  const activeSenders = React.useMemo(() => {
    const counts: Record<string, number> = {};
    mails.forEach(m => {
      const sender = m.metadata.suratDari;
      if (sender && typeof sender === 'string') {
        const trimmed = sender.trim();
        if (trimmed && trimmed !== '-') {
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }, [mails]);

  const handleInputKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      e.preventDefault();
      const formElements = e.currentTarget.closest('form')?.querySelectorAll('md-outlined-text-field, input, textarea');
      if (formElements) {
        const nextElement = formElements[index + 1] as HTMLElement;
        if (nextElement) {
          nextElement.focus();
        } else {
          const submitBtn = e.currentTarget.closest('form')?.querySelector('md-filled-button[type="submit"]') as HTMLElement;
          if (submitBtn) {
            submitBtn.focus();
          }
        }
      }
    }
  };

  // Initialize form when opening / changing mailToEdit
  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      setIsExpanded(false);

      // Fetch network interfaces for dynamic host IP
      fetch('/api/network-info')
        .then(res => {
          if (!res.ok) throw new Error('HTTP error ' + res.status);
          return res.json();
        })
        .then(data => {
          setNetworkInfo(data);
          // Default to first active local interface, or first active overall
          const activeLocal = data.interfaces.find((i: any) => i.active && i.type === 'local');
          const fallback = data.interfaces.find((i: any) => i.active) || data.interfaces[0] || null;
          setSelectedInterface(activeLocal || fallback);
          setQrError(null);
        })
        .catch(err => {
          console.error('[MailDrawer] Gagal memuat info jaringan:', err);
          setQrError('Gagal mendeteksi koneksi jaringan host.');
        });
      if (mailToEdit) {
        setType(mailToEdit.type || 'Masuk');
        const formattedMeta = { ...(mailToEdit.metadata || {}) };
        columns.forEach(col => {
          if (col.type === 'date' && formattedMeta[col.key]) {
            const dateStr = formattedMeta[col.key];
            if (dateStr.includes('-')) {
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                formattedMeta[col.key] = `${parts[2]}/${parts[1]}/${parts[0]}`; // Convert YYYY-MM-DD to DD/MM/YYYY
              }
            }
          }
        });
        setFormData(formattedMeta);
        setPdfFile(null);
        setPdfBase64(null);
        setDeletedPdf(false);
      } else {
        setType('Masuk');
        const defaultData: Record<string, string> = {};
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const todayStr = `${day}/${month}/${year}`;
        
        columns.forEach(col => {
          if (col.type === 'date') {
            defaultData[col.key] = todayStr;
          }
        });

        // Set otomatis noUrut dengan nomor berikutnya
        defaultData['noUrut'] = getNextNoUrut(mails);

        setFormData(defaultData);
        setPdfFile(null);
        setPdfBase64(null);
        setDeletedPdf(false);
      }
      setErrors({});
    }

    // Manage iframe rendering delay
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isOpen) {
      timeoutId = setTimeout(() => setIsAnimationComplete(true), 200);
    } else {
      setIsAnimationComplete(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, mailToEdit]);

  const handleReloadQr = () => {
    setQrLoading(true);
    setQrError(null);
    setQrKey(prev => prev + 1);
    setTimeout(() => {
      setQrLoading(false);
    }, 600);
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopiedSnackbar(true);
    setTimeout(() => setShowCopiedSnackbar(false), 2000);
  };

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
      const val = formData[col.key];
      if (col.required && !val) {
        newErrors[col.key] = `${col.label} wajib diisi.`;
      } else if (col.type === 'date' && val) {
        // Validate DD/MM/YYYY format
        const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!datePattern.test(val)) {
          newErrors[col.key] = `${col.label} harus berformat DD/MM/YYYY (contoh: 06/07/2026).`;
        } else {
          // Check if it is a valid date
          const [day, month, year] = val.split('/').map(Number);
          const d = new Date(year, month - 1, day);
          if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
            newErrors[col.key] = `${col.label} bukan tanggal yang valid.`;
          }
        }
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
        pdfName: pdfFile ? pdfFile.name : undefined,
        deletePdf: deletedPdf,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return '-';
    if (typeof dateVal === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)) {
      return dateVal;
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return String(dateVal);
    }
  };

  const sortedColumns = React.useMemo(() => {
    return [...columns].sort((a, b) => a.order - b.order);
  }, [columns]);

  const formatMarkdown = (mail: MailRecord) => {
    const noSurat = mail.metadata.noSurat || mail.metadata.nomorSurat || 'Tanpa Nomor';
    let md = `# Agenda Surat: ${noSurat}\n\n`;
    sortedColumns.forEach(col => {
      const val = mail.metadata[col.key] || '-';
      const isDateKey = col.key.toLowerCase().includes('tanggal') || col.key.toLowerCase().includes('date') || col.type === 'date';
      const displayVal = isDateKey ? formatDate(val) : val;
      md += `*${col.label.toUpperCase()}:* ${displayVal}\n`;
    });
    return md;
  };



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
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            className={`fixed top-0 right-0 h-full bg-[var(--md-sys-color-surface)] shadow-2xl z-[101] border-l border-[var(--md-sys-color-outline-variant)] flex flex-col transition-[width,max-width] duration-300 ease-in-out w-full md:w-auto ${
               isExpanded 
                 ? 'md:max-w-[1000px] lg:max-w-[90vw] md:w-full' 
                 : (mode === 'view' ? 'md:max-w-[550px] md:w-full' : 'md:max-w-[600px] md:w-full')
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
              <div className="flex items-center gap-1">
                <md-icon-button onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? 'Perkecil panel' : 'Perbesar panel'}>
                  <span className="material-symbols-outlined">{isExpanded ? 'fullscreen_exit' : 'fullscreen'}</span>
                </md-icon-button>
                <md-icon-button onClick={onClose} aria-label="Tutup panel">
                  <span className="material-symbols-outlined">close</span>
                </md-icon-button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {mode === 'edit' ? (
                  <form className="p-4 md:p-6 flex flex-col gap-6 md:gap-8 pb-32 scroll-inertia" onSubmit={handleSubmit}>

                    {/* Metadata Fields */}
                    <div className="flex flex-col gap-6">
                      {sortedColumns.map((col, index) => (
                        <div key={col.key} className="flex flex-col gap-1">
                          {(col.type as any) === 'textarea' ? (
                            <md-outlined-text-field
                              type="textarea"
                              label={col.label + (col.required ? ' **' : '')}
                              value={formData[col.key] || ''}
                              onInput={(e: any) => handleInputChange(col.key, e.target.value)}
                              onKeyDown={(e: any) => handleInputKeyDown(e, index)}
                              error={!!errors[col.key] ? true : undefined}
                              errorText={errors[col.key]}
                              rows={3}
                              style={{ '--md-outlined-text-field-container-shape': '12px' }}
                            ></md-outlined-text-field>
                          ) : (
                            <div className="relative flex flex-col w-full gap-1.5">
                              <div className="relative flex items-center w-full">
                                <md-outlined-text-field
                                  type="text"
                                  autofocus={index === 0 && !mailToEdit ? true : undefined}
                                  placeholder={col.type === 'date' ? 'DD/MM/YYYY' : undefined}
                                  label={col.label + (col.required ? ' **' : '')}
                                  value={formData[col.key] || ''}
                                  onInput={(e: any) => handleInputChange(col.key, e.target.value)}
                                  onKeyDown={(e: any) => handleInputKeyDown(e, index)}
                                  error={!!errors[col.key] ? true : undefined}
                                  errorText={errors[col.key]}
                                  style={{ '--md-outlined-text-field-container-shape': '12px', width: '100%' }}
                                  className="w-full"
                                ></md-outlined-text-field>
                                {col.type === 'date' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date();
                                      const day = String(today.getDate()).padStart(2, '0');
                                      const month = String(today.getMonth() + 1).padStart(2, '0');
                                      const year = today.getFullYear();
                                      handleInputChange(col.key, `${day}/${month}/${year}`);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 active:scale-95 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all z-10"
                                    title="Isi dengan tanggal hari ini"
                                  >
                                    Hari Ini
                                  </button>
                                )}
                              </div>

                              {col.key === 'suratDari' && activeSenders.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1 px-1">
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--md-sys-color-on-surface-variant)] self-center mr-1">Instansi Teraktif:</span>
                                  {activeSenders.map(sender => (
                                    <button
                                      key={sender}
                                      type="button"
                                      onClick={() => handleInputChange('suratDari', sender)}
                                      className="text-[10px] font-medium bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] active:scale-95 px-2.5 py-1 rounded-full cursor-pointer transition-all border border-[var(--md-sys-color-outline-variant)]/60"
                                    >
                                      {sender}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {col.key === 'penomoran' && penomoranSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1 px-1">
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--md-sys-color-on-surface-variant)] self-center mr-1">Saran Penomoran:</span>
                                  {penomoranSuggestions.map(sug => (
                                    <button
                                      key={sug}
                                      type="button"
                                      onClick={() => handleInputChange('penomoran', sug)}
                                      className="text-[10px] font-medium bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] active:scale-95 px-2.5 py-1 rounded-full cursor-pointer transition-all border border-[var(--md-sys-color-outline-variant)]/60 duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                                    >
                                      {sug}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Keyboard Shortcuts Tip Banner */}
                    <div className="flex items-center gap-2.5 p-3 bg-[var(--md-sys-color-primary)]/5 border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] mt-2">
                      <span className="material-symbols-outlined text-sm text-[var(--md-sys-color-primary)] font-fill">lightbulb</span>
                      <span>
                        <strong>Tips Pintasan:</strong> Tekan <kbd className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded text-[9.5px] font-mono">Enter</kbd> untuk berpindah ke kolom berikutnya, dan <kbd className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded text-[9.5px] font-mono">Ctrl + Enter</kbd> untuk langsung menyimpan.
                      </span>
                    </div>

                    {/* PDF Upload Section */}
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-widest px-1">Berkas Lampiran PDF</label>
                         {pdfSource && (
                           <button
                             type="button"
                             onClick={() => window.open(pdfSource, '_blank')}
                             className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 px-3 py-2 rounded-full flex items-center gap-1 cursor-pointer transition-all"
                           >
                             <span className="material-symbols-outlined text-sm">visibility</span>
                             Lihat PDF
                           </button>
                         )}
                      </div>

                      <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="pdf-drawer-input" />

                      {!pdfSource ? (
                        <div
                          onClick={isOffline ? undefined : () => fileInputRef.current?.click()}
                          className={`border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3 transition-all ${
                            isOffline
                              ? 'opacity-50 cursor-not-allowed bg-[var(--md-sys-color-surface-container-low)]'
                              : 'cursor-pointer hover:bg-[var(--md-sys-color-primary-container)]/10 group'
                          }`}
                        >
                          <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-primary)] group-hover:scale-110 transition-transform">
                            {isOffline ? 'cloud_off' : 'upload_file'}
                          </span>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold">
                              {isOffline ? 'Pengunggahan PDF dinonaktifkan saat offline' : 'Pilih PDF atau Seret ke sini'}
                            </span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">
                              {isOffline ? 'Koneksi Host Terputus' : 'MAKS 50MB'}
                            </span>
                          </div>
                        </div>
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
                          {!isOffline && (
                            <button
                              type="button"
                              onClick={() => { setPdfFile(null); setPdfBase64(null); setDeletedPdf(true); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 text-[var(--md-sys-color-error)] transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                    {/* Left Pane (Details) - only shown when isExpanded is true on desktop */}
                    {isExpanded && (
                      <div className="hidden lg:flex lg:w-[45%] lg:flex-col lg:h-full lg:border-r border-[var(--md-sys-color-outline-variant)] overflow-y-auto p-6 scroll-inertia bg-[var(--md-sys-color-surface-container-lowest)]">
                        <div className="flex flex-col gap-4">
                          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--md-sys-color-primary)] mb-2">Rincian Agenda</h3>
                          {sortedColumns.map(col => (
                            <div key={col.key} className="flex flex-col gap-1 p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50">
                              <span className="text-[9px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-[0.2em] opacity-80">{col.label}</span>
                              <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)] leading-relaxed whitespace-pre-wrap">
                                {col.type === 'date' && mailToEdit?.metadata[col.key]
                                  ? formatDate(mailToEdit?.metadata[col.key])
                                  : String(mailToEdit?.metadata[col.key] || '-')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Right Pane (Tabs + Tab Contents) */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      <div className="flex border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('details')}
                          className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative cursor-pointer ${
                            isExpanded ? 'lg:hidden' : 'flex'
                          } ${
                            previewTab === 'details'
                              ? 'text-[var(--md-sys-color-primary)]'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface-variant)]/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">info</span>
                          Rincian
                          {previewTab === 'details' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--md-sys-color-primary)] rounded-t-full" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('markdown')}
                          className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative cursor-pointer ${
                            previewTab === 'markdown'
                              ? 'text-[var(--md-sys-color-primary)]'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface-variant)]/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">description</span>
                          Markdown
                          {previewTab === 'markdown' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--md-sys-color-primary)] rounded-t-full" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => pdfSource && setPreviewTab('qr')}
                          disabled={!pdfSource}
                          className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer ${
                            previewTab === 'qr'
                              ? 'text-[var(--md-sys-color-primary)]'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface-variant)]/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">qr_code_2</span>
                          Unduh QR
                          {previewTab === 'qr' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--md-sys-color-primary)] rounded-t-full" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => pdfSource && setPreviewTab('pdf')}
                          disabled={!pdfSource}
                          className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer ${
                            previewTab === 'pdf'
                              ? 'text-[var(--md-sys-color-primary)]'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface-variant)]/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                          Preview PDF
                          {previewTab === 'pdf' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--md-sys-color-primary)] rounded-t-full" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto bg-[var(--md-sys-color-surface)] scroll-inertia">
                      {previewTab === 'details' && (
                        <div className="p-6 flex flex-col gap-4 pb-32">
                           {sortedColumns.map(col => (
                             <div key={col.key} className="flex flex-col gap-1 p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50">
                               <span className="text-[9px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-[0.2em] opacity-80">{col.label}</span>
                               <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)] leading-relaxed whitespace-pre-wrap">
                                 {col.type === 'date' && mailToEdit?.metadata[col.key]
                                   ? formatDate(mailToEdit?.metadata[col.key])
                                   : String(mailToEdit?.metadata[col.key] || '-')}
                               </span>
                             </div>
                           ))}
                        </div>
                      )}

                      {previewTab === 'markdown' && mailToEdit && (
                        <div className="p-6 pb-32">
                           <div className="relative p-6 bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-inner">
                              <button
                                type="button"
                                className="absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--md-sys-color-surface)] hover:bg-black/5 border border-[var(--md-sys-color-outline-variant)] shadow-sm cursor-pointer transition-all"
                                aria-label="Salin Markdown"
                                onClick={() => {
                                  navigator.clipboard.writeText(formatMarkdown(mailToEdit));
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                              >
                                <span className="material-symbols-outlined text-lg">{copied ? 'done' : 'content_copy'}</span>
                              </button>
                              <pre className="font-mono text-xs whitespace-pre-wrap select-text pr-12 leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                                {formatMarkdown(mailToEdit)}
                              </pre>
                           </div>
                        </div>
                      )}

                      {previewTab === 'qr' && pdfSource && (
                        <div className="flex flex-col items-center justify-center p-8 gap-8 h-full min-h-[550px] max-w-md mx-auto text-center animate-premium-in">
                          {/* Header section with icon */}
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary)]/10 flex items-center justify-center mb-1">
                              <span className="material-symbols-outlined text-2xl text-[var(--md-sys-color-primary)] font-fill">
                                qr_code_2
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                              Bagikan Akses / Unduh via QR Code
                            </h3>
                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-[340px]">
                              Pindai kode QR dengan kamera ponsel untuk mengunduh atau membaca langsung dokumen PDF ini di HP Android/iOS Anda.
                            </p>
                          </div>

                          {/* QR Code Container */}
                          <div 
                            onDoubleClick={() => setIsQrZoomed(true)}
                            title="Double click untuk memperbesar"
                            className="bg-white p-4 rounded-[2rem] border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center w-48 h-48 relative overflow-hidden shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group/qr"
                          >
                            {mailToEdit?.pdfPath ? (
                              <>
                                {qrError ? (
                                  <div className="flex flex-col items-center justify-center text-center p-3 text-[var(--md-sys-color-error)] select-none">
                                    <span className="material-symbols-outlined text-3xl mb-1">error</span>
                                    <span className="text-[10px] font-bold leading-normal">{qrError}</span>
                                  </div>
                                ) : selectedInterface ? (
                                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                                    <img
                                      src={`/api/network-info/qr?url=${encodeURIComponent(`http://${selectedInterface.address}:3000/api/files/${mailToEdit.pdfPath}`)}&t=${qrKey}`}
                                      alt="QR Code Berkas PDF"
                                      className={`w-full h-full object-contain transition-opacity duration-300 ${qrLoading ? 'opacity-0' : 'opacity-100'}`}
                                      onError={() => setQrError('QR gagal dimuat')}
                                    />
                                    <span className="absolute bottom-0 text-[7px] font-black text-[var(--md-sys-color-outline)] uppercase tracking-widest leading-none select-none opacity-0 group-hover/qr:opacity-100 transition-opacity bg-white/90 py-1 px-2 rounded-full shadow-sm">
                                      Klik 2x Zoom
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-center p-3 text-[var(--md-sys-color-outline)] select-none">
                                    <span className="material-symbols-outlined text-3xl mb-1 animate-pulse">cloud_off</span>
                                    <span className="text-[10px] font-bold leading-normal">Koneksi tidak tersedia</span>
                                  </div>
                                )}

                                {/* Loading Progress Spinner */}
                                {qrLoading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                                    <md-circular-progress indeterminate className="scale-75"></md-circular-progress>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-4 text-[var(--md-sys-color-outline)] select-none">
                                <span className="material-symbols-outlined text-3xl mb-2 font-fill">lock</span>
                                <span className="text-[10px] font-bold leading-normal">
                                  Simpan agenda untuk mengaktifkan QR Code.
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Network Interface Switcher */}
                          {networkInfo && (
                            <div className="flex flex-col gap-2 w-full">
                              <span className="text-[10px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-wider">
                                Pilih Jaringan Akses:
                              </span>
                              <div className="flex p-0.5 bg-[var(--md-sys-color-surface-container-high)] dark:bg-[var(--md-sys-color-surface-container-highest)] rounded-full border border-[var(--md-sys-color-outline-variant)]/60 w-full">
                                {(['local', 'tailscale', 'public'] as const).map((type) => {
                                  const label = type === 'local' ? 'Lokal' : type === 'tailscale' ? 'Tailscale' : 'IP Publik';
                                  const isSelected = selectedInterface?.type === type;
                                  const targetIf = networkInfo.interfaces.find(i => i.type === type);
                                  const disabled = !targetIf || !targetIf.active;
                                  
                                  return (
                                    <button
                                      key={type}
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => setSelectedInterface(targetIf || null)}
                                      className={`flex-1 py-1.5 text-[10px] font-black rounded-full transition-all duration-300 relative cursor-pointer ${
                                        disabled 
                                          ? 'opacity-35 cursor-not-allowed text-[var(--md-sys-color-outline)]' 
                                          : isSelected
                                            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface-variant)]/10'
                                      }`}
                                      title={disabled ? `${label} Tidak Aktif` : `Gunakan ${label}`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Link and Refresh Row */}
                          {mailToEdit?.pdfPath && selectedInterface && (
                            <div className="flex flex-col gap-3 w-full">
                              <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] py-2 px-4 rounded-xl flex items-center justify-between gap-3 overflow-hidden shadow-sm w-full">
                                <span className="text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)] truncate flex-1 text-left select-none">
                                  {`http://${selectedInterface.address}:3000/api/files/${mailToEdit.pdfPath}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(`http://${selectedInterface.address}:3000/api/files/${mailToEdit.pdfPath}`)}
                                  className="w-8 h-8 rounded-lg hover:bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all"
                                  title="Salin Alamat Unduh"
                                >
                                  <span className="material-symbols-outlined text-lg">content_copy</span>
                                </button>
                              </div>
                              
                              <button
                                type="button"
                                onClick={handleReloadQr}
                                disabled={qrLoading}
                                className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:underline flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 py-2 px-4 rounded-xl hover:bg-[var(--md-sys-color-primary)]/5 transition-all self-center"
                              >
                                <span className={`material-symbols-outlined text-sm ${qrLoading ? 'animate-spin' : ''}`}>
                                  refresh
                                </span>
                                Perbarui QR Code
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {previewTab === 'pdf' && pdfSource && (
                        <div className="p-6 h-full pb-32 flex flex-col min-h-[500px] animate-premium-in">
                          <div className="flex-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[32px] p-2 overflow-hidden h-full flex flex-col min-h-[500px]">
                            <div className="w-full h-full bg-[var(--md-sys-color-surface)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-[24px] overflow-hidden flex items-center justify-center relative flex-1">
                              {isAnimationComplete ? (
                                <iframe src={pdfSource} className="w-full h-full border-none animate-premium-in" title="PDF Preview" />
                              ) : (
                                <md-circular-progress indeterminate></md-circular-progress>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-end gap-3 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
               <button
                 type="button"
                 onClick={onClose}
                 className="px-6 h-10 text-sm font-bold text-[var(--md-sys-color-primary)] rounded-full hover:bg-[var(--md-sys-color-primary)]/10 active:scale-95 transition-all cursor-pointer"
               >
                 Batal
               </button>
               {mode === 'edit' ? (
                 <button
                   type="button"
                   onClick={handleSubmit}
                   disabled={isSaving}
                   className="px-6 h-10 text-sm font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full hover:shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                 >
                    {isSaving ? (
                      <>
                        <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '18px' }}></md-circular-progress>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        {mailToEdit ? 'Simpan Perubahan' : 'Tambah Agenda'}
                      </>
                    )}
                 </button>
               ) : (
                 <button
                   type="button"
                   onClick={() => onSave({ isSwitchToEdit: true })}
                   className="px-6 h-10 text-sm font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full hover:shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                 >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Data
                 </button>
               )}
            </div>
          </motion.div>
        </>
      )}

      {/* Zoomed QR Code Modal */}
      <AnimatePresence>
        {isQrZoomed && selectedInterface && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2600] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsQrZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-8 max-w-sm w-full flex flex-col items-center gap-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsQrZoomed(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center cursor-pointer hover:bg-[var(--md-sys-color-error)]/10 hover:text-[var(--md-sys-color-error)] transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="text-center flex flex-col gap-2 mt-4">
                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                  Pindai QR Code
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Unduh berkas PDF ini secara langsung ke ponsel Anda.
                </p>
              </div>

              {/* Large QR Box */}
              <div className="bg-white p-4 rounded-[2rem] w-60 h-60 border border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src={`/api/network-info/qr?url=${encodeURIComponent(`http://${selectedInterface.address}:3000/api/files/${mailToEdit?.pdfPath}`)}&t=${qrKey}`}
                  alt="Enlarged QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="w-full bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/40 p-4 rounded-2xl text-center">
                <p className="text-xs font-mono font-bold text-[var(--md-sys-color-primary)] truncate selection:bg-transparent">
                  {`http://${selectedInterface.address}:3000/api/files/${mailToEdit?.pdfPath}`}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copied Success Snackbar */}
      <AnimatePresence>
        {showCopiedSnackbar && (
          <motion.div
            initial={{ y: 30, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 30, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2500] px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full shadow-lg border border-neutral-800 dark:border-neutral-200 flex items-center gap-2.5 text-xs font-bold select-none"
          >
            <span className="material-symbols-outlined text-sm text-emerald-500 font-fill">check_circle</span>
            Alamat unduh berkas disalin ke papan klip!
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
