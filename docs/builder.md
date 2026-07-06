# Builder Memory Journal

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
## 06-07-2026 - [Unified Database Access via Drizzle ORM]
- **Tags:** #database #refactor #drizzle-orm
- **Level:** 🟢 INFO
- **Scope:** [server.ts](file:///server.ts)
- **Notify Agents:** @Orchestrator, @Builder, @Scholar
- **Symptom:** Inconsistent DB access patterns (raw pg vs Drizzle).
- **Root Cause:** Partial migration from initial setup.
- **Learning:** Migrating to a unified ORM (Drizzle) significantly improves type safety and removes redundant connection pool management.
- **Action/Rule:** Always use 'db' instance from 'src/db/index.ts' for database operations in 'server.ts'.
- **Verify Command:** `pnpm lint && pnpm test`
