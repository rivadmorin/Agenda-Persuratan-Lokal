# Scholar Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## DD-MM-YYYY - [Judul Pembelajaran]
- **Tags:**
- **Level:**  |  |
- **Scope:**
- **Notify Agents:**
- **Fingerprint ID:**  (jika ada di docs/scholar.md)
- **Symptom:** [Gejala/pesan error yang muncul]
- **Root Cause:** [Penyebab utama arsitektur/konfigurasi]
- **Learning:** [Prinsip baru yang ditemukan]
- **Action/Rule:** [Langkah konkret tindakan pencegahan]
- **Verify Command:**  (jika ada)

---

## ERROR FINGERPRINT DICTIONARY

To ensure all agents can resolve common build, environment, and code compilation errors instantly without manual troubleshooting.

| Error Signature (Regex/Text) | Inferred Root Cause | Verified Resolution / Fix Command |
| --- | --- | --- |
| `Cannot find module '@components/...'` | Missing TypeScript path mapping in tsconfig.json or vite.config.ts | Add alias to `vite.config.ts` and tsconfig paths |
| `exit code 127: ... command not found` | Tool is not installed globally or missing from local PATH | Install via npm/pnpm/pip, or use explicit executable path |
| `sh: 1: tsc: not found` | Missing node_modules or tsc not in PATH | `npm install && ./node_modules/.bin/tsc` |

---

## 05-07-2026 - [Missing Node Modules and Tooling Path]
- **Tags:** #environment #tooling
- **Level:** 🔴 CRITICAL
- **Scope:** [package.json](file:///package.json)
- **Notify Agents:** @Orchestrator
- **Fingerprint ID:** ERR-127
- **Symptom:** `sh: 1: tsc: not found` when running `npm run lint`.
- **Root Cause:** `node_modules` was missing in the environment, and the `lint` script relied on a global or path-relative `tsc` executable that wasn't available until `npm install` was run.
- **Learning:** Always verify dependency installation before running build/lint tasks. The environment might start fresh without pre-installed packages.
- **Action/Rule:** Use `npm install` if `node_modules` is missing. Consider using `./node_modules/.bin/tsc` or ensuring local binaries are in PATH.
- **Verify Command:** `npm run lint` or `./node_modules/.bin/tsc --noEmit`
