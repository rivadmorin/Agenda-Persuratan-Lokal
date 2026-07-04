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

## 📥 Panduan Setup Cepat & Manajemen (Unified Scripts)

Aplikasi telah dilengkapi dengan **satu skrip setup interaktif** untuk masing-masing sistem operasi (Windows & Linux Debian) yang memudahkan proses **Instalasi otomatis**, **Konfigurasi API**, **Auto-start / Background Service**, serta **Uninstall bersih**.

### 💻 1. Di Windows (PowerShell)
Gunakan skrip `setup.ps1` untuk instalasi interaktif satu langkah:

1. Klik tombol **Start**, cari **PowerShell**, klik kanan lalu pilih **Run as Administrator**.
2. Masuk ke direktori proyek Anda:
   ```powershell
   cd "C:\path\ke\folder-proyek"
   ```
3. Jalankan skrip setup:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; .\setup.ps1
   ```
4. **Fitur di Windows:**
   * Memeriksa dan memandu instalasi Node.js.
   * Memasang dependensi (`npm install`) & melakukan kompilasi otomatis (`npm run build`).
   * Konfigurasi `.env` dengan input `GEMINI_API_KEY` interaktif.
   * **Auto-Start Latar Belakang (Silent Mode):** Membuat skrip peluncur tak kasat mata (`launch.vbs` + `start-app.bat`) di folder Startup Windows sehingga server berjalan otomatis tanpa jendela CMD hitam yang mengganggu.
   * **Shortcut Desktop:** Membuat pintasan web langsung di desktop Anda untuk akses sekali klik.

---

### 🐧 2. Di Linux (Debian / Ubuntu / derivatif)
Gunakan skrip `setup.sh` untuk instalasi interaktif satu langkah:

1. Buka terminal Anda.
2. Masuk ke direktori proyek Anda:
   ```bash
   cd /path/ke/folder-proyek
   ```
3. Jalankan skrip setup (gunakan `sudo` jika ingin mengonfigurasi Systemd service secara otomatis):
   ```bash
   sudo ./setup.sh
   ```
4. **Fitur di Linux:**
   * Memasang Node.js v20 LTS dan npm otomatis dari repositori resmi NodeSource jika belum terdeteksi.
   * Memasang dependensi (`npm install`) & mengompilasi program (`npm run build`).
   * Konfigurasi `.env` interaktif.
   * **Systemd Service Integration:** Memasang aplikasi sebagai *daemon system* (`agenda-surat.service`) sehingga otomatis menyala saat sistem operasi booting, dapat dihidup-matikan lewat `systemctl`, dan auto-restart jika crash.

---

## 🗑️ Cara Menghapus Aplikasi (Uninstallation)

Anda tidak perlu menghapus file secara manual satu per satu. Cukup gunakan skrip setup yang sama:

### 💻 Di Windows (PowerShell):
1. Jalankan kembali skrip dengan hak akses administrator:
   ```powershell
   .\setup.ps1
   ```
2. Pilih menu **2) Hapus / Uninstall Aplikasi**. Skrip akan:
   * Menghentikan semua proses server aktif di port 3000 secara paksa.
   * Menghapus pintasan Desktop dan entri Startup otomatis.
   * Membersihkan file build (`dist`) dan folder `node_modules`.
   * Menawarkan opsi opsional untuk menghapus seluruh folder proyek dan data tersimpan secara permanen.

### 🐧 Di Linux (Debian):
1. Jalankan kembali skrip:
   ```bash
   sudo ./setup.sh
   ```
2. Pilih menu **2) Hapus / Uninstall Aplikasi**. Skrip akan:
   * Mematikan, menonaktifkan, dan menghapus unit service `/etc/systemd/system/agenda-surat.service`.
   * Memulihkan daemon systemd (`systemctl daemon-reload`).
   * Menghapus berkas kompilasi (`dist`) dan dependensi (`node_modules`).
   * Memberikan opsi untuk menghapus data agenda (`data/`), file konfigurasi (`.env`), atau bahkan keseluruhan direktori proyek Anda.

---

## 🛠️ Stack Teknologi

* **Frontend**: React (TypeScript), Vite, Tailwind CSS, Motion (Framer Motion).
* **Komponen Diagram**: Recharts, Lucide Icons.
* **Server Backend**: Node.js, Express, ESBuild compiler.

---

## 📖 Dokumentasi Teknis & Arsitektur

Untuk pemahaman mendalam mengenai arsitektur sistem, peta direktori, dependensi antar-file, serta penjabaran logika bisnis terperinci, silakan merujuk pada berkas berikut:

* [**Analisis Teknis Mendalam**](docs/ANALISIS_TEKNIS_MENDALAM.md)
