import React, { useState, useEffect } from 'react';
import { ColumnDefinition, ColumnProfile, ColumnType, AppConfig } from '../types';
import { generateM3Theme } from '../utils/theme';

export default function Settings({
  config,
  onSaveConfig
}: {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
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
  }, [config]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(''), 4000);
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

  // Add Column Handler
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

  // Edit Column Handler
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
    // Also remove from PDF rename columns list if exists
    setPdfRenameCols(prev => prev.filter(k => k !== key));
    showNotification(`Kolom dengan key "${key}" dihapus.`);
  };

  // Column Profile Handlers
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

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 p-4 relative pb-24">
      {/* Toast Notification */}
      {statusMsg && (
        <div className={`fixed bottom-24 right-8 z-50 p-4 rounded-2xl shadow-lg flex items-center gap-3 transition-opacity duration-300 ${statusType === 'success' ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' : 'bg-red-100 text-red-800'}`}>
          <span className="material-symbols-outlined">{statusType === 'success' ? 'check_circle' : 'error'}</span>
          <span className="text-sm font-bold">{statusMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)]">Pengaturan Sistem</h1>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">Kelola konfigurasi branding, skema kolom dinamis, dan pengelolaan PDF.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Branding and PDF Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Tampilan & Branding */}
          <section className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[28px] border border-[var(--md-sys-color-outline-variant)]">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)]">palette</span>
              Tampilan & Branding
            </h2>
            <div className="flex flex-col gap-4">
              <md-filled-text-field
                label="Nama Aplikasi / Instansi"
                value={appName}
                onInput={(e: any) => setAppName(e.target.value)}
              ></md-filled-text-field>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <md-filled-select
                    label="Tipe Logo"
                    value={logoType}
                    onInput={(e: any) => setLogoType(e.target.value)}
                  >
                    <md-select-option value="emoji">Emoji</md-select-option>
                    <md-select-option value="image">Gambar URL</md-select-option>
                  </md-filled-select>
                </div>
                <div className="col-span-2">
                  <md-filled-text-field
                    label={logoType === 'emoji' ? 'Karakter Emoji' : 'URL Gambar Logo'}
                    value={logoUrl}
                    onInput={(e: any) => setLogoUrl(e.target.value)}
                    className="w-full"
                  ></md-filled-text-field>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] ml-1">WARNA TEMA (SEED COLOR)</label>
                <div className="flex flex-wrap gap-2">
                  {['#2563eb', '#0d9488', '#7c3aed', '#db2777', '#475569'].map(color => (
                    <button
                      key={color}
                      onClick={() => setThemeColor(color)}
                      className={`w-10 h-10 rounded-full border-4 ${themeColor === color ? 'border-[var(--md-sys-color-outline)]' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-10 h-10 rounded-full overflow-hidden border-none p-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Manajemen Berkas & Auto-Rename */}
          <section className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[28px] border border-[var(--md-sys-color-outline-variant)]">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--md-sys-color-primary)]">description</span>
              Manajemen Berkas & Unggahan
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Kompresi PDF Otomatis</p>
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
                  <md-select-option value="low">Low (Kualitas Gambar Tinggi)</md-select-option>
                  <md-select-option value="medium">Medium (Ukuran Seimbang)</md-select-option>
                  <md-select-option value="high">High (Kompresi Maksimal)</md-select-option>
                </md-filled-select>
              )}

              <md-filled-text-field
                label="Maksimum Ukuran PDF (MB)"
                type="number"
                value={maxUploadSizeMb}
                onInput={(e: any) => setMaxUploadSizeMb(parseInt(e.target.value) || 50)}
              ></md-filled-text-field>

              <md-filled-text-field
                label="Masa Retensi Cadangan Otomatis (Hari)"
                type="number"
                value={backupRetentionDays}
                onInput={(e: any) => setBackupRetentionDays(parseInt(e.target.value) || 7)}
              ></md-filled-text-field>

              <md-divider className="my-2"></md-divider>

              {/* Auto Rename Config */}
              <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Penamaan Berkas PDF Otomatis</p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Format: [Nilai Kolom1]-[Nilai Kolom2].pdf</p>
                </div>
                <md-checkbox
                  checked={autoRenamePdf}
                  onClick={() => setAutoRenamePdf(!autoRenamePdf)}
                ></md-checkbox>
              </div>

              {autoRenamePdf && (
                <div className="flex flex-col gap-2 p-3 border border-[var(--md-sys-color-outline-variant)] rounded-2xl bg-[var(--md-sys-color-surface-container-low)]">
                  <label className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] ml-1">PILIH KOLOM UNTUK FORMAT NAMA</label>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {columns.map(col => (
                      <label key={col.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer transition-colors text-sm">
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
          </section>
        </div>

        {/* Right Column: Dynamic Schema and Profiles */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Skema Kolom Dinamis */}
          <section className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[28px] border border-[var(--md-sys-color-outline-variant)] flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--md-sys-color-primary)]">splitscreen</span>
                Skema Kolom Dinamis
              </h2>
              <md-filled-button onClick={() => setShowAddCol(true)} style={{ '--md-filled-button-container-shape': '16px' }}>
                <span slot="icon" className="material-symbols-outlined">add</span>
                Tambah Kolom
              </md-filled-button>
            </div>

            {/* Profiles Section */}
            <div className="flex items-end gap-3 p-4 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl mb-6">
              <div className="flex-1">
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
                <md-outlined-button onClick={() => handleDeleteProfile(activeProfileId)} style={{ '--md-outlined-button-outline-color': 'red', '--md-outlined-button-label-text-color': 'red' }}>
                  Hapus Profil
                </md-outlined-button>
              )}
            </div>

            {/* Profile Saving field */}
            <div className="flex items-center gap-3 px-4 py-2 border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl mb-6">
              <input
                type="text"
                placeholder="Nama profil skema baru..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="flex-grow bg-transparent border-none outline-none text-sm text-[var(--md-sys-color-on-surface)]"
              />
              <md-outlined-button onClick={handleSaveAsNewProfile}>
                Simpan Profil
              </md-outlined-button>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3 italic">
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
                  className={`p-3 bg-[var(--md-sys-color-surface-container-low)] border rounded-2xl flex items-center justify-between hover:bg-[var(--md-sys-color-surface-container-high)] transition-all select-none ${
                    draggedIdx === idx
                      ? 'opacity-40 border-dashed border-[var(--md-sys-color-primary)] scale-95'
                      : 'border-[var(--md-sys-color-outline-variant)]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {/* Drag Handle Icon */}
                    <div
                      onMouseEnter={() => setDragAllowedKey(col.key)}
                      onMouseLeave={() => setDragAllowedKey(null)}
                      className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-grab active:cursor-grabbing p-1"
                    >
                      <span className="material-symbols-outlined text-lg">drag_indicator</span>
                    </div>

                    {/* Up/Down buttons backup */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveColumn(idx, 'up')}
                        className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20 cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === columns.length - 1}
                        onClick={() => handleMoveColumn(idx, 'down')}
                        className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20 cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">{col.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{col.type}</span>
                        {col.required && (
                          <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-bold">WAJIB</span>
                        )}
                        {col.includeInReceipt !== false && (
                          <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px] font-fill">receipt_long</span>
                            STRUK
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <md-icon-button onClick={() => handleStartEditColumn(col)}>
                      <span className="material-symbols-outlined text-base">edit</span>
                    </md-icon-button>
                    <md-icon-button onClick={() => handleDeleteColumn(col.key)}>
                      <span className="material-symbols-outlined text-base text-red-500">delete</span>
                    </md-icon-button>
                  </div>
                </div>
              ))}

              {columns.length === 0 && (
                <div className="p-16 text-center text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl">
                  <p className="italic opacity-60">Belum ada kolom didefinisikan.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Global save button bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--md-sys-color-surface-container-high)] border-t border-[var(--md-sys-color-outline-variant)] flex justify-end gap-3 z-30 shadow-md">
        <md-filled-button onClick={handleSave} style={{ padding: '0 32px' }}>
          <span slot="icon" className="material-symbols-outlined">save</span>
          Simpan Perubahan
        </md-filled-button>
      </div>

      {/* dialog Add Column */}
      <md-dialog open={showAddCol} onClose={() => setShowAddCol(false)} style={{ maxWidth: '480px', width: '90vw' }}>
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

          <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] rounded-xl mt-2">
            <div>
              <p className="font-bold text-sm">Wajib Diisi (Required)</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Validasi formulir sebelum disimpan</p>
            </div>
            <md-checkbox
              checked={newColRequired}
              onClick={() => setNewColRequired(!newColRequired)}
            ></md-checkbox>
          </div>

          <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] rounded-xl">
            <div>
              <p className="font-bold text-sm">Tampilkan di Cetak Tanda Terima</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Masukkan informasi kolom ini pada PDF tanda terima</p>
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
      <md-dialog open={!!editingColumn} onClose={() => setEditingColumn(null)} style={{ maxWidth: '480px', width: '90vw' }}>
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

          <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] rounded-xl mt-2">
            <div>
              <p className="font-bold text-sm">Wajib Diisi (Required)</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Validasi formulir sebelum disimpan</p>
            </div>
            <md-checkbox
              checked={editColRequired}
              onClick={() => setEditColRequired(!editColRequired)}
            ></md-checkbox>
          </div>

          <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] rounded-xl">
            <div>
              <p className="font-bold text-sm">Tampilkan di Cetak Tanda Terima</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Masukkan informasi kolom ini pada PDF tanda terima</p>
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
