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
