import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Columns, 
  Trash2, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  RefreshCw,
  Sparkles,
  Database,
  Sliders,
  Check,
  AlertCircle,
  Loader,
  GripVertical,
  Download,
  Upload,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppConfig, ColumnDefinition, ColumnType } from '../types';

interface SettingsProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
}

export default function Settings({ config, onUpdateConfig }: SettingsProps) {
  // General configs states
  const [appName, setAppName] = useState(config.appName);
  const [themeColor, setThemeColor] = useState(config.themeColor);
  const [autoCompressPdf, setAutoCompressPdf] = useState(config.autoCompressPdf);
  const [pdfCompressionLevel, setPdfCompressionLevel] = useState(config.pdfCompressionLevel);
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(config.maxUploadSizeMb);
  const [backupRetentionDays, setBackupRetentionDays] = useState(config.backupRetentionDays);
  const [showNoColumn, setShowNoColumn] = useState(config.showNoColumn !== false);
  
  // Columns schema state
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragAllowedKey, setDragAllowedKey] = useState<string | null>(null);

  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const reordered = [...columns];
    const draggedItem = reordered[draggedIdx];
    reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, draggedItem);
    const updated = reordered.map((col, i) => ({ ...col, order: i + 1 }));
    setColumns(updated);
    setDraggedIdx(null);
  };
  
  // Add new column dialog states
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColKey, setNewColKey] = useState('');
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [newColRequired, setNewColRequired] = useState(false);
  const [colError, setColError] = useState('');

  // Edit existing column states
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);
  const [editColLabel, setEditColLabel] = useState('');
  const [editColType, setEditColType] = useState<ColumnType>('text');
  const [editColRequired, setEditColRequired] = useState(false);
  const [editColError, setEditColError] = useState('');

  const handleStartEditColumn = (col: ColumnDefinition) => {
    setEditingColumn(col);
    setEditColLabel(col.label);
    setEditColType(col.type);
    setEditColRequired(col.required);
    setEditColError('');
  };

  const handleSaveEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    setEditColError('');

    if (!editColLabel.trim()) {
      setEditColError('Mohon isi judul kolom.');
      return;
    }

    const updatedCols = columns.map((col) => {
      if (col.key === editingColumn?.key) {
        return {
          ...col,
          label: editColLabel.trim(),
          type: editColType,
          required: editColRequired,
        };
      }
      return col;
    });

    setColumns(updatedCols);
    setEditingColumn(null);
    showNotification('Kolom berhasil diperbarui. Klik "Simpan Urutan & Skema" di bawah untuk menerapkan.');
  };

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingColumns, setSavingColumns] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/backup/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_database_agenda_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showNotification('Ekspor database berhasil diunduh!');
      } else {
        showNotification('Gagal mengunduh ekspor database.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi saat ekspor.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        showNotification('File backup tidak valid (Bukan format JSON).', 'error');
        setIsImporting(false);
        return;
      }

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        showNotification('Database berhasil dipulihkan dari backup!');
        if (window.location) {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        showNotification(errJson.error || 'Gagal memulihkan database dari backup.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi saat memulihkan database.', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/backup/clear', {
        method: 'POST',
      });
      if (res.ok) {
        showNotification('Seluruh data agenda surat dan berkas PDF berhasil dibersihkan!');
        setShowClearConfirm(false);
        if (window.location) {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        showNotification('Gagal membersihkan data.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi.', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  // Load config on init or change
  useEffect(() => {
    setAppName(config.appName);
    setThemeColor(config.themeColor);
    setAutoCompressPdf(config.autoCompressPdf);
    setPdfCompressionLevel(config.pdfCompressionLevel);
    setMaxUploadSizeMb(config.maxUploadSizeMb);
    setBackupRetentionDays(config.backupRetentionDays);
    setShowNoColumn(config.showNoColumn !== false);
    setColumns([...config.columns].sort((a, b) => a.order - b.order));
  }, [config]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      showNotification('Nama aplikasi tidak boleh kosong.', 'error');
      return;
    }

    setSavingGeneral(true);
    try {
      await onUpdateConfig({
        appName,
        themeColor,
        autoCompressPdf,
        pdfCompressionLevel,
        maxUploadSizeMb,
        backupRetentionDays,
        showNoColumn,
      });
      showNotification('Konfigurasi umum berhasil disimpan!');
    } catch (err) {
      showNotification('Gagal menyimpan konfigurasi.', 'error');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    setColError('');

    if (!newColLabel.trim()) {
      setColError('Mohon isi judul kolom.');
      return;
    }

    // Auto-generate key if not filled
    let generatedKey = newColKey.trim();
    if (!generatedKey) {
      generatedKey = newColLabel
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .map((word, idx) => {
          if (idx === 0) return word.toLowerCase();
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
    }

    if (!generatedKey) {
      setColError('Kunci kolom tidak valid. Harap gunakan judul kolom yang mengandung huruf atau angka.');
      return;
    }

    if (columns.some((col) => col.key.toLowerCase() === generatedKey.toLowerCase())) {
      setColError('Kolom dengan kunci atau label ini sudah terdaftar.');
      return;
    }

    const newCol: ColumnDefinition = {
      key: generatedKey,
      label: newColLabel.trim(),
      type: newColType,
      required: newColRequired,
      order: columns.length + 1,
    };

    const updatedCols = [...columns, newCol];
    setColumns(updatedCols);
    
    // Clear add col inputs
    setNewColKey('');
    setNewColLabel('');
    setNewColType('text');
    setNewColRequired(false);
    setShowAddCol(false);
    
    showNotification('Kolom baru ditambahkan. Klik "Simpan Urutan & Skema" untuk menerapkan.');
  };

  const handleDeleteColumn = (key: string) => {
    if (columns.length <= 1) {
      showNotification('Minimal harus menyisakan 1 kolom aktif.', 'error');
      return;
    }
    const filtered = columns.filter((col) => col.key !== key);
    // Recalculate orders
    const recalculated = filtered.map((col, idx) => ({ ...col, order: idx + 1 }));
    setColumns(recalculated);
    showNotification('Kolom dihapus. Klik "Simpan Urutan & Skema" di bawah untuk menerapkan.');
  };

  const handleMoveColumn = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === columns.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...columns];
    
    // Swap elements
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    // Re-assign orders
    const updated = reordered.map((col, i) => ({ ...col, order: i + 1 }));
    setColumns(updated);
  };

  const handleSaveColumnsSchema = async () => {
    setSavingColumns(true);
    try {
      await onUpdateConfig({ columns }); // sync parent state and save to DB
      showNotification('Skema dan urutan kolom berhasil disimpan dan diterapkan!');
    } catch (err) {
      showNotification('Gagal menyimpan skema kolom.', 'error');
    } finally {
      setSavingColumns(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden p-6 bg-slate-50 dark:bg-slate-950 gap-5 transition-colors duration-200">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm dark:shadow-none flex items-center justify-between shrink-0 transition-colors duration-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1">
            Pengaturan Sistem
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            White-label nama instansi, batasan berkas PDF, database backup, dan sesuaikan skema kolom spreadsheet dinamis.
          </p>
        </div>
      </div>

      {/* Main Form scrollable columns */}
      <div className="flex-1 flex gap-6 overflow-hidden relative">
        
        {/* Floating Notification Toast */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider ${
                statusType === 'success' ? 'bg-emerald-600 text-white shadow-emerald-100 dark:shadow-none' : 'bg-rose-600 text-white shadow-rose-100 dark:shadow-none'
              }`}
            >
              {statusType === 'success' ? <Check className="w-4.5 h-4.5" /> : <AlertCircle className="w-4.5 h-4.5" />}
              <span>{statusMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Column Left: General and Backup Configuration */}
        <div className="flex-1 overflow-y-auto space-y-6">
          <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-none space-y-5 transition-colors duration-200">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-4.5 h-4.5 text-blue-600" />
              Pengaturan Instansi & Berkas
            </h3>

            {/* Application Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Nama Aplikasi / Instansi
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                placeholder="Masukkan nama instansi"
              />
            </div>

            {/* Theme colors choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Warna Tema Utama Accent
              </label>
              <div className="flex items-center gap-3">
                {[
                  { value: '#2563eb', label: 'Biru Samudra', bg: 'bg-blue-600' },
                  { value: '#0d9488', label: 'Hijau Tosca', bg: 'bg-teal-600' },
                  { value: '#7c3aed', label: 'Ungu Lavender', bg: 'bg-violet-600' },
                  { value: '#db2777', label: 'Pink Cerise', bg: 'bg-pink-600' },
                  { value: '#475569', label: 'Slate Gray', bg: 'bg-slate-600' },
                ].map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setThemeColor(color.value)}
                    className={`w-9 h-9 rounded-full ${color.bg} border-2 relative transition-transform cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center text-white ${
                      themeColor === color.value ? 'border-slate-800 dark:border-white scale-105' : 'border-transparent'
                    }`}
                    title={color.label}
                  >
                    {themeColor === color.value && <Check className="w-4.5 h-4.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Max upload size */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Maksimum Ukuran PDF (MB)
                </label>
                <input
                  type="number"
                  value={maxUploadSizeMb}
                  onChange={(e) => setMaxUploadSizeMb(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  min={5}
                  max={200}
                />
              </div>

              {/* PDF Auto Compress switch */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Kompresi Unggah Otomatis
                </label>
                <div className="flex items-center gap-4 py-2.5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCompressPdf}
                      onChange={(e) => setAutoCompressPdf(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                    {autoCompressPdf ? 'Aktif (Rekomendasi)' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </div>

            {autoCompressPdf && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Level Kompresi Bawaan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPdfCompressionLevel(lvl)}
                      className={`py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        pdfCompressionLevel === lvl
                          ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lvl === 'low' ? 'Rendah' : lvl === 'medium' ? 'Sedang' : 'Tinggi'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row Number (No) sequence column toggle */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Tampilkan Kolom Nomor Urut Baris (No) di Agenda
              </label>
              <div className="flex items-center gap-4 py-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNoColumn}
                    onChange={(e) => setShowNoColumn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {showNoColumn ? 'Aktif (Tampilkan Kolom "No" di tabel)' : 'Sembunyikan Kolom "No"'}
                </span>
              </div>
            </div>

            {/* Save Button for general settings */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingGeneral}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {savingGeneral ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Backup Database info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-none space-y-5 transition-colors duration-200">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Database className="w-4.5 h-4.5 text-blue-600" />
              Sistem Database Backup & Pemulihan
            </h3>
            
            <div className="grid grid-cols-2 gap-4 pb-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Retensi Backup Otomatis (Hari)
                </label>
                <input
                  type="number"
                  value={backupRetentionDays}
                  onChange={(e) => setBackupRetentionDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  min={3}
                  max={90}
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  * Sistem akan otomatis menyalin file database utama dan menghapus file backup yang usang melebihi durasi hari simpan yang disetel.
                </span>
              </div>
            </div>

            {/* Manual actions area */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-4">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                Tindakan Pencadangan Manual
              </span>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">
                Ekspor data Anda ke file lokal, pulihkan data dari file cadangan sebelumnya, atau bersihkan seluruh database jika ingin memulai dari awal.
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Export Button */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportBackup}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50/50 dark:bg-blue-950/15 hover:bg-blue-50 dark:hover:bg-blue-950/25 border border-blue-100 dark:border-blue-900/30 rounded-2xl transition-all cursor-pointer text-blue-700 dark:text-blue-400 active:scale-95"
                >
                  {isExporting ? (
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                  ) : (
                    <Download className="w-5 h-5 mb-1.5" />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ekspor JSON</span>
                </button>

                {/* Import Button */}
                <label className="flex flex-col items-center justify-center p-4 bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-50 dark:hover:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl transition-all cursor-pointer text-emerald-700 dark:text-emerald-400 active:scale-95 text-center">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                    disabled={isImporting}
                  />
                  {isImporting ? (
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                  ) : (
                    <Upload className="w-5 h-5 mb-1.5" />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-wider">Impor JSON</span>
                </label>

                {/* Delete/Clear Button */}
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => setShowClearConfirm(true)}
                  className="flex flex-col items-center justify-center p-4 bg-rose-50/50 dark:bg-rose-950/15 hover:bg-rose-50 dark:hover:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 rounded-2xl transition-all cursor-pointer text-rose-700 dark:text-rose-450 active:scale-95"
                >
                  <Trash2 className="w-5 h-5 mb-1.5 text-rose-600 dark:text-rose-450" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Hapus Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column Right: Columns dynamic schema configuration & Drag-and-Drop ordering */}
        <div className="w-[480px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-none flex flex-col overflow-hidden shrink-0 transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <Columns className="w-4.5 h-4.5 text-blue-600" />
                Skema Kolom Dinamis
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                Seret gagang atau gunakan tombol untuk mengubah urutan kolom.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCol(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Kolom
            </button>
          </div>

          {/* Visually Reorderable Columns List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
            {columns.map((col, idx) => (
              <div
                key={col.key}
                draggable={dragAllowedKey === col.key}
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  handleDrop(idx);
                }}
                onDragEnd={() => setDraggedIdx(null)}
                className={`p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-900/50 transition-all select-none ${
                  draggedIdx === idx
                    ? 'opacity-40 border-dashed border-blue-400 bg-blue-50/20 dark:bg-blue-950/20 scale-95'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  {/* Drag Handle Icon */}
                  <div 
                    onMouseEnter={() => setDragAllowedKey(col.key)}
                    onMouseLeave={() => setDragAllowedKey(null)}
                    className="text-slate-450 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-grab active:cursor-grabbing p-1"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  {/* Up / Down Navigation Controls (Backup) */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveColumn(idx, 'up')}
                      className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded disabled:opacity-20 transition-all cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === columns.length - 1}
                      onClick={() => handleMoveColumn(idx, 'down')}
                      className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded disabled:opacity-20 transition-all cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="overflow-hidden flex-1">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate flex items-center gap-1.5">
                      {col.label}
                      {col.required && <span className="text-rose-500 font-semibold text-[10px]">(Wajib)</span>}
                    </h5>
                    <span className="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                      {col.type === 'date' ? 'Tanggal' : col.type === 'number' ? 'Angka' : 'Teks'} • Kunci: {col.key}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEditColumn(col)}
                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all cursor-pointer"
                    title="Edit Kolom"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteColumn(col.key)}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                    title="Hapus Kolom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit/Apply columns order change */}
          <button
            onClick={handleSaveColumnsSchema}
            disabled={savingColumns}
            className="w-full py-3 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {savingColumns ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Urutan & Skema</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ==========================================
          ADD NEW COLUMN DIALOG
          ========================================== */}
      <AnimatePresence>
        {showAddCol && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-200"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
              
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-1.5">
                <Columns className="w-5 h-5 text-blue-600" />
                Tambah Kolom Kustom Baru
              </h3>

              {colError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{colError}</span>
                </div>
              )}

              <form onSubmit={handleAddColumn} className="space-y-4">
                {/* Column Label */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Label Judul Kolom (Tampilan UI) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newColLabel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewColLabel(val);
                      const derived = val
                        .trim()
                        .replace(/[^a-zA-Z0-9\s]/g, '')
                        .split(/\s+/)
                        .map((word, idx) => {
                          if (idx === 0) return word.toLowerCase();
                          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                        })
                        .join('');
                      setNewColKey(derived);
                    }}
                    className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    placeholder="Contoh: Nomor Agenda"
                    required
                  />
                </div>

                {/* Column Key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Kunci Sistem (Terisi Otomatis)
                  </label>
                  <input
                    type="text"
                    value={newColKey}
                    onChange={(e) => setNewColKey(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full px-4.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-500 dark:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:text-slate-800 dark:focus:text-slate-200 transition-all"
                    placeholder="Auto-generated"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Digunakan secara internal untuk penyimpanan data. Terisi otomatis berdasarkan Judul Kolom.
                  </p>
                </div>

                {/* Column Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Tipe Data Inputan
                  </label>
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as ColumnType)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  >
                    <option value="text">Teks / Karakter</option>
                    <option value="date">Tanggal (Format Kalender)</option>
                    <option value="number">Angka / Angka Bulat</option>
                  </select>
                </div>

                {/* Column Required Check */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="required_check"
                    checked={newColRequired}
                    onChange={(e) => setNewColRequired(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <label htmlFor="required_check" className="text-xs font-bold text-slate-650 dark:text-slate-400 cursor-pointer">
                    Kolom Bersifat Wajib Diisi (Required)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCol(false);
                      setColError('');
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all cursor-pointer"
                  >
                    Tambahkan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear database warning confirmation modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-200 text-center text-slate-800 dark:text-slate-200"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600" />
              
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-450 mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-2">
                Hapus Seluruh Data Agenda?
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mb-6">
                Tindakan ini akan <strong className="text-rose-600 dark:text-rose-400 font-bold">menghapus secara permanen</strong> seluruh rekaman agenda surat masuk/keluar, skema kustom, dan seluruh file attachment PDF fisik dari server. Data yang terhapus tidak dapat dipulihkan!
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={handleClearDatabase}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-200 dark:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isClearing ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ya, Hapus Semua</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit existing column dialog modal */}
      <AnimatePresence>
        {editingColumn && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-200 text-left text-slate-850 dark:text-slate-200"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
              
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-1.5">
                <Columns className="w-5 h-5 text-blue-600" />
                Ubah / Edit Kolom
              </h3>

              {editColError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editColError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditColumn} className="space-y-4">
                {/* Column Label */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Label Judul Kolom (Tampilan UI) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editColLabel}
                    onChange={(e) => setEditColLabel(e.target.value)}
                    className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-850 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    placeholder="Contoh: Nomor Agenda"
                    required
                  />
                </div>

                {/* Column Key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Kunci Sistem (Tidak Dapat Diubah)
                  </label>
                  <input
                    type="text"
                    value={editingColumn.key}
                    disabled
                    className="w-full px-4.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Kunci sistem bersifat permanen untuk menjaga keselarasan database yang ada.
                  </p>
                </div>

                {/* Column Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Tipe Data Inputan
                  </label>
                  <select
                    value={editColType}
                    onChange={(e) => setEditColType(e.target.value as ColumnType)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-850 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  >
                    <option value="text">Teks / Karakter</option>
                    <option value="date">Tanggal (Format Kalender)</option>
                    <option value="number">Angka / Angka Bulat</option>
                  </select>
                </div>

                {/* Column Required Check */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="edit_required_check"
                    checked={editColRequired}
                    onChange={(e) => setEditColRequired(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <label htmlFor="edit_required_check" className="text-xs font-bold text-slate-650 dark:text-slate-400 cursor-pointer">
                    Kolom Bersifat Wajib Diisi (Required)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingColumn(null);
                      setEditColError('');
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
