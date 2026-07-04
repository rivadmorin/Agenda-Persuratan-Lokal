# Analisis Teknis Mendalam: Sistem Agenda Persuratan

## 🏗️ Arsitektur Sistem
Aplikasi ini menggunakan stack **PERN** (PostgreSQL, Express, React, Node.js) yang dioptimalkan untuk penggunaan lokal dan offline.

### 1. Backend (Node.js & Express)
- **Database:** PostgreSQL murni (Strict Mode). Tidak menggunakan fallback JSON untuk menjamin integritas data sesuai permintaan pengguna.
- **SSE (Server-Sent Events):** Digunakan untuk fitur *real-time online user tracking* di endpoint `/api/sse/online`.
- **File Storage:** PDF disimpan di `data/uploads/` dengan struktur folder berbasis tanggal (`YYYY/MM/DD`).

### 2. Frontend (React 19 & Material Design 3)
- **UI Framework:** Menggunakan Web Components resmi dari Google (`@material/web`).
- **Theming:** Engine tema dinamis di `src/utils/theme.ts` yang mengonversi satu warna benih menjadi palet M3 lengkap.
- **Typography:** Menggunakan font **Product Sans** (Lokal) sebagai identitas visual utama, didukung oleh Roboto dan JetBrains Mono.

### 3. Keamanan & Stabilitas
- **Optimistic Locking:** Menggunakan `versionId` untuk mencegah tabrakan data saat dua pengguna mengedit surat yang sama.
- **Sidecar Metadata:** Setiap file PDF memiliki file `.pdf.json` pendamping untuk redundansi metadata.

## 📁 Struktur Direktori Utama
- `src/assets/fonts/`: Menyimpan file font Product Sans secara lokal.
- `data/`: Pusat penyimpanan database (backups), logs, dan file fisik PDF.
- `tests/`: Skrip pengujian E2E menggunakan Playwright.

## 🔄 Alur Kerja Data
1. Pengguna login -> Backend memvalidasi ke PostgreSQL.
2. Pengguna menambah surat -> Metadata masuk ke Tabel `mails`, PDF disimpan ke Disk.
3. Sidebar menerima update SSE -> Menampilkan jumlah pengguna online secara real-time.

---
[SYSTEM MEMORY LOCK: SUCCESS]
Seluruh struktur, dependensi, dan logika bisnis proyek ini telah direkam ke dalam memori aktif. Mode Pakar Proyek siap digunakan untuk instruksi selanjutnya.
