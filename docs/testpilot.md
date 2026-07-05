# Test Pilot Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## 2026-07-06 - Test Environment Bootstrapping
**Learning:** Running `pnpm test` failed with `vitest: not found` because the environment lacked `node_modules` despite having a `package.json`.
**Action:** Always verify dependency installation (`pnpm install`) before executing test runners in a fresh session to ensure the toolchain is fully populated.

## 2026-07-05 - E2E Testing Environment Failure (PostgreSQL)
**Learning:** E2E Playwright tests (`tests/e2e.spec.ts`, `tests/error-handling.spec.ts`) failed because the `docker compose up -d` command failed to start the `postgres:15-alpine` container due to an `overlayfs` mount error in Docker (`err: invalid argument`). This caused the backend to be unavailable, resulting in timeouts when Playwright attempted to interact with the UI (e.g., waiting for `input[name="username"]`). Conversely, unit tests (`pnpm test` via Vitest) passed successfully.
**Action:** When running Playwright E2E tests in a new or restricted environment, ensure the Docker daemon is fully functional and supports `overlayfs` to start the PostgreSQL database. If the DB cannot be started, consider mocking API responses using Playwright's `page.route` as noted in the `[ENVIRONMENT]` guidelines to allow frontend tests to pass without a real backend.
