# 📨 Sistem Manajemen Agenda Persuratan Digital

Sistem Manajemen Agenda Persuratan Digital adalah aplikasi berbasis web modern yang dirancang untuk mendigitalisasi, mengelola, dan menganalisis surat masuk, surat keluar, dan surat keputusan secara efisien. Dengan dukungan teknologi ekstraksi pintar (Gemini AI) dan visualisasi grafik data yang interaktif, aplikasi ini mempermudah pelacakan administrasi surat secara real-time.

---

## 🚀 Cara Kerja Aplikasi (How It Works)

Aplikasi ini mengintegrasikan alur kerja administrasi konvensional ke dalam ekosistem digital terpadu melalui modul-modul berikut:

### 1. Ekstraksi Dokumen Pintar (AI-Powered Extraction)
* **Unggah Berkas**: Pengguna dapat mengunggah berkas surat berbentuk PDF (melalui fitur *drag-and-drop* atau seleksi file manual).
* **Ekstraksi Otomatis**: Sistem menggunakan Gemini API (server-side) untuk membaca dokumen PDF secara cerdas, lalu mengekstrak informasi penting seperti nomor surat, tanggal surat, pengirim, penerima, perihal, kategori, hingga ringkasan isi surat tanpa perlu mengetik manual.
* **Review Mandiri**: Pengguna dapat meninjau hasil ekstraksi kecerdasan buatan sebelum disimpan secara permanen ke dalam basis data agenda persuratan.

### 2. Dashboard Analitik & Trafik Real-Time
* **Statistik Utama**: Menyajikan visualisasi jumlah surat masuk, surat keluar, surat keputusan, serta rasio kategori surat dalam diagram lingkaran (*pie chart*) interaktif menggunakan pustaka **Recharts**.
* **Trafik Persuratan Bulanan**: Melacak naik-turunnya volume persuratan sepanjang tahun untuk mengamati periode sibuk administrasi.
* **Trafik Persuratan Harian**: Memungkinkan pemantauan aktivitas persuratan harian dengan rentang waktu fleksibel (7 hari, 14 hari, atau 30 hari terakhir) guna menganalisis produktivitas harian secara presisi.
* **Opsi Representasi**: Grafik dapat diubah format penampilannya secara instan antara diagram batang (*Bar Chart*) atau diagram area (*Area Chart*) sesuai kenyamanan visual pengguna.

### 3. Manajemen Tabel Agenda & Cetak Tanda Terima
* **Tabel Terstruktur**: Daftar surat dilengkapi fitur pencarian pintar, filter kategori (surat masuk/keluar/keputusan), dan pagination yang responsif.
* **Lembar Disposisi & Tanda Terima**: Menyediakan modal cetak disposisi atau tanda terima surat (*Receipt*) instan yang rapi untuk kebutuhan arsip fisik.
* **Drawer Detail**: Klik pada surat apa pun untuk memunculkan panel laci (*drawer*) samping yang memuat ringkasan dokumen lengkap bersandingan dengan pratinjau (*preview*) dokumen PDF asli.

### 4. Kustomisasi Tema Dinamis
* **Dukungan Mode Gelap**: Transisi mulus antara Mode Terang (*Light Mode*) dan Mode Gelap (*Dark Mode*) untuk kenyamanan mata pengguna.
* **Pilihan Warna Aksentuasi**: Melalui menu Pengaturan (*Settings*), administrator dapat mengubah warna aksen utama aplikasi (misalnya Biru Korporat, Hijau Toska, Ungu Royal, Merah Muda, atau Slate) yang langsung diterapkan secara real-time di seluruh komponen antarmuka.

---

## 📦 Persyaratan Sistem (Prerequisites)

Sebelum memasang aplikasi, pastikan komputer Anda telah memenuhi persyaratan berikut:
* **Node.js** versi 18.x atau lebih tinggi.
* **npm** (biasanya otomatis terpasang bersama Node.js) atau **Yarn** sebagai manajer paket.
* Koneksi internet aktif (untuk pengunduhan dependensi dan pemanggilan API).

---

## 📥 Panduan Instalasi (Installation)

Ikuti langkah-langkah di bawah ini untuk memasang aplikasi di lingkungan lokal Anda:

1. **Unduh atau Kloning Repositori**:
   Ekstrak file ZIP proyek ke direktori kerja Anda, atau lakukan kloning jika menggunakan Git:
   ```bash
   git clone <url-repositori-anda>
   cd <nama-folder-proyek>
   ```

2. **Pasang Dependensi**:
   Jalankan perintah berikut untuk mengunduh dan memasang semua pustaka yang dibutuhkan oleh sistem:
   ```bash
   npm install
   ```
   *Atau jika Anda menggunakan yarn:*
   ```bash
   yarn install
   ```

3. **Konfigurasi Variabel Lingkungan (Environment Variables)**:
   Buat file bernama `.env` di direktori utama (*root*) aplikasi dengan menyalin contoh dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Isi token autentikasi API jika Anda ingin mengaktifkan layanan AI backend:
   ```env
   GEMINI_API_KEY=masukkan_api_key_gemini_anda_di_sini
   ```

---

## 🏃‍♂️ Cara Menjalankan Aplikasi (Running the Application)

### 1. Mode Pengembangan (Development Mode)
Untuk menjalankan aplikasi dalam mode pengembangan lokal dengan fitur penyegaran otomatis (*hot reload*):
```bash
npm run dev
```
Buka peramban (*browser*) Anda lalu akses alamat:
👉 **`http://localhost:3000`**

### 2. Mode Produksi (Production Build & Start)
Jika Anda ingin menguji atau mendeploy aplikasi dengan performa maksimal dan ukuran file yang dioptimalkan:

A. **Kompilasi Aplikasi (Build)**:
```bash
npm run build
```
Proses ini akan menghasilkan folder `dist/` yang berisi file aset statis frontend serta kompilasi server backend Node.js (`dist/server.cjs`).

B. **Jalankan Server Produksi (Start)**:
```bash
npm run start
```
Aplikasi akan berjalan di lingkungan produksi mandiri pada port `3000`.

---

## 🗑️ Cara Menghapus Aplikasi (Uninstallation / Cleanup)

Jika Anda ingin menghapus atau membersihkan proyek ini dari komputer Anda, ikuti prosedur berikut:

1. **Hentikan Server yang Sedang Berjalan**:
   Tekan kombinasi tombol `Ctrl + C` pada terminal tempat aplikasi dijalankan untuk mematikan proses server Node.js.

2. **Bersihkan File Build dan Dependensi Terinstal**:
   Untuk mengosongkan ruang penyimpanan tanpa menghapus kode sumber utama, Anda dapat menghapus folder hasil kompilasi (`dist`) dan modul pustaka pihak ketiga (`node_modules`):
   * **Sistem Operasi Linux / macOS**:
     ```bash
     rm -rf node_modules dist
     ```
   * **Sistem Operasi Windows (Command Prompt)**:
     ```cmd
     rmdir /s /q node_modules dist
     ```
   * **Sistem Operasi Windows (PowerShell)**:
     ```powershell
     Remove-Item -Recurse -Force node_modules, dist
     ```

3. **Hapus Seluruh Folder Proyek**:
   Bila ingin menghapus keseluruhan aplikasi beserta seluruh riwayat kode sumbernya:
   * Kembali ke folder satu tingkat di atas proyek:
     ```bash
     cd ..
     ```
   * Hapus folder utama proyek:
     * **Linux / macOS**: `rm -rf <nama-folder-proyek>`
     * **Windows (PowerShell)**: `Remove-Item -Recurse -Force <nama-folder-proyek>`

---

## 🛠️ Stack Teknologi

* **Frontend**: React (TypeScript), Vite, Tailwind CSS, Motion (Framer Motion).
* **Komponen Diagram**: Recharts, Lucide Icons.
* **Server Backend**: Node.js, Express, ESBuild compiler.
