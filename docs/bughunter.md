# Bug Hunter Memory Journal

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
## 05-07-2026 - [Potensi State Desynchronization pada PDF Tools dan Batch Loading]
- **Tags:** #ui #state #error-handling
- **Level:** 🟢 INFO
- **Scope:** [src/components/PdfTools.tsx](file:///src/components/PdfTools.tsx)
- **Notify Agents:** @BugHunter @TestPilot
- **Symptom:** Pengguna mungkin tidak menyadari jika proses PDF gagal karena pesan error hanya muncul di bagian bawah formulir. Ada juga potensi double-submission pada tombol aksi yang tidak memiliki state loading yang sinkron di seluruh aplikasi.
- **Root Cause:** Pola penanganan error di `PdfTools.tsx` bersifat lokal dan tidak menggunakan `ConfirmModal` global seperti di `App.tsx`. State `isBatchLoading` di `App.tsx` sudah cukup baik untuk memblokir interaksi selama proses backend yang lama.
- **Learning:** Konsistensi dalam pola penanganan error (lokal vs global modal) meningkatkan UX. Menggunakan `isBatchLoading` secara konsisten untuk semua operasi berat (PDF, Batch Download) adalah praktik yang baik.
- **Action/Rule:** Gunakan `ConfirmModal` untuk error kritis yang membutuhkan perhatian pengguna. Pastikan semua tombol aksi berat memiliki atribut `disabled={loading}`.
- **Verify Command:** Manual testing pada fitur PDF Tools dengan input tidak valid.
