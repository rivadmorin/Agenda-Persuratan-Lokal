# Spesifikasi Desain: Core Settings & UI (Sub-project 1)

**Tanggal:** 2026-07-05
**Topik:** Core Settings & UI
**Status:** Rancangan (Disetujui Pengguna)

---

## 🏗️ Ringkasan Desain

Desain ini melengkapi fungsionalitas antarmuka (UI) dasar pada aplikasi dengan mengintegrasikan fitur kustomisasi pengaturan dari folder referensi dan mengimplementasikannya ke atas backend PostgreSQL secara optimal. Selaras dengan filosofi proyek (**Simple, Hemat Sumber Daya, Cepat, Stabil, Lokal, & Portable**), seluruh logika UI diatur agar tetap ringan menggunakan Web Components resmi `@material/web` dan ikon Material Symbols lokal.

---

## 🛠️ Rincian Komponen & Alur Data

### 1. Kustomisasi Kolom & Profil (`Settings.tsx`)
- **Backend (PostgreSQL)**:
  - Konfigurasi columns & profiles disimpan di tabel `config` kolom `data` (format JSONB).
  - API `POST /api/config` menangani pembaruan konfigurasi global secara utuh.
  - API `POST /api/config/columns/reorder` memproses urutan kolom baru yang didefinisikan dari drag-and-drop.
- **Frontend UI (`Settings.tsx`)**:
  - **Drag-and-Drop List**: Daftar kolom dapat diatur ulang urutannya secara visual menggunakan HTML5 Drag and Drop API, yang secara dinamis memperbarui nilai properti `order`.
  - **CRUD Kolom**: Dialog pop-up untuk Menambah (`showAddCol`) dan Mengedit (`editingColumn`) metadata kolom:
    - `key` (unik, lowercase)
    - `label` (nama tampilan)
    - `type` (text, date, number)
    - `required` (boolean)
    - `includeInReceipt` (boolean)
  - **Profil Kolom**: Memilih setelan kolom yang tersimpan, menyimpan profil baru, dan menghapus profil.

### 2. Dialog Agenda Surat & Preview PDF (`MailDrawer.tsx`)
- **Modal Dialog terpadu (`md-dialog`)**:
  - Tetap menggunakan Popup modal di tengah layar (bukan layout pisah di halaman utama), tetapi ukurannya dapat menyesuaikan.
  - **State Layout Split**:
    - Jika lampiran PDF terdeteksi (baik data lama atau file baru dipilih), dialog melebar menjadi `max-w-[1250px]` (grid 2 kolom).
    - Kolom Kiri: Form entri data surat dinamis berdasarkan kolom yang aktif.
    - Kolom Kanan: Pratinjau PDF interaktif menggunakan tag `<iframe src="/api/files/[pdfPath]" className="w-full h-full" />`.
    - Dilengkapi tombol pembantu "Buka di Tab Baru".
    - Jika tidak ada PDF: Dialog berukuran standar `max-w-[600px]` (single column) dengan area uploader file PDF.
- **Uploader File**:
  - Drag-and-drop atau input file manual -> mengonversi berkas ke representasi Base64 secara instan untuk dikirim via JSON `onSave`.
  - Dukungan penghapusan berkas PDF lampiran (`deletePdf` dikirim sebagai `true` ke backend).

### 3. Sidebar Lipat (`Sidebar.tsx`)
- **Fungsionalitas**:
  - State `isCollapsed` (boolean) disimpan di LocalStorage agar persistensi saat reload halaman terjaga.
  - Lebar sidebar: `280px` saat terbuka dan `80px` saat dilipat.
  - Tombol menu toggle menggunakan Material Symbol `menu` di pojok kiri atas.
  - Saat dilipat: Teks nama aplikasi, profil nama user, dan label teks navigasi disembunyikan (transisi lebar halus). Tooltip bawaan atau deskripsi visual digunakan saat kursor melakukan hover di atas ikon menu.
  - Filter menu berdasarkan role pengguna (Admin/Operator) dengan andal.

---

## 🎯 Rencana Pengujian (Verification Plan)
1. **Verifikasi Columns CRUD**: Menambah kolom baru (`klasifikasi`), mengedit label, mengurutkannya via drag-and-drop, menyimpan perubahan, dan memverifikasi data config di PostgreSQL terupdate.
2. **Verifikasi PDF Preview**: Membuka surat dengan lampiran -> Dialog membesar dan menampilkan PDF di sisi kanan. Mengunggah PDF baru -> Base64 terkirim, file disimpan ke folder uploads, database terupdate.
3. **Verifikasi Sidebar Collapse**: Klik tombol menu -> Sidebar mengecil ke ikon saja. Refresh halaman -> Sidebar tetap dalam kondisi melipat.
