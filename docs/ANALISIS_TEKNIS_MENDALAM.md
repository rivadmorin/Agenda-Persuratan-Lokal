# STRUKTUR POHON DIREKTORI

.
├── assets/                      # [Folder] Berisi aset statis pendukung aplikasi seperti logo atau gambar latar.
├── data/                        # [Folder] Pusat penyimpanan data persuratan dan berkas fisik yang diunggah.
│   ├── backups/                 # [Folder] Menyimpan arsip cadangan database baik dalam format JSON maupun ZIP (lengkap dengan PDF).
│   ├── logs/                    # [Folder] Berisi file `app.log` yang mencatat setiap aktivitas sistem, error, dan riwayat login.
│   ├── uploads/                 # [Folder] Direktori penyimpanan fisik lampiran PDF surat, disusun berdasarkan hierarki Tahun/Bulan/Hari.
│   └── db.json                  # [File] Database utama berbasis JSON yang berfungsi sebagai sinkronisasi fallback jika PostgreSQL tidak tersedia.
├── docs/                        # [Folder] Dokumentasi teknis dan analisis mendalam sistem.
├── src/                         # [Folder] Kode sumber utama aplikasi frontend berbasis React dan TypeScript.
│   ├── components/              # [Folder] Komponen antarmuka pengguna (UI) yang modular dan reusable.
│   │   ├── ConfirmModal.tsx     # [File] Komponen dialog untuk memvalidasi aksi krusial seperti penghapusan data atau pengosongan database.
│   │   ├── CursorInteraction.tsx# [File] Implementasi visual untuk interaksi kursor kustom dan efek ripple saat elemen diklik.
│   │   ├── Dashboard.tsx        # [File] Panel utama yang menyajikan statistik ringkas, grafik tren persuratan, dan log aktivitas terbaru.
│   │   ├── Login.tsx            # [File] Antarmuka autentikasi pengguna dengan validasi kredensial ke API backend.
│   │   ├── MailDrawer.tsx       # [File] Panel entri data (side-drawer) untuk menambah atau memperbarui rekaman agenda surat beserta lampirannya.
│   │   ├── MailTable.tsx        # [File] Komponen tabel dinamis untuk menampilkan, mencari, memfilter, dan mengelola banyak rekaman surat sekaligus.
│   │   ├── PdfTools.tsx         # [File] Modul fungsional untuk pengolahan file PDF seperti penggabungan, pemotongan, dan kompresi ukuran.
│   │   ├── ReceiptModal.tsx     # [File] Form khusus untuk menginput nama penandatangan sebelum mencetak tanda terima resmi dalam format PDF.
│   │   ├── Settings.tsx         # [File] Antarmuka konfigurasi sistem untuk mengatur branding, tema warna, dan kebijakan manajemen berkas.
│   │   ├── Sidebar.tsx          # [File] Navigasi vertikal aplikasi yang juga menampilkan status real-time jumlah pengguna online.
│   │   └── UserManagement.tsx   # [File] Panel kontrol administrator untuk mengelola hak akses, menambah, atau menghapus akun pengguna.
│   ├── utils/                   # [Folder] Kumpulan fungsi utilitas dan logika logika bisnis tingkat rendah.
│   │   ├── search.ts            # [File] Implementasi algoritma Fuzzy Search untuk pencarian teks yang fleksibel dan efisien di sisi klien.
│   │   └── theme.ts             # [File] Engine penghasil tema Material Design 3 (M3) yang menghasilkan variabel CSS secara dinamis dari seed color.
│   ├── App.tsx                  # [File] Komponen root yang mengelola state global aplikasi, sinkronisasi data API, dan navigasi antar tab.
│   ├── index.css                # [File] File gaya utama yang mengintegrasikan Tailwind CSS v4, font lokal, dan desain token sistem.
│   ├── main.tsx                 # [File] Titik masuk (entry point) aplikasi yang merender React ke DOM dan mengimpor Web Components Material.
│   ├── material-web.d.ts        # [File] Definisi tipe global untuk mendukung penggunaan elemen HTML kustom dari perpustakaan @material/web.
│   └── types.ts                 # [File] Pusat definisi tipe data, interface, dan enum yang digunakan secara konsisten di seluruh proyek.
├── .env.example                 # [File] Panduan konfigurasi variabel lingkungan untuk API Key Gemini dan kredensial database.
├── docker-compose.yml           # [File] File konfigurasi Docker untuk menjalankan layanan PostgreSQL secara instan.
├── index.html                   # [File] Struktur dasar dokumen HTML yang menjadi wadah aplikasi React.
├── metadata.json                # [File] Deskripsi metadata proyek untuk integrasi dengan platform pengembangan eksternal.
├── package.json                 # [File] Definisi proyek, skrip operasional (dev, build, start), dan daftar dependensi pustaka.
├── schema.sql                   # [File] Rancangan skema database relasional (tabel config, users, mails) untuk PostgreSQL.
├── server.ts                    # [File] Inti dari backend; mengelola server Express, API REST, WebSocket/SSE, dan integrasi database ganda.
├── setup.ps1                    # [File] Skrip otomasi instalasi dan konfigurasi lingkungan untuk pengguna sistem operasi Windows.
├── setup.sh                     # [File] Skrip otomasi instalasi, konfigurasi Systemd, dan izin akses untuk sistem operasi Linux.
├── tsconfig.json                # [File] Aturan kompilasi TypeScript untuk memastikan konsistensi tipe dan standar kode ESNext.
└── vite.config.ts               # [File] Konfigurasi build tool Vite, termasuk plugin React, Tailwind, dan pengaturan alias direktori.

# KAMUS FILE DAN DOKUMENTASI KODE SECARA MENDALAM

📄 File: server.ts

Jalur File Lengkap: server.ts

Tanggung Jawab Utama: Bertindak sebagai server backend utama yang mengelola logika bisnis, persistensi data (PostgreSQL & JSON), manipulasi file PDF, ekspor/impor Excel, dan komunikasi real-time (SSE).

Peta Dependensi (Imports & Exports):
- Imports:
  - `pg`: Driver untuk koneksi ke database PostgreSQL.
  - `express`: Framework web untuk menangani routing dan middleware.
  - `path`, `fs`, `os`: Modul bawaan Node.js untuk operasi sistem file dan jalur direktori.
  - `vite`: Digunakan untuk menjalankan middleware pengembangan (createViteServer).
  - `jspdf`: Pustaka untuk pembuatan dokumen PDF (Tanda Terima).
  - `pdf-lib`: Digunakan untuk manipulasi PDF tingkat lanjut (Merge, Split).
  - `jszip`: Pustaka untuk membuat arsip ZIP untuk batch download dan backup.
  - `xlsx`: Digunakan untuk pengolahan file spreadsheet (Excel Import/Export).
  - `child_process`: Untuk mengeksekusi perintah eksternal (Ghostscript).

Konfigurasi & Variabel Lingkungan (Env):
- `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`: Kredensial untuk koneksi PostgreSQL.
- `NODE_ENV`: Menentukan apakah server berjalan dalam mode 'production' atau development.

Struktur Data & Model Data:
- `defaultDb`: Objek cetak biru untuk inisialisasi database, mencakup array `users`, `mails`, dan objek `config` (appName, themeColor, columns, dll).
- `activeSessions`: Record untuk melacak pengguna yang sedang login dan aktif berdasarkan username.

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `logMessage(level, message)`
  - Input: Level log ('INFO'|'WARN'|'ERROR') dan pesan teks.
  - Logika: 1. Mencetak log ke konsol -> 2. Menulis log ke file `data/logs/app.log` -> 3. Melakukan rotasi file jika ukuran melebihi 5MB (menyimpan hingga 3 file lama).

- `readDbSync()`
  - Output: Objek database lengkap dari `db.json`.
  - Logika: 1. Mengecek keberadaan `db.json`, jika tidak ada buat dengan `defaultDb` -> 2. Membaca file secara sinkron -> 3. Jika file korup/kosong, cari backup terbaru di `data/backups/` dan pulihkan -> 4. Kembalikan data dalam bentuk objek JavaScript.

- `writeDb(data)`
  - Input: Objek data database.
  - Logika: 1. Membuat file sementara `.tmp` untuk menghindari korupsi data saat penulisan -> 2. Menulis string JSON ke file `.tmp` -> 3. Mengganti nama (rename) file `.tmp` menjadi `db.json` secara atomik.

- `getFormattedPdfName(db, metadata, originalName)`
  - Logika: 1. Mengambil konfigurasi kolom penamaan dari `config.pdfRenameCols` -> 2. Mengambil nilai dari metadata berdasarkan kolom tersebut -> 3. Membersihkan karakter non-alfanumerik -> 4. Menggabungkan nilai menjadi nama file dengan ekstensi `.pdf`.

- `performBackup()`
  - Logika: 1. Menyalin `db.json` ke folder `backups` dengan timestamp -> 2. Mengecek file lama berdasarkan `backupRetentionDays` dan menghapus yang kadaluwarsa.

- Endpoint `POST /api/auth/login`
  - Logika: 1. Menerima username & password -> 2. Mencari di database -> 3. Jika cocok, simpan ke `activeSessions` dan kembalikan data user tanpa password.

- Endpoint `POST /api/mails`
  - Logika: 1. Menerima metadata dan data PDF base64 -> 2. Menentukan jalur penyimpanan berdasarkan tanggal terima (Tahun/Bulan/Hari) -> 3. Menulis file PDF ke disk -> 4. Menghasilkan ID unik -> 5. Menyimpan rekaman ke PostgreSQL dan menyinkronkan ke `db.json` -> 6. Menyimpan sidecar metadata `.pdf.json`.

- Endpoint `POST /api/pdf/merge`
  - Logika: 1. Menerima array string base64 PDF -> 2. Membuat dokumen `PDFDocument` baru -> 3. Melakukan iterasi dan menyalin setiap halaman dari file sumber ke dokumen baru -> 4. Mengirimkan buffer PDF hasil penggabungan ke klien.

Interaksi Komponen & Arus Data (Data Flow):
- Menerima permintaan dari frontend via HTTP REST API.
- Berinteraksi dengan PostgreSQL untuk data persisten utama.
- Berinteraksi dengan Sistem File untuk penyimpanan fisik PDF dan database JSON.
- Mengirimkan data real-time ke Sidebar melalui SSE (Server-Sent Events).

---

📄 File: src/App.tsx

Jalur File Lengkap: src/App.tsx

Tanggung Jawab Utama: Bertindak sebagai pengatur state pusat dan orkestrator komponen utama. Mengelola data konfigurasi, daftar surat, status login, dan navigasi aplikasi.

Peta Dependensi (Imports & Exports):
- Imports:
  - Komponen lokal: `Login`, `Sidebar`, `MailTable`, `MailDrawer`, `Dashboard`, `Settings`, `PdfTools`, `UserManagement`.
  - Utilitas: `generateM3Theme` dari `src/utils/theme.ts`.
  - Hooks: `useState`, `useEffect`, `useMemo` dari React.

Konfigurasi & Variabel Lingkungan (Env):
- Membaca konfigurasi aplikasi secara dinamis dari API `/api/config`.

Struktur Data & Model Data:
- `currentUser`: Menyimpan objek pengguna yang sedang login.
- `config`: Objek konfigurasi aplikasi.
- `mails`: Array berisi semua rekaman surat.
- `activeTab`: String penanda tab mana yang sedang aktif (dashboard, mails, dll).

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `fetchConfig()`
  - Logika: 1. Mengambil data dari `/api/config` -> 2. Menyimpan ke state `config` -> 3. Memanggil `generateM3Theme` untuk menerapkan palet warna sistem secara global.

- `setupSSE()`
  - Logika: 1. Membuka koneksi `EventSource` ke `/api/sse/online` (Catatan: di kode tertulis `/api/sse/online` namun di server endpointnya adalah `/api/users/online`, diperlukan penyesuaian) -> 2. Mendengarkan update jumlah pengguna online -> 3. Memperbarui state `onlineCount`.

- `handleSaveMail(data)`
  - Logika: 1. Menentukan metode (POST/PUT) berdasarkan keberadaan `mailToEdit` -> 2. Mengirim data metadata dan PDF ke server -> 3. Jika sukses, tutup drawer dan panggil `fetchMails` untuk memperbarui daftar.

- `handleLogout()`
  - Logika: 1. Mengirim permintaan logout ke server -> 2. Menghapus state `currentUser` sehingga aplikasi kembali ke layar Login.

Interaksi Komponen & Arus Data (Data Flow):
- Mengalirkan data `config` dan `currentUser` ke semua komponen anak via Props.
- Menerima event aksi (edit, delete, save) dari komponen anak dan meneruskannya ke Backend API.

---

📄 File: src/components/MailTable.tsx

Jalur File Lengkap: src/components/MailTable.tsx

Tanggung Jawab Utama: Menampilkan daftar surat dalam format tabel Material Design 3, mengelola pencarian lokal, pemilihan massal (selection), dan memicu aksi ekspor/cetak.

Peta Dependensi (Imports & Exports):
- Imports: `React`, `useState`, `useMemo`, dan tipe data dari `../types`.

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `filteredMails` (useMemo)
  - Logika: 1. Mengambil input dari `searchTerm` -> 2. Melakukan filter pada array `mails` -> 3. Mengecek kecocokan pada tipe surat atau seluruh nilai di dalam metadata secara case-insensitive.

- `toggleSelectAll()`
  - Logika: 1. Jika jumlah terpilih sudah sama dengan jumlah data filter, kosongkan pilihan -> 2. Jika tidak, masukkan semua ID dari `filteredMails` ke dalam state `selectedIds`.

- `onPrintReceipt(selectedIds)`
  - Logika: Mengirimkan array ID ke fungsi yang diteruskan dari App.tsx untuk menghasilkan PDF tanda terima di server.

Interaksi Komponen & Arus Data (Data Flow):
- Menerima data `mails` dari App.tsx.
- Mengirimkan ID surat yang dipilih ke fungsi `onDelete`, `onEdit`, atau `onPrintReceipt`.

---

📄 File: src/utils/theme.ts

Jalur File Lengkap: src/utils/theme.ts

Tanggung Jawab Utama: Menghasilkan palet warna Material Design 3 secara dinamis berdasarkan satu warna sumber (seed color).

Peta Dependensi (Imports & Exports):
- Imports: `@material/material-color-utilities`.

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `generateM3Theme(seedColor)`
  - Input: String hex warna.
  - Logika: 1. Mengonversi hex ke format ARGB -> 2. Menghasilkan objek tema lengkap menggunakan `themeFromSourceColor` -> 3. Melakukan pemetaan warna (primary, secondary, surface, dll) ke dalam variabel CSS (Design Tokens) -> 4. Menyisipkan variabel tersebut ke `document.documentElement.style` sehingga seluruh aplikasi berubah warna secara instan.

---

📄 File: src/utils/search.ts

Jalur File Lengkap: src/utils/search.ts

Tanggung Jawab Utama: Menyediakan logika pencarian "Fuzzy" (samar) untuk meningkatkan akurasi pencarian meskipun ada kesalahan ketik kecil atau urutan karakter yang tidak lengkap.

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `fuzzyMatch(text, query)`
  - Logika: 1. Jika teks sama persis, beri skor 1000 -> 2. Jika query adalah substring, beri skor 500 dikurangi posisi index -> 3. Jika hanya urutan karakter yang cocok (subsequence), hitung skor berdasarkan kedekatan karakter dan bonus karakter berurutan -> 4. Kembalikan status cocok dan skor akhir.

- `getMailSearchScore(mail, query)`
  - Logika: 1. Mencari kecocokan di kolom 'type' (bobot 1.5x) -> 2. Mencari di semua field metadata -> 3. Jika field termasuk kategori kritis (nomorSurat, perihal), beri bobot tambahan 1.3x -> 4. Mengembalikan skor tertinggi dari semua kecocokan.

---

📄 File: src/components/MailDrawer.tsx

Jalur File Lengkap: src/components/MailDrawer.tsx

Tanggung Jawab Utama: Menyediakan formulir input dinamis yang menyesuaikan dengan konfigurasi kolom yang didefinisikan di database.

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `handleFileChange(e)`
  - Logika: 1. Membaca file PDF yang dipilih pengguna -> 2. Mengonversi file menjadi string Base64 menggunakan `FileReader` -> 3. Menyimpan nama file dan data base64 ke state `pdfFile`.

- Rendering Form:
  - Logika: Melakukan pemetaan (mapping) terhadap `config.columns` dan merender komponen `<md-filled-text-field>` sesuai tipe data (text/date) yang ditentukan.

---

📄 File: schema.sql

Jalur File Lengkap: schema.sql

Tanggung Jawab Utama: Mendefinisikan struktur tabel untuk database PostgreSQL.

Struktur Tabel:
- `config`: Tabel satu baris yang menyimpan objek JSONB untuk pengaturan aplikasi.
- `users`: Menyimpan data akun pengguna dengan kolom username unik.
- `mails`: Tabel utama untuk agenda surat dengan kolom `metadata` bertipe JSONB untuk mendukung fleksibilitas kolom dinamis.

---

📄 File: data/db.json (Model Data)

Jalur File Lengkap: data/db.json

Tanggung Jawab Utama: Sebagai representasi struktur data sistem (Schema-less Storage).

Struktur Objek Utama:
- `users`: Array objek user `{username, password, name, role}`.
- `mails`: Array objek surat `{id, type, pdfPath, createdAt, metadata: { ... } }`.
- `config`: Objek pengaturan `{appName, themeColor, autoCompressPdf, columns: [...] }`.
  - `columns`: Mendefinisikan atribut surat seperti `noUrut`, `tanggalTerima`, `perihal`, dll., beserta properti `type` dan `required`.

---

📄 File: tsconfig.json

Jalur File Lengkap: tsconfig.json

Tanggung Jawab Utama: Mengatur standar kompilasi TypeScript untuk proyek.

Analisis Konfigurasi:
- `target: ES2022`: Menggunakan fitur JavaScript modern.
- `jsx: react-jsx`: Mendukung sintaks React 17+ tanpa perlu impor React manual di setiap file.
- `paths`: Mendefinisikan alias `@/*` yang merujuk ke root proyek untuk mempermudah impor file.

---

📄 File: src/components/Dashboard.tsx

Jalur File Lengkap: src/components/Dashboard.tsx

Tanggung Jawab Utama: Visualisasi data dan ringkasan eksekutif aplikasi.

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `chartData` (useMemo):
  - Logika: 1. Mengambil 20 surat terakhir -> 2. Mengelompokkan jumlah surat berdasarkan tanggal pembuatan (`createdAt`) -> 3. Memformat data menjadi array objek `{name: tanggal, count: jumlah}` untuk dikonsumsi oleh komponen AreaChart Recharts.

- `stats` (useMemo):
  - Logika: Menghitung total entri dan jumlah surat yang memiliki lampiran fisik PDF.

---

📄 File: src/components/PdfTools.tsx

Jalur File Lengkap: src/components/PdfTools.tsx

Tanggung Jawab Utama: Memberikan antarmuka grafis untuk fitur manipulasi file PDF di sisi server.

Analisis Alur Kerja Fungsi & Logika Bisnis Terperinci:

- `executeTool()`:
  - Logika: 1. Memvalidasi input (minimal file atau rentang halaman) -> 2. Mengirimkan payload ke endpoint API yang sesuai (`/api/pdf/merge`, `/api/pdf/split`, atau `/api/pdf/compress`) -> 3. Menerima respon berupa Blob PDF -> 4. Memicu pengunduhan otomatis di browser menggunakan URL object sementara.

---

📄 File: src/components/Sidebar.tsx

Jalur File Lengkap: src/components/Sidebar.tsx

Tanggung Jawab Utama: Navigasi aplikasi dan indikator status pengguna.

Logika Bisnis:
- Melakukan filter pada `menuItems` berdasarkan peran pengguna (`currentUser.role`). Menu 'Pengguna' hanya ditampilkan jika user adalah 'admin'.
- Menampilkan `onlineCount` yang diperbarui secara real-time melalui mekanisme Server-Sent Events yang dikelola di App.tsx.

---
