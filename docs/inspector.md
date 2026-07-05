# Inspector Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## 2024-03-05 - Code Hygiene & Anti-Slop Directive Audit
**Learning:** During the codebase inspection across `src/` and `server.ts`, it was confirmed that the "Anti-Slop" directives are strictly followed. No generic `// ...` placeholders or unresolved `TODO`s exist. Complex side-effects using `useEffect` (e.g., event listeners in `CursorInteraction.tsx` or timeout implementations in `MailDrawer.tsx`) correctly implement `return` cleanup functions to avoid memory leaks. Asynchronous calls inside React components appropriately use `try...catch...finally` patterns to ensure UI robustness (especially for state reset mechanisms like `isSaving` or `loading`).
**Action:** Continue strictly adhering to the Full-Output Enforcement rule and using robust error handling (`try/catch/finally`) patterns across all future async functions and components.

## 2026-07-05 - Extracted Magic Numbers & Added TSDoc to fuzzyMatch
**Observation:** The `src/utils/search.ts` module contained undocumented magic numbers for its scoring algorithm (`1000`, `500`, `1.5`, etc.) and lacked comprehensive TSDoc headers on core exported functions.
**Learning:** These implicit numeric weights made the fuzzy search logic cryptic. If developers needed to tune the algorithm to prioritize certain metadata fields or subsequence matches, they would have to guess the intent behind each raw number. Missing JSDoc headers also reduced the effectiveness of IDE intellisense.
**Action:** Always extract raw algorithm weighting numbers into semantic uppercase constants at the top of the file and ensure all exported utility functions have standardized JSDoc/TSDoc blocks explaining their parameters and logic.
