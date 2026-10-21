# Bayaro — Product Brief

> Invoice & kwitansi generator untuk freelancer dan UMKM Indonesia.
> Isi form → dokumen rapi → tersimpan terpusat → dibagikan lewat link.

---

## 1. Ringkasan Produk

**Bayaro** adalah platform web untuk membuat invoice dan kwitansi profesional dengan cepat tanpa perlu skill desain. Pengguna memilih template, mengisi form, melihat *live preview*, menyimpan ke daftar invoice yang terpusat, lalu mengekspor ke **PDF / PNG / link browser**. Produk berjalan dengan model **Free** dan **Pro**, dengan pembayaran via **Midtrans Snap**.

Nama "Bayaro" berakar dari kata **bayar** — langsung menyampaikan fungsinya.

---

## 2. Masalah & Solusi

| Masalah pengguna | Solusi Bayaro |
|---|---|
| Bikin invoice manual di Word/Excel lama & berantakan | Form terstruktur + template rapi, selesai dalam hitungan menit |
| Dokumen tercecer di banyak folder/chat | Semua invoice tersimpan terpusat dalam satu daftar |
| Susah dibagikan ke klien (harus kirim file besar) | Link browser read-only, tanpa perlu download |
| Data usaha & klien diketik ulang terus | Profil usaha & daftar klien disimpan, dipakai ulang otomatis |
| Tidak tahu rekap nilai & jenis tagihan | Dashboard + chart kategori |

---

## 3. Target Pengguna

- **Primer:** freelancer (desainer, developer, fotografer, konsultan) yang menagih klien sendiri.
- **Sekunder:** UMKM & usaha kecil yang butuh invoice/kwitansi rutin.
- **Lanjutan:** agensi/usaha dengan beberapa brand (kebutuhan multi-workspace).

Karakteristik: mau membayar dari kantong sendiri untuk tool yang menghemat waktu, bukan lewat proses pengadaan perusahaan.

---

## 4. Fitur

### MVP (wajib di launch pertama)
- Autentikasi (email + password, dan Google).
- Onboarding: buat **Profil Usaha / Workspace** pertama (nama, logo, alamat, rekening).
- Buat invoice: pilih template → isi form → **live preview** → simpan.
- Item invoice dengan perhitungan subtotal, pajak, diskon otomatis.
- **Kategori per item** (Barang / Jasa / Transportasi / Lainnya) — menyiapkan data untuk chart.
- Daftar invoice (tabel) dengan status (Draft / Terkirim / Lunas).
- Daftar klien tersimpan.
- Penomoran invoice otomatis & berurutan.
- Export **PDF + PNG + Link browser** (satu sumber template HTML/CSS).
- Plan **Free vs Pro** + kuota harian.
- Pembayaran **Midtrans Snap (Sandbox)** + webhook.

### Fase lanjut (setelah ada pengguna)
- **Dashboard + chart kategori** (donut + kartu statistik).
- **UI multi-workspace** + switcher (pondasi datanya sudah disiapkan sejak MVP).
- Duplikat invoice, kirim via email, reminder jatuh tempo.
- Template premium tambahan.
- (Opsional, diminta pengguna) export Word/Spreadsheet, integrasi kalender, multi-currency.

> **Prinsip scope:** satu kerjaan inti dikerjakan sangat rapi > banyak fitur setengah jadi. Setiap penambahan diuji dengan: menyelesaikan pain inti? pengguna berhenti bayar tanpanya? bisa dicapai lebih simpel?

---

## 5. Format Export (final)

Hanya **tiga format**, semuanya lahir dari **satu template HTML/CSS** yang sama:

| Format | Cara | Catatan |
|---|---|---|
| **PDF** | HTML → Playwright/Puppeteer `page.pdf()` | dokumen final utama |
| **PNG** | HTML → `page.screenshot()` | untuk dibagikan di chat/sosmed |
| **Link browser** | halaman view read-only publik | buka di browser tanpa download |

Word & Spreadsheet **tidak** dibangun di tahap ini (konsep invoice tidak cocok, menambah kompleksitas tanpa nilai inti).

---

## 6. Model Bisnis — Free vs Pro

| | **Free** | **Pro** |
|---|---|---|
| Buat invoice | **maks 10 / hari** | **unlimited** |
| Penyimpanan invoice | terbatas | **unlimited** |
| Export | PDF, PNG, Link | PDF, PNG, Link |
| Watermark halus | ada (opsional) | tidak ada |
| Template | dasar | semua + premium |
| Workspace | 1 | banyak (fase lanjut) |

**Aturan kuota (penting secara teknis):**
- Kuota dihitung **per akun (user)**, bukan per workspace — supaya tidak diakali dengan membuat banyak workspace.
- Dihitung **real-time**: `COUNT(invoices WHERE user_id = X AND created_at >= awal_hari_ini)`, bukan disimpan sebagai angka sisa.
- "Hari" memakai **timezone Asia/Jakarta (WIB)** agar reset tengah malam konsisten.
- Pengecekan dilakukan **di server (backend)**, bukan hanya di frontend.

---

## 7. Pembayaran — Midtrans Snap + Webhook

Flow upgrade ke Pro:

1. User klik **Upgrade ke Pro** di tab Billing.
2. Backend membuat order → minta **Snap token** ke Midtrans → simpan `order_id` di tabel `subscriptions` dengan status `pending`.
3. Frontend membuka **Snap popup** dengan token → user membayar (Sandbox).
4. **Webhook** Midtrans masuk ke endpoint backend (mis. `/api/midtrans/webhook`).
5. Backend **verifikasi signature** → cek status transaksi.
6. Status `settlement`/`capture` → set subscription user menjadi **Pro active** + tanggal berakhir.
7. Akses unlimited langsung aktif.

**Aturan krusial:**
- **Sumber kebenaran = webhook**, bukan tampilan frontend (popup bisa ditutup/refresh).
- **Selalu verifikasi signature** webhook.
- Webhook harus **idempotent** (Midtrans bisa kirim notifikasi berkali-kali → jangan double-upgrade).
- Set **Notification URL** di dashboard Midtrans; saat development lokal pakai tunnel (mis. ngrok).

---

## 8. Tech Stack

| Lapisan | Pilihan |
|---|---|
| Frontend & Backend | **Next.js (React)** — API routes jadi satu, live preview mudah |
| Database | **PostgreSQL via Supabase** (sekalian Auth + Storage) |
| Auth | Supabase Auth (email/password + Google) |
| Rendering PDF/PNG | **Playwright / Puppeteer** (headless Chromium) |
| Storage file & logo | Supabase Storage / S3 |
| Payment | **Midtrans Snap** (Sandbox → Production) + webhook |
| Deploy | Vercel (app) + worker/serverless untuk rendering |

---

## 9. Skema Database (6 tabel)

| Tabel | Isi utama | Relasi |
|---|---|---|
| `users` | akun login | — |
| `workspaces` | identitas usaha: nama, logo, alamat, rekening/NPWP, setting penomoran | `owner_user_id → users` |
| `clients` | data pelanggan (dipakai ulang) | `workspace_id → workspaces` |
| `invoices` | header: nomor, tanggal, jatuh tempo, jenis, template_id, subtotal, pajak, total, status | `workspace_id`, `client_id` |
| `invoice_items` | baris item: deskripsi, qty, harga, subtotal, **category** | `invoice_id → invoices` |
| `subscriptions` | plan (free/pro), status, tanggal, `midtrans_order_id` | `user_id → users` |

> `workspace_id` dan `invoice_items.category` **sudah ada sejak MVP** meski UI-nya menyusul — menambah kolom itu murah, migrasi data belakangan itu mahal.

---

## 10. Arsitektur Multi-Workspace

- "Workspace" = **identitas usaha/brand** (punya logo, alamat, rekening, nomor invoice sendiri).
- **Sejak hari pertama:** kolom `workspace_id` ada di `clients` & `invoices`; saat user daftar, otomatis dibuat **1 workspace default**.
- **Di MVP:** UI "buat workspace" dan switcher **belum ditampilkan** — user hanya melihat satu workspace tanpa sadar konsepnya.
- **Fase lanjut:** nyalakan UI multi-workspace sebagai fitur **Pro** (Free = 1 workspace).

---

## 11. Roadmap Fase

| Fase | Fokus | Output |
|---|---|---|
| **1 — Proof of Concept** (1–2 mgg) | 1 template HTML, form statis, export PDF | buktikan rendering rapi |
| **2 — MVP** (2–4 mgg) | auth, simpan DB, 3–5 template, live preview, PDF+PNG+link, daftar invoice, Free/Pro + Midtrans | produk bisa dijual |
| **3 — Dashboard** (2–4 mgg) | kartu statistik, donut chart kategori, status lunas | retensi & nilai |
| **4 — Skala** | UI multi-workspace, duplikat, kirim email, template premium | monetisasi lanjut |

---

## 12. Prinsip Keberhasilan

- **Kualitas rendering** adalah taruhan utama — invoice harus rapi, font konsisten, page-break benar. Selesaikan di Fase 1.
- **Watermark di Free** = jalur konversi paling natural.
- **Mulai 3–5 template** yang benar-benar dipakai, bukan 20.
- Launch dengan scope ramping; tunda semua "nice to have" sampai ada pengguna yang memintanya.
