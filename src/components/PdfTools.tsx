import React, { useState } from 'react';
import { MailRecord } from '../types';

export default function PdfTools() {
  const [activeTool, setActiveTool] = useState<'merge' | 'split' | 'compress'>('merge');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States for tools
  const [mergeFiles, setMergeFiles] = useState<{ name: string; base64: string }[]>([]);
  const [splitFile, setSplitFile] = useState<{ name: string; base64: string } | null>(null);
  const [splitRange, setSplitRange] = useState('1-2');
  const [compressFile, setCompressFile] = useState<{ name: string; base64: string } | null>(null);
  const [compressLevel, setCompressLevel] = useState('medium');

  const tools = [
    { id: 'merge', label: 'Gabungkan PDF', icon: 'layers', desc: 'Satukan beberapa PDF menjadi satu.' },
    { id: 'split', label: 'Potong PDF', icon: 'content_cut', desc: 'Ekstrak halaman PDF.' },
    { id: 'compress', label: 'Kompresi PDF', icon: 'compress', desc: 'Perkecil ukuran berkas PDF.' },
  ];

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, tool: string) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (tool === 'merge') {
      const newFiles = await Promise.all(files.map(async f => ({
        name: f.name,
        base64: await handleFileToBase64(f)
      })));
      setMergeFiles([...mergeFiles, ...newFiles]);
    } else if (tool === 'split') {
      const f = files[0];
      setSplitFile({ name: f.name, base64: await handleFileToBase64(f) });
    } else if (tool === 'compress') {
      const f = files[0];
      setCompressFile({ name: f.name, base64: await handleFileToBase64(f) });
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const executeTool = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      let body = {};
      let fileName = 'result.pdf';

      if (activeTool === 'merge') {
        if (mergeFiles.length < 2) throw new Error('Pilih minimal 2 file untuk digabungkan');
        endpoint = '/api/pdf/merge';
        body = { files: mergeFiles };
        fileName = 'Merged_Document.pdf';
      } else if (activeTool === 'split') {
        if (!splitFile) throw new Error('Pilih file PDF terlebih dahulu');
        endpoint = '/api/pdf/split';
        body = { pdfData: splitFile.base64, range: splitRange };
        fileName = `Split_${splitFile.name}`;
      } else if (activeTool === 'compress') {
        if (!compressFile) throw new Error('Pilih file PDF terlebih dahulu');
        endpoint = '/api/pdf/compress';
        body = { pdfData: compressFile.base64, level: compressLevel };
        fileName = `Compressed_${compressFile.name}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal memproses PDF');
      }

      const blob = await res.blob();
      downloadBlob(blob, fileName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-[var(--md-sys-color-on-surface)]">PDF Management Tools</h1>
        <p className="text-[var(--md-sys-color-on-surface-variant)]">Olah berkas PDF secara instan tanpa aplikasi tambahan.</p>
      </div>

      <div className="flex gap-4">
        {tools.map(tool => (
          <div
            key={tool.id}
            onClick={() => { setActiveTool(tool.id as any); setError(''); }}
            className={`flex-1 p-6 rounded-[28px] cursor-pointer border-2 transition-all ${
              activeTool === tool.id
                ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)]'
                : 'bg-[var(--md-sys-color-surface-container)] border-transparent hover:border-[var(--md-sys-color-outline-variant)]'
            }`}
          >
            <span className={`material-symbols-outlined text-4xl mb-4 ${
              activeTool === tool.id ? 'text-[var(--md-sys-color-on-primary-container)]' : 'text-[var(--md-sys-color-primary)]'
            }`}>{tool.icon}</span>
            <h3 className="font-bold text-lg">{tool.label}</h3>
            <p className="text-xs opacity-70 mt-1">{tool.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--md-sys-color-surface-container-high)] p-8 rounded-[32px] border border-[var(--md-sys-color-outline-variant)] min-h-[400px]">
         {error && (
            <div className="mb-6 p-4 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
         )}

         {activeTool === 'merge' && (
            <div className="flex flex-col gap-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Gabungkan PDF</h3>
                  <div className="flex gap-2">
                    <md-outlined-button onClick={() => setMergeFiles([])} disabled={mergeFiles.length === 0}>
                      Hapus Semua
                    </md-outlined-button>
                    <div className="relative">
                       <md-filled-button>
                         <span slot="icon" className="material-symbols-outlined">add</span>
                         Tambah File
                       </md-filled-button>
                       <input type="file" multiple accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onFileSelect(e, 'merge')} />
                    </div>
                  </div>
               </div>

               <div className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
                  <md-list>
                    {mergeFiles.map((file, idx) => (
                      <React.Fragment key={idx}>
                        <md-list-item>
                          <span slot="start" className="material-symbols-outlined opacity-50">description</span>
                          <div slot="headline" className="text-sm font-medium">{file.name}</div>
                          <div slot="supporting-text" className="text-[10px]">Urutan ke-{idx + 1}</div>
                          <div slot="end" className="flex items-center gap-1">
                             <md-icon-button onClick={() => {
                                const newFiles = [...mergeFiles];
                                if (idx > 0) {
                                  [newFiles[idx-1], newFiles[idx]] = [newFiles[idx], newFiles[idx-1]];
                                  setMergeFiles(newFiles);
                                }
                             }} disabled={idx === 0}>
                               <span className="material-symbols-outlined">arrow_upward</span>
                             </md-icon-button>
                             <md-icon-button onClick={() => {
                                const newFiles = [...mergeFiles];
                                if (idx < mergeFiles.length - 1) {
                                  [newFiles[idx+1], newFiles[idx]] = [newFiles[idx], newFiles[idx+1]];
                                  setMergeFiles(newFiles);
                                }
                             }} disabled={idx === mergeFiles.length - 1}>
                               <span className="material-symbols-outlined">arrow_downward</span>
                             </md-icon-button>
                             <md-icon-button onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))}>
                               <span className="material-symbols-outlined text-error">delete</span>
                             </md-icon-button>
                          </div>
                        </md-list-item>
                        <md-divider></md-divider>
                      </React.Fragment>
                    ))}
                  </md-list>
                  {mergeFiles.length === 0 && (
                    <div className="p-16 text-center opacity-30 italic">
                       <span className="material-symbols-outlined text-6xl mb-2">upload_file</span>
                       <p>Belum ada file dipilih</p>
                    </div>
                  )}
               </div>
            </div>
         )}

         {activeTool === 'split' && (
            <div className="flex flex-col gap-8 items-center text-center max-w-lg mx-auto">
                <div className="w-24 h-24 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl">content_cut</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Potong Halaman PDF</h3>
                  <p className="text-[var(--md-sys-color-on-surface-variant)] mt-2">Pilih file PDF dan tentukan rentang halaman yang ingin dipisahkan.</p>
                </div>

                <div className="w-full flex flex-col gap-6">
                  <div className="relative w-full">
                    <md-outlined-button className="w-full h-16">
                      {splitFile ? `File: ${splitFile.name}` : 'Pilih File PDF'}
                    </md-outlined-button>
                    <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onFileSelect(e, 'split')} />
                  </div>

                  <md-filled-text-field
                    label="Rentang Halaman (Contoh: 1-5, 8, 11-13)"
                    value={splitRange}
                    onInput={(e: any) => setSplitRange(e.target.value)}
                  ></md-filled-text-field>
                </div>
            </div>
         )}

         {activeTool === 'compress' && (
            <div className="flex flex-col gap-8 items-center text-center max-w-lg mx-auto">
                <div className="w-24 h-24 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl">compress</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Optimasi Ukuran PDF</h3>
                  <p className="text-[var(--md-sys-color-on-surface-variant)] mt-2">Perkecil ukuran berkas PDF untuk kemudahan pengiriman dan penyimpanan.</p>
                </div>

                <div className="w-full flex flex-col gap-6 text-left">
                  <div className="relative w-full">
                    <md-outlined-button className="w-full h-16">
                      {compressFile ? `File: ${compressFile.name}` : 'Pilih File PDF'}
                    </md-outlined-button>
                    <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onFileSelect(e, 'compress')} />
                  </div>

                  <md-filled-select
                    label="Kualitas Kompresi"
                    value={compressLevel}
                    onInput={(e: any) => setCompressLevel(e.target.value)}
                  >
                    <md-select-option value="screen">Low (72 dpi - Ukuran Terkecil)</md-select-option>
                    <md-select-option value="ebook">Medium (150 dpi - Standar)</md-select-option>
                    <md-select-option value="printer">High (300 dpi - Cetak)</md-select-option>
                  </md-filled-select>
                </div>
            </div>
         )}

         <div className="mt-12 flex justify-center">
            <md-filled-button
              onClick={executeTool}
              disabled={loading}
              style={{ padding: '0 48px', height: '56px', borderRadius: '16px' }}
            >
              {loading ? (
                 <div className="flex items-center gap-2">
                   <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '24px' }}></md-circular-progress>
                   <span>Memproses...</span>
                 </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  <span>Proses Sekarang</span>
                </div>
              )}
            </md-filled-button>
         </div>
      </div>
    </div>
  );
}
