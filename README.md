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
- **Manajemen Surat:** Input, edit, dan hapus agenda surat dengan lampiran PDF.
- **Material Design 3:** UI yang konsisten dengan standar desain Google terbaru.
- **Real-time Tracking:** Pantau jumlah sesi pengguna aktif secara real-time.
- **Offline Ready:** Aset font dan simbol Material Icons dilayani secara lokal dari server sendiri.
- **SQLite Powered:** Menggunakan SQLite lokal tunggal (`data/database.db`) dengan pencadangan otomatis harian di `data/backups/`.

---

## 🛠️ Persyaratan Sistem
- **Node.js** v20+
- **npm** (Manajer paket bawaan Node.js)

---

## 📥 Panduan Instalasi (Satu Komando)

Jalankan skrip deployment terpadu untuk memasang dependensi dan membangun aplikasi secara otomatis:

```bash
bash launchpad/deploy.sh install
```

*Catatan untuk drive dengan mount `noexec`: Skrip instalasi di atas dan perintah npm di bawah secara otomatis dikonfigurasi untuk mengeksekusi biner via wrapper Node, sehingga aman dari galat "Permission denied (EACCES)".*

---

## 🏃 Cara Menjalankan

### Cara Cepat (Satu Klik)
Gunakan skrip startup terpadu yang otomatis memeriksa kompilasi dan menjalankan server:
```bash
bash launchpad/start-local.sh
```

### Cara Manual
Setelah instalasi selesai, Anda dapat menjalankan perintah berikut:

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

1. Cari alamat IP komputer server (misal di Linux: `hostname -I` atau `ip a`, di Windows: `ipconfig`). Contoh IP: `192.168.1.10`.
2. Dari komputer client dalam jaringan yang sama, buka browser dan akses alamat IP server:
   ```
   http://192.168.1.10:3000
   ```

---

## 🧪 Pengujian
Untuk menjalankan pengujian unit (Vitest):
```bash
npm run test
```

Untuk menjalankan linting dan pemeriksaan tipe TypeScript:
```bash
npm run lint
```
