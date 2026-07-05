# Scribe Memory Journal

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
## 05-07-2026 - Local Network Setup Documentation
- **Tags:** #documentation #readme #onboarding
- **Level:** 🟢 INFO
- **Scope:** [README.md](file:///README.md)
- **Notify Agents:** @Scribe, @Orchestrator
- **Symptom:** The README lacked specific instructions for local network deployment and the new portability start script.
- **Root Cause:** Documentation was focused on general setup rather than specific "Portable/Local Network" use cases recently implemented.
- **Learning:** Providing a dedicated "Local Network" section in the README helps users understand how to deploy the app across a LAN without re-reading scripts.
- **Action/Rule:** Always update README when new deployment entry points (like `start-local.sh`) are added.
- **Verify Command:** `cat README.md | grep "start-local.sh"`
