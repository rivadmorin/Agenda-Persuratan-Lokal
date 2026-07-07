# Task Plan - Integrasi PWA & Akses Jaringan Lokal + Tailscale (QR Code & Enhanced UX)

Rencana pengerjaan integrasi PWA dan penambahan fitur pembagian akses jaringan lokal menggunakan Kode QR serta optimasi konkurensi dengan jaminan dukungan Tailscale, tombol penyegaran instan, indikator koneksi, skeleton loading, petunjuk Tailscale, snackbar salin alamat, deaktivasi upload PDF saat offline, dan PWA prompt update.

## Tahapan Kerja
1. **Instalasi Dependensi**:
   - Pasang `qrcode` (backend).
   - Pasang `vite-plugin-pwa` (devDependencies frontend).
2. **Backend (Server & SQLite Concurrency)**:
   - Tambahkan `this.db.pragma('busy_timeout = 5000')` pada client SQLite.
   - Buat helper `getLocalIpAddresses()` untuk memindai semua kartu jaringan aktif (Wi-Fi, Ethernet, dan Tailscale) dan mengelompokkannya.
   - Buat endpoint `/api/network-info` (daftar interface & port) dan `/api/network-info/qr` (menerima query `?url=...` dan men-stream PNG Kode QR).
3. **Frontend Dashboard (QR Code & IP Display M3 Double-Bezel)**:
   - Hubungkan state `networkInterfaces`, `selectedInterface`, `qrError`, `isRefreshingNetwork`, `isServerOnline`, dan `showCopiedSnackbar` di `Dashboard.tsx`.
   - Desain Banner koneksi M3 double-bezel di Dashboard utama yang merender tombol pill switcher untuk memilih jenis interface jaringan (Wi-Fi, Tailscale, dll.).
   - Tambahkan tombol refresh teranimasi putar, tombol salin alamat, gambar Kode QR dinamis dengan skeleton loading, dan petunjuk khusus Tailscale. Jika loopback 127.0.0.1, tampilkan banner peringatan.
   - Tambahkan badge status koneksi klien real-time (`● Terhubung` / `● Terputus dari Server`) dan snackbar notifikasi sukses salin alamat.
   - Terapkan spring entry animations menggunakan Framer Motion.
4. **Deaktivasi Upload PDF saat Offline**:
   - Deteksi status `isServerOnline` di `App.tsx` (atau operasikan state dari Dashboard/Header).
   - Nonaktifkan dropzone file PDF di dalam Mail Drawer jika status server terputus.
5. **PWA Integration**:
   - Konfigurasi plugin PWA di `vite.config.ts`.
   - Tambahkan inisialisasi SW di `src/main.tsx`.
   - Buat file ikon PWA berbasis vektor (`public/pwa-icon.svg`).
   - Buat komponen `src/components/PwaUpdateToast.tsx` untuk melayani notifikasi update mengambang teranimasi pegas dengan tombol [Muat Ulang] dan [Nanti].
6. **Uji Coba & Verifikasi**:
   - Jalankan kompilasi tsc.
   - Jalankan build Vite produksi.
   - Tes fungsionalitas tombol Refresh Jaringan dan pemantau status koneksi online/offline.
   - Pastikan area dropzone PDF menjadi disabled saat status server host offline.
   - Tes pemindaian Kode QR menggunakan Android di jaringan Wi-Fi lokal dan VPN Tailscale.
   - Tes konflik pengeditan simultan (2 editor mengedit surat yang sama) dan verifikasi pragma `busy_timeout` di SQLite.
