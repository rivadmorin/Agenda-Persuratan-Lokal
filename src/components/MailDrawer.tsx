import React, { useState, useEffect, useRef } from 'react';
import { MailRecord, ColumnDefinition } from '../types';

interface MailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mailToEdit: MailRecord | null;
  columns: ColumnDefinition[];
  onSave: (data: any) => void;
}

export default function MailDrawer({
  isOpen,
  onClose,
  mailToEdit,
  columns,
  onSave
}: MailDrawerProps) {
  const [type, setType] = useState<'Masuk' | 'Keputusan'>('Masuk');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [deleteExistingPdf, setDeleteExistingPdf] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        // Pre-populate default dates if any column is of date type
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
    }
  }, [isOpen, mailToEdit, columns]);

  // Handle Object URL generation for uploaded file
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

  // Determine PDF Source URL for preview
  const pdfSource = pdfPreviewUrl || (mailToEdit?.pdfPath && !deleteExistingPdf ? `/api/files/${mailToEdit.pdfPath}` : '');
  const isSplit = !!pdfSource;

  // Sorted columns based on order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <md-dialog
      open={isOpen ? true : undefined}
      onClose={onClose}
      style={{
        maxWidth: isSplit ? '1200px' : '650px',
        width: '95vw',
        transition: 'max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      } as any}
    >
      <span slot="headline" className="font-display font-bold">
        {mailToEdit ? 'Ubah Agenda Surat' : 'Tambah Agenda Surat'}
      </span>

      <div slot="content" className="py-2">
        <div className={`grid grid-cols-1 ${isSplit ? 'lg:grid-cols-2' : ''} gap-6 h-[70vh] overflow-hidden`}>
          
          {/* Left Panel: Form */}
          <form id="mail-form" className="flex flex-col gap-4 overflow-y-auto pr-2 h-full pb-8" onSubmit={handleSubmit}>
            
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
              return (
                <div key={col.key} className="flex flex-col gap-1">
                  <md-filled-text-field
                    label={`${col.label}${col.required ? ' *' : ''}`}
                    type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
                    value={formData[col.key] || ''}
                    error={hasError ? true : undefined}
                    errorText={errors[col.key]}
                    onInput={(e: any) => setFormData({ ...formData, [col.key]: e.target.value })}
                    required={col.required ? true : undefined}
                    className="w-full"
                  ></md-filled-text-field>
                </div>
              );
            })}

            <md-divider className="my-2"></md-divider>

            {/* File PDF Upload Section */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] ml-1"> berkas LAMPIRAN PDF</label>
              
              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="pdf-file-input"
              />

              {!pdfSource ? (
                <label
                  htmlFor="pdf-file-input"
                  className="border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[var(--md-sys-color-surface-container-low)] transition-all flex flex-col items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-primary)]">upload_file</span>
                  <span className="text-sm font-bold">Pilih berkas PDF atau Seret ke sini</span>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Ukuran maksimum sesuai limit sistem</span>
                </label>
              ) : (
                <div className="p-4 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl flex items-center justify-between border border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="material-symbols-outlined text-red-500 text-3xl font-fill">picture_as_pdf</span>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate">
                        {pdfFile ? pdfFile.name : (mailToEdit?.pdfPath ? mailToEdit.pdfPath.split('/').pop() : 'Berkas PDF')}
                      </p>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                        {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'Tersimpan di Server'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {pdfFile ? (
                      <md-icon-button onClick={handleRemoveUploadedFile}>
                        <span className="material-symbols-outlined text-red-500">cancel</span>
                      </md-icon-button>
                    ) : (
                      <md-outlined-button
                        onClick={() => setDeleteExistingPdf(true)}
                        style={{ '--md-outlined-button-outline-color': 'red', '--md-outlined-button-label-text-color': 'red' }}
                      >
                        <span slot="icon" className="material-symbols-outlined text-sm">delete</span>
                        Hapus Lampiran
                      </md-outlined-button>
                    )}
                  </div>
                </div>
              )}

              {errors.pdf && (
                <p className="text-xs text-red-500 font-bold ml-1">{errors.pdf}</p>
              )}
            </div>

          </form>

          {/* Right Panel: Live PDF Preview */}
          {isSplit && (
            <div className="hidden lg:flex flex-col h-full border border-[var(--md-sys-color-outline-variant)] rounded-[24px] overflow-hidden bg-[var(--md-sys-color-surface-container-low)]">
              <div className="p-3 bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] truncate max-w-[250px] ml-1">
                  {pdfFile ? pdfFile.name : (mailToEdit?.pdfPath ? mailToEdit.pdfPath.split('/').pop() : 'Pratinjau PDF')}
                </span>
                <md-outlined-button onClick={() => window.open(pdfSource, '_blank')}>
                  <span slot="icon" className="material-symbols-outlined text-sm">open_in_new</span>
                  Buka Tab Baru
                </md-outlined-button>
              </div>
              <iframe
                src={pdfSource}
                className="flex-grow w-full h-full border-none bg-white"
                title="PDF Preview"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

        </div>
      </div>

      <div slot="actions">
        <md-text-button onClick={onClose}>Batal</md-text-button>
        <md-filled-button onClick={handleSubmit}>
          <span slot="icon" className="material-symbols-outlined">save</span>
          {mailToEdit ? 'Simpan Perubahan' : 'Tambah Agenda'}
        </md-filled-button>
      </div>
    </md-dialog>
  );
}
