# Inspector Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## 2024-03-05 - Code Hygiene & Anti-Slop Directive Audit
**Learning:** During the codebase inspection across `src/` and `server.ts`, it was confirmed that the "Anti-Slop" directives are strictly followed. No generic `// ...` placeholders or unresolved `TODO`s exist. Complex side-effects using `useEffect` (e.g., event listeners in `CursorInteraction.tsx` or timeout implementations in `MailDrawer.tsx`) correctly implement `return` cleanup functions to avoid memory leaks. Asynchronous calls inside React components appropriately use `try...catch...finally` patterns to ensure UI robustness (especially for state reset mechanisms like `isSaving` or `loading`).
**Action:** Continue strictly adhering to the Full-Output Enforcement rule and using robust error handling (`try/catch/finally`) patterns across all future async functions and components.
