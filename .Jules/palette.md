## 2026-07-05 - [Accessibility: ARIA labels on icon-only buttons]
**Learning:** Found that Material Design 3 official web components (<md-*>) in this project often use span-based Material Symbols inside icon buttons, which are not automatically accessible. Screen readers only see the icon name text (e.g., 'delete').
**Action:** Always add explicit `aria-label` to `md-icon-button` and any other button with only an icon inside to ensure meaningful context for assistive technologies.

## 2026-07-05 - [Accessibility: Tooltips on disabled buttons]
**Learning:** Material Web buttons (<md-*>) that are 'disabled' do not fire hover events themselves in some environments, and even if they do, screen readers won't read associated tooltips unless there is a proper ARIA link.
**Action:** For tooltips on disabled buttons, wrap the button or use a sibling element with an 'id' and link it to the button via the 'aria-describedby' attribute.

## 2026-07-06 - [UX: Settings Layout & Button Polish]
**Learning:** For settings interfaces with heterogeneous content (forms, tables, utilities), a single-column vertical stack (`max-w-4xl`) significantly improves scannability compared to grid layouts. Additionally, Material Web buttons require explicit minimum widths and global typography overrides to prevent label truncation when using descriptive labels like "Buat Cadangan Baru".
**Action:** Default to single-column layouts for complex settings. Use `min-w` on buttons with multi-word labels and apply global typescale overrides for consistent font sizes in Material Web components.

## 2026-07-07 - [UX: Anti-Slop Button Standardization]
**Learning:** Found that Material Web Component buttons (<md-*>) frequently truncate labels in dense layouts or when custom fonts are applied. Standardizing on a 44px height and using '--md-filled-button-leading-space' / '--md-filled-button-trailing-space' instead of manual padding ensures consistent, professional proportions.
**Action:** Use 'white-space: nowrap' and a safe 'min-width' (e.g., 120px) on MD3 buttons to prevent clipping, especially when using descriptive Indonesian labels.

## 2026-07-07 - [Motion: Premium Easing & Synchronized Transitions]
**Learning:** Side sheets (MailDrawer) feel 'sluggish' if width transitions aren't synchronized with the slide-in animation easing. Using a uniform 'cubic-bezier(0.2, 0.8, 0.2, 1)' across both properties creates a cohesive, high-end feel.
**Action:** Always match Framer Motion easings with CSS transition easings for components that undergo simultaneous transform and layout changes.
