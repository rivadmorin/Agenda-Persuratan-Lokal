# Material Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## DD-MM-YYYY - [Judul Pembelajaran]
- **Tags:** `#kategori/alat` `#jenis-masalah`
- **Level:** `🔴 CRITICAL` | `🟡 WARNING` | `🟢 INFO`
- **Scope:** `[Nama Berkas](file:///absolute/path/to/file)`
- **Notify Agents:** `@AgentName`
- **Fingerprint ID:** `ERR-XXXX` (jika ada di docs/scholar.md)
- **Symptom:** [Gejala/pesan error yang muncul]
- **Root Cause:** [Penyebab utama arsitektur/konfigurasi]
- **Learning:** [Prinsip baru yang ditemukan]
- **Action/Rule:** [Langkah konkret tindakan pencegahan]
- **Verify Command:** `perintah verifikasi` (jika ada)
## 05-07-2026 - [Integrasi Token MD3 dan Shadow DOM Consistency]
- **Tags:** #material #tokens #theming
- **Level:** 🟢 INFO
- **Scope:** [src/utils/theme.ts](file:///src/utils/theme.ts), [src/index.css](file:///src/index.css)
- **Notify Agents:** @Material
- **Symptom:** Penggunaan token `--md-sys-color-surface-container-*` sudah diimplementasikan secara dinamis di `theme.ts`, yang merupakan praktik sangat baik untuk mendukung M3.
- **Root Cause:** Arsitektur tema menggunakan `material-color-utilities` untuk menghasilkan skema warna dari warna benih (seed color).
- **Learning:** Komponen `@material/web` mendeteksi token sistem secara otomatis jika didefinisikan di `:root`. Penggunaan `color-mix` untuk kustomisasi latar belakang memastikan kontras tetap terjaga.
- **Action/Rule:** Selalu gunakan variabel CSS MD3 untuk warna komponen. Jangan gunakan kode HEX keras di dalam komponen JSX.
- **Verify Command:** Inspeksi elemen di browser untuk memastikan variabel CSS dari `theme.ts` terikat dengan benar ke komponen `<md-*>`.
