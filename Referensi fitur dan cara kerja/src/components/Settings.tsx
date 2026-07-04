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
  Edit2,
  Mail,
  Building,
  Briefcase,
  FileText,
  Shield,
  Landmark,
  Award,
  BookOpen,
  GraduationCap,
  Star,
  Inbox,
  History,
  HardDrive,
  Server
} from 'lucide-react';

const SettingsLogoMap: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Inbox,
  Mail,
  Building,
  Briefcase,
  FileText,
  Shield,
  Landmark,
  Award,
  BookOpen,
  GraduationCap,
  Star
};
import { motion, AnimatePresence } from 'motion/react';
import { AppConfig, ColumnDefinition, ColumnType, ColumnProfile } from '../types';

interface SettingsProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
}

export default function Settings({ config, onUpdateConfig }: SettingsProps) {
  // General configs states
  const [appName, setAppName] = useState(config.appName);
  const [logoType, setLogoType] = useState<'lucide' | 'emoji' | 'image'>(config.logoType || 'lucide');
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || 'Sparkles');
  const [themeColor, setThemeColor] = useState(config.themeColor);
  const [autoCompressPdf, setAutoCompressPdf] = useState(config.autoCompressPdf);
  const [pdfCompressionLevel, setPdfCompressionLevel] = useState(config.pdfCompressionLevel);
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(config.maxUploadSizeMb);
  const [backupRetentionDays, setBackupRetentionDays] = useState(config.backupRetentionDays);
  const [showNoColumn, setShowNoColumn] = useState(config.showNoColumn !== false);
  const [startNo, setStartNo] = useState(config.startNo || 1);
  const [autoRenamePdf, setAutoRenamePdf] = useState(config.autoRenamePdf !== false);
  
  // Columns schema state
  const [columns, setColumns] = useState<ColumnDefinition[]>(() => {
    return [...config.columns].sort((a, b) => a.order - b.order);
  });
  const [pdfRenameCols, setPdfRenameCols] = useState<string[]>(() => {
    const sortedCols = [...config.columns].sort((a, b) => a.order - b.order);
    let colsToUse = config.pdfRenameCols;
    if (!colsToUse) {
      return sortedCols.slice(0, 3).map(c => c.key);
    }
    colsToUse = colsToUse.filter(k => sortedCols.some(c => c.key === k));
    return colsToUse.length > 0 ? colsToUse : sortedCols.slice(0, 3).map(c => c.key);
  });
  
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragAllowedKey, setDragAllowedKey] = useState<string | null>(null);

  // Live preview effect for theme color choices
  useEffect(() => {
    if (!themeColor) return;
    const themeColorMap: Record<string, { base: string; hover: string; light: string; border: string; darkBg: string }> = {
      '#2563eb': {
        base: '#2563eb',
        hover: '#1d4ed8',
        light: 'rgba(37, 99, 235, 0.08)',
        border: 'rgba(37, 99, 235, 0.15)',
        darkBg: 'rgba(37, 99, 235, 0.2)'
      },
      '#0d9488': {
        base: '#0d9488',
        hover: '#0f766e',
        light: 'rgba(13, 148, 136, 0.08)',
        border: 'rgba(13, 148, 136, 0.15)',
        darkBg: 'rgba(13, 148, 136, 0.2)'
      },
      '#7c3aed': {
        base: '#7c3aed',
        hover: '#6d28d9',
        light: 'rgba(124, 58, 237, 0.08)',
        border: 'rgba(124, 58, 237, 0.15)',
        darkBg: 'rgba(124, 58, 237, 0.2)'
      },
      '#db2777': {
        base: '#db2777',
        hover: '#be185d',
        light: 'rgba(219, 39, 119, 0.08)',
        border: 'rgba(219, 39, 119, 0.15)',
        darkBg: 'rgba(219, 39, 119, 0.2)'
      },
      '#475569': {
        base: '#475569',
        hover: '#334155',
        light: 'rgba(71, 85, 105, 0.08)',
        border: 'rgba(71, 85, 105, 0.15)',
        darkBg: 'rgba(71, 85, 105, 0.2)'
      }
    };

    const colors = themeColorMap[themeColor] || {
      base: themeColor,
      hover: themeColor,
      light: `${themeColor}14`,
      border: `${themeColor}26`,
      darkBg: `${themeColor}33`
    };

    const root = document.documentElement;
    root.style.setProperty('--theme-base', colors.base);
    root.style.setProperty('--theme-hover', colors.hover);
    root.style.setProperty('--theme-light', colors.light);
    root.style.setProperty('--theme-light-border', colors.border);
    root.style.setProperty('--theme-dark-bg', colors.darkBg);
  }, [themeColor]);

  // Column profiles states
  const [columnProfiles, setColumnProfiles] = useState<ColumnProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

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
  const [newColIncludeInReceipt, setNewColIncludeInReceipt] = useState(true);
  const [colError, setColError] = useState('');

  // Edit existing column states
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);
  const [editColLabel, setEditColLabel] = useState('');
  const [editColType, setEditColType] = useState<ColumnType>('text');
  const [editColRequired, setEditColRequired] = useState(false);
  const [editColIncludeInReceipt, setEditColIncludeInReceipt] = useState(true);
  const [editColError, setEditColError] = useState('');

  const handleStartEditColumn = (col: ColumnDefinition) => {
    setEditingColumn(col);
    setEditColLabel(col.label);
    setEditColType(col.type);
    setEditColRequired(col.required);
    setEditColIncludeInReceipt(col.includeInReceipt !== false);
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
          includeInReceipt: editColIncludeInReceipt,
        };
      }
      return col;
    });

    setColumns(updatedCols);
    setEditingColumn(null);
    showNotification('Kolom berhasil diperbarui. Klik "Simpan Pengaturan" di bawah untuk menerapkan.');
  };

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Local backups list states
  interface BackupFile {
    filename: string;
    sizeBytes: number;
    createdAt: string;
    label: string;
    isAuto: boolean;
    isManual: boolean;
    isPreRestore: boolean;
    isZip?: boolean;
  }
  const [localBackups, setLocalBackups] = useState<BackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingLocalBackup, setIsCreatingLocalBackup] = useState(false);
  const [includePdfInLocalBackup, setIncludePdfInLocalBackup] = useState(true);
  const [isRestoringLocal, setIsRestoringLocal] = useState<string | null>(null);
  const [isDeletingLocal, setIsDeletingLocal] = useState<string | null>(null);
  const [backupConfirmAction, setBackupConfirmAction] = useState<{
    type: 'restore' | 'delete';
    filename: string;
  } | null>(null);

  const fetchLocalBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const res = await fetch('/api/backup/list');
      if (res.ok) {
        const data = await res.json();
        setLocalBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Error fetching backups list:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Integrity check and cleanup states
  interface IntegrityStats {
    totalMails: number;
    totalMailsWithPdf: number;
    totalPdfsOnDisk: number;
    orphanCount: number;
    missingCount: number;
    totalSizeOrphans: number;
  }
  interface OrphanFile {
    path: string;
    sizeBytes: number;
    createdAt: string;
  }
  interface MissingFile {
    mailId: string;
    noSurat: string;
    perihal: string;
    tanggalSurat: string;
    pdfPath: string;
  }
  interface IntegrityReport {
    stats: IntegrityStats;
    orphans: OrphanFile[];
    missing: MissingFile[];
  }

  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [isCleaningIntegrity, setIsCleaningIntegrity] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCheckIntegrity = async () => {
    setIsCheckingIntegrity(true);
    try {
      const res = await fetch('/api/backup/integrity');
      if (res.ok) {
        const data = await res.json();
        setIntegrityReport(data);
        showNotification('Pemeriksaan integritas basis data & file lampiran selesai.');
      } else {
        showNotification('Gagal memeriksa integritas sistem.', 'error');
      }
    } catch (err: any) {
      console.error('Error checking integrity:', err);
      showNotification('Gagal memeriksa integritas sistem.', 'error');
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const handleCleanupIntegrity = async () => {
    setIsCleaningIntegrity(true);
    try {
      const res = await fetch('/api/backup/integrity/cleanup', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Pembersihan selesai! Berhasil menghapus ${data.deletedCount} file lampiran sampah dan membebaskan ${formatSize(data.reclaimedBytes)}.`);
        // Re-run check to refresh stats
        const checkRes = await fetch('/api/backup/integrity');
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setIntegrityReport(checkData);
        }
      } else {
        showNotification('Gagal melakukan pembersihan file lampiran sampah.', 'error');
      }
    } catch (err: any) {
      console.error('Error cleaning integrity:', err);
      showNotification('Gagal melakukan pembersihan file lampiran sampah.', 'error');
    } finally {
      setIsCleaningIntegrity(false);
    }
  };

  const [isReconstructing, setIsReconstructing] = useState(false);

  const handleReconstructDatabase = async () => {
    setIsReconstructing(true);
    try {
      const res = await fetch('/api/backup/integrity/reconstruct', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(data.message);
        // Re-run integrity check to see updated stats
        const checkRes = await fetch('/api/backup/integrity');
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setIntegrityReport(checkData);
        }
      } else {
        showNotification('Gagal merekonstruksi database.', 'error');
      }
    } catch (err: any) {
      console.error('Error reconstructing database:', err);
      showNotification('Gagal merekonstruksi database.', 'error');
    } finally {
      setIsReconstructing(false);
    }
  };

  const handleCreateLocalBackup = async () => {
    setIsCreatingLocalBackup(true);
    try {
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ includePdf: includePdfInLocalBackup }),
      });
      if (res.ok) {
        const result = await res.json();
        showNotification(result.isZip 
          ? 'Pencadangan manual lengkap (Database + PDF) berhasil disimpan di server!'
          : 'Pencadangan database manual (JSON) berhasil disimpan di server!'
        );
        fetchLocalBackups();
      } else {
        showNotification('Gagal membuat pencadangan manual.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi.', 'error');
    } finally {
      setIsCreatingLocalBackup(false);
    }
  };

  const handleRestoreLocalBackup = (filename: string) => {
    setBackupConfirmAction({ type: 'restore', filename });
  };

  const executeRestoreLocalBackup = async (filename: string) => {
    setIsRestoringLocal(filename);
    try {
      const res = await fetch('/api/backup/restore-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      if (res.ok) {
        const result = await res.json();
        showNotification(result.message || 'Sistem berhasil dipulihkan dari berkas cadangan!');
        if (window.location) {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        showNotification(errJson.message || 'Gagal memulihkan database dari berkas cadangan.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi.', 'error');
    } finally {
      setIsRestoringLocal(null);
    }
  };

  const handleDeleteLocalBackup = (filename: string) => {
    setBackupConfirmAction({ type: 'delete', filename });
  };

  const executeDeleteLocalBackup = async (filename: string) => {
    setIsDeletingLocal(filename);
    try {
      const res = await fetch(`/api/backup/delete/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('Berkas cadangan berhasil dihapus.');
        fetchLocalBackups();
      } else {
        showNotification('Gagal menghapus berkas cadangan.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi.', 'error');
    } finally {
      setIsDeletingLocal(null);
    }
  };

  useEffect(() => {
    fetchLocalBackups();
  }, []);

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
        showNotification('Ekspor database JSON berhasil diunduh!');
      } else {
        showNotification('Gagal mengunduh ekspor database.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi saat ekspor.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBackupZip = async () => {
    setIsExportingZip(true);
    try {
      const res = await fetch('/api/backup/export-zip');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_lengkap_agenda_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showNotification('Ekspor paket lengkap (Database + PDF) berhasil diunduh!');
      } else {
        showNotification('Gagal mengunduh paket pencadangan lengkap.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan koneksi saat ekspor paket lengkap.', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      if (file.name.endsWith('.zip')) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await fetch('/api/backup/import-zip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/zip',
          },
          body: arrayBuffer,
        });

        if (res.ok) {
          const result = await res.json();
          showNotification(result.message || 'Sistem berhasil dipulihkan dari berkas ZIP cadangan!');
          if (window.location) {
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          showNotification(errJson.message || 'Gagal memulihkan dari berkas ZIP.', 'error');
        }
      } else {
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
    setLogoType(config.logoType || 'lucide');
    setLogoUrl(config.logoUrl || 'Sparkles');
    setThemeColor(config.themeColor);
    setAutoCompressPdf(config.autoCompressPdf);
    setPdfCompressionLevel(config.pdfCompressionLevel);
    setMaxUploadSizeMb(config.maxUploadSizeMb);
    setBackupRetentionDays(config.backupRetentionDays);
    setShowNoColumn(config.showNoColumn !== false);
    setStartNo(config.startNo || 1);
    setAutoRenamePdf(config.autoRenamePdf !== false);

    const sortedCols = [...config.columns].sort((a, b) => a.order - b.order);
    setColumns(sortedCols);

    // Filter loaded columns to only keep valid ones, or default to the first 3
    let colsToUse = config.pdfRenameCols;
    if (!colsToUse) {
      colsToUse = sortedCols.slice(0, 3).map(c => c.key);
    } else {
      colsToUse = colsToUse.filter(k => sortedCols.some(c => c.key === k));
      if (colsToUse.length === 0) {
        colsToUse = sortedCols.slice(0, 3).map(c => c.key);
      }
    }
    setPdfRenameCols(colsToUse);

    const initialDefault: ColumnProfile = {
      id: 'default',
      name: 'Profil Default',
      columns: [...config.columns],
      isDefault: true,
    };
    const profiles = config.columnProfiles && config.columnProfiles.length > 0
      ? config.columnProfiles
      : [initialDefault];
    setColumnProfiles(profiles);
    setActiveProfileId(config.activeProfileId || 'default');
  }, [config]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSaveAllSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!appName.trim()) {
      showNotification('Nama aplikasi tidak boleh kosong.', 'error');
      return;
    }

    setSaving(true);
    try {
      // Update columns state inside the active profile as well
      const updatedProfiles = columnProfiles.map((p) => {
        if (p.id === activeProfileId) {
          return { ...p, columns };
        }
        return p;
      });

      setColumnProfiles(updatedProfiles);

      await onUpdateConfig({
        appName,
        logoType,
        logoUrl,
        themeColor,
        autoCompressPdf,
        pdfCompressionLevel,
        maxUploadSizeMb,
        backupRetentionDays,
        showNoColumn,
        startNo,
        autoRenamePdf,
        pdfRenameCols,
        columns,
        columnProfiles: updatedProfiles,
        activeProfileId,
      });
      showNotification('Semua pengaturan sistem berhasil disimpan!');
    } catch (err) {
      showNotification('Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSaving(false);
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
      includeInReceipt: newColIncludeInReceipt,
    };

    const updatedCols = [...columns, newCol];
    setColumns(updatedCols);
    
    // Clear add col inputs
    setNewColKey('');
    setNewColLabel('');
    setNewColType('text');
    setNewColRequired(false);
    setNewColIncludeInReceipt(true);
    setShowAddCol(false);
    
    showNotification('Kolom baru ditambahkan. Klik "Simpan Pengaturan" untuk menerapkan.');
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
    showNotification('Kolom dihapus. Klik "Simpan Pengaturan" di bawah untuk menerapkan.');
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

  const handleSelectProfile = (profileId: string) => {
    const prof = columnProfiles.find((p) => p.id === profileId);
    if (prof) {
      setActiveProfileId(profileId);
      setColumns([...prof.columns].sort((a, b) => a.order - b.order));
      showNotification(`Profil "${prof.name}" dimuat. Klik "Simpan Pengaturan" di bawah untuk mengaktifkan.`);
    }
  };

  const handleSaveAsNewProfile = (name: string) => {
    if (!name.trim()) {
      showNotification('Nama profil tidak boleh kosong.', 'error');
      return;
    }

    const newId = `profile_${Date.now()}`;
    const newProfile: ColumnProfile = {
      id: newId,
      name: name.trim(),
      columns: [...columns],
      isDefault: false,
    };

    const updatedProfiles = [...columnProfiles, newProfile];
    setColumnProfiles(updatedProfiles);
    setActiveProfileId(newId);
    setShowSaveProfileModal(false);
    setNewProfileName('');

    onUpdateConfig({
      columns: columns,
      columnProfiles: updatedProfiles,
      activeProfileId: newId,
    })
      .then(() => {
        showNotification(`Profil "${newProfile.name}" berhasil disimpan dan diterapkan!`);
      })
      .catch(() => {
        showNotification('Gagal menyimpan profil baru.', 'error');
      });
  };

  const handleDeleteProfile = (profileId: string) => {
    const prof = columnProfiles.find((p) => p.id === profileId);
    if (!prof) return;

    if (prof.isDefault) {
      showNotification('Profil Default tidak dapat dihapus.', 'error');
      return;
    }

    const updatedProfiles = columnProfiles.filter((p) => p.id !== profileId);
    // Find default profile
    const defaultProf = updatedProfiles.find((p) => p.isDefault) || updatedProfiles[0];
    const nextActiveId = defaultProf ? defaultProf.id : 'default';
    const nextColumns = defaultProf ? defaultProf.columns : columns;

    setColumnProfiles(updatedProfiles);
    setActiveProfileId(nextActiveId);
    setColumns([...nextColumns].sort((a, b) => a.order - b.order));

    onUpdateConfig({
      columns: nextColumns,
      columnProfiles: updatedProfiles,
      activeProfileId: nextActiveId,
    })
      .then(() => {
        showNotification(`Profil "${prof.name}" berhasil dihapus.`);
      })
      .catch(() => {
        showNotification('Gagal menghapus profil.', 'error');
      });
  };

  const handleSetAsDefaultProfile = () => {
    const updatedProfiles = columnProfiles.map((p) => ({
      ...p,
      isDefault: p.id === activeProfileId,
    }));

    setColumnProfiles(updatedProfiles);

    onUpdateConfig({
      columnProfiles: updatedProfiles,
      activeProfileId: activeProfileId,
      columns: columns,
    })
      .then(() => {
        showNotification('Profil saat ini diatur sebagai Profil Default.');
      })
      .catch(() => {
        showNotification('Gagal mengatur profil default.', 'error');
      });
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
          <form onSubmit={handleSaveAllSettings} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-none space-y-5 transition-colors duration-200">
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

            {/* Logo Customization */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Logo / Icon Aplikasi
              </label>
              
              {/* Type Selection Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                {(['lucide', 'emoji', 'image'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setLogoType(type);
                      if (type === 'lucide') setLogoUrl('Sparkles');
                      else if (type === 'emoji') setLogoUrl('📬');
                      else if (type === 'image') setLogoUrl('');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      logoType === type
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {type === 'lucide' ? 'Icon Lucide' : type === 'emoji' ? 'Emoji' : 'URL Gambar'}
                  </button>
                ))}
              </div>

              {/* Type: Lucide Grid */}
              {logoType === 'lucide' && (
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih Icon Lucide:
                  </span>
                  <div className="grid grid-cols-6 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {Object.keys(SettingsLogoMap).map((key) => {
                      const IconComp = SettingsLogoMap[key];
                      const isSelected = logoUrl === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setLogoUrl(key)}
                          style={{
                            color: isSelected ? 'var(--theme-base, #2563eb)' : '',
                            backgroundColor: isSelected ? 'var(--theme-light, rgba(37, 99, 235, 0.08))' : '',
                            borderColor: isSelected ? 'var(--theme-light-border, rgba(37, 99, 235, 0.15))' : 'transparent'
                          }}
                          className={`p-3 border rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 ${
                            isSelected 
                              ? 'shadow-sm' 
                              : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-850 text-slate-500'
                          }`}
                          title={key}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Type: Emoji & Quick select */}
              {logoType === 'emoji' && (
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tulis atau Pilih Emoji:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value.substring(0, 4))}
                      className="w-20 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xl focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
                      placeholder="📬"
                    />
                    
                    {/* Quick Select Emoji Buttons */}
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      {['📬', '🏛️', '🏢', '📂', '📄', '✉️', '💼', '🎓', '🔥', '⭐️', '🎯', '🚀'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setLogoUrl(em)}
                          className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all ${
                            logoUrl === em ? 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 scale-105' : ''
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type: Image URL */}
              {logoType === 'image' && (
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Masukkan URL Gambar / Logo PNG / SVG:
                  </span>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    placeholder="https://example.com/logo.png"
                  />
                  {logoUrl && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-slate-200">
                        <img 
                          src={logoUrl} 
                          alt="Pratinjau" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">Pratinjau logo eksternal</span>
                    </div>
                  )}
                </div>
              )}
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

            {/* PDF Auto Rename Section */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Penamaan Berkas PDF Otomatis</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Secara otomatis mengganti nama berkas PDF yang diunggah berdasarkan nilai kolom sistem.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRenamePdf}
                    onChange={(e) => setAutoRenamePdf(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {autoRenamePdf && (
                <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pilih Kolom Untuk Membentuk Nama File (Dihubungkan dengan tanda hubung "-"):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {columns.map((col) => {
                      const isChecked = pdfRenameCols.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setPdfRenameCols(pdfRenameCols.filter((k) => k !== col.key));
                              } else {
                                setPdfRenameCols([...pdfRenameCols, col.key]);
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                          />
                          <span>{col.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {pdfRenameCols.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Format Penamaan Terpilih:
                      </span>
                      <p className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold overflow-x-auto whitespace-nowrap">
                        {pdfRenameCols.map(k => {
                          const matchedCol = columns.find(c => c.key === k);
                          return matchedCol ? `[${matchedCol.label}]` : `[${k}]`;
                        }).join('-')}.pdf
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        Peringatan: Tidak ada kolom yang dipilih. Nama file asli dari file yang diunggah akan digunakan sebagai gantinya.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

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

              {showNoColumn && (
                <div className="mt-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nomor Urut Mulai Dari (Awal Baris)
                  </label>
                  <input
                    type="number"
                    value={startNo}
                    onChange={(e) => setStartNo(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                    min={1}
                    placeholder="Contoh: 1, 100, 500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Menentukan nomor urut awal untuk baris pertama pada tabel agenda dan ekspor Excel.
                  </p>
                </div>
              )}
            </div>

            {/* Save Button for general settings */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {saving ? (
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-none space-y-6 transition-colors duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-blue-600" />
                Sistem Database Backup & Pemulihan
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Aktif</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Retensi Backup Otomatis (Hari)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={backupRetentionDays}
                    onChange={(e) => setBackupRetentionDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    min={3}
                    max={90}
                  />
                  <span className="inline-flex items-center px-3 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500">HARI</span>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  * Sistem secara otomatis melakukan pencadangan otomatis (auto-backup) secara terjadwal dan menghapus file cadangan usang yang melebihi batas hari retensi.
                </span>
              </div>
            </div>

            {/* Manual Backup Options */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includePdfInLocalBackup}
                  onChange={(e) => setIncludePdfInLocalBackup(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-wider">
                    Sertakan File PDF Lampiran
                  </span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed mt-0.5">
                    Jika dicentang, file pencadangan akan dibuat dalam format <strong>ZIP</strong> lengkap berisi data database JSON dan seluruh file lampiran PDF surat. Jika tidak dicentang, hanya database JSON yang dicadangkan.
                  </span>
                </div>
              </label>
            </div>

            {/* Quick Manual Actions Panel */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-850 space-y-4">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                Tindakan Cepat & Transfer Data
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Manual Local Backup Creation */}
                <button
                  type="button"
                  disabled={isCreatingLocalBackup}
                  onClick={handleCreateLocalBackup}
                  className="flex flex-col items-center justify-center p-3.5 bg-blue-50/50 dark:bg-blue-950/15 hover:bg-blue-50 dark:hover:bg-blue-950/25 border border-blue-100 dark:border-blue-900/30 rounded-2xl transition-all cursor-pointer text-blue-700 dark:text-blue-400 active:scale-95"
                  title="Buat file cadangan baru langsung di server lokal"
                >
                  {isCreatingLocalBackup ? (
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                  ) : (
                    <Server className="w-5 h-5 mb-1.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-center">
                    {includePdfInLocalBackup ? 'Buat ZIP + PDF' : 'Buat JSON DB'}
                  </span>
                </button>

                {/* Export Button (JSON) */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportBackup}
                  className="flex flex-col items-center justify-center p-3.5 bg-indigo-50/50 dark:bg-indigo-950/15 hover:bg-indigo-50 dark:hover:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl transition-all cursor-pointer text-indigo-700 dark:text-indigo-400 active:scale-95"
                  title="Unduh database utama saat ini ke komputer Anda sebagai JSON"
                >
                  {isExporting ? (
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                  ) : (
                    <Download className="w-5 h-5 mb-1.5 text-indigo-600 dark:text-indigo-450" />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-center">Ekspor JSON</span>
                </button>

                {/* Export Button (ZIP with PDFs) */}
                <button
                  type="button"
                  disabled={isExportingZip}
                  onClick={handleExportBackupZip}
                  className="flex flex-col items-center justify-center p-3.5 bg-purple-50/50 dark:bg-purple-950/15 hover:bg-purple-50 dark:hover:bg-purple-950/25 border border-purple-100 dark:border-purple-900/30 rounded-2xl transition-all cursor-pointer text-purple-700 dark:text-purple-400 active:scale-95"
                  title="Unduh paket backup lengkap (Database + semua PDF lampiran) ke komputer Anda sebagai ZIP"
                >
                  {isExportingZip ? (
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                  ) : (
                    <Download className="w-5 h-5 mb-1.5 text-purple-600 dark:text-purple-450" />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-center">Ekspor ZIP + PDF</span>
                </button>

                {/* Import Button */}
                <label className="flex flex-col items-center justify-center p-3.5 bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-50 dark:hover:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl transition-all cursor-pointer text-emerald-700 dark:text-emerald-400 active:scale-95 text-center" title="Unggah berkas JSON atau ZIP ekspor Anda untuk memulihkan seluruh data">
                  <input
                    type="file"
                    accept=".json,.zip"
                    onChange={handleImportBackup}
                    className="hidden"
                    disabled={isImporting}
                  />
                  {isImporting ? (
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                  ) : (
                    <Upload className="w-5 h-5 mb-1.5 text-emerald-600 dark:text-emerald-450" />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-center">Impor file</span>
                </label>

                {/* Delete/Clear Button */}
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => setShowClearConfirm(true)}
                  className="flex flex-col items-center justify-center p-3.5 bg-rose-50/50 dark:bg-rose-950/15 hover:bg-rose-50 dark:hover:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 rounded-2xl transition-all cursor-pointer text-rose-700 dark:text-rose-450 active:scale-95 text-center"
                  title="DANGEROUS: Kosongkan database utama dan seluruh lampiran PDF"
                >
                  <Trash2 className="w-5 h-5 mb-1.5 text-rose-600 dark:text-rose-450" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-center">Hapus Data</span>
                </button>
              </div>
            </div>

            {/* System Integrity & Cleanup */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider">
                    Verifikasi Integritas & Pembersihan Lampiran
                  </span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed mt-0.5">
                    Periksa keselarasan database dengan file PDF fisik, bersihkan file sampah yang tidak terpakai, dan deteksi file yang hilang.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckIntegrity}
                  disabled={isCheckingIntegrity}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl cursor-pointer transition-colors shrink-0"
                >
                  {isCheckingIntegrity ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Periksa Integritas
                </button>
              </div>

              {integrityReport && (
                <div className="mt-3 space-y-3 animate-fadeIn">
                  {/* Status Indicator */}
                  {integrityReport.stats.orphanCount === 0 && integrityReport.stats.missingCount === 0 ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3">
                      <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-450 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Sistem 100% Selaras (Sehat)</h4>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium leading-relaxed mt-0.5">
                          Semua file lampiran terverifikasi aman. Tidak ditemukan berkas sampah atau dokumen yang hilang dari server.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-650 dark:text-amber-450 shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-amber-850 dark:text-amber-400 font-semibold">Tindakan Diperlukan</h4>
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium leading-relaxed mt-0.5">
                            Ditemukan {integrityReport.stats.orphanCount} berkas sampah tidak terpakai dan {integrityReport.stats.missingCount} file lampiran surat yang terputus/hilang.
                          </p>
                        </div>
                      </div>
                      {integrityReport.stats.orphanCount > 0 && (
                        <button
                          type="button"
                          onClick={handleCleanupIntegrity}
                          disabled={isCleaningIntegrity}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-450 rounded-xl cursor-pointer transition-colors shadow-sm self-end sm:self-auto shrink-0"
                        >
                          {isCleaningIntegrity ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Bersihkan {integrityReport.stats.orphanCount} File Sampah
                        </button>
                      )}
                    </div>
                  )}

                  {/* Stats Bento Grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
                      <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Total Surat</span>
                      <span className="block text-sm font-extrabold text-slate-750 dark:text-slate-200 mt-1">
                        {integrityReport.stats.totalMails}
                      </span>
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-550 mt-0.5 uppercase tracking-wider">
                        {integrityReport.stats.totalMailsWithPdf} Lampiran
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
                      <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">File Sampah (Orphan)</span>
                      <span className={`block text-sm font-extrabold mt-1 ${integrityReport.stats.orphanCount > 0 ? 'text-amber-600 dark:text-amber-450' : 'text-slate-750 dark:text-slate-200'}`}>
                        {integrityReport.stats.orphanCount} File
                      </span>
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-550 mt-0.5 uppercase tracking-wider">
                        {formatSize(integrityReport.stats.totalSizeOrphans)} Sampah
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl">
                      <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">File Hilang (Missing)</span>
                      <span className={`block text-sm font-extrabold mt-1 ${integrityReport.stats.missingCount > 0 ? 'text-rose-650 dark:text-rose-450' : 'text-slate-750 dark:text-slate-200'}`}>
                        {integrityReport.stats.missingCount} File
                      </span>
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-550 mt-0.5 uppercase tracking-wider">
                        Perlu Perhatian
                      </span>
                    </div>
                  </div>

                  {/* Database Reconstruction Card */}
                  <div className="p-3.5 bg-blue-50/25 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-bold text-blue-750 dark:text-blue-400 uppercase tracking-wider">
                          Rekonstruksi Basis Data dari PDF
                        </span>
                        <span className="block text-[9px] text-slate-450 dark:text-slate-500 font-medium leading-relaxed">
                          Jika file database (JSON) terhapus atau rusak, fitur ini akan membaca file metadata sidecar fisik (.pdf.json) yang tersisa di folder penyimpanan server dan memulihkan daftar surat ke database secara aman.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleReconstructDatabase}
                        disabled={isReconstructing}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 rounded-xl cursor-pointer transition-colors shadow-sm self-end sm:self-auto shrink-0"
                      >
                        {isReconstructing ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Database className="w-3.5 h-3.5" />
                        )}
                        Pulihkan Data
                      </button>
                    </div>
                  </div>

                  {/* Missing Files Detail */}
                  {integrityReport.missing.length > 0 && (
                    <div className="p-3 bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100/50 dark:border-rose-950/20 rounded-2xl space-y-2">
                      <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-450 uppercase tracking-wider">
                        Daftar Surat Dengan Lampiran Hilang / Terputus ({integrityReport.missing.length})
                      </span>
                      <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5 divide-y divide-rose-100/30 dark:divide-rose-950/15">
                        {integrityReport.missing.map((item, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 text-[10px] font-medium text-slate-650 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="truncate">
                              <span className="font-bold text-slate-800 dark:text-slate-300">[{item.noSurat}]</span> {item.perihal}
                            </div>
                            <div className="text-[9px] text-rose-500 dark:text-rose-450 font-semibold font-mono truncate max-w-[200px]" title={item.pdfPath}>
                              {item.pdfPath.split('/').pop()} (Tidak ada di disk)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orphan Files Detail */}
                  {integrityReport.orphans.length > 0 && (
                    <div className="p-3 bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/20 rounded-2xl space-y-2">
                      <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-450 uppercase tracking-wider">
                        Daftar Berkas PDF Sampah di Server ({integrityReport.orphans.length})
                      </span>
                      <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5 divide-y divide-amber-100/30 dark:divide-amber-950/15">
                        {integrityReport.orphans.map((item, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 text-[10px] font-medium text-slate-650 dark:text-slate-400 flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-slate-500 dark:text-slate-550" title={item.path}>
                              {item.path.split('/').slice(2).join('/')}
                            </span>
                            <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold shrink-0">
                              {formatSize(item.sizeBytes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of Backup Files stored on server */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                    Daftar Riwayat Cadangan di Server
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full">
                    {localBackups.length} Berkas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchLocalBackups}
                  disabled={isLoadingBackups}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  Segarkan
                </button>
              </div>

              {isLoadingBackups ? (
                <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Memuat riwayat cadangan...</span>
                </div>
              ) : localBackups.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-950/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1.5">
                  <History className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Belum ada file cadangan di server</span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 max-w-xs leading-relaxed">
                    Cadangan otomatis akan dibuat secara harian, atau Anda bisa menekan tombol <strong>Buat Backup</strong> untuk mencadangkannya instan.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800/85 rounded-2xl overflow-hidden bg-slate-50/30 dark:bg-slate-950/5 divide-y divide-slate-100 dark:divide-slate-850 max-h-72 overflow-y-auto custom-scrollbar">
                  {localBackups.map((backup) => {
                    const isRestoringThis = isRestoringLocal === backup.filename;
                    const isDeletingThis = isDeletingLocal === backup.filename;
                    
                    const formatBytes = (bytes: number, decimals = 2) => {
                      if (bytes === 0) return '0 Bytes';
                      const k = 1024;
                      const dm = decimals < 0 ? 0 : decimals;
                      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                      const i = Math.floor(Math.log(bytes) / Math.log(k));
                      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
                    };

                    const formatBackupDate = (isoString: string) => {
                      try {
                        const date = new Date(isoString);
                        return date.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } catch {
                        return isoString;
                      }
                    };

                    // Choose badge color based on label type
                    let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/40';
                    if (backup.isZip) {
                      badgeClass = 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/40 dark:border-purple-900/30';
                    } else if (backup.isManual) {
                      badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/40 dark:border-blue-900/30';
                    } else if (backup.isPreRestore) {
                      badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
                    }

                    return (
                      <div key={backup.filename} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="mt-0.5 flex-shrink-0">
                            {backup.isManual ? (
                              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                                <HardDrive className="w-4 h-4" />
                              </div>
                            ) : backup.isPreRestore ? (
                              <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450 rounded-lg">
                                <History className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-lg">
                                <Server className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={backup.filename}>
                                {backup.filename}
                              </span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeClass}`}>
                                {backup.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                              <span>{formatBackupDate(backup.createdAt)}</span>
                              <span>•</span>
                              <span>Ukuran: {formatBytes(backup.sizeBytes)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions for local backup file */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Restore Button */}
                          <button
                            type="button"
                            disabled={isRestoringLocal !== null || isDeletingLocal !== null}
                            onClick={() => handleRestoreLocalBackup(backup.filename)}
                            className="px-2 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md cursor-pointer transition-colors shadow-sm"
                            title="Pulihkan database utama ke kondisi file backup ini"
                          >
                            {isRestoringThis ? (
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              'Pulihkan'
                            )}
                          </button>

                          {/* Download Button */}
                          <a
                            href={`/api/backup/download/${encodeURIComponent(backup.filename)}`}
                            download={backup.filename}
                            className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors hover:border-blue-200"
                            title="Unduh berkas backup ini ke penyimpanan lokal Anda"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isRestoringLocal !== null || isDeletingLocal !== null}
                            onClick={() => handleDeleteLocalBackup(backup.filename)}
                            className="p-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-450 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer transition-colors hover:border-rose-200"
                            title="Hapus permanen berkas cadangan ini dari server"
                          >
                            {isDeletingThis ? (
                              <Loader className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Cetak Tanda Terima (Checklist) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-none space-y-4 transition-colors duration-200">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.615 0-1.101-.483-1.12-1.097L6.34 18m11.32 0a1.15 1.15 0 00-.73-.273H7.39c-.282 0-.552.1-.73.273M15 11.25V1.5c0-.621-.504-1.125-1.125-1.125h-3.75c-.621 0-1.125.504-1.125 1.125v9.75M8.25 11.25h7.5" />
                </svg>
              </span>
              Kolom Cetak Tanda Terima
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sesuaikan informasi kolom apa saja yang ingin Anda tampilkan pada tanda terima penyerahan surat (tanda terima PDF). Beri tanda centang pada kolom yang ingin dicetak.
            </p>

            <div className="space-y-2.5 pt-1">
              {columns.map((col) => {
                const isChecked = col.includeInReceipt !== false;
                return (
                  <div 
                    key={col.key}
                    onClick={() => {
                      const updated = columns.map((c) => {
                        if (c.key === col.key) {
                          return { ...c, includeInReceipt: !isChecked };
                        }
                        return c;
                      });
                      setColumns(updated);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isChecked 
                        ? 'bg-blue-50/40 border-blue-200 dark:bg-blue-950/15 dark:border-blue-900/30 shadow-sm' 
                        : 'bg-slate-50/50 border-slate-200 dark:bg-slate-950/10 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                      }`}>
                        {isChecked && (
                          <svg className="w-3.5 h-3.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {col.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono uppercase tracking-wider bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 mt-1 inline-block w-fit">
                          {col.type === 'date' ? 'Tanggal' : col.type === 'number' ? 'Angka' : 'Teks'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isChecked 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-450'
                    }`}>
                      {isChecked ? 'Dicetak' : 'Disembunyikan'}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed italic">
              * Setelah mengatur checklist di atas, pastikan untuk mengklik tombol <strong className="font-bold text-blue-600 dark:text-blue-400">"Simpan Pengaturan"</strong> di sebelah kiri untuk menyimpan seluruh konfigurasi ke sistem secara permanen.
            </p>
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

          {/* Profiles Section */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl mb-4 space-y-2 text-xs transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                Profil Skema Kolom
              </span>
              <button
                type="button"
                onClick={() => setShowSaveProfileModal(true)}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-md transition-all shrink-0 cursor-pointer"
                title="Simpan profil baru"
              >
                Simpan Baru
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activeProfileId}
                onChange={(e) => handleSelectProfile(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-500 text-xs cursor-pointer transition-colors duration-200"
              >
                {columnProfiles.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} {prof.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleSetAsDefaultProfile()}
                disabled={columnProfiles.find(p => p.id === activeProfileId)?.isDefault}
                className="px-2.5 py-1.5 bg-slate-250 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-750 dark:text-slate-300 font-bold text-[10px] rounded-lg transition-all shrink-0 cursor-pointer"
                title="Atur profil ini sebagai Default"
              >
                Set Default
              </button>

              <button
                type="button"
                onClick={() => handleDeleteProfile(activeProfileId)}
                disabled={activeProfileId === 'default' || columnProfiles.find(p => p.id === activeProfileId)?.isDefault}
                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/35 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 disabled:opacity-30 rounded-lg transition-all shrink-0 cursor-pointer"
                title="Hapus profil saat ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
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

                {/* Column Include in Receipt Check */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="receipt_check"
                    checked={newColIncludeInReceipt}
                    onChange={(e) => setNewColIncludeInReceipt(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <label htmlFor="receipt_check" className="text-xs font-bold text-slate-650 dark:text-slate-400 cursor-pointer">
                    Cetak di Tanda Terima (Receipt)
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

      {/* Custom Backup Action confirmation modal */}
      <AnimatePresence>
        {backupConfirmAction && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-200 text-center text-slate-800 dark:text-slate-200"
            >
              {backupConfirmAction.type === 'delete' ? (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600" />
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-450 mx-auto mb-4">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-2">
                    Hapus Berkas Cadangan?
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mb-6">
                    Apakah Anda yakin ingin menghapus berkas cadangan <strong className="font-bold font-mono text-rose-600 dark:text-rose-450">"{backupConfirmAction.filename}"</strong> secara permanen dari server? Berkas ini tidak dapat dikembalikan setelah dihapus.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBackupConfirmAction(null)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const filename = backupConfirmAction.filename;
                        setBackupConfirmAction(null);
                        executeDeleteLocalBackup(filename);
                      }}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-200 dark:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Ya, Hapus</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-450 mx-auto mb-4">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-2">
                    Pulihkan Basis Data?
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mb-6">
                    {backupConfirmAction.filename.endsWith('.zip') ? (
                      <span>Apakah Anda yakin ingin memulihkan database dan seluruh file PDF menggunakan berkas cadangan <strong className="font-bold font-mono text-blue-600 dark:text-blue-400">"{backupConfirmAction.filename}"</strong>? Tindakan ini akan <strong className="text-rose-650 dark:text-rose-450 font-bold">menimpa seluruh data dan lampiran surat</strong> saat ini.</span>
                    ) : (
                      <span>Apakah Anda yakin ingin memulihkan database menggunakan berkas cadangan <strong className="font-bold font-mono text-blue-600 dark:text-blue-400">"{backupConfirmAction.filename}"</strong>? Tindakan ini akan <strong className="text-rose-650 dark:text-rose-450 font-bold">menimpa seluruh data</strong> saat ini.</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBackupConfirmAction(null)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const filename = backupConfirmAction.filename;
                        setBackupConfirmAction(null);
                        executeRestoreLocalBackup(filename);
                      }}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Ya, Pulihkan</span>
                    </button>
                  </div>
                </>
              )}
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

                {/* Column Include in Receipt Check */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="edit_receipt_check"
                    checked={editColIncludeInReceipt}
                    onChange={(e) => setEditColIncludeInReceipt(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer"
                  />
                  <label htmlFor="edit_receipt_check" className="text-xs font-bold text-slate-650 dark:text-slate-400 cursor-pointer">
                    Cetak di Tanda Terima (Receipt)
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

      {/* ==========================================
          SAVE AS NEW PROFILE DIALOG
          ========================================== */}
      <AnimatePresence>
        {showSaveProfileModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl w-full max-w-sm relative overflow-hidden transition-colors duration-200 text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
              
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center gap-1.5">
                <Save className="w-5 h-5 text-blue-600" />
                Simpan Profil Skema Baru
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleSaveAsNewProfile(newProfileName);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Profil <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-850 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    placeholder="Contoh: Profil Unit HRD"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveProfileModal(false);
                      setNewProfileName('');
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all cursor-pointer"
                  >
                    Simpan Profil
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
