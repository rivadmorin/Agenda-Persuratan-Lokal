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
# Inspector Memory Journal entry

## 05-07-2026 - Post-Pull Hygiene Audit
- **Tags:** #hygiene #lint #documentation
- **Level:** 🟢 INFO
- **Scope:** [src/utils/search.ts](file:///src/utils/search.ts), [src/App.tsx](file:///src/App.tsx)
- **Notify Agents:** @Orchestrator
- **Symptom:** Codebase maintains high standard of hygiene after pull.
- **Root Cause:** Consistent application of 'Anti-Slop' rules in previous tasks.
- **Learning:** Existing utility functions like `fuzzyMatch` are well-documented with JSDoc. Linting (`tsc --noEmit`) passes cleanly.
- **Action/Rule:** Verified no "TODO" or "console.log" clutter in core src files.
- **Verify Command:** `pnpm lint`
## 06-07-2026 - [Final Hygiene and Linting Verification]
- **Tags:** #inspector #lint #hygiene
- **Level:** 🟢 INFO
- **Scope:** [src/](file:///src/)
- **Notify Agents:** @Orchestrator
- **Symptom:** Need to ensure the codebase remains clean after configuration changes and dependency restoration.
- **Root Cause:** Routine hygiene check.
- **Learning:** Standardizing environment variables and restoring the environment allows the linter (`tsc --noEmit`) to run correctly and verify type safety across the project.
- **Action/Rule:** Verified that the project passes linting without errors.
- **Verify Command:** `pnpm lint`
