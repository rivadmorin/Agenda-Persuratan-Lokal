import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MailRecord, ColumnDefinition } from '../types';

interface MailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  mailToEdit: MailRecord | null;
  onSave: (mailData: {
    id?: string;
    type: 'Masuk' | 'Keputusan';
    metadata: Record<string, any>;
    pdfData?: string; // base64
    pdfName?: string;
    versionId?: number;
    deletePdf?: boolean;
  }) => Promise<void>;
}

export default function MailDrawer({
  isOpen,
  onClose,
  columns,
  mailToEdit,
  onSave,
}: MailDrawerProps) {
  const [type, setType] = useState<'Masuk' | 'Keputusan'>('Masuk');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [deleteExistingPdf, setDeleteExistingPdf] = useState(false);

  // Set default metadata structure from columns
  useEffect(() => {
    if (mailToEdit) {
      setType(mailToEdit.type);
      setMetadata(mailToEdit.metadata || {});
      setPdfFile(null);
      setPdfBase64('');
      setDeleteExistingPdf(false);
    } else {
      setType('Masuk');
      const defaults: Record<string, any> = {};
      columns.forEach((col) => {
        defaults[col.key] = col.type === 'number' ? '' : '';
      });
      // prefill tanggalTerima and tanggalSurat with today's date
      const today = new Date().toISOString().split('T')[0];
      if (defaults.hasOwnProperty('tanggalTerima')) defaults['tanggalTerima'] = today;
      if (defaults.hasOwnProperty('tanggalSurat')) defaults['tanggalSurat'] = today;

      setMetadata(defaults);
      setPdfFile(null);
      setPdfBase64('');
    }
    setErrors({});
    setGlobalError('');
  }, [mailToEdit, columns, isOpen]);

  const handleMetadataChange = (key: string, value: any, type: string) => {
    let formattedVal = value;
    if (type === 'number') {
      formattedVal = value === '' ? '' : Number(value);
    }
    setMetadata({ ...metadata, [key]: formattedVal });
    if (errors[key]) {
      const newErrors = { ...errors };
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      processFile(file);
    } else {
      setGlobalError('Hanya mendukung berkas PDF.');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      processFile(file);
    } else {
      setGlobalError('Hanya mendukung berkas PDF.');
    }
  };

  const processFile = (file: File) => {
    setPdfFile(file);
    setGlobalError('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPdfBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    // Field Validations
    const newErrors: Record<string, string> = {};
    columns.forEach((col) => {
      const val = metadata[col.key];
      if (col.required && (val === undefined || val === null || String(val).trim() === '')) {
        newErrors[col.key] = `${col.label} wajib diisi.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError('Mohon periksa dan lengkapi semua kolom wajib.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: mailToEdit?.id,
        type,
        metadata,
        pdfData: pdfBase64 || undefined,
        pdfName: pdfFile?.name || undefined,
        versionId: mailToEdit?.versionId,
        deletePdf: deleteExistingPdf,
      });
      onClose();
    } catch (err: any) {
      setGlobalError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40 cursor-pointer"
          />

          {/* Drawer Panel on Right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col select-none transition-colors duration-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg font-display">
                  {mailToEdit ? 'Ubah Informasi Surat' : 'Tambah Agenda Surat'}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {mailToEdit ? 'Ubah data dan dokumen terlampir' : 'Isi kolom dan unggah lampiran surat'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error alerts */}
            {globalError && (
              <div className="m-6 mb-0 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold flex items-start gap-3">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Dynamic Inputs from Columns */}
              <div className="space-y-4">
                {sortedColumns.map((col) => {
                  const error = errors[col.key];
                  return (
                    <div key={col.key}>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {col.label} {col.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
                        value={metadata[col.key] ?? ''}
                        onChange={(e) => handleMetadataChange(col.key, e.target.value, col.type)}
                        className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium ${
                          error ? 'border-rose-400 dark:border-rose-500 bg-rose-50/20 dark:bg-rose-950/10' : 'border-slate-200 dark:border-slate-800'
                        }`}
                        placeholder={`Masukkan ${col.label.toLowerCase()}`}
                      />
                      {error && (
                        <span className="text-[11px] text-rose-500 font-semibold mt-1 block pl-1">
                          {error}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PDF File Drag and Drop attachment */}
              <div className="pt-3">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Lampiran Berkas PDF
                </label>
                {mailToEdit?.pdfPath && !pdfFile && !deleteExistingPdf ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-350 font-semibold min-w-0 flex-1">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">
                        {mailToEdit.pdfPath.split('/').pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-lg cursor-pointer transition-all">
                        Ganti PDF
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteExistingPdf(true);
                          setPdfFile(null);
                          setPdfBase64('');
                        }}
                        className="p-1.5 border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        title="Hapus PDF"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-950 cursor-pointer transition-all relative ${
                      pdfFile ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50/10 dark:bg-blue-950/10' : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${pdfFile ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {pdfFile ? pdfFile.name : 'Pilih atau seret lampiran PDF ke sini'}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Format dokumen PDF wajib di bawah 50MB
                    </span>
                  </div>
                )}
              </div>
            </form>

            {/* Footer buttons */}
            <div className="p-6 border-t border-slate-150 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-100 dark:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Simpan Agenda'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
