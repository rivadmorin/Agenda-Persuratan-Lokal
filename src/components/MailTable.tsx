import React, { useState } from 'react';
import { MailRecord, AppConfig } from '../types';
import { getMailSearchScore } from '../utils/search';

interface MailTableProps {
  mails: MailRecord[];
  config: AppConfig;
  onAdd: () => void;
  onEdit: (mail: MailRecord) => void;
  onDelete: (id: string) => void;
  onViewMail: (mail: MailRecord) => void;
  onExportExcel: () => void;
  onOpenImportModal: () => void;
  onBatchDownload: (ids: string[]) => void;
  onPrintReceipt: (ids: string[]) => void;
  isBatchLoading?: boolean;
  isImporting?: boolean;
  onRefresh: () => void;
  onError?: (title: string, message: string) => void;
}

const MailTable = React.memo(function MailTable(props: MailTableProps) {
  const {
    mails,
    config,
    onAdd,
    onEdit,
    onDelete,
    onViewMail,
    onExportExcel,
    onOpenImportModal,
    onBatchDownload,
    onPrintReceipt,
    onRefresh,
    isBatchLoading,
    isImporting
  } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadingMailId, setUploadingMailId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const sortedColumns = React.useMemo(() => {
    return [...config.columns].sort((a, b) => a.order - b.order);
  }, [config.columns]);

  const sortedMails = React.useMemo(() => {
    return [...mails].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [mails]);

  const filteredMails = React.useMemo(() => {
    if (!debouncedSearchTerm) return sortedMails;
    const scoredMails = sortedMails
      .map(mail => ({
        mail,
        result: getMailSearchScore(mail, debouncedSearchTerm)
      }))
      .filter(item => item.result.matches);

    // Sort by fuzzy match score descending
    return scoredMails
      .sort((a, b) => b.result.score - a.result.score)
      .map(item => item.mail);
  }, [sortedMails, debouncedSearchTerm]);

  // Reset to first page when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const totalItems = filteredMails.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedMails = React.useMemo(() => {
    return filteredMails.slice(startIndex, endIndex);
  }, [filteredMails, startIndex, endIndex]);

  const allSelectedOnPage = React.useMemo(() => {
    return displayedMails.length > 0 && displayedMails.every(m => selectedIds.includes(m.id));
  }, [displayedMails, selectedIds]);

  const someSelectedOnPage = React.useMemo(() => {
    return displayedMails.some(m => selectedIds.includes(m.id));
  }, [displayedMails, selectedIds]);

  const isIndeterminate = someSelectedOnPage && !allSelectedOnPage;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const displayedIds = displayedMails.map(m => m.id);
    const allSelectedOnPage = displayedIds.length > 0 && displayedIds.every(id => selectedIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedIds(prev => prev.filter(id => !displayedIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const next = [...prev];
        displayedIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
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
              onClick={() => { setSearchTerm(''); setDebouncedSearchTerm(''); }}
              aria-label="Hapus pencarian"
            >
              <span className="material-symbols-outlined">close</span>
            </md-icon-button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          {selectedIds.length > 0 && (
             <>
               <md-filled-button
                 disabled={isBatchLoading ? true : undefined}
                 onClick={() => onPrintReceipt(selectedIds)}
                 style={{ '--md-filled-button-container-color': 'var(--md-sys-color-tertiary)' }}
                 className="w-full sm:w-auto"
               >
                 <span slot="icon" className="material-symbols-outlined">receipt_long</span>
                 Tanda Terima
               </md-filled-button>
               <md-outlined-button
                 disabled={isBatchLoading ? true : undefined}
                 onClick={() => onBatchDownload(selectedIds)}
                 className="w-full sm:w-auto"
               >
                 <span slot="icon" className="material-symbols-outlined">download_for_offline</span>
                 ZIP
               </md-outlined-button>
             </>
          )}
          <md-outlined-button 
            disabled={isImporting || isBatchLoading ? true : undefined} 
            onClick={onExportExcel} 
            className="w-full sm:w-auto"
          >
            <span slot="icon" className="material-symbols-outlined font-fill">description</span>
            Ekspor Excel
          </md-outlined-button>
          <md-outlined-button 
            disabled={isImporting || isBatchLoading ? true : undefined} 
            onClick={onOpenImportModal} 
            className="w-full sm:w-auto"
          >
            <span slot="icon" className="material-symbols-outlined font-fill">upload_file</span>
            Impor Excel
          </md-outlined-button>
          <md-filled-button 
            disabled={isImporting || isBatchLoading ? true : undefined} 
            onClick={onAdd} 
            className="hidden md:inline-flex"
          >
            <span slot="icon" className="material-symbols-outlined">add</span>
            Tambah Surat
          </md-filled-button>
        </div>
      </div>

      <div className="m3-table-container flex flex-col shadow-sm border border-[var(--md-sys-color-outline-variant)] flex-1 overflow-hidden bg-[var(--md-sys-color-surface-container)] rounded-3xl transition-premium">
        {isBatchLoading && <md-linear-progress indeterminate style={{ position: 'sticky', top: 0, zIndex: 10, width: '100%' }}></md-linear-progress>}
        
        {/* Desktop Table View */}
        <div className="flex-1 overflow-auto hidden md:block scroll-inertia">
          <table className="m3-table min-w-full">
            <thead className="bg-[var(--md-sys-color-surface-container-high)] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 w-12">
                  <md-checkbox
                    checked={allSelectedOnPage}
                    indeterminate={isIndeterminate ? true : undefined}
                    onClick={toggleSelectAll}
                  ></md-checkbox>
                </th>
                {sortedColumns.map(col => {
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
                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.15em] text-[var(--md-sys-color-on-surface-variant)] w-48 min-w-[192px] whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {displayedMails.map(mail => (
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
                  {sortedColumns.map(col => {
                    const isSecondary = col.key === 'catatan' || col.key === 'disposisi' || col.key === 'penomoran';
                    return (
                      <td key={col.key} className={`px-4 py-4 text-sm text-[var(--md-sys-color-on-surface)] max-w-[200px] truncate ${isSecondary ? 'hidden lg:table-cell' : ''}`}>
                        {col.type === 'date'
                          ? formatDate(mail.metadata[col.key])
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
                      <div className="inline-block">
                        <md-outlined-button
                          onClick={(e: any) => {
                            const parent = e.currentTarget.parentElement;
                            const input = parent?.querySelector('input[type="file"]');
                            if (input) input.click();
                          }}
                          className="flex items-center gap-1 text-[var(--md-sys-color-primary)] font-bold transition-premium animate-premium-in"
                        >
                          <span slot="icon" className="material-symbols-outlined text-sm">upload</span>
                          <span>Unggah</span>
                        </md-outlined-button>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInlineUpload(mail.id, file);
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right w-48 min-w-[192px] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 action-btn-group">
                      <md-icon-button onClick={() => onEdit(mail)} aria-label="Edit Agenda" className="btn-action-edit">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </md-icon-button>
                      <md-icon-button
                        onClick={mail.pdfPath ? () => window.open(`/api/files/${mail.pdfPath}`, '_blank') : undefined}
                        disabled={mail.pdfPath ? undefined : true}
                        aria-label={mail.pdfPath ? "Unduh PDF" : "Tidak ada PDF"}
                        className="btn-action-download"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </md-icon-button>
                      <md-icon-button
                        onClick={() => onDelete(mail.id)}
                        aria-label="Hapus Agenda"
                        className="btn-action-delete"
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

        {/* Mobile Card List View */}
        <div className="flex-1 overflow-auto md:hidden p-4 flex flex-col gap-4 scroll-inertia">
          {displayedMails.map(mail => {
            const primaryCol = sortedColumns[0];
            const otherCols = sortedColumns.slice(1).filter(col => {
              return col.key !== 'catatan' && col.key !== 'disposisi';
            }).slice(0, 4);

            return (
              <div 
                key={mail.id} 
                onClick={() => onViewMail(mail)}
                className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 flex flex-col gap-3 hover:bg-[var(--md-sys-color-surface-container-highest)] transition-premium cursor-pointer relative"
              >
                {/* Card Header: Checkbox + Type Badge + Quick Actions */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)]/50 pb-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <md-checkbox
                      checked={selectedIds.includes(mail.id)}
                      onClick={() => toggleSelect(mail.id)}
                    ></md-checkbox>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      mail.type === 'Masuk' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    }`}>
                      {mail.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <md-icon-button onClick={() => onEdit(mail)} aria-label="Edit" className="w-8 h-8">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </md-icon-button>
                    <md-icon-button
                      onClick={mail.pdfPath ? () => window.open(`/api/files/${mail.pdfPath}`, '_blank') : undefined}
                      disabled={mail.pdfPath ? undefined : true}
                      aria-label="Download"
                      className="w-8 h-8"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </md-icon-button>
                    <md-icon-button onClick={() => onDelete(mail.id)} aria-label="Delete" className="w-8 h-8">
                      <span className="material-symbols-outlined text-[18px] text-[var(--md-sys-color-error)]">delete</span>
                    </md-icon-button>
                  </div>
                </div>

                {/* Card Content: Dynamic metadata columns */}
                <div className="flex flex-col gap-2">
                  {primaryCol && (
                    <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)] break-all leading-tight">
                      {mail.metadata[primaryCol.key] || '-'}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-y-1.5 mt-1">
                    {otherCols.map(col => {
                      const val = col.type === 'date'
                        ? formatDate(mail.metadata[col.key])
                        : String(mail.metadata[col.key] || '-');
                      return (
                        <div key={col.key} className="text-xs flex justify-between border-b border-[var(--md-sys-color-outline-variant)]/30 pb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] shrink-0 pr-2">
                            {col.label}
                          </span>
                          <span className="text-[var(--md-sys-color-on-surface)] truncate max-w-full font-medium text-right">
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PDF Status / Inline Upload */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/50 mt-1" onClick={(e) => e.stopPropagation()}>
                  <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
                    Oleh: {mail.createdByName || mail.createdBy || '-'}
                  </div>
                  
                  <div>
                    {uploadingMailId === mail.id ? (
                      <div className="flex items-center gap-1.5 text-[var(--md-sys-color-primary)] animate-pulse">
                        <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '16px' }}></md-circular-progress>
                        <span className="text-[9px] font-black uppercase">Mengunggah</span>
                      </div>
                    ) : mail.pdfPath ? (
                      <span className="text-[9px] font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>PDF Tersedia</span>
                      </span>
                    ) : (
                      <div className="inline-block">
                        <md-outlined-button
                          onClick={(e: any) => {
                            const parent = e.currentTarget.parentElement;
                            const input = parent?.querySelector('input[type="file"]');
                            if (input) input.click();
                          }}
                          className="h-7 text-[9px] font-bold"
                          style={{ '--md-outlined-button-label-text-size': '10px', height: '28px' }}
                        >
                          <span slot="icon" className="material-symbols-outlined text-xs" style={{ fontSize: '14px' }}>upload</span>
                          <span>Unggah PDF</span>
                        </md-outlined-button>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInlineUpload(mail.id, file);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMails.length === 0 && (
            <div className="py-16 text-center text-[var(--md-sys-color-outline)] animate-premium-in">
              <span className="material-symbols-outlined text-5xl mb-3 text-[var(--md-sys-color-primary)] opacity-20 font-fill">inventory_2</span>
              <p className="text-xs font-medium">Tidak ada data surat ditemukan.</p>
            </div>
          )}
        </div>

        {/* Dynamic Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-[var(--md-sys-color-surface-container-high)] border-t border-[var(--md-sys-color-outline-variant)] rounded-b-3xl shrink-0">
          <div className="flex items-center gap-3 text-sm text-[var(--md-sys-color-on-surface-variant)] flex-wrap">
            <span>Tampilkan baris:</span>
            <div className="relative inline-flex">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] text-sm font-bold py-1.5 pl-3 pr-8 rounded-xl border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-premium cursor-pointer"
              >
                {[10, 20, 30, 40, 50, 100].map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-md text-[var(--md-sys-color-on-surface-variant)]">
                arrow_drop_down
              </span>
            </div>
            <span className="text-xs text-[var(--md-sys-color-outline)] font-mono">
              (kelipatan 10)
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-end">
            <span className="text-sm text-[var(--md-sys-color-on-surface-variant)] font-tabular">
              Menampilkan <span className="font-bold text-[var(--md-sys-color-on-surface)]">{totalItems === 0 ? 0 : startIndex + 1}</span>–
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{Math.min(endIndex, totalItems)}</span> dari{' '}
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">{totalItems}</span> data
            </span>

            <div className="flex items-center gap-1">
              <md-icon-button
                disabled={activePage === 1 ? true : undefined}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                aria-label="Halaman Sebelumnya"
                className="w-10 h-10"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </md-icon-button>

              <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)] px-2 font-tabular select-none min-w-[40px] text-center">
                {activePage} / {totalPages}
              </span>

              <md-icon-button
                disabled={activePage === totalPages ? true : undefined}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                aria-label="Halaman Selanjutnya"
                className="w-10 h-10"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </md-icon-button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) for mobile view */}
      <button
        onClick={onAdd}
        className="fixed bottom-6 right-6 z-[40] w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 cursor-pointer md:hidden border border-[var(--md-sys-color-outline-variant)]"
        title="Tambah Agenda Surat"
        aria-label="Tambah Agenda Surat"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
      </button>
    </div>
  );
});
export default MailTable;
