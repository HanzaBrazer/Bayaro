# BUILD-SEQUENCE.md — Urutan Build Page-demi-Page (Bayaro di Antigravity)

Urutan ini membangun Bayaro dari nol sampai **semua halaman bekerja**, dalam
langkah kecil yang bisa kamu review. Kerjakan **satu langkah per waktu**: tempel
prompt → biarkan agent tampilkan rencana → setujui → eksekusi → cek "Selesai
bila…" → baru lanjut langkah berikutnya.

> Prasyarat: `AGENTS.md` di root; `docs/design.md`, `docs/Bayaro-Brief.md`,
> file ini di `docs/`. Model: **Gemini 3.x Pro (High)**.
>
> Kenapa granular: langkah kecil = agent lebih akurat, dan kamu bisa menangkap
> penyimpangan lebih awal sebelum menumpuk.

---

## LANGKAH 0 — Fondasi & Design System

```
Peran: senior full-stack engineer membangun "Bayaro".
Baca menyeluruh @AGENTS.md, @docs/design.md, @docs/Bayaro-Brief.md — sumber kebenaran.

Tujuan langkah ini: fondasi project + design system, BELUM fitur bisnis.
Lingkup:
1. Scaffold Next.js (App Router, TypeScript) + Tailwind CSS. Siapkan Supabase
   client (env var, belum bikin tabel). Struktur folder rapi.
2. Terapkan design tokens dari design.md §1: warna (ink/bone/canvas/surface/line/
   muted/primary #2E7D5B/dst) di tailwind config; font Plus Jakarta Sans (UI) &
   IBM Plex Mono (nominal) via next/font; radius, shadow, spacing.
3. Bangun library komponen dasar sesuai design.md §3, LENGKAP dengan state
   (default/hover/active/focus/disabled/loading): Button (primary/secondary/ghost/
   danger/icon), Input/Textarea/Select/DatePicker/Toggle/FileUpload, Card,
   StatCard, Table, Badge status, Modal, Drawer, Toast, EmptyState, PaywallModal.
4. Buat halaman internal /dev/components yang menampilkan semua komponen & state
   untuk verifikasi visual.

Aturan: Bahasa UI Indonesia, IDR. Belum ada auth/DB/halaman bisnis.
Langkah: tampilkan RENCANA + daftar env var, berhenti & tunggu persetujuanku.
Lalu eksekusi & jalankan /dev/components.

Selesai bila: /dev/components menampilkan semua komponen dengan semua state,
tokens warna/font persis design.md.
```

---

## LANGKAH 1 — App Shell & Navigasi

```
Lanjut "Bayaro". Baca ulang @AGENTS.md & @docs/design.md (§4 navigasi, §2 layout).
Langkah 0 selesai.

Tujuan: kerangka aplikasi yang bisa dinavigasi (halaman masih kosong).
Lingkup:
1. App shell: Sidebar (§4.1) + Topbar (§4.2). Responsif (desktop penuh, tablet
   collapse ikon, mobile drawer/bottom bar) sesuai design.md §7.
2. Routing + halaman placeholder: /dashboard, /invoices, /clients, /templates,
   /settings. Plus /login, /signup, /onboarding (masih kosong).
3. State nav aktif (bg primary-soft + garis kiri). Workspace switcher tampil 1
   workspace (non-aktif dulu). Upgrade card tampil untuk kondisi "Free".
4. Topbar: Search ⌘K (placeholder), Notifikasi (dropdown kosong), Menu akun
   (Profil/Billing/Bantuan/Keluar).

Langkah: tampilkan RENCANA, tunggu persetujuan, lalu eksekusi.
Selesai bila: bisa klik-navigasi ke semua halaman, nav aktif benar, layout
responsif di 3 ukuran.
```

---

## LANGKAH 2 — Database & Autentikasi

```
Lanjut "Bayaro". Baca ulang @AGENTS.md, @docs/Bayaro-Brief.md (§9 skema), @docs/design.md (§5.1, §5.2).
Langkah 1 selesai.

Tujuan: skema database + auth berfungsi.
Lingkup:
1. Migrasi Supabase: 6 tabel persis Bayaro-Brief.md §9 (users, workspaces,
   clients, invoices, invoice_items dgn kolom category, subscriptions). Sertakan
   workspace_id di clients & invoices. Aktifkan Row Level Security yang benar
   (user hanya akses datanya sendiri).
2. Auth Supabase: email+password dan Google.
3. Halaman Login split-screen (§5.1): panel gelap (ink) + logo bone di kiri,
   form di kanan (email, password + toggle 👁, Ingat saya, Lupa password, Masuk,
   Masuk dengan Google, link Daftar). Validasi & error inline.
4. Halaman Sign up (§5.2): nama, email, password (indikator kekuatan), setuju
   S&K, Buat akun, Google, link Masuk.
5. Proteksi route: halaman app hanya untuk yang sudah login; logout → /login.

Langkah: tampilkan RENCANA + SQL migrasi untuk kureview, tunggu persetujuan, eksekusi.
Selesai bila: bisa sign up, login (email & Google), logout; route terproteksi;
RLS teruji (user A tak bisa lihat data user B).
```

---

## LANGKAH 3 — Onboarding (Workspace pertama)

```
Lanjut "Bayaro". Baca ulang @docs/design.md §5.3. Langkah 2 selesai.

Tujuan: user baru menyiapkan identitas usaha.
Lingkup:
1. Saat sign up berhasil, otomatis buat 1 workspace default milik user, lalu
   arahkan ke /onboarding.
2. Form onboarding (§5.3): nama usaha, upload logo (preview + batas ukuran),
   alamat, no. rekening/bank, prefix nomor invoice (mis. INV-).
3. Tombol "Simpan & mulai" → simpan ke workspaces → ke /invoices.
   Tombol "Lewati" → ke /invoices (bisa dilengkapi nanti di Pengaturan).

Langkah: tampilkan RENCANA, tunggu persetujuan, eksekusi.
Selesai bila: user baru melewati onboarding; data workspace tersimpan & muncul
nanti di Pengaturan; logo ter-upload ke Supabase Storage.
```

---

## LANGKAH 4 — Invoice Editor + Live Preview (INTI)

```
Lanjut "Bayaro". Baca ulang @docs/design.md §5.6 (editor) & §5.8 (view). Langkah 3 selesai.

Tujuan: jantung produk — buat & simpan invoice dengan preview akurat.
Lingkup:
1. Satu template invoice "Jasa" sebagai komponen HTML/CSS sesuai design.md
   (layout preview §5.6 & dokumen §5.8). Pakai IBM Plex Mono untuk nomor & nominal.
2. Halaman /invoices/new: FORM (kiri) + LIVE PREVIEW (kanan, sticky).
   Form: pilih klien (sementara dropdown kosong/﹢baru menyusul di Langkah 7),
   nomor invoice auto (prefix + urutan, unik per workspace), tanggal terbit
   (default hari ini WIB) + jatuh tempo (date picker + tombol +14/+30 hari),
   baris item (deskripsi, qty, harga → Jumlah otomatis), kategori per item
   (Barang/Jasa/Transportasi/Lainnya), ﹢tambah/×hapus item, pajak %, diskon,
   catatan.
3. Perhitungan subtotal/pajak/diskon/total real-time, format Rp ribuan.
4. Tombol: Simpan draft (status Draft), Simpan (validasi: min 1 item, total>0),
   Batal (konfirmasi jika ada perubahan). Simpan → tulis ke invoices + invoice_items.
5. Edit invoice lewat /invoices/[id]/edit memakai form yang sama.

Langkah: tampilkan RENCANA, tunggu persetujuan, eksekusi; tunjukkan preview-nya.
Selesai bila: bisa buat, simpan, dan edit invoice; preview berubah real-time dan
akurat; nomor invoice berurutan & unik.
```

---

## LANGKAH 5 — Export (PDF/PNG) & Halaman View Publik

```
Lanjut "Bayaro". Baca ulang @docs/design.md §5.7 & §5.8. Langkah 4 selesai.

Tujuan: tiga output dari SATU template HTML.
Lingkup:
1. Integrasi Playwright (headless Chromium) di server.
2. Export PDF (page.pdf) & PNG (screenshot) dari template yang SAMA. Output harus
   identik dengan preview: font konsisten, page-break benar.
3. Halaman view publik read-only (/i/[token]) memakai template yang sama; bisa
   dibuka tanpa login; ada tombol Unduh PDF & Unduh PNG untuk penerima.
4. Tombol "Salin link" menyalin URL publik ke clipboard + toast.
5. Watermark halus pada 3 output untuk kondisi Free (placeholder flag dulu).

Langkah: tampilkan RENCANA (termasuk cara deploy Chromium), tunggu persetujuan, eksekusi.
Selesai bila: PDF & PNG identik preview; link publik terbuka tanpa login; salin
link bekerja.
```

---

## LANGKAH 6 — Halaman Daftar Invoice

```
Lanjut "Bayaro". Baca ulang @docs/design.md §5.5. Langkah 5 selesai.

Tujuan: kelola semua invoice.
Lingkup (/invoices):
1. Tabel: No, Klien, Tanggal, Total, Status, aksi. Nominal rata kanan (mono).
2. Tombol + Invoice Baru (→ editor; cek kuota menyusul di Langkah 9).
3. Cari (nomor/klien), Filter status, Filter tanggal, Sort header, pagination.
4. Badge status (Draft/Terkirim/Lunas/Jatuh tempo) + ubah status cepat.
5. Menu baris ⋯: Lihat, Edit, Export (PDF/PNG/Salin link), Tandai Lunas, Hapus
   (modal konfirmasi). Klik baris → buka invoice.
6. Empty state: "Belum ada invoice" + tombol + Invoice Baru.

Langkah: tampilkan RENCANA, tunggu persetujuan, eksekusi.
Selesai bila: semua filter/sort/cari/aksi baris bekerja; status bisa diubah;
hapus pakai konfirmasi + toast.
```

---

## LANGKAH 7 — Halaman Klien (+ sambung ke Editor)

```
Lanjut "Bayaro". Baca ulang @docs/design.md §5.9 & §5.6. Langkah 6 selesai.

Tujuan: data klien dipakai ulang.
Lingkup:
1. /clients: daftar klien, Cari, + Klien baru (drawer: nama, email, alamat,
   telp), klik baris → detail + daftar invoice klien, ⋯ Edit/Hapus, empty state.
2. Sambungkan ke editor: "pilih klien" mengambil dari daftar; ﹢Klien baru di
   editor membuka drawer yang sama tanpa keluar halaman.

Langkah: tampilkan RENCANA, tunggu persetujuan, eksekusi.
Selesai bila: CRUD klien bekerja; memilih klien di editor mengisi data otomatis.
```

---

## LANGKAH 8 — Halaman Template

```
Lanjut "Bayaro". Baca ulang @docs/design.md §5.10 & §5.6. Langkah 7 selesai.

Tujuan: beberapa pilihan tampilan invoice.
Lingkup:
1. Tambah 2–4 template lagi (Barang, Sewa, Kwitansi) sebagai skin HTML/CSS dari
   struktur data yang sama (lihat Brief: beda tampilan, bukan beda data).
2. /templates: galeri kartu preview, tombol Preview (modal penuh), Jadikan
   default (set default workspace), badge Pro pada template premium.
3. Dropdown template di editor mengganti skin preview & output seketika.

Langkah: tampilkan RENCANA, tunggu persetujuan, eksekusi.
Selesai bila: ganti template mengubah preview, PDF, PNG, dan view publik secara konsisten.
```

---

## LANGKAH 9 — Plan, Kuota Harian & Paywall

```
Lanjut "Bayaro". Baca ulang @AGENTS.md (aturan kuota) & @docs/design.md §3.9. Langkah 8 selesai.

Tujuan: batasi Free, buka Pro.
Lingkup:
1. Logika plan Free/Pro (dari subscriptions). Default user baru = Free.
2. Kuota Free = 10 invoice/hari, dihitung PER USER, real-time (COUNT created_at
   >= awal hari WIB), DIVERIFIKASI DI SERVER (bukan hanya frontend).
3. Saat + Invoice Baru dan kuota habis → PaywallModal (§3.9): Upgrade ke Pro /
   Nanti saja.
4. Aktifkan watermark halus di output Free; hilang untuk Pro.
5. Template premium terkunci untuk Free (klik → paywall).

Langkah: tampilkan RENCANA, tunggu persetujuan, eksekusi; uji dengan simulasi 10+ invoice.
Selesai bila: user Free tertahan di invoice ke-11 (server-side); watermark & kunci
template premium benar; Pro bebas batas.
```

---

## LANGKAH 10 — Billing & Pembayaran Midtrans (Sandbox)

```
Lanjut "Bayaro". Baca ulang @docs/Bayaro-Brief.md §7 & @docs/design.md §5.11. Langkah 9 selesai.

Tujuan: upgrade ke Pro via pembayaran.
Lingkup:
1. Tab Pengaturan → Billing: status plan (Free X/10 / Pro aktif s/d tanggal),
   tombol Upgrade ke Pro, riwayat transaksi.
2. Flow Midtrans Snap (Sandbox): buat order → Snap token (simpan order_id,
   status pending) → popup Snap → user bayar.
3. Webhook /api/midtrans/webhook: VERIFIKASI SIGNATURE, IDEMPOTENT; status
   settlement/capture → set subscription Pro active + tanggal berakhir.
4. Rahasia via env var (jangan hardcode). Beri tahu aku env var & cara set
   Notification URL (sebutkan opsi tunnel untuk dev lokal).

Langkah: tampilkan RENCANA + daftar env var, tunggu persetujuan, eksekusi.
Selesai bila: pembayaran sandbox sukses → Pro aktif lewat WEBHOOK (bukan
frontend); notifikasi ganda tidak menggandakan upgrade.
```

---

## LANGKAH 11 — Dashboard

```
Lanjut "Bayaro". Baca ulang @docs/design.md §5.4. Langkah 10 selesai.

Tujuan: ringkasan di /dashboard (gaya Prodex), jadikan landing default.
Lingkup:
1. 4 stat card real-time: Total Invoice, Terkirim, Lunas, Nilai bulan ini.
   Klik "Lunas" → /invoices terfilter Lunas.
2. Dropdown bulan memfilter semua widget.
3. Bar chart "Nilai Invoice" per bulan (toggle Bulanan/Kuartal/Tahun + tooltip).
4. Donut "Rincian Kategori": SUM(invoice_items.subtotal) GROUP BY category + %;
   hover segmen & klik legenda; palet kategori design.md §1.1.
5. Tombol 👁 sembunyikan/tampilkan nominal. Widget Aktivitas terbaru & Klien
   teratas (klik → navigasi). Untuk Free: sisa kuota + Upgrade.
6. Jadikan /dashboard landing default setelah login.

Aturan: label "Nilai Invoice / Rincian Kategori", BUKAN "Pengeluaran".
Langkah: tampilkan RENCANA + pilihan library chart (ringan, React), tunggu
persetujuan, eksekusi.
Selesai bila: angka real-time akurat; chart interaktif; filter bulan bekerja.
```

---

## LANGKAH 12 — QA Audit "Semua Tombol Berjalan"

```
Lanjut "Bayaro". Baca ulang @docs/design.md §9 (checklist) & §6 (state), §7 (responsif), §8 (a11y).
Semua langkah sebelumnya selesai.

Tujuan: pastikan tidak ada elemen mati & pengalaman rapi.
Lingkup:
1. Audit SETIAP tombol/tool di semua halaman terhadap checklist design.md §9.
   Laporkan dalam tabel: elemen | punya aksi? | state lengkap? | umpan balik?
2. Perbaiki semua yang kurang (aksi hilang, tanpa loading/disabled, tanpa toast,
   destruktif tanpa konfirmasi).
3. Cek semua state global (loading skeleton, empty, error, kuota) ada.
4. Cek responsif 3 ukuran & quality floor a11y (focus ring, kontras, aria-label,
   prefers-reduced-motion).

Langkah: tampilkan hasil audit dulu (tabel), baru perbaiki setelah kusetujui prioritas.
Selesai bila: semua item checklist §9 tercentang; tidak ada tombol tanpa aksi/
state/umpan balik; lolos cek responsif & a11y.
```

---

## Catatan pemakaian
- Jangan loncat langkah; tiap langkah bergantung pada sebelumnya.
- Jika hasil meleset dari dokumen: `Cek ulang @docs/design.md bagian <X>, samakan.`
- Commit per langkah (atau minta agent commit) agar mudah mundur jika perlu.
- Setelah Langkah 12, kamu punya platform lengkap sesuai brief. Fitur di luar
  dokumen (multi-currency, export Word/xlsx, kalender) tetap ditunda sampai kamu
  memintanya eksplisit.
```
