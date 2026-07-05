# Palette Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]

## 2026-07-05 - [Accessibility: ARIA labels on icon-only buttons]
**Learning:** Material Design 3 web components (`<md-icon-button>`) rendering span-based Material Symbols are opaque to screen readers (they read the icon literal, e.g., 'delete').
**Action:** Always explicitly define `aria-label` attributes on `<md-icon-button>` elements.

## 2026-07-05 - [Accessibility: Tooltips on disabled buttons]
**Learning:** Native `disabled` buttons often swallow hover and focus events, preventing traditional nested tooltips from working for keyboard/screen reader users.
**Action:** Implement tooltips for disabled elements by wrapping them or using a sibling element with a unique ID, linked back to the target via `aria-describedby`.
