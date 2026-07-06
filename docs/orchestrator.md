# Orchestrator Memory Journal

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

## 05-07-2026 - [Orchestrating Environment-Heavy Initial Audits]
- **Tags:** #orchestration #audit
- **Level:** 🟢 INFO
- **Scope:** [docs/draft/audit-fix-ui-bugs_plan.md](file:///docs/draft/audit-fix-ui-bugs_plan.md)
- **Notify Agents:** @Scholar @BugHunter
- **Symptom:** Rencana audit awal terhambat oleh `node_modules` yang hilang di lingkungan sandbox.
- **Root Cause:** Asumsi bahwa semua dependensi sudah terpasang tidak selalu valid di lingkungan cloud agent.
- **Learning:** Langkah pertama dalam rencana orkestrasi untuk proyek baru harus selalu menyertakan pemeriksaan dependensi (boot check) sebelum menugaskan agen fungsional lainnya.
- **Action/Rule:** Selalu masukkan `npm install` atau perintah serupa di Task 1 jika `node_modules` tidak ditemukan.
- **Verify Command:** `ls -d node_modules`

## 05-07-2026 - Repository Sync & Health Audit Successful
- **Tags:** #orchestration #git-sync #health-check
- **Level:** 🟢 INFO
- **Scope:** Workspace Root
- **Notify Agents:** @Genesis @TestPilot @Inspector
- **Symptom:** User requested repository pull and verification.
- **Root Cause:** Need to ensure latest code from 'main' is merged without conflicts and verified.
- **Learning:** Executing a sequenced 'Genesis -> TestPilot -> Inspector' flow provides high certainty of environment and code health post-sync.
- **Action/Rule:** Always perform dependency sync (`pnpm install`) and full test run after merging from main.
- **Verify Command:** `git log -n 1 && pnpm test`
