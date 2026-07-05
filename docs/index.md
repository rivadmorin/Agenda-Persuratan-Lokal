# Master Agent Registry

This index connects all critical learnings and memories across different specialized agents working in this repository.

## Active Agent Memories

- [Bolt ⚡](bolt.md) - Performance optimization insights.
- [Bug Hunter 🐛](bughunter.md) - Stability and bug-fixing insights.
- [Builder 🏗️](builder.md) - Feature implementation and extension logs.
- [Design 🎨 (Palette)](palette.md) - UI/UX and accessibility learnings.
- [Genesis 🌱](genesis.md) - Bootstrap and workspace orchestration logs.
- [Inspector 🧐](inspector.md) - Code hygiene, readability, and documentation standards.
- [Launchpad 🚀](launchpad.md) - Environment automation and orchestration scripts.
- [Material 📐](material.md) - Google Material Design and web components styling insights.
- [Scholar 🧠](scholar.md) - Self-learning, meta-reflection, and error analysis logs.
- [Scribe 📜](scribe.md) - Documentation and readme updates.
- [Sentinel 🛡️](sentinel.md) - Security auditing and vulnerability fixes.
- [Taste 💅](taste.md) - Frontend design taste, aesthetics, and anti-slop styling insights.
- [Test Pilot 🧪](testpilot.md) - Unit and integration testing logs.

## Workspace Initialization

All agents must run `pnpm install` upon entering a fresh sandbox environment before executing any builds, tests, or scripts. Do not assume `node_modules` is populated.

## Index Maintenance

When you (an active agent) discover a critical learning and write it to your respective memory file:
1. Ensure your specific memory file is updated.
2. If the learning has cross-cutting implications for the codebase (e.g. package version locks, common build fixes), add a brief note under your section here in `docs/index.md` linking to your main learning page.

## Archived Memories

- [Archive Folder](archive/) - Stores historical or legacy memory logs from retired agents or past setups (used by Scholar 🧠 for meta-learning).
- [bolt_legacy.md](archive/bolt_legacy.md) - Legacy Bolt memory
- [palette_legacy.md](archive/palette_legacy.md) - Legacy Palette memory
