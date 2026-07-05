# Scribe Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## 2024-03-05 - README Alignment & Documentation Accuracy
**Learning:** Hardcoded commands (`npm run x`) and broken documentation links in the README can lead to severe confusion, especially when repository standards dictate `pnpm` exclusively and when old markdown files are deleted. Recent additions like dynamic Material Design 3 generation (`src/utils/theme.ts`) and full Playwright E2E testing setups need clear entry points in the documentation.
**Action:** Always verify links in the README when removing `.md` files. Additionally, whenever new fundamental test frameworks (like Vitest/Playwright) are added, ensure their execution commands are explicitly documented in the README using the enforced package manager (`pnpm`).
