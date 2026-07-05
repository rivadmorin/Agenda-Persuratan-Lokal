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
