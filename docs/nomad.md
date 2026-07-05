# Nomad Memory Journal

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
## 05-07-2026 - Portability & Local Network Enhancement
- **Tags:** #portability #offline #local-network
- **Level:** 🟢 INFO
- **Scope:** [launchpad/start-local.sh](file:///launchpad/start-local.sh), [docker-compose.yml](file:///docker-compose.yml)
- **Notify Agents:** @Launchpad, @Orchestrator
- **Symptom:** No dedicated start script for local network/portable execution that handles both DB and App.
- **Root Cause:** Reliance on manual docker/npm commands or complex deploy scripts not optimized for "one-click" local start.
- **Learning:** Dedicated start scripts should encapsulate environment variables and service dependencies (like Docker) to ensure portability.
- **Action/Rule:** Always provide a `start-local.sh` that handles environment defaults and background service checks.
- **Verify Command:** `./launchpad/start-local.sh` (offline mode)
