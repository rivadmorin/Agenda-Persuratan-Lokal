# Launchpad Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Automation Gap:** [What script logic, command execution, or environment trap broke]
**Learning:** [Why the shell engine or platform variant caused this failure loop]
**Action:** [The specific defensive scripting wrapper to apply across platforms next time]
## 2025-07-05 - 🚀 Launchpad: Standardize lifecycle scripts inside launchpad/
**Automation Gap:** Disorganized, destructive, and sprawling scripts (`setup.sh` and `setup.ps1` at the root directory) lack a unified menu, robust process traps, and environment containment.
**Learning:** Legacy scripting practices without designated boundaries result in duplicate logic and platform-specific execution errors. An explicit orchestration directory (`launchpad/`) isolates lifecycle commands.
**Action:** Created `launchpad/deploy.sh` and `launchpad/deploy.ps1` featuring a strict command menu (`check-prereqs`, `install`, `start`, `stop`, `uninstall`, `help`), idempotent checks, graceful shutdowns with PID tracking, and 100% path isolation. Removed old root scripts.
