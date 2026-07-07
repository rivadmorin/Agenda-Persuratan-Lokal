# Progress - PWA & Local Network QR Integration

Pelacakan progres integrasi PWA dan pembagian akses Kode QR.

- `[ ]` Install dependensi `qrcode` (backend) dan `vite-plugin-pwa` (frontend)
- `[ ]` Tambahkan konfigurasi `busy_timeout` di `server.ts`
- `[ ]` Buat helper `getLocalIpAddresses()` & route API jaringan (dukungan Tailscale) serta Kode QR di `server.ts`
- `[ ]` Desain Banner QR Code & IP Host di `src/components/Dashboard.tsx` dengan visual M3 double-bezel, selektor Wi-Fi/Tailscale, tombol refresh teranimasi putar, skeleton loading QR, tooltip Tailscale, snackbar salin alamat, & error handling loopback 127.0.0.1
- `[ ]` Buat fitur monitoring status koneksi klien real-time di `src/components/Dashboard.tsx` dan integrasikan ke `App.tsx` untuk menonaktifkan dropzone unggah PDF saat offline
- `[ ]` Konfigurasi plugin PWA di `vite.config.ts`
- `[ ]` Buat file ikon PWA berbasis vektor (`public/pwa-icon.svg`)
- `[ ]` Daftarkan Service Worker otomatis di `src/main.tsx`
- `[ ]` Buat PWA Update Toast mengambang teranimasi pegas di `src/components/PwaUpdateToast.tsx`
- `[ ]` Verifikasi build produksi, tes scan Kode QR via Android (lokal & Tailscale), fungsionalitas tombol Refresh, status online/offline + deaktivasi dropzone, dan verifikasi simulasi 2 editor
