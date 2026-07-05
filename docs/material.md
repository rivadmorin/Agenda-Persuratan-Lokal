# Material Memory Journal

Critical learnings only. Do not add routine logs.

Format:
## YYYY-MM-DD - [Title]
**Design System Trap:** [What broke standard M3 spec]
**Learning:** [Insight]
**Action:** [How to apply next time]

## $(date +"%Y-%m-%d") - md-dialog Centering
**Design System Trap:** `<md-dialog>` dari Material Web terkadang tidak terpusat secara otomatis dan bisa menempel di pojok kiri atas tergantung pada styling parent atau spesifikasi browser. Selain itu, form di dalam dialog terasa terlalu sempit (slop).
**Learning:** Komponen web `<md-dialog>` memerlukan `margin: auto` atau flex/grid centering eksplisit, serta properti `width`/`maxWidth` yang jelas agar proporsional dan tidak menciut saat memuat form.
**Action:** Selalu berikan in-line style `style={{ minWidth: '400px', maxWidth: '480px', width: '90vw', margin: 'auto' }}` pada `<md-dialog>` untuk memastikan ia selalu berada di tengah viewport dengan proporsi yang elegan (Anti-Slop). Tingkatkan juga `gap` dan `py` pada elemen `<form slot="content">`.
