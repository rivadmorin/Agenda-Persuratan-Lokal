import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { AppConfig } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onImport: (file: File, conflictMode: 'insert' | 'skip' | 'merge') => Promise<{
    success: boolean;
    error?: string;
    summary?: {
      imported: number;
      merged: number;
      skipped: number;
      total: number;
    };
  }>;
}

export default function ImportModal({ isOpen, onClose, config, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [conflictMode, setConflictMode] = useState<'insert' | 'skip' | 'merge'>('merge');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShake, setIsShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    merged: number;
    skipped: number;
    total: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerShake = () => {
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setIsErrorState(true);
      setErrorMessage('Hanya berkas Excel (.xlsx, .xls) yang diperbolehkan.');
      triggerShake();
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setIsErrorState(true);
      setErrorMessage('Ukuran berkas maksimal adalah 10MB.');
      triggerShake();
      setFile(null);
      return;
    }

    setIsErrorState(false);
    setErrorMessage('');
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    // Generate template headers based on current columns configuration
    const headers = config.columns.map(c => c.label);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Agenda');
    XLSX.writeFile(wb, 'Templat_Agenda_Surat.xlsx');
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setIsErrorState(false);
    setErrorMessage('');
    
    try {
      const res = await onImport(file, conflictMode);
      if (res.success && res.summary) {
        setImportSummary(res.summary);
      } else if (res.error) {
        setIsErrorState(true);
        setErrorMessage(res.error);
        triggerShake();
      }
    } catch (err: any) {
      setIsErrorState(true);
      setErrorMessage(err.message || 'Gagal menghubungi server.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsErrorState(false);
    setErrorMessage('');
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm flex items-center justify-center p-4"
          >
            {/* Double-Bezel Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[32px] p-2 max-w-md w-full shadow-2xl flex flex-col z-[201] overflow-hidden ${
                isShake ? 'animate-shake' : ''
              }`}
            >
              <div className="bg-[var(--md-sys-color-surface)] rounded-[26px] p-6 flex flex-col gap-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/60 pb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] tracking-[0.2em] font-medium text-[var(--md-sys-color-primary)] uppercase">
                      Impor Dokumen
                    </span>
                    <h2 className="text-xl font-bold font-display text-[var(--md-sys-color-on-surface)] tracking-tight">
                      Impor Agenda Excel
                    </h2>
                  </div>
                  {!isLoading && (
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-on-surface)]/10 text-[var(--md-sys-color-on-surface-variant)] transition-all cursor-pointer active:scale-90"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>

                {importSummary ? (
                  /* Success Bento Grid State */
                  <div className="flex flex-col gap-5 animate-premium-in">
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-2xl font-fill">check_circle</span>
                      </div>
                      <h3 className="text-md font-bold text-[var(--md-sys-color-on-surface)] font-display">
                        Impor Selesai Berhasil
                      </h3>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] text-center">
                        Total {importSummary.total} baris data diproses dari berkas Excel.
                      </p>
                    </div>

                    {/* Bento Grid Metrics Summary */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Imported Card */}
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500 mb-1">Baru</span>
                        <span className="text-2xl font-black text-emerald-500 font-display font-tabular">
                          {importSummary.imported}
                        </span>
                      </div>
                      {/* Merged Card */}
                      <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-blue-500 mb-1">Gabung</span>
                        <span className="text-2xl font-black text-blue-500 font-display font-tabular">
                          {importSummary.merged}
                        </span>
                      </div>
                      {/* Skipped Card */}
                      <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500 mb-1">Lewat</span>
                        <span className="text-2xl font-black text-amber-500 font-display font-tabular">
                          {importSummary.skipped}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-2">
                      <md-filled-button onClick={() => { handleReset(); onClose(); }}>
                        Selesai
                      </md-filled-button>
                    </div>
                  </div>
                ) : (
                  /* Upload Form State */
                  <div className="flex flex-col gap-4">
                    {/* Drag-Drop Box */}
                    <div
                      onDragOver={isLoading ? undefined : handleDragOver}
                      onDragLeave={isLoading ? undefined : handleDragLeave}
                      onDrop={isLoading ? undefined : handleDrop}
                      onClick={isLoading ? undefined : () => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                        isDragOver
                          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/5 scale-[0.99]'
                          : isErrorState
                          ? 'border-red-500 bg-red-500/5'
                          : file
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-[var(--md-sys-color-outline-variant)] bg-transparent hover:bg-[var(--md-sys-color-surface-container-low)]'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls"
                        className="hidden"
                        disabled={isLoading}
                      />
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isErrorState 
                          ? 'bg-red-500/10 text-red-500' 
                          : file 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)]'
                      }`}>
                        <span className="material-symbols-outlined text-xl">
                          {isErrorState ? 'warning' : file ? 'check_circle' : 'upload_file'}
                        </span>
                      </div>

                      {file ? (
                        <div className="flex flex-col gap-1 w-full max-w-[250px]">
                          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                            Tarik berkas ke sini atau klik untuk pilih
                          </span>
                          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                            Hanya Excel (.xlsx, .xls) maksimal 10MB
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Template & Info */}
                    {!file && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 text-xs">
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          Belum punya berkas templat?
                        </span>
                        <md-text-button onClick={handleDownloadTemplate}>
                          <span slot="icon" className="material-symbols-outlined">download</span>
                          Unduh Templat
                        </md-text-button>
                      </div>
                    )}

                    {/* Error Alerts */}
                    {isErrorState && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-xs flex gap-2 items-start animate-premium-in">
                        <span className="material-symbols-outlined text-sm mt-[2px] font-fill">error</span>
                        <div className="flex-1 font-mono text-[10.5px] leading-relaxed break-words whitespace-pre-wrap">
                          {errorMessage}
                        </div>
                      </div>
                    )}

                    {/* Conflict Mode Selection Card Group */}
                    {file && !isLoading && (
                      <div className="flex flex-col gap-2 mt-1 animate-premium-in">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                          Opsi Konflik Nomor Surat Duplikat:
                        </span>
                        <div className="flex flex-col gap-2">
                          {/* Merge Option */}
                          <div 
                            onClick={() => setConflictMode('merge')}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                              conflictMode === 'merge' 
                                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/5' 
                                : 'border-[var(--md-sys-color-outline-variant)] bg-transparent hover:bg-[var(--md-sys-color-surface-container-low)]'
                            }`}
                          >
                            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                              <span className={`material-symbols-outlined text-sm ${conflictMode === 'merge' ? 'font-fill text-[var(--md-sys-color-primary)]' : ''}`}>
                                merge_type
                              </span>
                              Gabungkan & Perbarui (Merge)
                            </span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                              Timpa kolom data lama jika nomor surat sama dengan data Excel.
                            </span>
                          </div>

                          {/* Skip Option */}
                          <div 
                            onClick={() => setConflictMode('skip')}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                              conflictMode === 'skip' 
                                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/5' 
                                : 'border-[var(--md-sys-color-outline-variant)] bg-transparent hover:bg-[var(--md-sys-color-surface-container-low)]'
                            }`}
                          >
                            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                              <span className={`material-symbols-outlined text-sm ${conflictMode === 'skip' ? 'font-fill text-[var(--md-sys-color-primary)]' : ''}`}>
                                block
                              </span>
                              Lewati Data Duplikat (Skip)
                            </span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                              Abaikan baris baru dari Excel jika nomor surat sudah terdaftar.
                            </span>
                          </div>

                          {/* Insert Option */}
                          <div 
                            onClick={() => setConflictMode('insert')}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                              conflictMode === 'insert' 
                                ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/5' 
                                : 'border-[var(--md-sys-color-outline-variant)] bg-transparent hover:bg-[var(--md-sys-color-surface-container-low)]'
                            }`}
                          >
                            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                              <span className={`material-symbols-outlined text-sm ${conflictMode === 'insert' ? 'font-fill text-[var(--md-sys-color-primary)]' : ''}`}>
                                add_box
                              </span>
                              Buat Baru Selalu (Duplicate)
                            </span>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                              Simpan semua data dari Excel sebagai data agenda baru.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar Loader */}
                    {isLoading && (
                      <div className="flex flex-col gap-2 py-2">
                        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
                          Sedang memproses dan memvalidasi berkas...
                        </span>
                        <md-linear-progress indeterminate></md-linear-progress>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2 border-t border-[var(--md-sys-color-outline-variant)]/60 pt-4 mt-2">
                      <md-text-button disabled={isLoading ? true : undefined} onClick={onClose}>
                        Batal
                      </md-text-button>
                      <md-filled-button
                        disabled={isLoading || !file ? true : undefined}
                        onClick={handleUpload}
                      >
                        <span slot="icon" className="material-symbols-outlined">upload</span>
                        Mulai Impor
                      </md-filled-button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
