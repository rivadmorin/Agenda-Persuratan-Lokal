## 2026-07-05 - [Accessibility: ARIA labels on icon-only buttons]
**Learning:** Found that Material Design 3 official web components (<md-*>) in this project often use span-based Material Symbols inside icon buttons, which are not automatically accessible. Screen readers only see the icon name text (e.g., 'delete').
**Action:** Always add explicit `aria-label` to `md-icon-button` and any other button with only an icon inside to ensure meaningful context for assistive technologies.
