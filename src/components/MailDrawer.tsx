
import React, { useState, useEffect } from 'react';
import { MailRecord, ColumnDefinition } from '../types';

interface MailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  mailToEdit: MailRecord | null;
  onSave: (data: any) => void;
}

export default function MailDrawer({ isOpen, onClose, columns, mailToEdit, onSave }: MailDrawerProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfFile, setPdfFile] = useState<{ data: string; name: string } | null>(null);

  useEffect(() => {
    if (mailToEdit) {
      setFormData(mailToEdit.metadata);
    } else {
      setFormData({});
    }
    setPdfFile(null);
  }, [mailToEdit, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfFile({
          data: (reader.result as string).split(',')[1],
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <md-dialog open={isOpen} onClose={onClose} style={{ maxWidth: '800px', width: '90vw' }}>
      <span slot="headline">{mailToEdit ? 'Edit Agenda Surat' : 'Tambah Agenda Surat Baru'}</span>

      <form slot="content" id="mail-form" className="flex flex-col gap-4 py-4" onSubmit={(e) => {
        e.preventDefault();
        onSave({
          metadata: formData,
          pdfData: pdfFile?.data,
          pdfName: pdfFile?.name,
          versionId: mailToEdit?.versionId
        });
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {columns.sort((a,b) => a.order - b.order).map(col => (
            <md-filled-text-field
              key={col.key}
              label={col.label}
              type={col.type === 'date' ? 'date' : 'text'}
              value={formData[col.key] || ''}
              required={col.required ? true : undefined}
              onInput={(e: any) => setFormData({ ...formData, [col.key]: e.target.value })}
            ></md-filled-text-field>
          ))}
        </div>

        <div className="mt-6 p-6 border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[var(--md-sys-color-primary)]">upload_file</span>
          <div className="text-center">
            <p className="font-bold text-[var(--md-sys-color-on-surface)]">Lampiran PDF</p>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {pdfFile ? `Terpilih: ${pdfFile.name}` : (mailToEdit?.pdfPath ? 'File sudah ada (unggah untuk mengganti)' : 'Klik untuk memilih file')}
            </p>
          </div>
          <input
            type="file"
            accept=".pdf"
            className="absolute opacity-0 w-full h-full cursor-pointer"
            onChange={handleFileChange}
          />
        </div>
      </form>

      <div slot="actions">
        <md-text-button onClick={onClose}>Batal</md-text-button>
        <md-filled-button form="mail-form" type="submit">Simpan Agenda</md-filled-button>
      </div>
    </md-dialog>
  );
}
