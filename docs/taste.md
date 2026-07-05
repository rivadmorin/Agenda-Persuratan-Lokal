# Taste Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Aesthetic Trap:** [What default template, spacing issue, or font pairing degraded the interface]
**Learning:** [Why the M3/custom dial system required a specific visual workaround]
**Action:** [How to apply next time]

## $(date +"%Y-%m-%d") - Card Layout Anti-Slop
**Aesthetic Trap:** Kartu-kartu alat pada `PdfTools` dan *dropzone* terlalu padat (kurang *padding*) dan menggunakan `transition-all duration-300` alih-alih `transition-premium` (kurva bezier kustom 400ms).
**Learning:** Komponen utilitas utama harus terasa sangat ringan dan bernapas. Bentuk (shape) MD3 seperti *extra-large rounded corners* (`rounded-[2rem]`) dan *padding* yang dalam (min 2rem/32px) membantu mendobrak kesan *generic template*.
**Action:** Gunakan selalu `transition-premium`, tingkatkan *padding* dari `p-6` ke `p-8` atau `p-12`, dan perbesar *gap* struktural menjadi `gap-10` pada area *hero/header*.

## $(date +"%Y-%m-%d") - Settings Page Hierarchy
**Aesthetic Trap:** Halaman `Settings` memiliki layout satu kolom yang terasa monoton dan jarak antar elemen (`p-5`, `gap-6`) kurang tegas dalam membedakan hierarki informasi.
**Learning:** Dalam tata letak *single-column* padat (`max-w-4xl`), memperbesar `padding` internal kartu utama menjadi `p-8` dan memperlebar *gap* eksternal menjadi `gap-8` memberikan "pernapasan" yang diperlukan agar antarmuka tidak terasa sesak (Anti-Slop). Tipografi pada *headline* juga membutuhkan `tracking-tight`.
**Action:** Jangan gunakan `p-4` atau `p-5` untuk container utama. Gunakan `p-8` (2rem) untuk memisahkan logika visual *Settings*, dan gunakan `tracking-tight` pada judul halaman.

## 2026-07-06 - [Settings Layout & Button Polish]
**Aesthetic Trap:** For settings interfaces with heterogeneous content, grid layouts decrease scannability. Additionally, Material Web buttons truncate descriptive multi-word labels.
**Learning:** Dense settings require a focused single-column layout for scannability. Material buttons need explicit width handling to survive custom fonts and verbose labels.
**Action:** Default to `max-w-4xl` single-column layouts for complex settings. Apply `min-w` to multi-word buttons and utilize global typography overrides.

## 2026-07-07 - [Anti-Slop Button Standardization]
**Aesthetic Trap:** Dense layouts and custom fonts often cause text inside `<md-*>` buttons to clip or look poorly proportioned.
**Learning:** Default padding isn't enough to prevent label clipping for descriptive Indonesian copy, and varying heights ruin horizontal alignment.
**Action:** Enforce a standard `44px` height, use `--md-filled-button-leading-space`/`--md-filled-button-trailing-space` for spacing, and strictly apply `white-space: nowrap` and a safe `min-width` (e.g., `120px`) on MD3 buttons.

## 2026-07-07 - [Premium Easing & Synchronized Transitions]
**Aesthetic Trap:** Side sheets feel sluggish or broken if the slide-in motion does not match the content reflow/width animation.
**Learning:** Synchronized timing and curves are necessary for a cohesive, "Anti-Slop" premium feel.
**Action:** Always match Framer Motion ease curves with CSS transitions (e.g. `cubic-bezier(0.2, 0.8, 0.2, 1)`) when a component undergoes simultaneous layout/transform updates.
