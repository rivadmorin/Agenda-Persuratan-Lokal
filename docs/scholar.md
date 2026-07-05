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

## 2024-05-18 - [Optimistic UI in Local Network Apps]
**Context:** The UserManagement component (from archive analysis) attempts Optimistic UI updates. Delaying UI updates while waiting for local backend requests can make the UI feel sluggish.
**Root Cause:** Synchronous waiting (`await`) on local API requests blocks the immediate React state transition.
**Action:** Always implement Optimistic Updates for simple CRUD operations to improve perceived performance, reversing the state if the local API request fails.

## 2024-05-18 - [Global Error Handling via ConfirmModal]
**Context:** Discovered repeated error bubbling patterns in `App.tsx` and child components for failed fetch requests or network disconnects.
**Root Cause:** Errors thrown inside asynchronous handlers (`try/catch`) do not automatically bubble up to standard React Error Boundaries and can cause silent failures.
**Action:** Use a unified `ConfirmModal` state managed in the parent `App` component and pass `onError` callbacks to children. For critical server interactions, ensure the frontend explicitly checks `if (!res.ok)` and displays the backend JSON `err.message` via the `ConfirmModal`.

## 2024-05-18 - [Material Web Component Accessibility]
**Context:** Analyzed historical palette/UI learnings. Icon-only buttons and disabled buttons in Material Web (<md-*>) fail screen-reader accessibility checks.
**Root Cause:** The `md-icon-button` relies on internal `span` rendering for icons, hiding meaning, and disabled elements may not trigger necessary mouse/focus events for tooltips.
**Action:** Enforce explicit `aria-label` attributes on any icon-only `<md-icon-button>`. For tooltips on disabled buttons, rely on `aria-describedby` with an external sibling element rather than nested hover states.
