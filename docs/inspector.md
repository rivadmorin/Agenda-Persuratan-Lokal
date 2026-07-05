# Inspector Memory Journal

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
## 05-07-2026 - Codebase Hygiene Audit
- **Tags:** #audit #cleanup #refactor
- **Level:** 🟡 WARNING
- **Scope:** [server.ts](file:///server.ts), [src/db/](file:///src/db/)
- **Notify Agents:** @Builder, @Nomad
- **Symptom:** Inconsistent database access patterns. `server.ts` uses raw `pg` queries, while `src/db/` has Drizzle ORM configured but unused in the backend entry point.
- **Root Cause:** Partial migration to Drizzle ORM or separate development tracks for frontend/backend database logic.
- **Learning:** Mixing raw SQL and ORM without a unified abstraction layer makes portability and schema changes harder to manage.
- **Action/Rule:** Standardize environment variable names (e.g., `DB_*` vs `SQL_*`) and unify DB access if possible.
- **Verify Command:** `npm run lint`
