# Technical Audit & Findings - PWA & Local Network QR Integration

## Temuan Teknis
- **Database Concurrency**:
  - Tabel `mails` sudah memiliki kolom `version_id` dan backend sudah siap melempar status `409` saat terjadi tabrakan versi (optimistic locking).
  - Frontend (`src/App.tsx`) sudah menangani respon status `409` dengan memunculkan modal dialog Konflik Data (Optimistic Lock) kepada pengguna.
  - Untuk memproteksi penulisan simultan tingkat database agar tidak memicu `SQLITE_BUSY` instan, pragmas `busy_timeout` di SQLite perlu ditambahkan (bawaan Node.js `better-sqlite3` adalah 0 jika tidak dikonfigurasi).
- **Deteksi Jaringan, Tailscale & QR**:
  - Node.js modul bawaan `os.networkInterfaces()` dapat mengambil semua IP. Kita perlu memfilter IPv4 non-internal.
  - VPN Tailscale membuat virtual interface (seperti `tailscale0` atau `Tailscale`) dengan IP dalam rentang `100.64.0.0/10`. Kita harus memetakan semua interface aktif ke array agar frontend dapat membedakan koneksi Wi-Fi biasa dengan VPN Tailscale.
  - Penyegaran dinamis & UX: Menambahkan tombol refresh visual dengan state loading akan memicu ulang fetch `/api/network-info` untuk mendeteksi perangkat LAN/Wi-Fi/VPN yang baru tersambung/terputus.
  - Penambahan visual skeleton shimmer selama loading QR Code dan penanganan error load gambar.
  - Penyalinan alamat didukung snackbar konfirmasi melayang.
  - Deteksi online/offline klien ke server host secara real-time via status polling atau status ping ringan di latar belakang.
  - Modul npm `qrcode` dapat digunakan di backend untuk men-stream gambar PNG langsung ke response stream Express secara 100% offline.
  - Skenario error jaringan: Jika IP host adalah loopback `127.0.0.1`, server dianggap offline dari jaringan lokal, dan frontend harus merespon dengan menampilkan banner error/peringatan visual bertema amber (Material 3).
- **PWA & Caching**:
  - Codebase saat ini tidak memiliki file gambar visual statis (seperti favicon atau PNG logo). Seluruh ikon visual dirender melalui font Material Symbols.
  - Sebagai solusinya, kita akan membuat file ikon SVG vektor baru (`public/pwa-icon.svg`) dengan tema amplop minimalis menggunakan palet warna Material 3 biru-teal. SVG didukung luas untuk ikon launcher PWA.
  - Konfigurasi PWA menggunakan metode **Prompt Update (Hybrid)** dengan menghadirkan komponen notifikasi melayang teranimasi pegas `PwaUpdateToast.tsx` berisi tombol [Muat Ulang] dan [Nanti], yang menjamin keamanan data pengguna agar tidak ter-reload secara paksa saat sedang mengetik.
