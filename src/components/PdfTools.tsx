import React, { useState } from 'react';
import { MailRecord } from '../types';

export default function PdfTools() {
  const [activeTool, setActiveTool] = useState<'merge' | 'split' | 'compress'>('merge');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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
        // Match payload schema expected by server.ts: { pdfFiles: string[] }
        body = { pdfFiles: mergeFiles.map(f => f.base64) };
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
        <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">PDF Management Tools</h1>
        <p className="text-sm text-slate-500">Olah berkas PDF secara instan tanpa aplikasi tambahan.</p>
      </div>

      <div className="flex gap-4">
        {tools.map(tool => (
          <div
            key={tool.id}
            onClick={() => { setActiveTool(tool.id as any); setError(''); }}
            className={`flex-grow flex-1 p-6 rounded-3xl cursor-pointer border-2 transition-all duration-200 ${
              activeTool === tool.id
                ? 'bg-teal-50/50 border-teal-600 shadow-[0_4px_16px_rgba(13,148,136,0.05)]'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.005)]'
            }`}
          >
            <span className={`material-symbols-outlined text-4xl mb-4 font-fill ${
              activeTool === tool.id ? 'text-teal-600' : 'text-slate-400'
            }`}>{tool.icon}</span>
            <h3 className="font-bold text-base text-slate-800">{tool.label}</h3>
            <p className="text-xs text-slate-400 mt-1">{tool.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.015)] min-h-[400px]">
         {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-500">error</span>
              <p className="text-xs font-bold">{error}</p>
            </div>
         )}

         {activeTool === 'merge' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Gabungkan PDF</h3>
                  <div className="flex gap-2">
                    <md-outlined-button onClick={() => setMergeFiles([])} disabled={mergeFiles.length === 0 ? true : undefined}>
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

               <div 
                 onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                 onDragLeave={() => setIsDragOver(false)}
                 onDrop={async (e) => {
                   e.preventDefault();
                   setIsDragOver(false);
                   const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'));
                   const newFiles = await Promise.all(files.map(async f => ({
                     name: f.name,
                     base64: await handleFileToBase64(f)
                   })));
                   setMergeFiles([...mergeFiles, ...newFiles]);
                 }}
                 className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                   isDragOver ? 'border-teal-500 bg-teal-50/20' : 'border-slate-200 hover:border-teal-500/40 bg-slate-50/50'
                 }`}
               >
                 <span className={`material-symbols-outlined text-4xl ${isDragOver ? 'text-teal-600 font-fill' : 'text-slate-400'}`}>upload_file</span>
                 <div className="text-center">
                   <p className="font-bold text-sm text-slate-700">Tarik berkas PDF ke sini</p>
                   <p className="text-xs text-slate-400 mt-1">Atau klik Tambah File di atas untuk memilih berkas</p>
                 </div>
               </div>

               <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                  <md-list className="p-0">
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
                             }} disabled={idx === 0 ? true : undefined} aria-label="Pindahkan ke atas">
                               <span className="material-symbols-outlined">arrow_upward</span>
                             </md-icon-button>
                             <md-icon-button onClick={() => {
                                const newFiles = [...mergeFiles];
                                if (idx < mergeFiles.length - 1) {
                                  [newFiles[idx+1], newFiles[idx]] = [newFiles[idx], newFiles[idx+1]];
                                  setMergeFiles(newFiles);
                                }
                             }} disabled={idx === mergeFiles.length - 1 ? true : undefined} aria-label="Pindahkan ke bawah">
                               <span className="material-symbols-outlined">arrow_downward</span>
                             </md-icon-button>
                             <md-icon-button onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))} className="text-rose-500" aria-label="Hapus dari daftar">
                               <span className="material-symbols-outlined">delete</span>
                             </md-icon-button>
                          </div>
                        </md-list-item>
                        <md-divider></md-divider>
                      </React.Fragment>
                    ))}
                  </md-list>
                  {mergeFiles.length === 0 && (
                    <div className="p-16 text-center opacity-30 italic text-sm text-slate-400">
                       <p>Belum ada file dipilih</p>
                    </div>
                  )}
               </div>
            </div>
         )}

         {activeTool === 'split' && (
            <div className="flex flex-col gap-8 items-center text-center max-w-lg mx-auto py-6 animate-in fade-in duration-200">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-fill text-4xl shadow-sm">
                  <span className="material-symbols-outlined">content_cut</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Potong Halaman PDF</h3>
                  <p className="text-xs text-slate-400 mt-2">Pilih file PDF dan tentukan rentang halaman yang ingin dipisahkan.</p>
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
            <div className="flex flex-col gap-8 items-center text-center max-w-lg mx-auto py-6 animate-in fade-in duration-200">
                <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-fill text-4xl shadow-sm">
                  <span className="material-symbols-outlined">compress</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Optimasi Ukuran PDF</h3>
                  <p className="text-xs text-slate-400 mt-2">Perkecil ukuran berkas PDF untuk kemudahan pengiriman dan penyimpanan.</p>
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

         <div className="mt-12 flex justify-center border-t border-slate-100 pt-8">
            <md-filled-button
              onClick={executeTool}
              disabled={loading ? true : undefined}
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
