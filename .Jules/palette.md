## 2026-07-05 - [Accessibility: ARIA labels on icon-only buttons]
**Learning:** Found that Material Design 3 official web components (<md-*>) in this project often use span-based Material Symbols inside icon buttons, which are not automatically accessible. Screen readers only see the icon name text (e.g., 'delete').
**Action:** Always add explicit `aria-label` to `md-icon-button` and any other button with only an icon inside to ensure meaningful context for assistive technologies.

## 2026-07-05 - [Accessibility: Tooltips on disabled buttons]
**Learning:** Material Web buttons (<md-*>) that are 'disabled' do not fire hover events themselves in some environments, and even if they do, screen readers won't read associated tooltips unless there is a proper ARIA link.
**Action:** For tooltips on disabled buttons, wrap the button or use a sibling element with an 'id' and link it to the button via the 'aria-describedby' attribute.

## 2026-07-06 - [UX: Settings Layout & Button Polish]
**Learning:** For settings interfaces with heterogeneous content (forms, tables, utilities), a single-column vertical stack (`max-w-4xl`) significantly improves scannability compared to grid layouts. Additionally, Material Web buttons require explicit minimum widths and global typography overrides to prevent label truncation when using descriptive labels like "Buat Cadangan Baru".
**Action:** Default to single-column layouts for complex settings. Use `min-w` on buttons with multi-word labels and apply global typescale overrides for consistent font sizes in Material Web components.
