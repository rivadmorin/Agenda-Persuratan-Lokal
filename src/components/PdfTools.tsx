import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Scissors, 
  Minimize2, 
  Upload, 
  Trash2, 
  ArrowDown, 
  Loader, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface PdfToolsProps {
  onTrackTask?: (
    name: string,
    type: 'upload' | 'download' | 'export' | 'zip' | 'receipt' | 'pdf-tool' | 'import',
    fileName?: string
  ) => {
    complete: (customMsg?: string) => void;
    error: (errorMsg?: string) => void;
    updateProgress: (prog: number) => void;
  };
}

export default function PdfTools({ onTrackTask }: PdfToolsProps = {}) {
  const [activeTool, setActiveTool] = useState<'merge' | 'split' | 'compress'>('merge');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Merge states
  const [mergeFiles, setMergeFiles] = useState<{ id: string; name: string; base64: string }[]>([]);

  // Split states
  const [splitFile, setSplitFile] = useState<{ name: string; base64: string } | null>(null);
  const [splitRange, setSplitRange] = useState('1-2');

  // Compress states
  const [compressFile, setCompressFile] = useState<{ name: string; base64: string } | null>(null);
  const [compressLevel, setCompressLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const tools = [
    { id: 'merge', label: 'Gabungkan PDF', desc: 'Satukan beberapa PDF menjadi satu berkas secara berurutan.', icon: Layers, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30' },
    { id: 'split', label: 'Potong PDF', desc: 'Ekstrak rentang halaman PDF terpilih menjadi satu berkas baru.', icon: Scissors, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30' },
    { id: 'compress', label: 'Kompresi PDF', desc: 'Perkecil ukuran berkas PDF Anda dengan aman.', icon: Minimize2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' },
  ];

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleMergeAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    setError('');
    const newFilesList = [...mergeFiles];
    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          const b64 = await fileToBase64(file);
          newFilesList.push({
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            name: file.name,
            base64: b64,
          });
        } catch (err) {
          setError('Gagal membaca berkas PDF.');
        }
      }
    }
    setMergeFiles(newFilesList);
  };

  const handleMergeSubmit = async () => {
    if (mergeFiles.length < 2) {
      setError('Mohon tambahkan minimal 2 file PDF untuk digabungkan.');
      return;
    }
    setLoading(true);
    setError('');
    const filename = 'PDF_Gabungan_Agenda.pdf';
    const task = onTrackTask ? onTrackTask('Gabung File PDF', 'pdf-tool', filename) : null;
    try {
      const response = await fetch('/api/pdf/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfFiles: mergeFiles.map((f) => f.base64) }),
      });
      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, filename);
        task?.complete('PDF Berhasil digabung!');
      } else {
        const errData = await response.json();
        setError(errData.message || 'Gagal menggabungkan PDF.');
        task?.error(errData.message || 'Gagal menggabungkan PDF.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
      task?.error('Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const b64 = await fileToBase64(file);
        setSplitFile({ name: file.name, base64: b64 });
        setError('');
      } catch (err) {
        setError('Gagal membaca berkas PDF.');
      }
    }
  };

  const handleSplitSubmit = async () => {
    if (!splitFile) {
      setError('Mohon tambahkan file PDF terlebih dahulu.');
      return;
    }
    if (!splitRange.trim()) {
      setError('Sediakan rentang halaman yang valid (contoh: 1-2 atau 1,3,4).');
      return;
    }
    setLoading(true);
    setError('');
    const filename = `Potongan_${splitFile.name}`;
    const task = onTrackTask ? onTrackTask('Potong Halaman PDF', 'pdf-tool', filename) : null;
    try {
      const response = await fetch('/api/pdf/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfData: splitFile.base64, range: splitRange }),
      });
      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, filename);
        task?.complete('PDF Berhasil dipotong!');
      } else {
        const errData = await response.json();
        setError(errData.message || 'Gagal memotong PDF.');
        task?.error(errData.message || 'Gagal memotong PDF.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
      task?.error('Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleCompressAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const b64 = await fileToBase64(file);
        setCompressFile({ name: file.name, base64: b64 });
        setError('');
      } catch (err) {
        setError('Gagal membaca berkas PDF.');
      }
    }
  };

  const handleCompressSubmit = async () => {
    if (!compressFile) {
      setError('Mohon tambahkan file PDF terlebih dahulu.');
      return;
    }
    setLoading(true);
    setError('');
    const filename = `Terkompresi_${compressFile.name}`;
    const task = onTrackTask ? onTrackTask('Kompres Ukuran PDF', 'pdf-tool', filename) : null;
    try {
      const response = await fetch('/api/pdf/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfData: compressFile.base64, level: compressLevel }),
      });
      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, filename);
        task?.complete('PDF Berhasil dikompres!');
      } else {
        const errData = await response.json();
        setError(errData.message || 'Gagal mengompres PDF.');
        task?.error(errData.message || 'Gagal mengompres PDF.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
      task?.error('Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden p-6 select-none bg-slate-50 dark:bg-slate-950 gap-5 transition-colors duration-200">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm dark:shadow-none flex items-center justify-between transition-colors duration-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1">
            PDF Perkakas Utility Suite
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kumpulan alat untuk mengolah, menggabungkan, memotong, dan mengompres berkas PDF lampiran.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Tool selector panel */}
        <div className="w-80 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col gap-2 shrink-0 transition-colors duration-200">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-2">
            Pilih Perkakas
          </span>
          {tools.map((t) => {
            const isActive = activeTool === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTool(t.id as any);
                  setError('');
                }}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 group flex items-start gap-3.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 shadow-sm dark:shadow-none'
                    : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className={`p-2 rounded-xl border ${isActive ? 'bg-blue-600 text-white' : t.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {t.label}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                    {t.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Tool Interactive Box */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 flex flex-col overflow-hidden shadow-sm dark:shadow-none relative transition-colors duration-200">
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold flex items-start gap-3">
              <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MERGE INTERFACE */}
          {activeTool === 'merge' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
                  Gabungkan Beberapa Berkas PDF
                </h3>
                <label className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-xl cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  Tambah Berkas PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleMergeAddFiles}
                    className="hidden"
                  />
                </label>
              </div>

              {mergeFiles.length === 0 ? (
                <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/30">
                  <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2.5 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada PDF Ditambahkan</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs text-center">
                    Klik tombol di pojok kanan atas untuk memasukkan minimal dua dokumen PDF yang ingin digabungkan.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
                    {mergeFiles.map((file, idx) => (
                      <div
                        key={file.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 overflow-hidden">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={() => setMergeFiles(mergeFiles.filter((f) => f.id !== file.id))}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleMergeSubmit}
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        <span>Gabungkan dan Unduh Berkas</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SPLIT INTERFACE */}
          {activeTool === 'split' && (
            <div className="flex-1 flex flex-col overflow-hidden justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider mb-4">
                  Potong Halaman PDF
                </h3>

                {!splitFile ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400/50 rounded-2xl p-10 text-center bg-slate-50 dark:bg-slate-950 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 cursor-pointer transition-all relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleSplitAddFile}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2.5 animate-bounce" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Berkas PDF untuk Dipotong</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Pastikan format file merupakan dokumen .pdf</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 overflow-hidden">
                        <FileText className="w-5 h-5 text-purple-500" />
                        <span className="truncate">{splitFile.name}</span>
                      </div>
                      <button
                        onClick={() => setSplitFile(null)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Tentukan Rentang Halaman Potong
                      </label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-all"
                        placeholder="Contoh: 1-2 atau 1,3 atau 1-3,5"
                      />
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed font-medium block pt-1">
                        * Gunakan format rentang menggunakan strip (e.g. <b>1-3</b> untuk mengambil halaman 1 s.d 3) atau koma (e.g. <b>1,4</b> untuk mengambil halaman 1 dan 4).
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {splitFile && (
                <button
                  onClick={handleSplitSubmit}
                  disabled={loading}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-100 dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>Potong dan Unduh Hasil</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* COMPRESS INTERFACE */}
          {activeTool === 'compress' && (
            <div className="flex-1 flex flex-col overflow-hidden justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider mb-4">
                  Kompresi Ukuran PDF
                </h3>

                {!compressFile ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400/50 rounded-2xl p-10 text-center bg-slate-50 dark:bg-slate-950 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 cursor-pointer transition-all relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleCompressAddFile}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2.5 animate-bounce" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Berkas PDF untuk Dikompres</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Pastikan format file merupakan dokumen .pdf</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 overflow-hidden">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        <span className="truncate">{compressFile.name}</span>
                      </div>
                      <button
                        onClick={() => setCompressFile(null)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Tingkat Kompresi Berkas
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setCompressLevel(level)}
                            className={`py-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                              compressLevel === level
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {level === 'low' ? 'Rendah' : level === 'medium' ? 'Sedang' : 'Tinggi'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                        * Kompresi tinggi akan memperkecil ukuran berkas secara signifikan tetapi mungkin menurunkan resolusi gambar jika terdapat gambar scan berkualitas tinggi di dalam PDF.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {compressFile && (
                <button
                  onClick={handleCompressSubmit}
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span>Mulai Kompresi dan Unduh</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
