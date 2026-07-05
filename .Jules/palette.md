## 2026-07-05 - [Accessibility: ARIA labels on icon-only buttons]
**Learning:** Found that Material Design 3 official web components (<md-*>) in this project often use span-based Material Symbols inside icon buttons, which are not automatically accessible. Screen readers only see the icon name text (e.g., 'delete').
**Action:** Always add explicit `aria-label` to `md-icon-button` and any other button with only an icon inside to ensure meaningful context for assistive technologies.

## 2026-07-05 - [Accessibility: Tooltips on disabled buttons]
**Learning:** Material Web buttons (<md-*>) that are 'disabled' do not fire hover events themselves in some environments, and even if they do, screen readers won't read associated tooltips unless there is a proper ARIA link.
**Action:** For tooltips on disabled buttons, wrap the button or use a sibling element with an 'id' and link it to the button via the 'aria-describedby' attribute.
