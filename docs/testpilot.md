# Test Pilot Memory Journal

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
## 05-07-2026 - [Verifikasi Cakupan Tes dan Stabilitas Runner]
- **Tags:** #testing #vitest #coverage
- **Level:** 🟢 INFO
- **Scope:** [src/utils/search.test.ts](file:///src/utils/search.test.ts), [src/components/Sidebar.test.tsx](file:///src/components/Sidebar.test.tsx)
- **Notify Agents:** @TestPilot
- **Symptom:** Seluruh 20 tes di dalam repository berhasil dijalankan dengan Vitest tanpa kegagalan.
- **Root Cause:** Tes yang ada mencakup logika pencarian fuzzy dan render dasar komponen Sidebar.
- **Learning:** Penggunaan `jsdom` sebagai environment testing memungkinkan verifikasi komponen React yang menggunakan API browser (seperti DOM).
- **Action/Rule:** Pertahankan pola penulisan tes yang mengisolasi logika (unit test) dan komponen (integration test). Pastikan mock dilakukan untuk fetch/API call di tes masa depan.
- **Verify Command:** `npm test`
# Test Pilot Memory Journal entry

## 05-07-2026 - Post-Pull Logic Verification
- **Tags:** #testing #vitest #post-pull
- **Level:** 🟢 INFO
- **Scope:** [src/utils/search.test.ts](file:///src/utils/search.test.ts), [src/components/Sidebar.test.tsx](file:///src/components/Sidebar.test.tsx)
- **Notify Agents:** @Orchestrator
- **Symptom:** Workspace required fresh `pnpm install` before tests could run.
- **Root Cause:** `node_modules` was missing or desynced after repository sync.
- **Learning:** Always run `pnpm install` after a pull to ensure test runners like Vitest are available and dependencies are up to date.
- **Action/Rule:** Verified 20/20 tests passed. Core search logic and Sidebar component are stable.
- **Verify Command:** `pnpm test`
## 06-07-2026 - [Regression Verification Successful]
- **Tags:** #testpilot #regression #vitest
- **Level:** 🟢 INFO
- **Scope:** [src/utils/search.test.ts](file:///src/utils/search.test.ts), [src/components/Sidebar.test.tsx](file:///src/components/Sidebar.test.tsx)
- **Notify Agents:** @Orchestrator
- **Symptom:** Need to ensure that environment restoration and configuration unification did not break core functionality.
- **Root Cause:** Routine stability check.
- **Learning:** Existing tests for search logic and UI components remain stable post-dependency restoration. The transition to unified DB environment variables did not affect the frontend logic verified by these tests.
- **Action/Rule:** Successfully verified 20/20 tests passed.
- **Verify Command:** `pnpm test`
