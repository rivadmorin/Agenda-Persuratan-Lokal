
import React, { useState, useEffect } from 'react';
import { MailRecord, AppConfig, User } from '../types';
import { generateM3Theme } from '../utils/theme';

export default function Settings({
  config,
  onSaveConfig
}: {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void
}) {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onSaveConfig(localConfig);
    if (localConfig.themeColor) {
      generateM3Theme(localConfig.themeColor);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)]">Pengaturan Sistem</h1>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">Kelola konfigurasi aplikasi dan tampilan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[28px] border border-[var(--md-sys-color-outline-variant)]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">palette</span>
            Tampilan & Branding
          </h2>
          <div className="flex flex-col gap-4">
            <md-filled-text-field
              label="Nama Aplikasi"
              value={localConfig.appName}
              onInput={(e: any) => setLocalConfig({ ...localConfig, appName: e.target.value })}
            ></md-filled-text-field>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] ml-1">WARNA TEMA (SEED COLOR)</label>
              <div className="flex gap-2">
                {['#2563eb', '#0d9488', '#7c3aed', '#db2777', '#475569'].map(color => (
                  <button
                    key={color}
                    onClick={() => setLocalConfig({ ...localConfig, themeColor: color })}
                    className={`w-10 h-10 rounded-full border-4 ${localConfig.themeColor === color ? 'border-[var(--md-sys-color-outline)]' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  ></button>
                ))}
                <input
                  type="color"
                  value={localConfig.themeColor}
                  onChange={(e) => setLocalConfig({ ...localConfig, themeColor: e.target.value })}
                  className="w-10 h-10 rounded-full overflow-hidden border-none p-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[28px] border border-[var(--md-sys-color-outline-variant)]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">description</span>
            Manajemen Berkas
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface-container-high)] rounded-xl">
              <div>
                <p className="font-bold text-sm">Kompresi PDF Otomatis</p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Gunakan Ghostscript untuk perkecil berkas</p>
              </div>
              <md-checkbox
                checked={localConfig.autoCompressPdf}
                onClick={() => setLocalConfig({ ...localConfig, autoCompressPdf: !localConfig.autoCompressPdf })}
              ></md-checkbox>
            </div>

            <md-filled-select
              label="Level Kompresi"
              value={localConfig.pdfCompressionLevel}
              onInput={(e: any) => setLocalConfig({ ...localConfig, pdfCompressionLevel: e.target.value })}
            >
              <md-select-option value="low">Low (Kualitas Tinggi)</md-select-option>
              <md-select-option value="medium">Medium (Seimbang)</md-select-option>
              <md-select-option value="high">High (Ukuran Terkecil)</md-select-option>
            </md-filled-select>
          </div>
        </section>
      </div>

      <div className="flex justify-end mt-4">
        <md-filled-button onClick={handleSave} style={{ padding: '0 32px' }}>
          <span slot="icon" className="material-symbols-outlined">save</span>
          Simpan Perubahan
        </md-filled-button>
      </div>
    </div>
  );
}
