# Analisis Teknis Mendalam: Sistem Agenda Persuratan

## 🏗️ Arsitektur Sistem
Aplikasi ini menggunakan stack **PERN** (PostgreSQL, Express, React, Node.js) yang dioptimalkan untuk penggunaan lokal dan offline.

### 1. Backend (Node.js & Express)
- **Database:** PostgreSQL murni (Strict Mode). Menggunakan `pg.Pool` untuk manajemen koneksi.
- **SSE (Server-Sent Events):** Endpoint `/api/sse/online` untuk pelacakan pengguna aktif secara real-time.
- **File Storage:** PDF disimpan di `data/uploads/` dengan struktur folder berbasis tanggal (`YYYY/MM/DD`).
- **PDF Processing:** Mendukung penggabungan, pemisahan, dan kompresi PDF menggunakan `pdf-lib` dan `jsPDF`.
- **Excel Integration:** Import/Export data agenda menggunakan `xlsx` (SheetJS).

### 2. Frontend (React 19 & Material Design 3)
- **UI Framework:** React 19 dengan Web Components resmi Google (`@material/web`).
- **Styling:** Tailwind CSS v4 untuk desain yang responsif dan modern.
- **Theming:** Engine tema dinamis (`src/utils/theme.ts`) berbasis Material Design 3 (M3).
- **Typography:** 100% Offline dengan font **Product Sans**, **Roboto**, dan **JetBrains Mono**.
- **Search:** Algoritma *fuzzy search* khusus di sisi klien (`src/utils/search.ts`).

### 3. Keamanan & Stabilitas
- **Optimistic Locking:** Penggunaan `versionId` (UUID/Hash) untuk konsistensi data saat akses konkuren.
- **Sidecar Metadata:** File `.pdf.json` berdampingan dengan PDF untuk redundansi dan pemulihan data (*reconstruction*).
- **Automated Backup:** Sistem cadangan otomatis ke `data/backups/` dalam format JSON atau ZIP.

## 📁 Struktur Direktori Utama
- `src/utils/`: Logika pencarian, theming, dan utilitas frontend.
- `data/`: (Diabaikan oleh Git) Berisi uploads, backups, logs, dan data dinamis.
- `docs/`: Dokumentasi teknis dan panduan sistem.
- `tests/`: Skrip pengujian otomatis menggunakan Playwright.

## 🔄 Alur Kerja Data
1. **Pencatatan:** Surat diinput -> Metadata disimpan di PG -> PDF disimpan di disk dengan nama yang diformat otomatis.
2. **Sinkronisasi:** Perubahan metadata memicu pembaruan file sidecar JSON untuk integritas ekstra.
3. **Pemulihan:** Fitur `/api/backup/integrity/reconstruct` memungkinkan pembangunan ulang database dari file fisik PDF & sidecar.
