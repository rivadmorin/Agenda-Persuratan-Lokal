# Scholar Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Context:** [What operation, command, or script failed]
**Root Cause:** [The exact structural reason or logic flow that broke]
**Action:** [The specific rule, check, or script fix implemented to prevent it]

---

## ERROR FINGERPRINT DICTIONARY

To ensure all agents can resolve common build, environment, and code compilation errors instantly without manual troubleshooting.

| Error Signature (Regex/Text) | Inferred Root Cause | Verified Resolution / Fix Command |
| --- | --- | --- |
| `Cannot find module '@components/...'` | Missing TypeScript path mapping in tsconfig.json or vite.config.ts | Add alias to `vite.config.ts` and tsconfig paths |
| `exit code 127: ... command not found` | Tool is not installed globally or missing from local PATH | Install via npm/pnpm/pip, or use explicit executable path |

## 2024-05-18 - [Vite HMR and Agent Edit Optimization]
**Context:** When AI agents edit code in AI Studio environments, hot module replacement (HMR) and constant file watching can cause flickering, loop updates, or excessive CPU consumption.
**Root Cause:** `vite.config.ts` default server settings assume a local developer environment where constant HMR is desired.
**Action:** Implemented conditional HMR and file watching in `vite.config.ts` via the `DISABLE_HMR` environment variable. When `DISABLE_HMR=true`, HMR is false, and watch is set to `null` to explicitly prevent flickering during automated code edits.

## 2024-05-18 - [Node Backend Bundling in Vite Projects]
**Context:** Compiling the Express backend (`server.ts`) in the same build step as the React Vite frontend.
**Root Cause:** Vite is optimized for frontend static asset bundling. Trying to bundle a backend Node.js entry point with standard Vite config leads to module loading issues or bloated bundles due to non-externalized Node.js native modules.
**Action:** Decoupled the backend build in `package.json`'s `build` script. Used Vite solely for the frontend (`vite build`) and piped immediately to `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` for a dedicated, optimized Node.js backend bundle.
