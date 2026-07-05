# Palette Memory Journal

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
## 05-07-2026 - [Audit Aksesibilitas dan Responsivitas UI]
- **Tags:** #design #a11y #responsive
- **Level:** 🟢 INFO
- **Scope:** [src/components/Sidebar.tsx](file:///src/components/Sidebar.tsx), [src/components/MailTable.tsx](file:///src/components/MailTable.tsx)
- **Notify Agents:** @Design @Taste
- **Symptom:** Sidebar memiliki atribut `aria-label` dan `title` yang baik, namun tabel agenda memiliki banyak kolom yang mungkin sulit dibaca di perangkat seluler (meskipun sudah ada mekanisme `hidden lg:table-cell`).
- **Root Cause:** Desain saat ini sudah mengimplementasikan sembunyi/tampilkan kolom berdasarkan breakpoint, namun masih ada potensi peningkatan pada target sentuh (touch targets) di perangkat mobile.
- **Learning:** Penggunaan `md-icon-button` dan `md-checkbox` dari Material Web sudah memberikan target sentuh yang standar (48x48px) secara default.
- **Action/Rule:** Pastikan semua elemen interaktif yang bersifat ikon-saja tetap memiliki `aria-label`. Pertahankan konsistensi radius sudut (24px-32px) sesuai standar "Taste" di proyek ini.
- **Verify Command:** Manual audit menggunakan screen reader atau inspeksi DOM untuk atribut ARIA.
