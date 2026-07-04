# 📨 Sistem Manajemen Agenda Persuratan Digital

Aplikasi web modern untuk manajemen agenda surat yang dirancang dengan filosofi: **Simple, Hemat Sumber Daya, Cepat, Stabil, Lokal, & Portable.**

---

## 🌟 Filosofi Pengembangan
*   **Simple:** Antarmuka bersih menggunakan Google Material Design 3 (M3).
*   **Hemat Sumber Daya:** Arsitektur Node.js yang ringan dan efisien.
*   **Cepat & Stabil:** Menggunakan PostgreSQL sebagai basis data utama untuk integritas data maksimal.
*   **100% Offline & Lokal:** Semua aset (Font, Ikon, Library) disimpan secara lokal. Tidak ada panggilan ke internet (CDN).
*   **Portable:** Bisa dijalankan dari Flashdisk menggunakan Docker.

---

## 🚀 Fitur Utama
- **Manajemen Surat:** Input, edit, dan hapus agenda surat dengan lampiran PDF.
- **Material Design 3:** UI yang konsisten dengan standar desain terbaru Google.
- **Real-time Tracking:** Pantau jumlah pengguna yang sedang aktif secara real-time.
- **Offline Ready:** Font **Product Sans** dan Material Symbols dilayani secara lokal.
- **PostgreSQL Powered:** Keamanan dan kecepatan akses data terjamin.

---

## 🛠️ Persyaratan Sistem
- **Node.js** v20+
- **Docker & Docker Compose** (Untuk menjalankan PostgreSQL)

---

## 📥 Panduan Instalasi (Satu Komando)

### 🐧 Linux / macOS
```bash
chmod +x setup.sh
./setup.sh
```

### 🪟 Windows (PowerShell)
```powershell
.\setup.ps1
```

Skrip di atas akan otomatis:
1. Memeriksa ketersediaan Docker.
2. Menjalankan kontainer PostgreSQL.
3. Memasang semua dependensi.
4. Melakukan kompilasi (Build) aplikasi.

---

## 🏃 Cara Menjalankan
Setelah instalasi selesai, cukup jalankan:
```bash
npm run start
```
Akses aplikasi di: `http://localhost:3000`

---

## 🧪 Pengujian (Playwright E2E)
Untuk menjalankan otomatisasi pengujian:
```bash
npx playwright test
```

---

## 📖 Dokumentasi Teknis
Untuk detail arsitektur, silakan baca [Analisis Teknis Mendalam](docs/ANALISIS_TEKNIS_MENDALAM.md).

---
*Dibuat dengan fokus pada ketahanan sistem dan kemudahan penggunaan lokal.*
