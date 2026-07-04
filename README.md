# 📨 Sistem Manajemen Agenda Persuratan Digital

Sistem Manajemen Agenda Persuratan Digital adalah aplikasi berbasis web modern yang dirancang untuk mendigitalisasi, mengelola, dan mengarsipkan agenda surat secara efisien. Dibangun dengan fokus pada portabilitas dan stabilitas, aplikasi ini mendukung manajemen berkas PDF, integrasi spreadsheet, dan persistensi data ganda.

---

## 🚀 Fitur Utama & Cara Kerja

Aplikasi ini mengintegrasikan alur kerja administrasi konvensional ke dalam ekosistem digital terpadu melalui fitur-fitur berikut:

### 1. Manajemen Berkas PDF & Lampiran
* **Penyimpanan Terstruktur**: Setiap surat yang diinput dapat disertai lampiran PDF yang disimpan secara otomatis ke dalam hierarki folder berdasarkan tanggal (`Tahun/Bulan/Hari`).
* **Penamaan Otomatis**: Sistem secara cerdas mengganti nama file PDF berdasarkan kolom metadata (misalnya: Tanggal-NomorSurat-Pengirim) untuk memudahkan pencarian fisik di server.
* **PDF Tools**: Modul bawaan untuk manipulasi PDF langsung dari browser:
  - **Merge**: Menggabungkan beberapa PDF menjadi satu dokumen.
  - **Split**: Memotong atau mengekstrak halaman tertentu dari PDF.
  - **Compress**: Memperkecil ukuran file PDF menggunakan Ghostscript.

### 2. Dashboard Analitik & Aktivitas
* **Tren Persuratan**: Visualisasi tren entri surat terbaru menggunakan grafik area (*Area Chart*) interaktif.
* **Statistik Cepat**: Pemantauan jumlah total agenda, jumlah lampiran fisik, dan efisiensi arsip secara real-time.
* **Log Aktivitas**: Menampilkan riwayat entri surat terbaru untuk pengawasan operasional yang lebih baik.

### 3. Manajemen Tabel & Integrasi Spreadsheet
* **Pencarian Fuzzy**: Algoritma pencarian cerdas yang memungkinkan penemuan data meskipun terdapat kesalahan ketik kecil.
* **Ekspor/Impor Excel**:
  - Ekspor seluruh database agenda ke format `.xlsx`.
  - Impor massal data dari Excel dengan fitur **deteksi duplikat** otomatis dan pemetaan kolom yang fleksibel.
* **Cetak Tanda Terima**: Menghasilkan dokumen PDF tanda terima resmi secara massal untuk surat-surat yang dipilih.
* **Batch Download**: Mengunduh banyak lampiran PDF sekaligus dalam satu arsip ZIP.

### 4. Integritas & Keamanan Data
* **Persistensi Ganda**: Menggunakan PostgreSQL sebagai database utama dan `db.json` sebagai fallback/sinkronisasi sinkron untuk stabilitas maksimal.
* **Cek Integritas**: Fitur untuk mendeteksi berkas PDF sampah (orphans) atau rekaman database yang kehilangan file fisiknya.
* **Backup & Restore**: Sistem pencadangan database (JSON) dan cadangan lengkap (ZIP + PDF) yang dapat dijadwalkan atau dilakukan secara manual.

---

## 📦 Persyaratan Sistem

* **Node.js** versi 18.x atau lebih tinggi.
* **PostgreSQL** (opsional, aplikasi akan otomatis menggunakan JSON jika DB tidak terdeteksi).
* **Ghostscript** (opsional, diperlukan untuk fitur kompresi PDF).

---

## 📥 Panduan Setup Cepat

Aplikasi dilengkapi dengan skrip instalasi interaktif untuk kemudahan deployment:

### 💻 Windows
1. Jalankan PowerShell sebagai Administrator.
2. Eksekusi: `.\setup.ps1`
3. Ikuti instruksi untuk instalasi dependensi dan konfigurasi.

### 🐧 Linux (Debian/Ubuntu)
1. Berikan izin eksekusi: `chmod +x setup.sh`
2. Jalankan: `sudo ./setup.sh`
3. Skrip akan mengonfigurasi Node.js, npm, dan systemd service secara otomatis.

---

## 📖 Dokumentasi Teknis & Arsitektur

Untuk pemahaman mendalam mengenai arsitektur sistem, peta direktori, dependensi antar-file, serta penjabaran logika bisnis terperinci, silakan merujuk pada berkas berikut:

* [**Analisis Teknis Mendalam**](docs/ANALISIS_TEKNIS_MENDALAM.md)

---

## 🛠️ Stack Teknologi

* **Frontend**: React 19, Vite, Tailwind CSS v4, Material Web Components (M3).
* **Backend**: Node.js, Express, esbuild.
* **Database**: PostgreSQL & Lokal JSON Store.
* **Libraries**: pdf-lib, jspdf, xlsx, jszip, recharts.
