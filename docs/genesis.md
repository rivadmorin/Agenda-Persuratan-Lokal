# Genesis Memory Journal

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
## 05-07-2026 - Workspace Structure Initialization
- **Tags:** #setup #workspace
- **Level:** 🟢 INFO
- **Scope:** [docs/](file:///docs/)
- **Notify Agents:** @Orchestrator
- **Symptom:** Missing `docs/draft/` and `docs/staged/` directories prevented proper plan storage and memory staging.
- **Root Cause:** The workspace was partially initialized but lacked the specific subdirectories required for the Orchestrator's execution flow.
- **Learning:** Always verify the full directory tree for agent memory before starting complex orchestration tasks.
- **Action/Rule:** Genesis must ensure `docs/draft/` and `docs/staged/` exist whenever the `docs/` folder is audited.
- **Verify Command:** `ls -d docs/draft docs/staged`

## 05-07-2026 - Post-Pull Memory Audit
- **Tags:** #audit #git-sync
- **Level:** 🟢 INFO
- **Scope:** [docs/index.md](file:///docs/index.md)
- **Notify Agents:** @Orchestrator
- **Symptom:** Workspace successfully synced with main. Verified existence of all memory files.
- **Root Cause:** Routine post-pull verification.
- **Learning:** Manual index fixes applied to align with Specialist Routing Table naming (Palette 🎨).
- **Action/Rule:** Always run Genesis audit after a major pull or merge.
- **Verify Command:** `cat docs/index.md`
