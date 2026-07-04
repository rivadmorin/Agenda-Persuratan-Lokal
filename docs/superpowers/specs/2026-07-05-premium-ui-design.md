# Spec: Premium Modern M3 UI Overhaul

## Goal
Improve the UI of the local mail agenda application to make it look premium, proportional, and consistent while preserving the Material Design 3 foundation where appropriate. Address existing functional bugs in the PDF merge API.

## Dials
- DESIGN_VARIANCE: 6
- MOTION_INTENSITY: 6
- VISUAL_DENSITY: 4

## Proposed Changes

### 1. Global Styling (`src/index.css`)
- Configure custom theme variables for a teal color palette (`#0d9488`).
- Add soft box shadows and border colors for glassmorphic elements.
- Ensure consistent spacing and borders.

### 2. Sidebar Component (`src/components/Sidebar.tsx`)
- Style the sidebar container with glassmorphic styling, using borders instead of heavy drawer colors.
- Make the menu items use subtle transitions, soft background hover states, and distinct teal markers for active items.
- Integrate the user profile box and logout button elegantly at the bottom.

### 3. Dashboard Component (`src/components/Dashboard.tsx`)
- Convert card widgets into a proportional, compact bento grid.
- Dynamic trend calculations (e.g. daily entry count comparison) instead of static counts.
- Style the AreaChart with a custom tooltip card, thin teal stroke, and smooth fade gradient.
- Modernize the "Aktivitas Terbaru" cards with subtle elevation and translation on hover.

### 4. Table Component (`src/components/MailTable.tsx`)
- Condense the table header and body layout.
- Hide secondary metadata columns (like Notes, Disposisi) on smaller devices.
- Group action buttons: replace the 4-icon block with 2 primary buttons (View, Edit) and a compact dropdown popover for secondary options (Delete, Print Receipt).

### 5. PDF Tools Component (`src/components/PdfTools.tsx`) & API (`server.ts`)
- Restyle the tools navigation cards to be compact and elegant.
- Add an interactive file uploader container (dropzone) with smooth hover/drag animations.
- Fix the mismatch between PDF merge payload: change `files` in `PdfTools.tsx` to `pdfFiles` to align with `server.ts`.

## Verification Plan
- Verify compilation with `npm run build`.
- Start the server using `npm run start` and test responsiveness, design layout, and drag/drop transitions using browser automation or manual testing.
