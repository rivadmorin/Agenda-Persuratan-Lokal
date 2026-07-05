import React, { useState, useEffect, useRef } from 'react';
import { ColumnDefinition, ColumnProfile, ColumnType, AppConfig } from '../types';
import { generateM3Theme } from '../utils/theme';
import { Hct, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

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
  const [logoType, setLogoType] = useState<'lucide' | 'emoji' | 'image'>(config.logoType || 'emoji');
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '📨');
  const [autoCompressPdf, setAutoCompressPdf] = useState(config.autoCompressPdf);
  const [pdfCompressionLevel, setPdfCompressionLevel] = useState<'low' | 'medium' | 'high'>(config.pdfCompressionLevel || 'medium');
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(config.maxUploadSizeMb || 50);
  const [backupRetentionDays, setBackupRetentionDays] = useState(config.backupRetentionDays || 7);
  const [autoRenamePdf, setAutoRenamePdf] = useState(config.autoRenamePdf !== false);
  const [pdfRenameCols, setPdfRenameCols] = useState<string[]>(config.pdfRenameCols || ['noSurat']);

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

  useEffect(() => {
    const hct = getHctFromHex(themeColor || '#0d9488');
    setHue(hct.hue);
    setChroma(hct.chroma);
    setTone(hct.tone);
  }, [themeColor]);

  const handleHueChange = (h: number) => {
    // We use a fixed vibrant chroma and medium tone for the "instant" theme color
    const newHct = Hct.from(h, 48, 40);
    const newHex = hexFromArgb(newHct.toInt());
    setThemeColor(newHex);
    generateM3Theme(newHex);
  };

  useEffect(() => {
    setAppName(config.appName);
    setThemeColor(config.themeColor);
    setLogoType(config.logoType || 'emoji');
    setLogoUrl(config.logoUrl || '📨');
    setAutoCompressPdf(config.autoCompressPdf);
    setPdfCompressionLevel(config.pdfCompressionLevel || 'medium');
    setMaxUploadSizeMb(config.maxUploadSizeMb || 50);
    setBackupRetentionDays(config.backupRetentionDays || 7);
    setAutoRenamePdf(config.autoRenamePdf !== false);
    setPdfRenameCols(config.pdfRenameCols || ['noSurat']);
    setColumns([...(config.columns || [])].sort((a, b) => a.order - b.order));
    setColumnProfiles(config.columnProfiles || []);
    setActiveProfileId(config.activeProfileId || '');
    fetchBackups();
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

  const handleCreateBackup = async () => {
    setBackupsLoading(true);
    try {
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includePdf: includePdfBackup })
      });
      if (res.ok) {
        showNotification('File cadangan baru berhasil dibuat di server.');
        fetchBackups();
      } else {
        showNotification('Gagal membuat file cadangan.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Gagal membuat file cadangan.', 'error');
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berkas cadangan ini secara permanen dari server?')) return;
    try {
      const res = await fetch(`/api/backup/delete/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Berkas cadangan berhasil dihapus.');
        fetchBackups();
      }
    } catch (err) {
      console.error(err);
      showNotification('Gagal menghapus berkas cadangan.', 'error');
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm('PENTING: Seluruh data saat ini akan ditimpa dengan data cadangan ini. Anda yakin ingin melanjutkan?')) return;
    setBackupsLoading(true);
    try {
      const res = await fetch('/api/backup/restore-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Sistem berhasil dipulihkan dari cadangan lokal!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showNotification(data.message || 'Gagal memulihkan sistem.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Gagal memulihkan sistem.', 'error');
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCheckIntegrity = async () => {
    try {
      const res = await fetch('/api/backup/integrity');
      const data = await res.json();
      if (res.ok) {
        if (data.missingCount === 0) {
          alert('Integritas OK: Seluruh record database memiliki berkas lampiran PDF yang lengkap.');
        } else {
          alert(`Integritas Peringatan: Ditemukan ${data.missingCount} record surat yang berkas lampiran PDF-nya hilang di server.`);
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('Gagal memeriksa integritas data.', 'error');
    }
  };

  const handleCleanupOrphans = async () => {
    if (!confirm('Hapus seluruh berkas PDF di folder uploads yang tidak terhubung ke record database surat mana pun?')) return;
    try {
      const res = await fetch('/api/backup/integrity/cleanup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Pembersihan berkas yatim berhasil dilakukan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReconstructMetadata = async () => {
    if (!confirm('Jalankan rekonstruksi? Sistem akan memindai folder uploads dan membuat record surat baru untuk setiap berkas PDF yang tidak memiliki record database.')) return;
    try {
      const res = await fetch('/api/backup/integrity/reconstruct', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Rekonstruksi metadata berhasil dilakukan.');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearSystem = async () => {
    if (!confirm('CAUTION: Tindakan ini akan menghapus SELURUH record surat, seluruh file uploads PDF lampiran, dan mereset kredensial admin ke bawaan. Lanjutkan?')) return;
    try {
      const res = await fetch('/api/backup/clear', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Sistem berhasil dibersihkan!');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupsLoading(true);
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
          showNotification(data.message || 'Sistem berhasil dipulihkan dari berkas ZIP cadangan!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showNotification(data.message || 'Gagal memulihkan dari ZIP.', 'error');
        }
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        let dbData;
        try {
          dbData = JSON.parse(text);
        } catch {
          showNotification('File backup JSON tidak valid.', 'error');
          setBackupsLoading(false);
          return;
        }

        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbData)
        });
        const data = await res.json();
        if (res.ok) {
          showNotification('Database berhasil dipulihkan dari cadangan JSON!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showNotification(data.error || 'Gagal memulihkan dari JSON.', 'error');
        }
      } else {
        showNotification('Format berkas tidak didukung. Wajib format .json atau .zip.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Terjadi kesalahan koneksi saat memulihkan database.', 'error');
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleExportJson = () => {
    window.open('/api/backup/export-zip', '_blank');
  };

  const handleSave = () => {
    const updatedConfig: AppConfig = {
      appName,
      logoType,
      logoUrl,
      themeColor,
      autoCompressPdf,
      pdfCompressionLevel,
      maxUploadSizeMb,
      backupRetentionDays,
      backupRetentionWeeks: Math.ceil(backupRetentionDays / 7),
      columns,
      columnProfiles,
      activeProfileId,
      autoRenamePdf,
      pdfRenameCols
    };

    onSaveConfig(updatedConfig);
    if (themeColor) {
      generateM3Theme(themeColor);
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
    <div className="max-w-4xl mx-auto flex flex-col gap-6 p-4 relative pb-28 text-[var(--md-sys-color-on-surface)]">
      {/* Toast Notification */}
      {statusMsg && (
        <div className={`fixed bottom-24 right-8 z-50 p-4 rounded-2xl shadow-lg flex items-center gap-3 transition-premium ${statusType === 'success' ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'}`}>
          <span className="material-symbols-outlined">{statusType === 'success' ? 'check_circle' : 'error'}</span>
          <span className="text-sm font-bold">{statusMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)]">Pengaturan Sistem</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Kelola konfigurasi branding, skema kolom dinamis, dan pengelolaan PDF.</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Tampilan & Branding */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-1 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2rem-0.25rem)] p-5">
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

              <div className="flex flex-col gap-4 mt-2">
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1">Kustomisasi Warna Tema</span>

                {/* Hex Color Input + Visual Preview */}
                <div className="flex items-center gap-4">
                  <md-filled-text-field
                    label="Seed Color (HEX)"
                    value={themeColor}
                    onInput={(e: any) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        setThemeColor(hex);
                        generateM3Theme(hex);
                      }
                    }}
                    className="flex-1"
                  >
                    <md-icon slot="leading-icon">palette</md-icon>
                  </md-filled-text-field>
                  <div
                    className="w-12 h-12 rounded-full border border-[var(--md-sys-color-outline-variant)] shadow-sm shrink-0"
                    style={{ backgroundColor: themeColor }}
                  ></div>
                </div>

                {/* Single Hue Slider */}
                <div className="flex flex-col gap-1 bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex justify-between text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider px-1">
                    <span>Pilih Warna (Hue)</span>
                    <span>{Math.round(hue)}°</span>
                  </div>
                  <md-slider
                    min="0"
                    max="360"
                    value={Math.round(hue)}
                    className="slider-hue-track"
                    onInput={(e: any) => {
                      const val = Number(e.target.value);
                      setHue(val);
                      handleHueChange(val);
                    }}
                  ></md-slider>
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
        </div>

        {/* Manajemen Berkas & Auto-Rename */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-1 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2rem-0.25rem)] p-5">
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
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Format: [Nilai Kolom1]-[Nilai Kolom2].pdf</p>
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

        {/* Backup & Pemulihan (Double Bezel) */}
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-1 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2rem-0.25rem)] p-5 flex flex-col gap-5">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--md-sys-color-on-surface)] font-display">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] font-fill">backup</span>
              Sistem Database Backup & Pemulihan
            </h2>

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
            <div className="flex flex-col gap-5 bg-[var(--md-sys-color-surface-container-low)] p-5 rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1">Tindakan Utama</span>
                <div className="flex flex-wrap gap-3">
                  <md-filled-button
                    onClick={handleCreateBackup}
                    disabled={backupsLoading ? true : undefined}
                    className="w-full sm:w-auto sm:min-w-[200px]"
                  >
                    <span slot="icon" className="material-symbols-outlined">cloud_upload</span>
                    Buat Cadangan Baru
                  </md-filled-button>
                  <md-outlined-button onClick={handleExportJson} className="w-full sm:w-auto sm:min-w-[200px]">
                    <span slot="icon" className="material-symbols-outlined">download</span>
                    Ekspor File Data
                  </md-outlined-button>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-[var(--md-sys-color-outline-variant)] pt-3">
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider ml-1">Utilitas & Diagnostik</span>
                <div className="flex flex-wrap gap-3">
                  <md-outlined-button onClick={handleCheckIntegrity} className="w-full sm:w-auto sm:min-w-[160px]">
                    <span slot="icon" className="material-symbols-outlined font-fill">verified_user</span>
                    Periksa Integritas
                  </md-outlined-button>
                  <md-outlined-button onClick={handleCleanupOrphans} className="w-full sm:w-auto sm:min-w-[160px]">
                    <span slot="icon" className="material-symbols-outlined">clean_hands</span>
                    Bersihkan File Yatim
                  </md-outlined-button>
                  <md-outlined-button onClick={handleReconstructMetadata} className="w-full sm:w-auto sm:min-w-[160px]">
                    <span slot="icon" className="material-symbols-outlined">construction</span>
                    Rekonstruksi Metadata
                  </md-outlined-button>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-[var(--md-sys-color-outline-variant)] pt-3">
                <span className="text-[10px] font-bold text-[var(--md-sys-color-error)] uppercase tracking-wider ml-1">Zona Bahaya</span>
                <div className="flex flex-wrap gap-3">
                  <md-outlined-button
                    onClick={handleClearSystem}
                    className="w-full sm:w-auto sm:min-w-[200px]"
                    style={{ '--md-outlined-button-outline-color': 'var(--md-sys-color-error)', '--md-outlined-button-label-text-color': 'var(--md-sys-color-error)' } as any}
                  >
                    <span slot="icon" className="material-symbols-outlined">delete_forever</span>
                    Hapus Seluruh Data
                  </md-outlined-button>
                </div>
              </div>
            </div>

            {/* Import drag and drop / upload zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-6 text-center cursor-pointer bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)]/50 hover:border-[var(--md-sys-color-primary)] transition-premium flex flex-col items-center justify-center gap-1.5"
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
              />
            </div>

            {/* Backups List Table */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest ml-1">DAFTAR CADANGAN DI SERVER</h4>
                 <button
                   onClick={fetchBackups}
                   className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)]/80 hover:underline flex items-center gap-1 cursor-pointer transition-premium"
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
                              onClick={() => handleRestoreBackup(b.filename)}
                              className="px-2.5 py-1 bg-[var(--md-sys-color-primary-container)] hover:bg-[var(--md-sys-color-primary-container)]/80 text-[var(--md-sys-color-on-primary-container)] rounded-lg font-bold transition-premium active:scale-95 cursor-pointer"
                            >
                              Pulihkan
                            </button>
                            <a
                              href={`/api/backup/download/${b.filename}`}
                              className="px-2.5 py-1 bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] rounded-lg font-bold transition-premium active:scale-95 inline-flex items-center gap-0.5"
                              title="Unduh berkas backup"
                            >
                              <span className="material-symbols-outlined text-xs">download</span>
                            </a>
                            <button
                              onClick={() => handleDeleteBackup(b.filename)}
                              className="px-2.5 py-1 bg-[var(--md-sys-color-error-container)]/40 hover:bg-[var(--md-sys-color-error-container)]/80 text-[var(--md-sys-color-error)] rounded-lg font-bold transition-premium active:scale-95 cursor-pointer"
                              title="Hapus backup dari server"
                            >
                              <span className="material-symbols-outlined text-xs">delete</span>
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
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-1 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2rem-0.25rem)] p-5 flex flex-col gap-4">
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
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[2rem] p-1 transition-premium shadow-sm">
          <div className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[calc(2rem-0.25rem)] p-5 flex flex-col min-h-[400px]">
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
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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

      {/* Global save button bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--md-sys-color-surface-container-low)]/90 border-t border-[var(--md-sys-color-outline-variant)] flex justify-end gap-3 z-30 shadow-md backdrop-blur-md transition-premium">
        <md-filled-button onClick={handleSave} style={{ padding: '0 32px' }}>
          <span slot="icon" className="material-symbols-outlined">save</span>
          Simpan Perubahan
        </md-filled-button>
      </div>

      {/* dialog Add Column */}
      <md-dialog open={showAddCol ? true : undefined} onClose={() => setShowAddCol(false)} style={{ maxWidth: '480px', width: '90vw' }}>
        <span slot="headline">Tambah Kolom Baru</span>
        <form slot="content" id="add-col-form" className="flex flex-col gap-4 py-4" onSubmit={handleAddColumnSubmit}>
          {colError && <p className="text-xs text-red-500 font-bold ml-1">{colError}</p>}
          <md-filled-text-field
            label="Key Kolom (Contoh: perihal, noSurat)"
            value={newColKey}
            onInput={(e: any) => setNewColKey(e.target.value)}
            required
          ></md-filled-text-field>

          <md-filled-text-field
            label="Label Tampilan (Contoh: Perihal, Nomor Surat)"
            value={newColLabel}
            onInput={(e: any) => setNewColLabel(e.target.value)}
            required
          ></md-filled-text-field>

          <md-filled-select
            label="Tipe Data"
            value={newColType}
            onInput={(e: any) => setNewColType(e.target.value as ColumnType)}
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
              checked={newColRequired}
              onClick={() => setNewColRequired(!newColRequired)}
            ></md-checkbox>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Tampilkan di Cetak Tanda Terima</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-550">Masukkan informasi kolom ini pada PDF tanda terima</p>
            </div>
            <md-checkbox
              checked={newColIncludeInReceipt}
              onClick={() => setNewColIncludeInReceipt(!newColIncludeInReceipt)}
            ></md-checkbox>
          </div>
        </form>
        <div slot="actions">
          <md-text-button onClick={() => setShowAddCol(false)}>Batal</md-text-button>
          <md-filled-button onClick={handleAddColumnSubmit}>Tambah</md-filled-button>
        </div>
      </md-dialog>

      {/* dialog Edit Column */}
      <md-dialog open={editingColumn ? true : undefined} onClose={() => setEditingColumn(null)} style={{ maxWidth: '480px', width: '90vw' }}>
        <span slot="headline">Edit Kolom: {editingColumn?.key}</span>
        <form slot="content" id="edit-col-form" className="flex flex-col gap-4 py-4" onSubmit={handleSaveEditColumn}>
          {editColError && <p className="text-xs text-red-500 font-bold ml-1">{editColError}</p>}
          
          <md-filled-text-field
            label="Label Tampilan"
            value={editColLabel}
            onInput={(e: any) => setEditColLabel(e.target.value)}
            required
          ></md-filled-text-field>

          <md-filled-select
            label="Tipe Data"
            value={editColType}
            onInput={(e: any) => setEditColType(e.target.value as ColumnType)}
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
              checked={editColRequired}
              onClick={() => setEditColRequired(!editColRequired)}
            ></md-checkbox>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Tampilkan di Cetak Tanda Terima</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-550">Masukkan informasi kolom ini pada PDF tanda terima</p>
            </div>
            <md-checkbox
              checked={editColIncludeInReceipt}
              onClick={() => setEditColIncludeInReceipt(!editColIncludeInReceipt)}
            ></md-checkbox>
          </div>
        </form>
        <div slot="actions">
          <md-text-button onClick={() => setEditingColumn(null)}>Batal</md-text-button>
          <md-filled-button onClick={handleSaveEditColumn}>Simpan</md-filled-button>
        </div>
      </md-dialog>
    </div>
  );
}
