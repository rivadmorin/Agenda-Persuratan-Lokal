# 📊 Perbandingan Fitur: Proyek vs. Referensi

Dokumen ini memetakan perbedaan fungsional antara kode proyek saat ini (berbasis database PostgreSQL) dan folder referensi **"Referensi fitur dan cara kerja"** (berbasis database file `db.json`). 

> [!IMPORTANT]
> Proyek saat ini menggunakan PostgreSQL untuk menjamin integritas data (Strict Mode), sedangkan folder referensi menggunakan model flat JSON file (`db.json`). Oleh karena itu, semua fitur referensi yang akan diimpor harus disesuaikan agar kompatibel dengan PostgreSQL.

---

## 🔍 Ringkasan Perbedaan Komponen

| Komponen / Berkas | Ukuran Referensi | Ukuran Saat Ini | Status & Temuan Utama |
| :--- | :---: | :---: | :--- |
| `server.ts` (Backend) | 94.4 KB | 24.5 KB | **Berbeda:** Versi saat ini memiliki dasar PostgreSQL, tetapi kehilangan banyak route pendukung manajemen backup, reorder kolom, excel template, dan integrasi audit. |
| `src/App.tsx` | 70.5 KB | 7.2 KB | **Sangat Sederhana:** Versi saat ini hanya kerangka tab dasar, belum memuat logika dialog, status drawer, parsing PDF cerdas, atau integrasi penanganan state error. |
| `src/index.css` | 7.5 KB | 2.9 KB | **Sederhana:** Desain CSS M3 belum lengkap (kehilangan efek transisi, custom scrollbars, dan style modal cetak disposisi). |
| `components/Dashboard.tsx` | 37.9 KB | 5.6 KB | **Terbatas:** Hanya ada satu chart mentah. Versi referensi memiliki diagram lingkaran kategori, chart tren harian/bulanan interaktif, range waktu fleksibel, dan toggle visual chart. |
| `components/MailTable.tsx` | 48.6 KB | 5.8 KB | **Belum Selesai:** Tidak ada pagination (server-side), filter per kolom, dialog import excel cerdas dengan penyelesaian duplikasi, atau fitur drag-and-drop file langsung ke baris. |
| `components/MailDrawer.tsx` | 13.4 KB | 3.2 KB | **Dialog Biasa:** Di proyek saat ini berupa dialog popup sederhana (`md-dialog`). Versi referensi berupa Drawer (Laci Samping) yang terintegrasi dengan penampil PDF interaktif. |
| `components/PdfTools.tsx` | 24.5 KB | 13.4 KB | **Kosong (Stub):** Versi saat ini hanya memiliki helper file. Logika merging, splitting, dan compressing PDF di sisi klien/server belum diimplementasikan. |
| `components/Settings.tsx` | 123.8 KB | 4.6 KB | **Kosong (Stub):** Hanya mengatur Nama Aplikasi & Aksen Warna. Fitur kustomisasi kolom, profil kolom, manajemen backup lokal, dan utilitas integritas DB-ke-PDF tidak ada. |
| `components/UserManagement.tsx` | 17.0 KB | 3.1 KB | **Terbatas:** Hanya bisa melakukan aksi delete user. Form Tambah & Edit Pengguna belum ada di frontend. |
| `components/Sidebar.tsx` | 14.8 KB | 3.8 KB | **Sederhana:** Desain flat dengan ikon Material. Versi referensi menggunakan Lucide icons, mendukung sidebar lipat (collapsible), dan status popover pengguna online yang detail. |

---

## 🛠️ Rincian Fitur yang Hilang / Belum Ada di Proyek

### 1. Tab Statistik & Analisis (`Dashboard.tsx`)
- **Trafik Harian & Bulanan**: Diagram yang dapat ditukar secara instan antara **Bar Chart** dan **Area Chart** (`chartType`).
- **Rentang Waktu Dinamis**: Opsi rentang waktu trafik 7, 14, dan 30 hari terakhir.
- **Rasio Kategori**: Diagram lingkaran (Pie Chart) interaktif yang memvisualisasikan proporsi Surat Masuk, Surat Keluar, dan Surat Keputusan.
- **Aktivitas Berwarna**: Skema indikator aktivitas terbaru yang disesuaikan berdasarkan tipe surat secara visual.

### 2. Manajemen Tabel & Spreadsheet (`MailTable.tsx`)
- **Pagination Server-Side**: Kontrol halaman (`currentPage`, `pageSize`) untuk menangani database berskala besar.
- **Filter Kolom Spesifik**: Input pencarian independen di setiap kolom tabel, bukan hanya pencarian global.
- **Import Excel Canggih**:
  - Dialog drag-and-drop file `.xlsx`/`.xls`.
  - Sistem pencocokan kolom pintar (`label` & `key`).
  - Resolusi duplikasi data: Opsi untuk menimpa (*overwrite*), melempar baris baru, atau mengabaikan (*skip*) jika surat dengan nomor yang sama ditemukan.
- **Unggah PDF Cepat**: Tombol unggah PDF langsung pada baris tabel untuk surat yang belum memiliki lampiran.

### 3. Pengaturan Kustomisasi & Integritas (`Settings.tsx`)
- **Kustomisasi Kolom Dinamis**:
  - Tambah kolom kustom dengan tipe data berbeda (teks, tanggal, angka).
  - Urutkan kolom menggunakan antarmuka **Drag & Drop** (`handleDrop`).
  - Edit properti kolom (Required, Tampilkan di Tanda Terima).
  - Simpan konfigurasi kolom ke dalam **Profil Kolom** (bisa membuat profil baru, mengganti, atau menghapusnya).
- **Penamaan PDF Otomatis**: Logika konfigurasi penamaan file PDF berdasarkan nilai kolom dinamis (misalnya: `[Nomor Surat]-[Perihal].pdf`).
- **Pencadangan Lokal (Local Backups)**:
  - Membuat cadangan lokal secara instan (opsi sertakan file PDF atau database saja).
  - List daftar berkas cadangan di server (`GET /api/backup/list`).
  - Unduh, hapus, dan pulihkan cadangan langsung dari UI (`/api/backup/restore-local`).
- **Audit & Pemulihan Data (Data Integrity)**:
  - Memeriksa keselarasan data database dengan file fisik PDF (`handleCheckIntegrity`).
  - Pembersihan file PDF sampah yang tidak memiliki entri di database (`handleCleanupIntegrity`).
  - Rekonstruksi database berdasarkan metadata sidecar `.pdf.json` yang ada di disk (`handleReconstructDatabase`).

### 4. Perkakas PDF (`PdfTools.tsx`)
- **Penggabungan PDF (Merge)**: Mengunggah banyak file PDF, menyusun urutan halaman, dan menggabungkannya menjadi satu berkas.
- **Pemisahan PDF (Split)**: Mengunggah file PDF besar dan memilih halaman spesifik (atau rentang halaman) untuk diekstrak menjadi berkas baru.
- **Kompresi PDF (Compress)**: Mengurangi ukuran berkas PDF melalui server menggunakan opsi optimasi Ghostscript.

### 5. Manajemen Pengguna (`UserManagement.tsx`)
- **CRUD Pengguna**: Form interaktif untuk menambah user baru dan mengedit nama, kata sandi, serta peran (*admin* / *operator*) secara langsung dari antarmuka Pengaturan.

### 6. Detail Dokumen Samping (`MailDrawer.tsx`)
- **Panel Slide-Out**: Perubahan visual dari Modal Tengah ke Drawer Samping yang lebih modern.
- **Live PDF Preview**: Menampilkan berkas PDF secara berdampingan di dalam drawer saat pengguna mengisi form data, memudahkan entri data secara presisi.

---

## 🛰️ Perbedaan Endpoint API (Backend `server.ts`)

Berikut adalah rute API yang **hanya ada di folder referensi** dan harus diimplementasikan dengan query PostgreSQL di proyek kita:

```http
# Manajemen Kolom & Tata Letak
POST   /api/config/columns/reorder      # Menyimpan urutan kolom baru hasil drag-and-drop

# Unduh Berkas Templat
GET    /api/excel/template              # Mengunduh template Excel kosong dengan kolom dinamis yang aktif

# Manajemen Backup & Database Lokal
GET    /api/backup/list                 # Mendapatkan daftar berkas ZIP backup di folder cadangan
POST   /api/backup/create               # Membuat berkas cadangan baru (DB + uploads PDF)
POST   /api/backup/restore-local        # Memulihkan sistem menggunakan berkas cadangan lokal
DELETE /api/backup/delete/:filename     # Menghapus berkas cadangan tertentu
GET    /api/backup/download/:filename   # Mengunduh berkas cadangan ZIP ke komputer lokal
POST   /api/backup/import-zip           # Mengunggah dan memulihkan dari file ZIP luar

# Utilitas Audit Integritas Data
POST   /api/backup/integrity/cleanup    # Menghapus berkas PDF yatim piatu di folder uploads
POST   /api/backup/integrity/reconstruct # Membangun ulang tabel database berdasarkan file sidecar PDF .json
```

---

## 📌 Rencana Tindakan Selanjutnya (Next Steps)

Untuk melengkapi fungsionalitas aplikasi, kita perlu melakukan porting fitur-fitur di atas secara bertahap. Karena proyek kita berjalan di atas PostgreSQL, kita akan:
1. Memodifikasi schema SQL/PostgreSQL agar mendukung reordering kolom dinamis atau menyimpannya di tabel `config`.
2. Menulis query Postgres untuk manajemen backup, restore, dan audit integritas data.
3. Mengganti file frontend di `src/components/` secara iteratif sesuai dengan standar desain Material Design 3 (M3).
