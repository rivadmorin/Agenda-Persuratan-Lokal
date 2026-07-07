import React, { useState, useEffect, useRef } from 'react';
import { ColumnDefinition, ColumnProfile, ColumnType, AppConfig } from '../types';
import { generateM3Theme } from '../utils/theme';
import { Hct, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { motion, AnimatePresence } from 'motion/react';

export interface ColorSchemeOption {
  id: string;
  name: string;
  description: string;
  chroma: number;
  tone: number;
  icon: string;
}

export const colorSchemes: ColorSchemeOption[] = [
  {
    id: 'vibrant',
    name: 'Vibrant Dynamic',
    description: 'Saturasi tinggi dan kontras modern khas Material Design 3.',
    chroma: 48,
    tone: 40,
    icon: 'palette'
  },
  {
    id: 'pastel',
    name: 'Soft Pastel',
    description: 'Warna lembut, cerah, dan tenang untuk kenyamanan mata.',
    chroma: 24,
    tone: 52,
    icon: 'spa'
  },
  {
    id: 'muted',
    name: 'Classic Muted',
    description: 'Saturasi rendah, profesional, formal, dan tidak mencolok.',
    chroma: 14,
    tone: 42,
    icon: 'business_center'
  },
  {
    id: 'deep',
    name: 'Deep Velvet',
    description: 'Warna gelap pekat berkarakter kuat untuk kesan eksklusif.',
    chroma: 68,
    tone: 34,
    icon: 'dark_mode'
  },
  {
    id: 'neon',
    name: 'Cyber Neon',
    description: 'Warna ultra-vibrant, neon futuristik bergaya synthwave.',
    chroma: 88,
    tone: 48,
    icon: 'bolt'
  },
  {
    id: 'monochrome',
    name: 'Slate Monochrome',
    description: 'Warna abu-abu monokromatik modern, elegan, dan minimalis.',
    chroma: 0,
    tone: 40,
    icon: 'filter_b_and_w'
  }
];

export default function Settings({
  config,
  onSaveConfig,
  darkMode,
  setDarkMode
}: {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}) {
  const [appName, setAppName] = useState(config.appName);
  const [themeColor, setThemeColor] = useState(config.themeColor);
  const [themeBgColor, setThemeBgColor] = useState(config.themeBgColor || '#f8fafc');
  const [themeDarkBgColor, setThemeDarkBgColor] = useState(config.themeDarkBgColor || '#090e1a');
  const [logoType, setLogoType] = useState<'lucide' | 'emoji' | 'image'>(config.logoType || 'emoji');
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '📨');
  const [autoCompressPdf, setAutoCompressPdf] = useState(config.autoCompressPdf);
  const [pdfCompressionLevel, setPdfCompressionLevel] = useState<'low' | 'medium' | 'high'>(config.pdfCompressionLevel || 'medium');
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(config.maxUploadSizeMb || 50);
  const [backupRetentionDays, setBackupRetentionDays] = useState(config.backupRetentionDays || 7);
  const [autoRenamePdf, setAutoRenamePdf] = useState(config.autoRenamePdf !== false);
  const [pdfRenameCols, setPdfRenameCols] = useState<string[]>(config.pdfRenameCols || ['noSurat']);

  // Penomoran suggestions states
  const [penomoranSuggestions, setPenomoranSuggestions] = useState<string[]>(
    config.penomoranSuggestions || ['ROJEMENGAR 1', 'ROJEMENGAR 2', 'ROJEMENGAR 3', 'WAAS 1', 'WAAS 2', 'WAAS 3']
  );
  const [newSuggestion, setNewSuggestion] = useState('');
  const [suggestionError, setSuggestionError] = useState('');

  // Columns & Profiles State
  const [columns, setColumns] = useState<ColumnDefinition[]>(
    [...(config.columns || [])].sort((a, b) => a.order - b.order)
  );
  const [columnProfiles, setColumnProfiles] = useState<ColumnProfile[]>(config.columnProfiles || []);
  const [activeProfileId, setActiveProfileId] = useState(config.activeProfileId || '');
  const [newProfileName, setNewProfileName] = useState('');

  // Drag and Drop States
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragAllowedKey, setDragAllowedKey] = useState<string | null>(null);

  // Add Column Modal States
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColKey, setNewColKey] = useState('');
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [newColRequired, setNewColRequired] = useState(false);
  const [newColIncludeInReceipt, setNewColIncludeInReceipt] = useState(true);
  const [colError, setColError] = useState('');

  // Edit Column Modal States
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);
  const [editColLabel, setEditColLabel] = useState('');
  const [editColType, setEditColType] = useState<ColumnType>('text');
  const [editColRequired, setEditColRequired] = useState(false);
  const [editColIncludeInReceipt, setEditColIncludeInReceipt] = useState(true);
  const [editColError, setEditColError] = useState('');

  // Toast / Status Message State
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  // Backups State
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [includePdfBackup, setIncludePdfBackup] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database Stats State
  const [dbStats, setDbStats] = useState<{
    totalMails: number;
    totalPdfs: number;
    totalSizeMb: number;
    lastBackup: string;
    integrityStatus: 'ok' | 'warning' | 'unchecked';
  }>({
    totalMails: 0,
    totalPdfs: 0,
    totalSizeMb: 0,
    lastBackup: '-',
    integrityStatus: 'unchecked'
  });

  // Specific per-action loading states
  const [activeLoading, setActiveLoading] = useState<Record<string, boolean>>({});

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: string;
    extraData?: any;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: '',
    isDanger: false
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'error' | 'success';
    showProgress?: boolean;
    countdown?: number;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });


  // HCT Theme states
  const getHctFromHex = (hex: string) => {
    try {
      return Hct.fromInt(argbFromHex(hex));
    } catch {
      return Hct.fromInt(argbFromHex('#0d9488'));
    }
  };

  const initialHct = getHctFromHex(themeColor || '#0d9488');
  const [hue, setHue] = useState(initialHct.hue);
  const [chroma, setChroma] = useState(initialHct.chroma);
  const [tone, setTone] = useState(initialHct.tone);
  const [colorScheme, setColorScheme] = useState<string>(config.themeColorScheme || 'vibrant');

  useEffect(() => {
    const hct = getHctFromHex(themeColor || '#0d9488');
    setHue(hct.hue);
    setChroma(hct.chroma);
    setTone(hct.tone);
  }, [themeColor]);

  const applyThemeColor = (h: number, schemeId: string, currentBg?: string, currentDarkBg?: string) => {
    const scheme = colorSchemes.find(s => s.id === schemeId) || colorSchemes[0];
    const newHct = Hct.from(h, scheme.chroma, scheme.tone);
    const newHex = hexFromArgb(newHct.toInt());
    setThemeColor(newHex);
    generateM3Theme(newHex, currentBg || themeBgColor, currentDarkBg || themeDarkBgColor, schemeId);
  };

  const handlePresetClick = (hex: string, h: number) => {
    setThemeColor(hex);
    setHue(h);
    const scheme = colorSchemes.find(s => s.id === colorScheme) || colorSchemes[0];
    const newHct = Hct.from(h, scheme.chroma, scheme.tone);
    const newHex = hexFromArgb(newHct.toInt());
    setThemeColor(newHex);
    generateM3Theme(newHex, themeBgColor, themeDarkBgColor, colorScheme);
  };

  const handleHueChange = (h: number) => {
    setHue(h);
    applyThemeColor(h, colorScheme);
  };

  const handleSchemeChange = (schemeId: string) => {
    setColorScheme(schemeId);
    applyThemeColor(hue, schemeId);
  };

  const handleHexPickerChange = (hex: string) => {
    setThemeColor(hex);
    const hct = getHctFromHex(hex);
    setHue(hct.hue);
    generateM3Theme(hex, themeBgColor, themeDarkBgColor, colorScheme);
  };

  const handleBgColorChange = (hex: string) => {
    setThemeBgColor(hex);
    generateM3Theme(themeColor, hex, themeDarkBgColor, colorScheme);
  };

  const handleDarkBgColorChange = (hex: string) => {
    setThemeDarkBgColor(hex);
    generateM3Theme(themeColor, themeBgColor, hex, colorScheme);
  };

  useEffect(() => {
    setAppName(config.appName);
    setThemeColor(config.themeColor);
    setThemeBgColor(config.themeBgColor || '#f8fafc');
    setThemeDarkBgColor(config.themeDarkBgColor || '#090e1a');
    setLogoType(config.logoType || 'emoji');
    setLogoUrl(config.logoUrl || '📨');
    setAutoCompressPdf(config.autoCompressPdf);
    setPdfCompressionLevel(config.pdfCompressionLevel || 'medium');
    setMaxUploadSizeMb(config.maxUploadSizeMb || 50);
    setBackupRetentionDays(config.backupRetentionDays || 7);
    setAutoRenamePdf(config.autoRenamePdf !== false);
    setPdfRenameCols(config.pdfRenameCols || ['noSurat']);
    setPenomoranSuggestions(config.penomoranSuggestions || ['ROJEMENGAR 1', 'ROJEMENGAR 2', 'ROJEMENGAR 3', 'WAAS 1', 'WAAS 2', 'WAAS 3']);
    setNewSuggestion('');
    setSuggestionError('');
    setColumns([...(config.columns || [])].sort((a, b) => a.order - b.order));
    setColumnProfiles(config.columnProfiles || []);
    setActiveProfileId(config.activeProfileId || '');
    if (config.themeColorScheme) {
      setColorScheme(config.themeColorScheme);
    }
    if (config.themeHue !== undefined) {
      setHue(config.themeHue);
    }
    fetchBackups();
    fetchDbStats();
  }, [config]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const fetchBackups = async () => {
    setBackupsLoading(true);
    try {
      const res = await fetch('/api/backup/list');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Failed to fetch backups', err);
    } finally {
      setBackupsLoading(false);
    }
  };

  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/backup/stats');
      if (res.ok) {
        const data = await res.json();
        setDbStats(prev => ({
          ...prev,
          totalMails: data.totalMails,
          totalPdfs: data.totalPdfs,
          totalSizeMb: data.totalSizeMb,
          lastBackup: data.lastBackup
        }));
      }
    } catch (err) {
      console.error('Failed to fetch DB stats', err);
    }
  };

  const triggerAction = (actionType: string, extraData?: any) => {
    let title = '';
    let message = '';
    let isDanger = false;

    if (actionType === 'createBackup') {
      title = 'Buat Cadangan Baru';
      message = `Apakah Anda yakin ingin membuat berkas cadangan database sekarang? ${includePdfBackup ? '(Mencakup seluruh file PDF lampiran)' : '(Hanya data teks)'}`;
    } else if (actionType === 'exportData') {
      title = 'Ekspor File Data';
      message = 'Apakah Anda yakin ingin mengekspor seluruh data persuratan saat ini ke berkas ZIP lokal?';
    } else if (actionType === 'checkIntegrity') {
      title = 'Periksa Integritas';
      message = 'Jalankan pemeriksaan integritas database dan verifikasi berkas PDF di server?';
    } else if (actionType === 'cleanupOrphans') {
      title = 'Bersihkan File Yatim';
      message = 'PENTING: Seluruh berkas PDF di folder uploads yang tidak memiliki record di database akan dihapus dari server secara permanen. Anda yakin?';
      isDanger = true;
    } else if (actionType === 'reconstructMetadata') {
      title = 'Rekonstruksi Metadata';
      message = 'Sistem akan memindai folder uploads dan memulihkan record surat berdasarkan berkas PDF yatim yang ditemukan. Anda yakin?';
    } else if (actionType === 'clearSystem') {
      title = 'HAPUS SELURUH DATA SISTEM';
      message = 'PERINGATAN KERAS: Semua agenda surat, berkas PDF lampiran akan dihapus secara permanen, dan kredensial admin akan di-reset. Tindakan ini TIDAK DAPAT DIBATALKAN. Anda yakin?';
      isDanger = true;
    } else if (actionType === 'deleteBackup') {
      title = 'Hapus Berkas Cadangan';
      message = `Apakah Anda yakin ingin menghapus berkas cadangan "${extraData}" secara permanen dari server?`;
      isDanger = true;
    } else if (actionType === 'restoreBackup') {
      title = 'Pulihkan Sistem dari Cadangan';
      message = `PENTING: Seluruh data saat ini akan ditimpa dengan data dari cadangan "${extraData}". Anda yakin ingin melanjutkan?`;
      isDanger = true;
    }

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      actionType,
      extraData,
      isDanger
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, extraData } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    const setLoading = (key: string, val: boolean) => {
      setActiveLoading(prev => ({ ...prev, [key]: val }));
    };

    if (actionType === 'createBackup') {
      setLoading('create', true);
      try {
        const res = await fetch('/api/backup/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ includePdf: includePdfBackup })
        });
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Cadangan Berhasil',
            message: 'Berkas cadangan baru berhasil dibuat di server.',
            type: 'success'
          });
          fetchBackups();
          fetchDbStats();
        } else {
          const errData = await res.json().catch(() => ({}));
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Cadangkan',
            message: errData.message || 'Gagal membuat file cadangan di server.',
            type: 'error'
          });
        }
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal terhubung ke server.',
          type: 'error'
        });
      } finally {
        setLoading('create', false);
      }
    }

    else if (actionType === 'exportData') {
      setLoading('export', true);
      try {
        window.open('/api/backup/export-zip', '_blank');
        setAlertDialog({
          isOpen: true,
          title: 'Ekspor Berhasil',
          message: 'Berkas ekspor ZIP berhasil diunduh.',
          type: 'success'
        });
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Gagal Ekspor',
          message: err.message || 'Gagal mengunduh file ekspor.',
          type: 'error'
        });
      } finally {
        setLoading('export', false);
      }
    }

    else if (actionType === 'checkIntegrity') {
      setLoading('integrity', true);
      try {
        const res = await fetch('/api/backup/integrity');
        const data = await res.json();
        if (res.ok) {
          const isOk = data.missingCount === 0;
          setDbStats(prev => ({
            ...prev,
            integrityStatus: isOk ? 'ok' : 'warning'
          }));
          setAlertDialog({
            isOpen: true,
            title: 'Hasil Pemeriksaan Integritas',
            message: isOk 
              ? 'INTEGRITAS OK: Seluruh record database memiliki berkas lampiran PDF yang lengkap di server.'
              : `PERINGATAN INTEGRITAS: Ditemukan ${data.missingCount} record surat yang berkas lampiran PDF-nya hilang di server.`,
            type: isOk ? 'success' : 'info'
          });
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Periksa',
            message: 'Gagal memeriksa integritas data dari server.',
            type: 'error'
          });
        }
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal terhubung ke server.',
          type: 'error'
        });
      } finally {
        setLoading('integrity', false);
      }
    }

    else if (actionType === 'cleanupOrphans') {
      setLoading('cleanup', true);
      try {
        const res = await fetch('/api/backup/integrity/cleanup', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Pembersihan Berhasil',
            message: data.message || 'Pembersihan berkas yatim berhasil dilakukan.',
            type: 'success'
          });
          fetchDbStats();
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Pembersihan',
            message: data.message || 'Gagal membersihkan berkas yatim.',
            type: 'error'
          });
        }
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal melakukan pembersihan berkas.',
          type: 'error'
        });
      } finally {
        setLoading('cleanup', false);
      }
    }

    else if (actionType === 'reconstructMetadata') {
      setLoading('reconstruct', true);
      try {
        const res = await fetch('/api/backup/integrity/reconstruct', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Rekonstruksi Sukses',
            message: (data.message || 'Rekonstruksi metadata berhasil dilakukan.') + ' Halaman akan dimuat ulang otomatis dalam 3 detik...',
            type: 'success',
            countdown: 3
          });
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Rekonstruksi',
            message: data.message || 'Gagal merekonstruksi metadata.',
            type: 'error'
          });
        }
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal melakukan rekonstruksi.',
          type: 'error'
        });
      } finally {
        setLoading('reconstruct', false);
      }
    }

    else if (actionType === 'clearSystem') {
      setLoading('clear', true);
      try {
        const res = await fetch('/api/backup/clear', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Sistem Dibersihkan',
            message: (data.message || 'Sistem berhasil dibersihkan!') + ' Halaman akan dimuat ulang otomatis dalam 3 detik...',
            type: 'success',
            countdown: 3
          });
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Reset',
            message: data.message || 'Gagal mereset sistem.',
            type: 'error'
          });
        }
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal mereset sistem.',
          type: 'error'
        });
      } finally {
        setLoading('clear', false);
      }
    }

    else if (actionType === 'deleteBackup') {
      const filename = extraData;
      setLoading(`delete_${filename}`, true);
      try {
        const res = await fetch(`/api/backup/delete/${filename}`, { method: 'DELETE' });
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Cadangan Dihapus',
            message: 'Berkas cadangan berhasil dihapus secara permanen.',
            type: 'success'
          });
          fetchBackups();
          fetchDbStats();
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Hapus',
            message: 'Gagal menghapus berkas cadangan dari server.',
            type: 'error'
          });
        }
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal menghapus berkas cadangan.',
          type: 'error'
        });
      } finally {
        setLoading(`delete_${filename}`, false);
      }
    }

    else if (actionType === 'restoreBackup') {
      const filename = extraData;
      setLoading(`restore_${filename}`, true);
      try {
        const res = await fetch('/api/backup/restore-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename })
        });
        const data = await res.json();
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Sistem Dipulihkan',
            message: (data.message || 'Sistem berhasil dipulihkan dari cadangan lokal!') + ' Halaman akan dimuat ulang otomatis dalam 3 detik...',
            type: 'success',
            countdown: 3
          });
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Pemulihan',
            message: data.message || 'Gagal memulihkan sistem.',
            type: 'error'
          });
        }
      } catch (err: any) {
        setAlertDialog({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal memulihkan sistem.',
          type: 'error'
        });
      } finally {
        setLoading(`restore_${filename}`, false);
      }
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupsLoading(true);
    setActiveLoading(prev => ({ ...prev, import: true }));
    try {
      if (file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        const res = await fetch('/api/backup/import-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/zip' },
          body: buffer
        });
        const data = await res.json();
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Sistem Dipulihkan',
            message: (data.message || 'Sistem berhasil dipulihkan dari berkas ZIP cadangan!') + ' Halaman akan dimuat ulang otomatis dalam 3 detik...',
            type: 'success',
            countdown: 3
          });
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Pemulihan',
            message: data.message || 'Gagal memulihkan dari ZIP.',
            type: 'error'
          });
        }
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        let dbData;
        try {
          dbData = JSON.parse(text);
        } catch {
          setAlertDialog({
            isOpen: true,
            title: 'Berkas Tidak Valid',
            message: 'File backup JSON tidak valid.',
            type: 'error'
          });
          return;
        }

        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbData)
        });
        const data = await res.json();
        if (res.ok) {
          setAlertDialog({
            isOpen: true,
            title: 'Sistem Dipulihkan',
            message: 'Database berhasil dipulihkan dari cadangan JSON! Halaman akan dimuat ulang otomatis dalam 3 detik...',
            type: 'success',
            countdown: 3
          });
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Pemulihan',
            message: data.error || 'Gagal memulihkan dari JSON.',
            type: 'error'
          });
        }
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Format Tidak Didukung',
          message: 'Format berkas tidak didukung. Wajib format .json atau .zip.',
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error(err);
      setAlertDialog({
        isOpen: true,
        title: 'Kesalahan Sistem',
        message: err.message || 'Terjadi kesalahan koneksi saat memulihkan database.',
        type: 'error'
      });
    } finally {
      setBackupsLoading(false);
      setActiveLoading(prev => ({ ...prev, import: false }));
    }
  };

  const handleAddSuggestion = () => {
    const trimmed = newSuggestion.trim();
    if (!trimmed) {
      setSuggestionError('Teks saran tidak boleh kosong.');
      return;
    }
    if (penomoranSuggestions.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSuggestionError('Saran penomoran sudah terdaftar.');
      return;
    }
    setPenomoranSuggestions([...penomoranSuggestions, trimmed]);
    setNewSuggestion('');
    setSuggestionError('');
  };

  const handleRemoveSuggestion = (val: string) => {
    setPenomoranSuggestions(penomoranSuggestions.filter(s => s !== val));
  };

  const handleSave = () => {
    const updatedConfig: AppConfig = {
      appName,
      logoType,
      logoUrl,
      themeColor,
      themeBgColor,
      themeDarkBgColor,
      themeColorScheme: colorScheme,
      themeHue: Math.round(hue),
      autoCompressPdf,
      pdfCompressionLevel,
      maxUploadSizeMb,
      backupRetentionDays,
      backupRetentionWeeks: Math.ceil(backupRetentionDays / 7),
      columns,
      columnProfiles,
      activeProfileId,
      autoRenamePdf,
      pdfRenameCols,
      penomoranSuggestions
    };

    onSaveConfig(updatedConfig);
    if (themeColor) {
      generateM3Theme(themeColor, themeBgColor, themeDarkBgColor, colorScheme);
    }
    showNotification('Pengaturan sistem berhasil disimpan.');
  };

  // HTML5 Drag and Drop Handlers
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

  const handleMoveColumn = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === columns.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...columns];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    const updated = reordered.map((col, i) => ({ ...col, order: i + 1 }));
    setColumns(updated);
  };

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newColKey.trim().replace(/\s+/g, '').toLowerCase();
    if (!cleanKey) {
      setColError('Key kolom tidak boleh kosong.');
      return;
    }
    if (columns.some(col => col.key === cleanKey)) {
      setColError(`Key kolom "${cleanKey}" sudah digunakan.`);
      return;
    }
    if (!newColLabel.trim()) {
      setColError('Label kolom tidak boleh kosong.');
      return;
    }

    const newCol: ColumnDefinition = {
      key: cleanKey,
      label: newColLabel.trim(),
      type: newColType,
      required: newColRequired,
      includeInReceipt: newColIncludeInReceipt,
      order: columns.length + 1
    };

    setColumns([...columns, newCol]);
    setShowAddCol(false);
    setNewColKey('');
    setNewColLabel('');
    setNewColType('text');
    setNewColRequired(false);
    setNewColIncludeInReceipt(true);
    setColError('');
    showNotification(`Kolom "${newCol.label}" ditambahkan.`);
  };

  const handleStartEditColumn = (col: ColumnDefinition) => {
    setEditingColumn(col);
    setEditColLabel(col.label);
    setEditColType(col.type);
    setEditColRequired(col.required);
    setEditColIncludeInReceipt(col.includeInReceipt !== false);
  };

  const handleSaveEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn) return;
    if (!editColLabel.trim()) {
      setEditColError('Label kolom tidak boleh kosong.');
      return;
    }

    const updated = columns.map(col => {
      if (col.key === editingColumn.key) {
        return {
          ...col,
          label: editColLabel.trim(),
          type: editColType,
          required: editColRequired,
          includeInReceipt: editColIncludeInReceipt
        };
      }
      return col;
    });

    setColumns(updated);
    setEditingColumn(null);
    setEditColError('');
    showNotification(`Kolom "${editColLabel}" berhasil diperbarui.`);
  };

  const handleDeleteColumn = (key: string) => {
    const colName = columns.find(col => col.key === key)?.label || key;
    if (!confirm(`Apakah Anda yakin ingin menghapus kolom "${colName}" dari skema?`)) return;
    const filtered = columns.filter(col => col.key !== key);
    const updated = filtered.map((col, i) => ({ ...col, order: i + 1 }));
    setColumns(updated);
    setPdfRenameCols(prev => prev.filter(k => k !== key));
    showNotification(`Kolom dengan key "${key}" dihapus.`);
  };

  const handleSelectProfile = (profileId: string) => {
    const prof = columnProfiles.find(p => p.id === profileId);
    if (prof) {
      setActiveProfileId(profileId);
      setColumns([...prof.columns].sort((a, b) => a.order - b.order));
      showNotification(`Profil "${prof.name}" dimuat. Klik Simpan untuk mengaktifkan.`);
    }
  };

  const handleSaveAsNewProfile = () => {
    if (!newProfileName.trim()) {
      showNotification('Nama profil tidak boleh kosong.', 'error');
      return;
    }
    const newProfile: ColumnProfile = {
      id: `profile_${Date.now()}`,
      name: newProfileName.trim(),
      columns: [...columns]
    };
    const updatedProfiles = [...columnProfiles, newProfile];
    setColumnProfiles(updatedProfiles);
    setActiveProfileId(newProfile.id);
    setNewProfileName('');
    showNotification(`Profil "${newProfile.name}" disimpan.`);
  };

  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = columnProfiles.filter(p => p.id !== profileId);
    setColumnProfiles(updatedProfiles);
    if (activeProfileId === profileId) {
      setActiveProfileId('');
    }
    showNotification('Profil kolom dihapus.');
  };

  const handleToggleRenameCol = (key: string) => {
    setPdfRenameCols(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleToggleReceiptCol = (key: string) => {
    const updated = columns.map(c => {
      if (c.key === key) {
        return { ...c, includeInReceipt: c.includeInReceipt === false ? true : false };
      }
      return c;
    });
    setColumns(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 p-4 relative pb-32 text-[var(--md-sys-color-on-surface)]">
      {/* Toast Notification */}
      {statusMsg && (
        <div className={`fixed bottom-24 right-8 z-50 p-4 rounded-2xl shadow-lg flex items-center gap-3 transition-premium ${statusType === 'success' ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'}`}>
          <span className="material-symbols-outlined">{statusType === 'success' ? 'check_circle' : 'error'}</span>
          <span className="text-sm font-bold">{statusMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Kelola konfigurasi branding, skema kolom dinamis, dan pengelolaan PDF.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Tampilan & Branding */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2.5rem-0.375rem)] p-6 sm:p-8 md:p-10 lg:p-12">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-[var(--md-sys-color-on-surface)] font-display">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] font-fill">palette</span>
              Tampilan & Branding
            </h2>
            <div className="flex flex-col gap-4">
              <md-filled-text-field
                label="Nama Aplikasi / Instansi"
                value={appName}
                onInput={(e: any) => setAppName(e.target.value)}
              ></md-filled-text-field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <md-filled-select
                    label="Tipe Logo"
                    value={logoType}
                    onInput={(e: any) => setLogoType(e.target.value)}
                    className="w-full"
                  >
                    <md-select-option value="emoji">Emoji</md-select-option>
                    <md-select-option value="image">Gambar URL</md-select-option>
                  </md-filled-select>
                </div>
                <div className="sm:col-span-2">
                  <md-filled-text-field
                    label={logoType === 'emoji' ? 'Karakter Emoji' : 'URL Gambar Logo'}
                    value={logoUrl}
                    onInput={(e: any) => setLogoUrl(e.target.value)}
                    className="w-full"
                  ></md-filled-text-field>
                </div>
              </div>

              <div className="flex flex-col gap-5 mt-4 p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-widest">Kustomisasi Warna & Skema Tema</span>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">Personalisasikan suasana digital aplikasi dengan memilih skema varian warna dan menggeser slider pelangi.</p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1">Pilihan Warna Cepat</span>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { name: 'Teal', hex: '#0d9488', hue: 174 },
                      { name: 'Indigo', hex: '#4f46e5', hue: 243 },
                      { name: 'Rose', hex: '#e11d48', hue: 348 },
                      { name: 'Amber', hex: '#d97706', hue: 37 },
                      { name: 'Emerald', hex: '#10b981', hue: 160 },
                      { name: 'Violet', hex: '#7c3aed', hue: 268 },
                    ].map((preset) => {
                      const isActive = themeColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => handlePresetClick(preset.hex, preset.hue)}
                          className={`w-9 h-9 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 border-2 hover:scale-110 active:scale-95 ${
                            isActive
                              ? 'border-[var(--md-sys-color-on-surface)] shadow-md scale-105'
                              : 'border-transparent shadow-sm'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {isActive && (
                            <span className="material-symbols-outlined text-white text-base drop-shadow-sm font-black">check</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Compact Skema Warna Selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1 font-black">Model Skema Warna</span>
                  <div className="grid grid-cols-2 gap-2">
                    {colorSchemes.slice(0, 4).map((scheme) => {
                      const isActive = colorScheme === scheme.id;
                      return (
                        <button
                          key={scheme.id}
                          type="button"
                          onClick={() => handleSchemeChange(scheme.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] shadow-sm'
                              : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-sm ${isActive ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>{scheme.icon}</span>
                          <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface)] truncate">{scheme.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rainbow Hue Slider */}
                <div className="flex flex-col gap-2 bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider px-1">
                    <span>Geser untuk Menyesuaikan Warna</span>
                    <span className="font-mono text-xs text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-1 rounded-full">{Math.round(hue)}°</span>
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={Math.round(hue)}
                      onChange={(e) => handleHueChange(Number(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer outline-none shadow-inner"
                      style={{
                        background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                      }}
                    />
                  </div>
                </div>

                {/* HEX Color Input & Native Picker */}
                <div className="flex items-center gap-3 bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex-1">
                    <md-filled-text-field
                      label="Warna Kustom (HEX)"
                      value={themeColor}
                      onInput={(e: any) => {
                        const hex = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                          handleHexPickerChange(hex);
                        } else {
                          setThemeColor(hex);
                        }
                      }}
                      className="w-full"
                    >
                      <md-icon slot="leading-icon">palette</md-icon>
                    </md-filled-text-field>
                  </div>
                  <div className="relative w-12 h-12 rounded-full border border-[var(--md-sys-color-outline-variant)] shadow-sm shrink-0 overflow-hidden cursor-pointer" style={{ backgroundColor: themeColor }}>
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => handleHexPickerChange(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Custom Background Colors */}
                <div className="flex flex-col gap-4 bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Kustomisasi Latar Belakang (Background)</span>
                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">Pilih preset atau gunakan picker warna untuk menyesuaikan warna latar belakang aplikasi pada mode Terang dan Gelap.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                    {/* Light Mode Bg */}
                    <div className="flex flex-col gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                      <span className="text-[10px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-wider">Latar Mode Terang</span>
                      
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'Default', hex: '#f8fafc' },
                          { name: 'Warm', hex: '#fafaf9' },
                          { name: 'Sky', hex: '#f0f9ff' },
                          { name: 'Lavender', hex: '#faf5ff' },
                          { name: 'Mint', hex: '#f0fdf4' }
                        ].map((bgPreset) => {
                          const isActive = themeBgColor.toLowerCase() === bgPreset.hex.toLowerCase();
                          return (
                            <button
                              key={bgPreset.hex}
                              type="button"
                              onClick={() => handleBgColorChange(bgPreset.hex)}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm'
                                  : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                              }`}
                            >
                              {bgPreset.name}
                            </button>
                          );
                        })}
                      </div>

                      {/* Input & Picker */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1">
                          <md-filled-text-field
                            label="Warna Terang (HEX)"
                            value={themeBgColor}
                            onInput={(e: any) => {
                              const hex = e.target.value;
                              if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                                handleBgColorChange(hex);
                              } else {
                                setThemeBgColor(hex);
                              }
                            }}
                            className="w-full text-xs"
                          >
                            <md-icon slot="leading-icon">wb_sunny</md-icon>
                          </md-filled-text-field>
                        </div>
                        <div className="relative w-10 h-10 rounded-lg border border-[var(--md-sys-color-outline-variant)] shadow-sm shrink-0 overflow-hidden cursor-pointer" style={{ backgroundColor: themeBgColor }}>
                          <input
                            type="color"
                            value={themeBgColor}
                            onChange={(e) => handleBgColorChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dark Mode Bg */}
                    <div className="flex flex-col gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                      <span className="text-[10px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-wider">Latar Mode Gelap</span>
                      
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'Default', hex: '#090e1a' },
                          { name: 'OLED', hex: '#000000' },
                          { name: 'Charcoal', hex: '#121212' },
                          { name: 'Emerald', hex: '#022c22' },
                          { name: 'Obsidian', hex: '#0f172a' }
                        ].map((bgPreset) => {
                          const isActive = themeDarkBgColor.toLowerCase() === bgPreset.hex.toLowerCase();
                          return (
                            <button
                              key={bgPreset.hex}
                              type="button"
                              onClick={() => handleDarkBgColorChange(bgPreset.hex)}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent shadow-sm'
                                  : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                              }`}
                            >
                              {bgPreset.name}
                            </button>
                          );
                        })}
                      </div>

                      {/* Input & Picker */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1">
                          <md-filled-text-field
                            label="Warna Gelap (HEX)"
                            value={themeDarkBgColor}
                            onInput={(e: any) => {
                              const hex = e.target.value;
                              if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                                handleDarkBgColorChange(hex);
                              } else {
                                setThemeDarkBgColor(hex);
                              }
                            }}
                            className="w-full text-xs"
                          >
                            <md-icon slot="leading-icon">bedtime</md-icon>
                          </md-filled-text-field>
                        </div>
                        <div className="relative w-10 h-10 rounded-lg border border-[var(--md-sys-color-outline-variant)] shadow-sm shrink-0 overflow-hidden cursor-pointer" style={{ backgroundColor: themeDarkBgColor }}>
                          <input
                            type="color"
                            value={themeDarkBgColor}
                            onChange={(e) => handleDarkBgColorChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* Mode Tampilan Control */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1">Mode Tampilan</span>
                  <div className="flex bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-2xl border border-[var(--md-sys-color-outline-variant)] w-full sm:max-w-sm">
                    <button
                      type="button"
                      onClick={() => setDarkMode(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        darkMode === true
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">dark_mode</span>
                      Gelap
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        setDarkMode(isSystemDark);
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">hdr_auto</span>
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setDarkMode(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        darkMode === false
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">light_mode</span>
                      Terang
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Manajemen Berkas & Auto-Rename */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2.5rem-0.375rem)] p-6 sm:p-8 md:p-10 lg:p-12">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-[var(--md-sys-color-on-surface)] font-display">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] font-fill">description</span>
              Manajemen Berkas & Unggahan
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl transition-premium">
                <div>
                  <p className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">Kompresi PDF Otomatis</p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Kompresi ukuran fisik via Ghostscript</p>
                </div>
                <md-checkbox
                  checked={autoCompressPdf}
                  onClick={() => setAutoCompressPdf(!autoCompressPdf)}
                ></md-checkbox>
              </div>

              {autoCompressPdf && (
                <md-filled-select
                  label="Level Kompresi Bawaan"
                  value={pdfCompressionLevel}
                  onInput={(e: any) => setPdfCompressionLevel(e.target.value)}
                >
                  <md-select-option value="low">RENDAH (Kualitas Gambar Tinggi)</md-select-option>
                  <md-select-option value="medium">SEDANG (Ukuran Seimbang)</md-select-option>
                  <md-select-option value="high">TINGGI (Kompresi Maksimal)</md-select-option>
                </md-filled-select>
              )}

              <md-filled-text-field
                label="Maksimum Ukuran PDF (MB)"
                type="number"
                value={maxUploadSizeMb}
                onInput={(e: any) => setMaxUploadSizeMb(parseInt(e.target.value) || 50)}
              ></md-filled-text-field>

              <md-divider className="my-1"></md-divider>

              {/* Auto Rename Config */}
              <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl transition-premium">
                <div>
                  <p className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-display">Penamaan Berkas PDF Otomatis</p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    Format:{' '}
                    <span className="font-semibold text-[var(--md-sys-color-primary)] font-mono">
                      {pdfRenameCols.length > 0 ? (
                        pdfRenameCols.map(key => {
                          const col = columns.find(c => c.key === key);
                          return `[${col ? col.label : key}]`;
                        }).join('-') + '.pdf'
                      ) : (
                        '[Pilih Kolom].pdf'
                      )}
                    </span>
                  </p>
                </div>
                <md-checkbox
                  checked={autoRenamePdf}
                  onClick={() => setAutoRenamePdf(!autoRenamePdf)}
                ></md-checkbox>
              </div>

              {autoRenamePdf && (
                <div className="flex flex-col gap-2 p-3 border border-[var(--md-sys-color-outline-variant)] rounded-2xl bg-[var(--md-sys-color-surface-container-low)] transition-premium">
                  <label className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest ml-1">PILIH KOLOM UNTUK FORMAT NAMA</label>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {columns.map(col => (
                      <label key={col.key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-container-highest)]/50 cursor-pointer transition-colors text-sm text-[var(--md-sys-color-on-surface)]">
                        <md-checkbox
                          checked={pdfRenameCols.includes(col.key)}
                          onClick={() => handleToggleRenameCol(col.key)}
                        ></md-checkbox>
                        <span>{col.label} ({col.key})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saran Penomoran (Double Bezel) */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2.5rem-0.375rem)] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--md-sys-color-on-surface)] font-display">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] font-fill">format_list_bulleted</span>
              Daftar Saran Penomoran
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] -mt-2">
              Kelola opsi rekomendasi saran pengisian otomatis untuk kolom Penomoran pada form Agenda Surat.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="flex-1 flex flex-col gap-1.5">
                  <md-filled-text-field
                    label="Tambah Saran Baru"
                    value={newSuggestion}
                    onInput={(e: any) => {
                      setNewSuggestion(e.target.value);
                      if (suggestionError) setSuggestionError('');
                    }}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSuggestion();
                      }
                    }}
                    error={!!suggestionError ? true : undefined}
                    errorText={suggestionError}
                    className="w-full"
                  ></md-filled-text-field>
                </div>
                <md-filled-button
                  type="button"
                  onClick={handleAddSuggestion}
                  className="h-[56px] flex items-center justify-center cursor-pointer animate-scale"
                  style={{ '--md-filled-button-container-shape': '12px' }}
                >
                  <span className="material-symbols-outlined mr-1">add</span>
                  Tambah
                </md-filled-button>
              </div>

              {penomoranSuggestions.length > 0 ? (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest ml-1">
                    Saran Aktif saat ini ({penomoranSuggestions.length})
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl">
                    {penomoranSuggestions.map(sug => (
                      <div
                        key={sug}
                        className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-full px-3.5 py-1.5 text-xs transition-premium hover:bg-[var(--md-sys-color-surface-container)]"
                      >
                        <span className="font-medium">{sug}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSuggestion(sug)}
                          className="material-symbols-outlined text-[14px] leading-none text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] cursor-pointer select-none active:scale-95 transition-colors duration-300"
                          title="Hapus saran ini"
                        >
                          close
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 border border-dashed border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl text-[var(--md-sys-color-on-surface-variant)]/60">
                  <span className="material-symbols-outlined text-2xl mb-1">list</span>
                  <span className="text-xs">Belum ada saran penomoran.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backup & Pemulihan (Double Bezel) */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2.5rem-0.375rem)] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--md-sys-color-on-surface)] font-display">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] font-fill">backup</span>
              Sistem Database Backup & Pemulihan
            </h2>

            {/* Database Status Summary Card */}
            <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)] font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm font-fill">analytics</span>
                Ringkasan Status Database
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/40 text-center">
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold">Total Agenda</p>
                  <p className="text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1 font-mono">{dbStats.totalMails}</p>
                </div>
                <div className="bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/40 text-center">
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold">Berkas PDF</p>
                  <p className="text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1 font-mono">{dbStats.totalPdfs}</p>
                </div>
                <div className="bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/40 text-center">
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold">Ukuran Uploads</p>
                  <p className="text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1 font-mono">{dbStats.totalSizeMb} MB</p>
                </div>
                <div className="bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/40 text-center">
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold">Integritas Berkas</p>
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    {dbStats.integrityStatus === 'ok' ? (
                      <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold">
                        <span className="material-symbols-outlined text-sm font-fill">check_circle</span> OK
                      </span>
                    ) : dbStats.integrityStatus === 'warning' ? (
                      <span className="text-amber-500 flex items-center gap-1 text-xs font-bold">
                        <span className="material-symbols-outlined text-sm">warning</span> Peringatan
                      </span>
                    ) : (
                      <span className="text-[var(--md-sys-color-on-surface-variant)]/60 text-xs font-bold">Belum Dicek</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)]/40 pt-2 px-1">
                <span>Terakhir Backup Otomatis: <strong className="font-mono">{dbStats.lastBackup}</strong></span>
                <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Offline-Ready & Portabel</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <md-filled-text-field
                label="Masa Retensi Cadangan (Hari)"
                type="number"
                value={backupRetentionDays}
                onInput={(e: any) => setBackupRetentionDays(parseInt(e.target.value) || 7)}
              ></md-filled-text-field>

              <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl transition-premium">
                <div>
                  <p className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">Sertakan File PDF Lampiran</p>
                  <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Pencadangan dalam format ZIP lengkap</p>
                </div>
                <md-checkbox
                  checked={includePdfBackup}
                  onClick={() => setIncludePdfBackup(!includePdfBackup)}
                ></md-checkbox>
              </div>
            </div>

            {/* Grouped Actions (Utama, Diagnostik, Bahaya) */}
            <div className="flex flex-col gap-6 bg-[var(--md-sys-color-surface-container-low)] p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
              {/* Tindakan Utama */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1">Tindakan Utama</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buat Cadangan */}
                  <div className="flex flex-col justify-between p-4 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">cloud_upload</span>
                        Buat Cadangan Baru
                      </h4>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1">
                        Membuat berkas arsip database baru di server (mencakup PDF jika dicentang).
                      </p>
                    </div>
                    <md-filled-button
                      onClick={() => triggerAction('createBackup')}
                      disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                      className="w-full"
                    >
                      {activeLoading.create ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          Memproses...
                        </span>
                      ) : (
                        'Cadangkan Sekarang'
                      )}
                    </md-filled-button>
                  </div>

                  {/* Ekspor */}
                  <div className="flex flex-col justify-between p-4 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">download</span>
                        Ekspor File Data
                      </h4>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1">
                        Mengompresi dan mengunduh seluruh data persuratan saat ini ke perangkat lokal Anda.
                      </p>
                    </div>
                    <md-outlined-button
                      onClick={() => triggerAction('exportData')}
                      disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                      className="w-full"
                    >
                      {activeLoading.export ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          Mengekspor...
                        </span>
                      ) : (
                        'Ekspor Berkas ZIP'
                      )}
                    </md-outlined-button>
                  </div>
                </div>
              </div>

              {/* Utilitas & Diagnostik */}
              <div className="flex flex-col gap-3 border-t border-[var(--md-sys-color-outline-variant)] pt-4">
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1">Utilitas & Diagnostik</span>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Periksa Integritas */}
                  <div className="flex flex-col justify-between p-4 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm font-fill text-[var(--md-sys-color-primary)]">verified_user</span>
                        Periksa Integritas
                      </h4>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1">
                        Memverifikasi kelengkapan seluruh berkas PDF lampiran fisik pada server.
                      </p>
                    </div>
                    <md-outlined-button
                      onClick={() => triggerAction('checkIntegrity')}
                      disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                      className="w-full"
                    >
                      {activeLoading.integrity ? (
                        <span className="flex items-center justify-center gap-1">
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        </span>
                      ) : (
                        'Periksa'
                      )}
                    </md-outlined-button>
                  </div>

                  {/* Bersihkan File Yatim */}
                  <div className="flex flex-col justify-between p-4 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[var(--md-sys-color-primary)]">clean_hands</span>
                        Bersihkan File Yatim
                      </h4>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1">
                        Menghapus PDF uploads di server yang tidak terhubung ke record database mana pun.
                      </p>
                    </div>
                    <md-outlined-button
                      onClick={() => triggerAction('cleanupOrphans')}
                      disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                      className="w-full"
                    >
                      {activeLoading.cleanup ? (
                        <span className="flex items-center justify-center gap-1">
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        </span>
                      ) : (
                        'Bersihkan'
                      )}
                    </md-outlined-button>
                  </div>

                  {/* Rekonstruksi Metadata */}
                  <div className="flex flex-col justify-between p-4 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[var(--md-sys-color-primary)]">construction</span>
                        Rekonstruksi Metadata
                      </h4>
                      <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1">
                        Memulihkan record surat baru secara otomatis berdasarkan file PDF yatim di server.
                      </p>
                    </div>
                    <md-outlined-button
                      onClick={() => triggerAction('reconstructMetadata')}
                      disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                      className="w-full"
                    >
                      {activeLoading.reconstruct ? (
                        <span className="flex items-center justify-center gap-1">
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        </span>
                      ) : (
                        'Rekonstruksi'
                      )}
                    </md-outlined-button>
                  </div>
                </div>
              </div>

              {/* Zona Bahaya */}
              <div className="flex flex-col gap-3 border-t border-[var(--md-sys-color-outline-variant)] pt-4">
                <span className="text-[10px] font-bold text-[var(--md-sys-color-error)] uppercase tracking-wider ml-1">Zona Bahaya</span>
                <div className="flex flex-col p-5 bg-[var(--md-sys-color-error-container)]/10 rounded-2xl border border-[var(--md-sys-color-error)]/30 gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--md-sys-color-error)] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">warning</span>
                      Hapus Seluruh Data Sistem
                    </h4>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1.5">
                      PENTING: Tindakan destruktif ini akan menghapus seluruh data agenda surat, seluruh file uploads PDF di server, dan mereset kredensial admin ke bawaan.
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <md-filled-button
                      onClick={() => triggerAction('clearSystem')}
                      disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                      style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)', '--md-filled-button-label-text-color': 'var(--md-sys-color-on-error)' }}
                      className="w-full sm:w-auto"
                    >
                      {activeLoading.clear ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          Menghapus...
                        </span>
                      ) : (
                        'Hapus Seluruh Data'
                      )}
                    </md-filled-button>
                  </div>
                </div>
              </div>
            </div>

            {/* Import drag and drop / upload zone */}
            <div
              onClick={() => {
                if (!Object.values(activeLoading).some(Boolean)) {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-6 text-center cursor-pointer bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)]/50 hover:border-[var(--md-sys-color-primary)] transition-premium flex flex-col items-center justify-center gap-1.5 ${
                Object.values(activeLoading).some(Boolean) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              <span className="material-symbols-outlined text-3xl text-[var(--md-sys-color-primary)] font-fill">upload_file</span>
              <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Unggah berkas JSON atau ZIP ekspor Anda</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Format .json atau .zip, maks 100MB</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFileChange}
                accept=".json,.zip"
                className="hidden"
                disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
              />
            </div>

            {/* Backups List Table */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest ml-1">DAFTAR CADANGAN DI SERVER</h4>
                <button
                  onClick={fetchBackups}
                  disabled={Object.values(activeLoading).some(Boolean)}
                  className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)]/80 hover:underline flex items-center gap-1 cursor-pointer transition-premium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">sync</span>
                  Segarkan
                </button>
              </div>

              <div className="border border-[var(--md-sys-color-outline-variant)] rounded-2xl overflow-x-auto bg-[var(--md-sys-color-surface-container-low)]">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Label Cadangan</th>
                      <th className="px-4 py-3">Ukuran</th>
                      <th className="px-4 py-3">Dibuat Pada</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(b => (
                      <tr key={b.filename} className="border-b border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]/30 transition-premium">
                        <td className="px-4 py-3 font-semibold text-[var(--md-sys-color-on-surface)] max-w-[180px] truncate" title={b.filename}>
                          {b.label}
                        </td>
                        <td className="px-4 py-3 text-[var(--md-sys-color-on-surface-variant)] font-mono font-tabular">
                          {formatSize(b.sizeBytes)}
                        </td>
                        <td className="px-4 py-3 text-[var(--md-sys-color-on-surface-variant)] font-mono font-tabular">
                          {new Date(b.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => triggerAction('restoreBackup', b.filename)}
                              disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                              className="px-2.5 py-1 bg-[var(--md-sys-color-primary-container)] hover:bg-[var(--md-sys-color-primary-container)]/80 text-[var(--md-sys-color-on-primary-container)] rounded-lg font-bold transition-premium active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {activeLoading[`restore_${b.filename}`] ? (
                                <span className="flex items-center gap-1">
                                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                  Proses
                                </span>
                              ) : (
                                'Pulihkan'
                              )}
                            </button>
                            <a
                              href={`/api/backup/download/${b.filename}`}
                              className={`px-2.5 py-1 bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] rounded-lg font-bold transition-premium active:scale-95 inline-flex items-center gap-0.5 ${
                                Object.values(activeLoading).some(Boolean) ? 'opacity-50 pointer-events-none' : ''
                              }`}
                              title="Unduh berkas backup"
                            >
                              <span className="material-symbols-outlined text-xs">download</span>
                            </a>
                            <button
                              onClick={() => triggerAction('deleteBackup', b.filename)}
                              disabled={Object.values(activeLoading).some(Boolean) ? true : undefined}
                              className="px-2.5 py-1 bg-[var(--md-sys-color-error-container)]/40 hover:bg-[var(--md-sys-color-error-container)]/80 text-[var(--md-sys-color-error)] rounded-lg font-bold transition-premium active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus backup dari server"
                            >
                              {activeLoading[`delete_${b.filename}`] ? (
                                <span className="flex items-center justify-center">
                                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-xs">delete</span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {backups.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-600 italic">
                          Belum ada file cadangan di server.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Cetak Tanda Terima */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2.5rem-0.375rem)] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-5">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--md-sys-color-on-surface)] font-display">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] font-fill">receipt_long</span>
              Kolom Cetak Tanda Terima
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Tentukan kolom mana saja yang ingin disertakan di hasil cetak PDF tanda terima surat.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {columns.map(col => {
                const isChecked = col.includeInReceipt !== false;
                return (
                  <div
                    key={col.key}
                    onClick={() => handleToggleReceiptCol(col.key)}
                    className={`p-3 border rounded-2xl flex items-center justify-between cursor-pointer transition-premium active:scale-95 ${
                      isChecked
                        ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                        : 'border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]/50 text-[var(--md-sys-color-on-surface-variant)]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">{col.label}</p>
                      <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono uppercase tracking-wider">{col.type}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isChecked ? 'bg-green-150 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-outline)]'
                    }`}>
                      {isChecked ? 'Dicetak' : 'Sembunyi'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Skema Kolom Dinamis */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2.5rem-0.375rem)] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--md-sys-color-on-surface)] font-display">
                <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] font-fill">splitscreen</span>
                Skema Kolom Dinamis
              </h2>
              <md-filled-button onClick={() => setShowAddCol(true)}>
                <span slot="icon" className="material-symbols-outlined">add</span>
                Tambah Kolom
              </md-filled-button>
            </div>
 
            {/* Profiles Section */}
            <div className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl mb-6">
              <div className="flex-1 w-full">
                <md-filled-select
                  label="Profil Kolom Aktif"
                  value={activeProfileId}
                  onInput={(e: any) => handleSelectProfile(e.target.value)}
                  className="w-full"
                >
                  <md-select-option value="">-- Kustom (Belum Disimpan) --</md-select-option>
                  {columnProfiles.map(p => (
                    <md-select-option key={p.id} value={p.id}>{p.name}</md-select-option>
                  ))}
                </md-filled-select>
              </div>

              {activeProfileId && (
                <button
                  onClick={() => handleDeleteProfile(activeProfileId)}
                  className="w-full sm:w-auto px-4 py-3 border border-red-200 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-xl text-xs font-bold transition-premium active:scale-95 cursor-pointer shadow-sm h-[56px]"
                >
                  Hapus Profil
                </button>
              )}
            </div>

            {/* Profile Saving field */}
            <div className="flex flex-col sm:flex-row items-center gap-3 px-4 py-2 border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl mb-6 bg-[var(--md-sys-color-surface-container-low)]">
              <input
                type="text"
                placeholder="Nama profil skema baru..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="w-full sm:flex-grow bg-transparent border-none outline-none py-2 text-sm text-[var(--md-sys-color-on-surface)]"
              />
              <md-outlined-button onClick={handleSaveAsNewProfile} className="w-full sm:w-auto">
                Simpan Profil
              </md-outlined-button>
            </div>
 
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mb-3 italic">
                * Tahan ikon pegangan di sisi kiri kolom untuk menyeret dan mengurutkan ulang.
              </p>

              {/* Reorderable columns list */}
              <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-1">
                {columns.map((col, idx) => (
                  <div
                    key={col.key}
                    draggable={dragAllowedKey === col.key}
                    onDragStart={(e) => {
                      setDraggedIdx(idx);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={() => setDraggedIdx(null)}
                    className={`p-3 bg-[var(--md-sys-color-surface-container)] border rounded-2xl flex items-center justify-between hover:bg-[var(--md-sys-color-surface-container-highest)]/50 transition-all select-none ${
                      draggedIdx === idx
                        ? 'opacity-40 border-dashed border-[var(--md-sys-color-primary)] scale-95'
                        : 'border-[var(--md-sys-color-outline-variant)] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      {/* Drag Handle Icon */}
                      <div
                        onMouseEnter={() => setDragAllowedKey(col.key)}
                        onMouseLeave={() => setDragAllowedKey(null)}
                        className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-grab active:cursor-grabbing p-1"
                      >
                        <span className="material-symbols-outlined text-lg">drag_indicator</span>
                      </div>

                      {/* Up/Down buttons backup */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveColumn(idx, 'up')}
                          className="text-[10px] opacity-50 hover:opacity-100 disabled:opacity-20 cursor-pointer text-slate-500 dark:text-slate-400"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === columns.length - 1}
                          onClick={() => handleMoveColumn(idx, 'down')}
                          className="text-[10px] opacity-50 hover:opacity-100 disabled:opacity-20 cursor-pointer text-slate-500 dark:text-slate-400"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-850 dark:text-slate-200 truncate">{col.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{col.type}</span>
                          {col.required && (
                            <span className="text-[10px] bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">WAJIB</span>
                          )}
                          {col.includeInReceipt !== false && (
                            <span className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px] font-fill">receipt_long</span>
                              STRUK
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <md-icon-button onClick={() => handleStartEditColumn(col)}>
                        <span className="material-symbols-outlined text-base text-slate-500 dark:text-slate-400">edit</span>
                      </md-icon-button>
                      <md-icon-button onClick={() => handleDeleteColumn(col.key)}>
                        <span className="material-symbols-outlined text-base text-red-500 dark:text-red-400">delete</span>
                      </md-icon-button>
                    </div>
                  </div>
                ))}

                {columns.length === 0 && (
                  <div className="p-16 text-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="italic opacity-60">Belum ada kolom didefinisikan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card for Save Changes */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2.5rem] p-1.5 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2.5rem-0.375rem)] p-6 sm:p-8 flex justify-end gap-3">
            <md-filled-button onClick={handleSave}>
              <span slot="icon" className="material-symbols-outlined">save</span>
              Simpan Perubahan
            </md-filled-button>
          </div>
        </div>

      {/* dialog Add Column */}
      <AnimatePresence>
        {showAddCol && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCol(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-2">
                <h3 className="text-xl font-bold font-display text-[var(--md-sys-color-on-surface)]">
                  Tambah Kolom Baru
                </h3>
              </div>

              {/* Content Form */}
              <form id="add-col-form" className="px-6 py-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]" onSubmit={handleAddColumnSubmit}>
                {colError && <p className="text-xs text-red-500 font-bold ml-1">{colError}</p>}
                
                <md-filled-text-field
                  label="Key Kolom (Contoh: perihal, noSurat)"
                  value={newColKey}
                  onInput={(e: any) => setNewColKey(e.target.value)}
                  required
                  className="w-full"
                ></md-filled-text-field>

                <md-filled-text-field
                  label="Label Tampilan (Contoh: Perihal, Nomor Surat)"
                  value={newColLabel}
                  onInput={(e: any) => setNewColLabel(e.target.value)}
                  required
                  className="w-full"
                ></md-filled-text-field>

                <md-filled-select
                  label="Tipe Data"
                  value={newColType}
                  onInput={(e: any) => setNewColType(e.target.value as ColumnType)}
                  className="w-full"
                >
                  <md-select-option value="text">Teks</md-select-option>
                  <md-select-option value="date">Tanggal</md-select-option>
                  <md-select-option value="number">Angka</md-select-option>
                </md-filled-select>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl mt-2">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Wajib Diisi (Required)</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-550">Validasi formulir sebelum disimpan</p>
                  </div>
                  <md-checkbox
                    checked={newColRequired || undefined}
                    onClick={() => setNewColRequired(!newColRequired)}
                  ></md-checkbox>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Tampilkan di Cetak Tanda Terima</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-550">Masukkan informasi kolom ini pada PDF tanda terima</p>
                  </div>
                  <md-checkbox
                    checked={newColIncludeInReceipt || undefined}
                    onClick={() => setNewColIncludeInReceipt(!newColIncludeInReceipt)}
                  ></md-checkbox>
                </div>
              </form>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-end gap-3">
                <md-text-button type="button" onClick={() => setShowAddCol(false)}>Batal</md-text-button>
                <md-filled-button type="button" onClick={handleAddColumnSubmit}>Tambah</md-filled-button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* dialog Edit Column */}
      <AnimatePresence>
        {editingColumn && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingColumn(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-2">
                <h3 className="text-xl font-bold font-display text-[var(--md-sys-color-on-surface)]">
                  Edit Kolom: {editingColumn.key}
                </h3>
              </div>

              {/* Content Form */}
              <form id="edit-col-form" className="px-6 py-4 flex flex-col gap-4 overflow-y-auto max-h-[70vh]" onSubmit={handleSaveEditColumn}>
                {editColError && <p className="text-xs text-red-500 font-bold ml-1">{editColError}</p>}
                
                <md-filled-text-field
                  label="Label Tampilan"
                  value={editColLabel}
                  onInput={(e: any) => setEditColLabel(e.target.value)}
                  required
                  className="w-full"
                ></md-filled-text-field>

                <md-filled-select
                  label="Tipe Data"
                  value={editColType}
                  onInput={(e: any) => setEditColType(e.target.value as ColumnType)}
                  className="w-full"
                >
                  <md-select-option value="text">Teks</md-select-option>
                  <md-select-option value="date">Tanggal</md-select-option>
                  <md-select-option value="number">Angka</md-select-option>
                </md-filled-select>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl mt-2">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Wajib Diisi (Required)</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-550">Validasi formulir sebelum disimpan</p>
                  </div>
                  <md-checkbox
                    checked={editColRequired || undefined}
                    onClick={() => setEditColRequired(!editColRequired)}
                  ></md-checkbox>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Tampilkan di Cetak Tanda Terima</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-550">Masukkan informasi kolom ini pada PDF tanda terima</p>
                  </div>
                  <md-checkbox
                    checked={editColIncludeInReceipt || undefined}
                    onClick={() => setEditColIncludeInReceipt(!editColIncludeInReceipt)}
                  ></md-checkbox>
                </div>
              </form>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-end gap-3">
                <md-text-button type="button" onClick={() => setEditingColumn(null)}>Batal</md-text-button>
                <md-filled-button type="button" onClick={handleSaveEditColumn}>Simpan</md-filled-button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[2rem] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-2xl ${confirmDialog.isDanger ? 'text-[var(--md-sys-color-error)] animate-pulse' : 'text-[var(--md-sys-color-primary)]'}`}>
                  {confirmDialog.isDanger ? 'warning' : 'help'}
                </span>
                <h3 className="text-base font-bold font-display">{confirmDialog.title}</h3>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-2.5 mt-2">
                <md-text-button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
                  Batal
                </md-text-button>
                <md-filled-button
                  onClick={handleConfirmAction}
                  style={confirmDialog.isDanger ? { '--md-filled-button-container-color': 'var(--md-sys-color-error)', '--md-filled-button-label-text-color': 'var(--md-sys-color-on-error)' } : undefined}
                >
                  Lanjutkan
                </md-filled-button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert & Progress Dialog */}
      <AnimatePresence>
        {alertDialog.isOpen && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[2rem] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-4 text-center items-center"
            >
              {/* Spinner / Progress circle */}
              {alertDialog.countdown !== undefined && alertDialog.countdown > 0 ? (
                <div className="w-16 h-16 relative flex items-center justify-center mb-1">
                  {/* Outer circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      className="stroke-[var(--md-sys-color-outline-variant)]/30 fill-none"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      className="stroke-[var(--md-sys-color-primary)] fill-none transition-all duration-1000 ease-linear animate-pulse"
                      strokeWidth="4"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 * (1 - alertDialog.countdown / 3)}
                    />
                  </svg>
                  <span className="absolute text-lg font-bold font-mono">{alertDialog.countdown}</span>
                </div>
              ) : (
                <span className={`material-symbols-outlined text-4xl mb-1 ${
                  alertDialog.type === 'error' ? 'text-[var(--md-sys-color-error)]' :
                  alertDialog.type === 'success' ? 'text-emerald-500' : 'text-[var(--md-sys-color-primary)]'
                }`}>
                  {alertDialog.type === 'error' ? 'error' :
                   alertDialog.type === 'success' ? 'check_circle' : 'info'}
                </span>
              )}

              <h3 className="text-base font-bold font-display">{alertDialog.title}</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                {alertDialog.message}
              </p>

              {/* Only show Close button if there is no auto-countdown running */}
              {alertDialog.countdown === undefined && (
                <md-filled-button
                  onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                  className="mt-2 min-w-[80px]"
                >
                  Tutup
                </md-filled-button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

