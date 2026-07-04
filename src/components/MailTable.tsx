
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
  onViewPdf
}: MailTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between gap-4">
        <md-outlined-text-field
          placeholder="Cari agenda surat..."
          onInput={(e: any) => setSearchTerm(e.target.value)}
          className="flex-grow max-w-md"
          style={{ '--md-outlined-text-field-container-shape': '28px' }}
        >
          <span slot="leading-icon" className="material-symbols-outlined">search</span>
        </md-outlined-text-field>

        <div className="flex items-center gap-2">
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

      <div className="m3-table-container shadow-sm border border-[var(--md-sys-color-outline-variant)]">
        <table className="m3-table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>
                <md-checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === filteredMails.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredMails.length ? true : undefined}
                  onClick={toggleSelectAll}
                ></md-checkbox>
              </th>
              {config.columns.sort((a,b) => a.order - b.order).map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th style={{ textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filteredMails.map(mail => (
              <tr key={mail.id}>
                <td>
                  <md-checkbox
                    checked={selectedIds.includes(mail.id)}
                    onClick={() => toggleSelect(mail.id)}
                  ></md-checkbox>
                </td>
                {config.columns.map(col => (
                  <td key={col.key}>
                    {col.type === 'date' && mail.metadata[col.key]
                      ? new Date(mail.metadata[col.key]).toLocaleDateString('id-ID')
                      : String(mail.metadata[col.key] || '-')}
                  </td>
                ))}
                <td style={{ textAlign: 'right' }}>
                  <div className="flex items-center justify-end gap-1">
                    {mail.pdfPath && (
                      <md-icon-button onClick={() => onViewPdf(mail.pdfPath!)}>
                        <span className="material-symbols-outlined">visibility</span>
                      </md-icon-button>
                    )}
                    <md-icon-button onClick={() => onEdit(mail)}>
                      <span className="material-symbols-outlined">edit</span>
                    </md-icon-button>
                    <md-icon-button onClick={() => onEdit(mail)}>
                      <span className="material-symbols-outlined">assignment_turned_in</span>
                    </md-icon-button>
                    <md-icon-button onClick={() => onDelete(mail.id)}>
                      <span className="material-symbols-outlined text-error">delete</span>
                    </md-icon-button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMails.length === 0 && (
          <div className="p-20 text-center text-[var(--md-sys-color-on-surface-variant)]">
             <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inventory_2</span>
             <p>Tidak ada data surat ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
