# 📨 Sistem Manajemen Agenda Persuratan Digital (SQLite Offline Edition)

Aplikasi web modern untuk manajemen agenda surat yang dirancang dengan filosofi: **Simple, Hemat Sumber Daya, Cepat, Stabil, Lokal, & Portable.**

---

## 🌟 Filosofi Pengembangan
*   **Simple:** Antarmuka bersih menggunakan Google Material Design 3 (M3).
*   **Hemat Sumber Daya:** Arsitektur Node.js dan database SQLite yang sangat ringan dan efisien.
*   **Cepat & Stabil:** Menggunakan SQLite sebagai basis data lokal terintegrasi untuk akses instan tanpa penyiapan server database.
*   **100% Offline & Lokal:** Semua aset (Font, Ikon, Library) disimpan secara lokal. Tidak ada panggilan ke internet (CDN).
*   **Portable:** Aplikasi *Zero-Configuration*—bisa dijalankan langsung bahkan dari Flashdisk tanpa perlu Docker/PostgreSQL.

---

## 🚀 Fitur Utama
- **Responsive UI (Mobile/Tablet Ready):** Tata letak dioptimalkan menggunakan *drawer sidebar*, kartu yang beradaptasi vertikal, dan *horizontal-scroll* yang stabil, memberikan kenyamanan maksimal saat diakses dari HP atau Tablet.
- **Manajemen Surat:** Input, edit, dan hapus agenda surat dengan lampiran PDF.
- **Format Tanggal Baku:** Seluruh ekspor Excel, cetak PDF tanda terima, dan daftar dashboard menampilkan tanggal dalam format `DD/MM/YYYY`.
- **Material Design 3:** UI yang konsisten dengan standar desain Google terbaru.
- **Real-time Tracking:** Pantau jumlah sesi pengguna aktif secara real-time.
- **Offline Ready:** Aset font dan simbol Material Icons dilayani secara lokal dari server sendiri.
- **SQLite Powered:** Menggunakan SQLite lokal tunggal (`data/database.db`) dengan pencadangan otomatis harian di `data/backups/`.

---

## 🛠️ Persyaratan Sistem
- **Node.js** v20+
- **npm** (Manajer paket bawaan Node.js)

---

## 📂 Alat Peluncur & Pengontrol (Launchpad)

Tersedia skrip pengontrol di dalam folder `launchpad/` untuk memudahkan instalasi dan manajemen aplikasi.

### 1. Di Windows (CMD / Double-Click)
*   **`launchpad/deploy.bat`**: Menampilkan menu interaktif berbasis nomor untuk mengelola aplikasi. Cukup klik ganda atau jalankan di CMD untuk memilih opsi:
    1. Periksa Kesiapan Sistem (Node.js & npm)
    2. Instal Aplikasi (Pasang Dependensi & Build)
    3. Jalankan Server di Background
    4. Hentikan Server
    5. Hapus Instalasi
*   **`launchpad/start-local.bat`**: Pintasan sekali klik untuk langsung menjalankan server lokal (otomatis mem-build jika folder `dist/` belum ada).
*   **`launchpad/pack-offline.bat`**: Pintasan sekali klik untuk mengemas seluruh aplikasi menjadi arsip ZIP offline (`release/agenda-persuratan-windows-x64.zip`).

### 2. Di Linux / macOS (Terminal)
*   **`launchpad/deploy.sh`**: Menampilkan menu interaktif berbasis nomor jika dijalankan tanpa argumen, atau menerima opsi langsung:
    *   `bash launchpad/deploy.sh install` : Instalasi dependensi & build produksi.
    *   `bash launchpad/deploy.sh start` : Jalankan server di latar belakang (background).
    *   `bash launchpad/deploy.sh stop` : Hentikan server latar belakang.
    *   `bash launchpad/deploy.sh uninstall` : Hapus dependensi, folder build, dan logs.
*   **`launchpad/start-local.sh`**: Pintasan cepat untuk langsung menjalankan server lokal di terminal.
*   **`launchpad/pack-offline.sh`**: Skrip untuk mengemas aplikasi menjadi arsip ZIP offline (`release/agenda-persuratan-linux-x64.zip`).

---

## 📥 Panduan Instalasi Luring (Offline Release Bundle)

Jika Anda ingin mendistribusikan aplikasi ini ke komputer klien yang **tidak memiliki akses internet**, Anda dapat membuat bundel pra-instal:

1.  **Kemasan Aplikasi (Zipping):**
    Jalankan skrip pengemas luring di mesin pengembang yang memiliki internet:
    *   **Windows:** Klik ganda `launchpad/pack-offline.bat`
    *   **Linux:** Jalankan `bash launchpad/pack-offline.sh`
    
    Arsip ZIP baru akan terbuat di folder `release/` (misal: `release/agenda-persuratan-linux-x64.zip`).
2.  **Pemasangan di Klien (Deployment):**
    *   Kirim berkas ZIP tersebut ke komputer klien.
    *   Ekstrak berkas ZIP di komputer klien.
    *   Cukup klik ganda `launchpad/start-local.bat` (Windows) atau jalankan `bash launchpad/start-local.sh` (Linux). Aplikasi langsung berjalan **tanpa perlu koneksi internet**.

---

## 🏃 Cara Menjalankan Manual (Pembangunan)

Jika Anda ingin mengembangkan atau menjalankan aplikasi secara manual dari source code:

**Mode Produksi (Rekomendasi):**
```bash
npm run start
```

**Mode Pengembangan (Development):**
```bash
npm run dev
```

Akses aplikasi di web browser melalui: `http://localhost:3000`

---

## 🌐 Penggunaan Jaringan Lokal (LAN)

Aplikasi ini dirancang untuk dapat diakses oleh komputer lain dalam satu jaringan lokal (LAN) tanpa koneksi internet.

1.  Cari alamat IP komputer server (misal di Linux: `hostname -I` atau `ip a`, di Windows: `ipconfig`). Contoh IP: `192.168.1.10`.
2.  Dari komputer client dalam jaringan yang sama, buka browser dan akses alamat IP server:
    ```
    http://192.168.1.10:3000
    ```

---

## 🧪 Pengujian & Kontrol Kualitas
Untuk menjalankan pengujian unit (Vitest):
```bash
npm run test
```

Untuk menjalankan linting dan pemeriksaan tipe TypeScript:
```bash
npm run lint
```


---

## 📱 Tangkapan Layar (Screenshots)

### Mode Desktop
![Tampilan Desktop](docs/images/desktop-view.png)

### Mode Mobile / Tablet (Responsif)
![Tampilan Mobile](docs/images/mobile-view.png)
