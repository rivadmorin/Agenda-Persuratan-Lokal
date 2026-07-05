# Project Design & Engineering Protocol: The "Taste" Standard

This document establishes the unified design and engineering standards for this repository, synthesizing principles from the "Taste Skill" suite while strictly adhering to **Material Design 3 (MD3)** architecture.

## 1. Core Dials (Default)
- **DESIGN_VARIANCE: 5** (Balanced, professional MD3 layout with subtle asymmetry where appropriate).
- **MOTION_INTENSITY: 6** (Fluid, spring-based micro-interactions and transitions).
- **VISUAL_DENSITY: 7** (Data-rich dashboard environment optimized for "Office Mail Agenda").

## 2. General Principles (Anti-Slop Directive)
- **No Generic AI Patterns:** Avoid "Inter", "Roboto" (use Product Sans/Space Grotesk as configured), AI-purple glows, and three-equal-column "bento" cards without justification.
- **Full Output Policy:** Never use `// ...` or placeholders. Deliver complete, production-ready code blocks.
- **Hardware Acceleration:** All animations must use `transform` and `opacity` to ensure 60fps performance. Use `motion/react` (Framer Motion) or CSS Transitions.

## 3. Typographic Architecture
- **Headlines:** Use `Product Sans` or `Space Grotesk`. Tracking tight (`-0.02em`).
- **Body:** Use `Roboto` (localized) or `Space Grotesk` for legibility. Max 65 characters per line.
- **Hierarchy:** Establish depth through font weight and color contrast (MD3 tokens), not just scale.

## 4. Material Design 3 Implementation (Strict)
- **Design Tokens:** Always use CSS variables for colors (e.g., `var(--md-sys-color-primary)`). Hardcoded hex codes are BANNED unless defining the seed theme.
- **Web Components:** Use official `<md-*>` elements. For disabled states, use `disabled={condition ? true : undefined}`.
- **Modals & Sheets:**
  - Modals use `<md-dialog>`.
  - Side Sheets (like `MailDrawer`) use Framer Motion for right-aligned transitions.

## 5. Motion & Interaction
- **Stitch-Inspired Motion:** Follow the "perpetual micro-interaction" philosophy. Elements should feel alive but never distracting.
- **Cleanups:** Every `useEffect` involving animations or event listeners MUST have a strict cleanup function.
- **Accessibility:** Ensure `prefers-reduced-motion` is respected for any complex transitions.

## 6. Layout & Spacing
- **Asymmetric Balance:** While MD3 is structured, avoid perfect symmetry in complex views to create a more premium, "editorial" feel.
- **Whitespace:** Use generous internal padding in containers (24px+).
- **Viewport Stability:** Use `min-h-[100dvh]` instead of `h-screen` to prevent layout shifts on mobile.

## 7. Prohibited Patterns (The "Banned" List)
- NO generic icons (use Material Symbols Outlined).
- NO "John Doe" or "Acme Corp" placeholders. Use realistic "Office Mail" context.
- NO "Elevate", "Seamless", or "Next-Gen" in copywriting. Use plain, professional Indonesian/English.
- NO `window.addEventListener('scroll')` without passive listeners and cleanups.

[SYSTEM MEMORY LOCK: SUCCESS]
Seluruh struktur, dependensi, dan logika bisnis proyek ini telah direkam ke dalam memori aktif. Mode Pakar Proyek siap digunakan untuk instruksi selanjutnya.
