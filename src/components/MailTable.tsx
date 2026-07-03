import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  FileSpreadsheet, 
  FileDown, 
  Archive, 
  Receipt, 
  Trash2, 
  FileWarning,
  Eye,
  Loader,
  X,
  Upload,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MailRecord, ColumnDefinition, User } from '../types';
import ConfirmModal from './ConfirmModal';
import { getMailSearchScore } from '../utils/search';

interface MailTableProps {
  currentUser: User;
  columns: ColumnDefinition[];
  mails: MailRecord[];
  loading: boolean;
  onRefresh: () => void;
  onAddMail: () => void;
  onEditMail: (mail: MailRecord) => void;
  onDeleteMail: (id: string) => void;
  onSelectForPreview: (mail: MailRecord) => void;
  selectedMailForPreview: MailRecord | null;
  onUploadPdfForMail: (mailId: string, base64Data: string, fileName: string) => Promise<void>;
  onBatchReceipt: (mailIds: string[]) => void;
  onBatchZip: (mailIds: string[]) => void;
  onImportExcel: (file: File) => Promise<{ success: boolean; count?: number; errors?: string[] }>;
  showNoColumn?: boolean;
}

export default function MailTable({
  currentUser,
  columns,
  mails,
  loading,
  onRefresh,
  onAddMail,
  onEditMail,
  onDeleteMail,
  onSelectForPreview,
  selectedMailForPreview,
  onUploadPdfForMail,
  onBatchReceipt,
  onBatchZip,
  onImportExcel,
  showNoColumn = true,
}: MailTableProps) {
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Searching & Filtering
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Excel Import UI states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Delete confirm modal states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, columnFilters]);

  // Clear selections if mails change or refresh
  useEffect(() => {
    setSelectedIds([]);
  }, [mails]);

  const [paginatedMails, setPaginatedMails] = useState<MailRecord[]>([]);
  const [totalMailsCount, setTotalMailsCount] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(false);

  // Load paginated data from the server based on filters, search, and sorting keys
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setFetching(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', String(currentPage));
        queryParams.append('limit', String(pageSize));
        if (globalSearch) {
          queryParams.append('search', globalSearch);
        }
        if (sortKey) {
          queryParams.append('sortKey', sortKey);
          queryParams.append('sortOrder', sortOrder);
        }
        
        // Add column filters
        Object.entries(columnFilters).forEach(([key, val]) => {
          if (val) {
            queryParams.append(key, val);
          }
        });

        const res = await fetch(`/api/mails?${queryParams.toString()}`, {
          headers: {
            'x-username': currentUser.username,
            'x-user-name': currentUser.name,
            'x-user-role': currentUser.role,
          },
        });
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json && typeof json === 'object' && 'data' in json) {
            setPaginatedMails(json.data);
            setTotalMailsCount(json.total);
          } else if (Array.isArray(json)) {
            setPaginatedMails(json);
            setTotalMailsCount(json.length);
          }
        }
      } catch (err) {
        console.error('Failed to load server-side paginated mails:', err);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentPage, pageSize, globalSearch, columnFilters, sortKey, sortOrder, mails, currentUser]);

  const totalPages = Math.ceil(totalMailsCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allPageIds = paginatedMails.map((m) => m.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...allPageIds])));
    } else {
      const allPageIds = paginatedMails.map((m) => m.id);
      setSelectedIds(selectedIds.filter((id) => !allPageIds.includes(id)));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((rowId) => rowId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters({ ...columnFilters, [key]: value });
  };

  // Upload handler for drop-zone on side panel
  const [uploadingPdfId, setUploadingPdfId] = useState<string | null>(null);
  const handleDropFile = async (e: React.DragEvent, mailId: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      await processAndUploadPdf(file, mailId);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, mailId: string) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      await processAndUploadPdf(file, mailId);
    }
  };

  const processAndUploadPdf = async (file: File, mailId: string) => {
    setUploadingPdfId(mailId);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await onUploadPdfForMail(mailId, base64, file.name);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Gagal mengunggah PDF.');
    } finally {
      setUploadingPdfId(null);
    }
  };

  const handleExcelImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importingFile) return;

    setImportLoading(true);
    setImportErrors([]);
    setImportSuccessCount(null);

    const result = await onImportExcel(importingFile);
    setImportLoading(false);

    if (result.success) {
      setImportSuccessCount(result.count || 0);
      setImportingFile(null);
      setTimeout(() => {
        setShowImportDialog(false);
        setImportSuccessCount(null);
      }, 2000);
    } else if (result.errors) {
      setImportErrors(result.errors);
    }
  };

  // Format date view Indonesian
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (err) {
      return dateStr;
    }
  };

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 flex h-screen select-none relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Primary Left Content (Grid Table and controls) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-200">
          {/* Search bar */}
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-16 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm font-medium"
              placeholder="Cari semua data surat..."
            />
            {globalSearch && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-lg border border-blue-500/20 select-none">
                Fuzzy
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || fetching) ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex items-center gap-2 px-3.5 py-2 border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Impor Excel</span>
              </button>
            )}

            <a
              href="/api/excel/export"
              className="flex items-center gap-2 px-3.5 py-2 border border-blue-100 dark:border-blue-950/40 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/80 dark:hover:bg-blue-950/45 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </a>

            <button
              onClick={onAddMail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Surat</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet-like Data Table Card */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none flex flex-col overflow-hidden relative transition-colors duration-200">
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-sm table-fixed" style={{ minWidth: `${(showNoColumn ? 496 : 448) + sortedColumns.length * 224}px` }}>
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                {/* Header Labels row */}
                <tr className="divide-x divide-slate-200 dark:divide-slate-800">
                  <th className="w-12 px-3 text-center bg-slate-50 dark:bg-slate-800/50">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedMails.length > 0 &&
                        paginatedMails.every((m) => selectedIds.includes(m.id))
                      }
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 w-4 h-4 cursor-pointer accent-blue-600 dark:accent-blue-500"
                    />
                  </th>
                  {showNoColumn && (
                    <th className="w-12 px-2 text-center font-bold text-slate-400 dark:text-slate-500">No</th>
                  )}
 
                  {sortedColumns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="w-56 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left"
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="truncate">{col.label}</span>
                        <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                          {sortKey === col.key ? (
                            sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 opacity-20" />
                          )}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="w-40 px-4 text-left font-bold text-slate-400 dark:text-slate-500">Penginput</th>
                  <th className="w-28 px-4 text-center">Lampiran</th>
                  <th className="w-32 px-4 text-center">Aksi</th>
                </tr>
 
                {/* Spreadsheet-like Column Filtering inputs row */}
                <tr className="bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800">
                  <th className="bg-slate-100/50 dark:bg-slate-950/10"></th>
                  {showNoColumn && <th className="bg-slate-100/50 dark:bg-slate-950/10"></th>}
 
                  {sortedColumns.map((col) => (
                    <th key={col.key} className="w-56 px-2 py-1 bg-slate-100/50 dark:bg-slate-950/10">
                      <input
                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        value={columnFilters[col.key] || ''}
                        onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs p-1 px-1.5 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 font-medium text-slate-800 dark:text-slate-200"
                        placeholder="Filter..."
                      />
                    </th>
                  ))}
                  <th className="bg-slate-100/50 dark:bg-slate-950/10"></th>
                  <th className="bg-slate-100/50 dark:bg-slate-950/10"></th>
                  <th className="bg-slate-100/50 dark:bg-slate-950/10"></th>
                </tr>
              </thead>
 
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 select-none">
                {(loading || fetching) ? (
                  <tr>
                    <td colSpan={(showNoColumn ? 5 : 4) + columns.length} className="py-24 text-center bg-white dark:bg-slate-900">
                      <div className="flex flex-col items-center gap-3">
                        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memuat data agenda surat...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedMails.length === 0 ? (
                  <tr>
                    <td colSpan={(showNoColumn ? 5 : 4) + columns.length} className="py-24 text-center bg-white dark:bg-slate-900">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-lg font-bold text-slate-400 font-display">Tidak Ada Data Agenda</span>
                        <p className="text-sm text-slate-400 max-w-sm">Silakan buat surat baru atau impor file Excel data lama.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedMails.map((mail, idx) => {
                    const isSelectedForPreview = selectedMailForPreview?.id === mail.id;
                    const isChecked = selectedIds.includes(mail.id);
 
                    return (
                      <tr
                        key={mail.id}
                        onClick={() => onSelectForPreview(mail)}
                        className={`divide-x divide-slate-200 dark:divide-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer select-none group/row ${
                          isSelectedForPreview ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/40 dark:hover:bg-blue-950/20' : isChecked ? 'bg-slate-50/80 dark:bg-slate-800/30' : 'bg-white dark:bg-slate-900'
                        }`}
                      >
                        <td 
                          className="px-3 py-3 text-center"
                          onClick={(e) => e.stopPropagation()} // stop selecting row preview
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectRow(mail.id)}
                            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 w-4 h-4 cursor-pointer accent-blue-600 dark:accent-blue-500"
                          />
                        </td>
                        {showNoColumn && (
                          <td className="px-2 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                            {startIndex + idx + 1}
                          </td>
                        )}

                        {sortedColumns.map((col) => {
                          const val = mail.metadata?.[col.key];
                          return (
                            <td key={col.key} className="w-56 px-4 py-3 truncate max-w-[14rem] text-slate-700 dark:text-slate-300 font-medium text-xs">
                              {col.type === 'date' ? formatDateString(val) : val ?? '-'}
                            </td>
                          );
                        })}

                        {/* Operator/Penginput */}
                        <td className="w-40 px-4 py-3 truncate text-slate-700 dark:text-slate-300 font-medium text-xs">
                          <div className="flex items-center gap-1.5" title={mail.createdByName || 'Operator'}>
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                              {String(mail.createdByName || 'OP').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate">
                              {mail.createdByName || 'Operator'}
                            </span>
                          </div>
                        </td>

                        {/* File Attachment status */}
                        <td className="w-28 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {mail.pdfPath ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectForPreview(mail);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-800 dark:hover:text-emerald-200 transition-all active:scale-95"
                              title="Klik untuk Pratinjau PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat PDF</span>
                            </span>
                          ) : (
                            <div className="relative inline-flex">
                              <label className="flex items-center gap-1 px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold rounded-lg cursor-pointer transition-all">
                                {uploadingPdfId === mail.id ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Upload className="w-3 h-3" />
                                )}
                                <span>Unggah</span>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, mail.id)}
                                />
                              </label>
                            </div>
                          )}
                        </td>

                        {/* Edit, Download & Delete actions */}
                        <td className="w-32 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditMail(mail)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-all cursor-pointer"
                              title="Edit Surat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {mail.pdfPath ? (
                              <button
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = `/api/files/${mail.pdfPath}`;
                                  const originalName = mail.pdfPath.split('/').pop() || 'surat.pdf';
                                  a.download = originalName;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-350 rounded-lg transition-all cursor-pointer"
                                title="Unduh PDF Lampiran"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="p-1.5 text-slate-300 dark:text-slate-700 rounded-lg cursor-not-allowed"
                                title="Tidak ada lampiran PDF untuk diunduh"
                              >
                                <FileDown className="w-3.5 h-3.5 opacity-40" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteId(mail.id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                              title="Hapus Surat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer (Pagination controls) */}
          <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 select-none transition-colors duration-200">
            <div className="flex items-center gap-4">
              <span>Menampilkan <b>{startIndex + 1} - {Math.min(startIndex + pageSize, totalMailsCount)}</b> dari <b>{totalMailsCount}</b> surat</span>
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg p-1 px-1.5 focus:outline-none focus:border-blue-500 font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 select-none transition-all cursor-pointer"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-8 h-8 rounded-lg border font-semibold select-none transition-all cursor-pointer ${
                    pg === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 select-none transition-all cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floater Batch Actions Bar (Pill on bottom center of table content) */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-5 z-20"
          >
            <span className="text-xs font-bold text-slate-300 border-r border-slate-700 pr-4">
              {selectedIds.length} Surat Terpilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBatchReceipt(selectedIds)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs rounded-xl transition-all"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Cetak Tanda Terima</span>
              </button>
              <button
                onClick={() => onBatchZip(selectedIds)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Unduh PDF (.zip)</span>
              </button>
              <button
                onClick={() => {
                  setShowBatchDeleteConfirm(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900/80 border border-rose-900 font-semibold text-xs text-rose-300 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Massal</span>
              </button>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          EXCEL IMPORT DIALOG
          ========================================== */}
      <AnimatePresence>
        {showImportDialog && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-lg relative overflow-hidden transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Impor Agenda dari Excel
                </h3>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportErrors([]);
                    setImportSuccessCount(null);
                  }}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExcelImportSubmit} className="space-y-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Petunjuk Penggunaan Impor:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Gunakan templat struktur tabel Excel yang valid.</li>
                    <li>Kolom dinamis harus disesuaikan dengan skema kolom aktif saat ini.</li>
                  </ol>
                  <div className="pt-2">
                    <a
                      href="/api/excel/template"
                      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-450 font-bold hover:underline"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Unduh Templat Excel Aktif
                    </a>
                  </div>
                </div>

                {importSuccessCount !== null ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold text-center py-6">
                    Berhasil mengimpor {importSuccessCount} baris data agenda surat!
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-950/30 hover:bg-emerald-50/10 cursor-pointer transition-all relative">
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => setImportingFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {importingFile ? importingFile.name : 'Pilih atau seret berkas Excel ke sini'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Hanya mendukung format .xlsx atau .xls</span>
                    </div>

                    {importErrors.length > 0 && (
                      <div className="max-h-40 overflow-y-auto p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-700 dark:text-rose-400">
                          <FileWarning className="w-4 h-4 shrink-0" />
                          <span>Kesalahan Validasi Berkas ({importErrors.length}):</span>
                        </div>
                        {importErrors.map((err, idx) => (
                          <div key={idx} className="pl-5 relative text-rose-600 dark:text-rose-400">
                            <span className="absolute left-1">•</span>
                            {err}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowImportDialog(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={!importingFile || importLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-200 dark:shadow-none transition-all cursor-pointer"
                      >
                        {importLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Mulai Impor'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Custom Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onDeleteMail(deleteId);
          }
        }}
        title="Hapus Agenda Surat"
        message="Apakah Anda yakin ingin menghapus surat ini beserta lampirannya? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      <ConfirmModal
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={() => {
          selectedIds.forEach((id) => onDeleteMail(id));
          setSelectedIds([]);
        }}
        title="Hapus Massal Agenda"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} agenda surat terpilih beserta seluruh lampirannya?`}
        confirmText="Hapus Semua"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
