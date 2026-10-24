# Bayaro — Design Specification (design.md)

> Spesifikasi desain lengkap untuk platform invoice generator **Bayaro**.
> Mencakup: design system, layout, komponen, dan **perilaku setiap tombol/tool di tiap layar** — supaya tidak ada elemen interaktif yang "mati".
>
> Gaya mengikuti referensi dashboard **Prodex** (terang, bersih, card-based) dengan identitas brand Bayaro (charcoal + cream dari logo) dan accent hijau yang dipilih deliberately.

---

## 0. Prinsip Desain

1. **Form adalah produknya.** Mengisi invoice harus terasa ringan: field jelas, perhitungan otomatis, preview langsung.
2. **Satu sumber template.** PDF, PNG, dan link browser lahir dari HTML/CSS yang sama — tampilan harus identik di tiga format.
3. **Tenang, satu aksen berani.** Permukaan netral hangat; warna hijau dipakai hanya untuk aksi utama & status positif.
4. **Setiap tombol punya tujuan & umpan balik.** Tidak ada tombol tanpa aksi, tanpa state hover/active/disabled, tanpa toast konfirmasi.
5. **Bahasa pengguna.** Copy sederhana Bahasa Indonesia, kata kerja aktif ("Simpan invoice", bukan "Submit").

---

## 1. Design Tokens

### 1.1 Warna

**Brand & netral (dari logo: charcoal + cream)**

| Token | Hex | Pakai untuk |
|---|---|---|
| `ink` | `#1C1A17` | teks utama, panel brand gelap, logo bg |
| `ink-soft` | `#3A3630` | teks sekunder di permukaan terang |
| `bone` | `#F4EFE4` | teks/logo di panel gelap, highlight hangat |
| `canvas` | `#F7F6F3` | background aplikasi (off-white hangat) |
| `surface` | `#FFFFFF` | kartu, panel, input |
| `line` | `#E7E3DA` | border, divider |
| `muted` | `#6B655B` | label, teks pembantu, placeholder |

**Accent & semantik**

| Token | Hex | Pakai untuk |
|---|---|---|
| `primary` | `#2E7D5B` | tombol utama, link aktif, nav terpilih, status Lunas |
| `primary-hover` | `#276A4D` | hover tombol utama |
| `primary-soft` | `#E6F1EC` | bg badge/hover lembut hijau |
| `warning` | `#C98A1B` | status Terkirim/menunggu |
| `danger` | `#C0453B` | hapus, error, overdue |
| `danger-soft` | `#F7E7E5` | bg hover aksi hapus |
| `info` | `#2F6FB0` | info netral |

**Palet kategori (untuk donut chart)**

| Kategori | Hex |
|---|---|
| Barang | `#2E7D5B` (primary) |
| Jasa | `#1C1A17` (ink) |
| Transportasi | `#C9A227` (gold) |
| Lainnya | `#8B6FB0` (plum) |

> Hindari default generik: bukan indigo SaaS standar, bukan terracotta cream. Hijau dipilih karena bermakna uang/"lunas" pada produk tagihan.

### 1.2 Tipografi

- **Keluarga utama:** **Plus Jakarta Sans** (geometris modern, buatan Indonesia — grounded pada produk lokal). Dipakai untuk semua UI & heading.
- **Mono (khusus data):** **IBM Plex Mono** — hanya untuk nomor invoice, kode, dan nominal pada dokumen invoice (figur sejajar/tabular).

**Skala tipe**

| Peran | Ukuran / Line-height | Weight |
|---|---|---|
| Display (angka besar dashboard) | 32 / 40 | 700 |
| H1 judul halaman | 24 / 32 | 700 |
| H2 judul kartu | 18 / 26 | 600 |
| Body | 15 / 24 | 400 |
| Label / caption | 13 / 18 | 500 |
| Nominal tabular | 15 / 24 | 500 (mono) |

Panjang baris body < 80 karakter. Gunakan **sentence case** (bukan ALL CAPS) untuk label.

### 1.3 Spacing, radius, shadow

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48 (px).
- **Radius:** input/tombol `10px`, kartu `16px`, modal `20px`, badge `999px`.
- **Shadow (halus, satu level utama):** `0 1px 2px rgba(28,26,23,.04), 0 4px 16px rgba(28,26,23,.06)`.
- **Border kartu:** `1px solid line` (kombinasi border tipis + shadow lembut, tidak bertumpuk).

### 1.4 Ikonografi

- Set ikon garis tunggal (mis. Lucide), stroke 1.75px, ukuran 18–20px di UI.
- Ikon selalu berpasangan dengan teks pada aksi penting (bukan ikon telanjang).

---

## 2. Layout System

Pola **app shell**: sidebar kiri tetap + area konten. Mengikuti struktur Prodex.

```
┌───────────┬──────────────────────────────────────────────┐
│  SIDEBAR  │  TOPBAR (judul · search · notif · akun)        │
│           ├──────────────────────────────────────────────┤
│  logo     │                                                │
│  worksp.  │   KONTEN HALAMAN                               │
│  switcher │   (dashboard / invoice / klien / dst)          │
│           │                                                │
│  nav      │                                                │
│  ...      │                                                │
│           │                                                │
│  upgrade  │                                                │
│  card     │                                                │
└───────────┴──────────────────────────────────────────────┘
```

- **Lebar sidebar:** 248px (collapse ke 72px ikon-only di layar sempit).
- **Konten:** max-width 1200px, padding 24–32px.
- **Alignment:** konten rata kiri; angka/nominal rata kanan dalam tabel.

---

## 3. Komponen Dasar (dan state-nya)

Setiap komponen interaktif wajib punya state: **default, hover, active/pressed, focus (ring 2px primary), disabled, loading**.

### 3.1 Tombol
| Varian | Tampilan | Pakai |
|---|---|---|
| Primary | bg `primary`, teks putih | aksi utama (Simpan, Upgrade, + Invoice Baru) |
| Secondary | bg `surface`, border `line`, teks `ink` | aksi sekunder (Batal, Preview) |
| Ghost | transparan, teks `ink-soft` | aksi dalam baris tabel |
| Danger | teks/ikon `danger`, hover bg `danger-soft` | Hapus |
| Icon-only | 36×36, tooltip wajib | aksi padat di tabel/topbar |

- **Loading:** spinner menggantikan teks, tombol disabled, lebar tetap.
- **Disabled:** opacity 50%, cursor not-allowed, + tooltip alasan jika relevan (mis. kuota habis).

### 3.2 Input & form
- Text, number, textarea, select/dropdown, date picker, toggle, file upload (logo).
- Label di atas field, helper text di bawah, **error inline** (teks `danger` + border `danger`).
- Number/nominal: format ribuan otomatis (`1.500.000`), prefix `Rp`.

### 3.3 Kartu statistik (stat card)
Ikon kecil + label + angka display. Opsional tren (+/- %).

### 3.4 Tabel
- Header sticky, baris hover `canvas`, zebra opsional.
- Kolom nominal rata kanan (mono).
- **Row actions:** muncul saat hover / menu `⋯`.
- Sort pada header (ikon panah), pagination di bawah.

### 3.5 Badge status
| Status | Warna |
|---|---|
| Draft | abu (`muted` di `canvas`) |
| Terkirim | `warning` di soft amber |
| Lunas | `primary` di `primary-soft` |
| Jatuh tempo | `danger` di `danger-soft` |

### 3.6 Modal & drawer
- Modal tengah untuk konfirmasi (Hapus, Upgrade).
- Drawer kanan untuk form cepat (Klien baru).
- Selalu ada tombol tutup (×) + klik overlay menutup + `Esc` menutup.

### 3.7 Toast (umpan balik)
- Sukses (hijau), error (merah), info (netral), muncul kanan-atas, auto-dismiss 4 dtk.
- **Konsistensi kata kerja:** tombol "Simpan" → toast "Invoice tersimpan".

### 3.8 Empty state
- Ilustrasi/ikon + kalimat ajakan + tombol aksi. Contoh: "Belum ada invoice. Buat invoice pertamamu." → tombol **+ Invoice Baru**.

### 3.9 Paywall (kuota habis)
- Modal: "Kuota harian Free habis (10/10). Upgrade ke Pro untuk invoice unlimited." → tombol **Upgrade ke Pro** + **Nanti saja**.

---

## 4. Navigasi

### 4.1 Sidebar
| Item | Ikon | Tujuan |
|---|---|---|
| **Logo Bayaro** | mark "b" | klik → Dashboard |
| **Workspace switcher** | avatar usaha + ⌄ | ganti/kelola workspace *(MVP: tampil 1 workspace, non-aktif; aktif di fase lanjut)* |
| Dashboard | grid | ringkasan *(fase 3; di MVP default ke Invoice)* |
| **Invoice** | dokumen | daftar invoice (tab paling sering) |
| Klien | orang | daftar pelanggan |
| Template | layout | pilih/preview template |
| Pengaturan | gear | profil usaha, penomoran, billing |
| **Upgrade card** | — | status plan + tombol **Upgrade** (hanya tampil untuk Free) |

**Perilaku:** item aktif diberi bg `primary-soft` + teks `primary` + indikator garis kiri. Semua item adalah link yang mengubah konten (tidak ada item mati).

### 4.2 Topbar
| Elemen | Aksi |
|---|---|
| Judul halaman | teks dinamis sesuai tab |
| **Search (⌘K)** | buka command/search: cari invoice by nomor/klien |
| **Notifikasi 🔔** | dropdown: info kuota, status pembayaran, jatuh tempo |
| **Menu akun** | dropdown: Profil, Billing, Bantuan, **Keluar** |

---

## 5. Spesifikasi Layar (per tombol/tool)

### 5.1 Login — split screen (ref: BuildMate)

```
┌───────────────────────────┬───────────────────────────┐
│  PANEL GELAP (ink)         │  FORM (surface)           │
│                            │                            │
│  logo Bayaro (bone)        │  Selamat datang kembali    │
│                            │  Masuk untuk mengelola     │
│  "Invoice rapi dalam       │  invoice-mu.               │
│   hitungan menit."         │                            │
│                            │  [ Email            ]      │
│  • Template profesional    │  [ Password      👁 ]      │
│  • Simpan & bagikan link   │  [✓] Ingat saya  Lupa?     │
│  • Export PDF & PNG        │  ( Masuk )                 │
│                            │  ──── atau ────            │
│                            │  ( Masuk dengan Google )   │
│                            │  Belum punya akun? Daftar  │
└───────────────────────────┴───────────────────────────┘
```

| Elemen | Perilaku |
|---|---|
| **Email / Password** | validasi inline; error "Email atau password salah" di atas form |
| **👁 toggle password** | tampil/sembunyikan teks password |
| **Ingat saya** | toggle sesi panjang |
| **Lupa password?** | → halaman reset (kirim email reset) |
| **Masuk** (primary) | loading → sukses ke Invoice; gagal → error |
| **Masuk dengan Google** | OAuth Supabase; akun baru → lanjut onboarding |
| **Daftar** | → halaman Sign up |

Panel gelap memakai `ink` + logo `bone` (memanfaatkan logo cream-on-charcoal secara native).

### 5.2 Sign up

Field disesuaikan kebutuhan input Bayaro:

| Field | Wajib | Catatan |
|---|---|---|
| Nama lengkap | ✓ | sapaan & pengirim invoice |
| Email | ✓ | login & notifikasi |
| Password | ✓ | min. 8 karakter, indikator kekuatan |
| Setuju S&K | ✓ | checkbox |

| Tombol | Perilaku |
|---|---|
| **Buat akun** | buat user → otomatis buat **workspace default** → ke Onboarding |
| **Daftar dengan Google** | OAuth → ke Onboarding |
| **Sudah punya akun? Masuk** | → Login |

### 5.3 Onboarding — Profil Usaha pertama

Dialog/langkah singkat (bisa di-skip, diisi nanti di Pengaturan):

| Field | Pakai |
|---|---|
| Nama usaha | tampil di invoice & switcher |
| Logo (upload) | pojok invoice |
| Alamat | blok pengirim |
| No. rekening / bank | instruksi pembayaran di invoice |
| Prefix nomor invoice | mis. `INV-` |

| Tombol | Perilaku |
|---|---|
| **Simpan & mulai** | simpan ke `workspaces` → ke Invoice (empty state) |
| **Lewati** | ke Invoice; profil bisa dilengkapi nanti |

### 5.4 Dashboard *(Fase 3 — ref: Prodex)*

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                         [Bulan: Oktober 2026 ⌄] │
├────────────┬────────────┬────────────┬───────────────────┤
│ Total      │ Terkirim   │ Lunas      │ Nilai bulan ini    │
│ Invoice 128│ 41         │ 73         │ Rp 54.100.000      │
├────────────┴────────────┴────────────┴───────────────────┤
│  ┌─ Nilai Invoice (bar, per bulan) ─┐  ┌─ Rincian ──────┐ │
│  │                                   │  │  Kategori      │ │
│  │   ▁▃▅▂▆▄▇▅                        │  │   (donut)      │ │
│  │                                   │  │  Barang   68%  │ │
│  └───────────────────────────────────┘  │  Jasa     20%  │ │
│                                          │  Transp.   8%  │ │
│  ┌─ Aktivitas terbaru ─┐  ┌─ Klien teratas ───────────┐  │
│  │ INV-048 • Lunas      │  │ PT Maju  Rp 12.000.000     │  │
│  └──────────────────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

| Elemen | Perilaku |
|---|---|
| **Dropdown bulan** | filter semua widget ke periode terpilih |
| **4 stat card** | angka real-time; klik "Lunas" → Invoice terfilter status Lunas |
| **Bar chart nilai** | toggle Bulanan/Kuartal/Tahun; hover → tooltip nominal |
| **Donut kategori** | `SUM(invoice_items.subtotal) GROUP BY category`; hover segmen → kategori + %; legenda klik → sorot segmen |
| **👁 lihat/sembunyikan nominal** | sembunyikan angka (privasi layar) |
| **Aktivitas terbaru** | klik item → buka invoice terkait |
| **Klien teratas** | klik → profil klien |
| **Sisa kuota (Free)** | "7/10 invoice hari ini" + tombol Upgrade |

> Catatan label: karena invoice = uang **masuk**, judul widget memakai **"Nilai Invoice"** / **"Rincian Kategori"**, bukan "Pengeluaran".

### 5.5 Invoice (daftar) — tab inti

```
┌──────────────────────────────────────────────────────────┐
│ Invoice           [🔍 cari]  [Status ⌄] [Tanggal ⌄] (+ Invoice Baru)│
├──────────────────────────────────────────────────────────┤
│ No.      Klien        Tanggal     Total        Status   ⋯ │
│ INV-048  PT Maju      12 Okt      Rp 3.000.000  Lunas   ⋯ │
│ INV-047  Budi S.      10 Okt      Rp 1.200.000  Terkirim⋯ │
│ ...                                                        │
├──────────────────────────────────────────────────────────┤
│                             ‹ 1 2 3 ›                      │
└──────────────────────────────────────────────────────────┘
```

| Tombol/tool | Perilaku |
|---|---|
| **+ Invoice Baru** (primary) | cek kuota → jika Free & 10/10 → **paywall**; else → Invoice Editor |
| **🔍 Cari** | filter by nomor / nama klien (live) |
| **Filter Status** | Draft / Terkirim / Lunas / Jatuh tempo |
| **Filter Tanggal** | rentang periode |
| **Sort header** | urut by tanggal / total / nomor |
| Klik **baris** | buka invoice (preview/editor) |
| **⋯ menu baris** | **Lihat**, **Edit**, **Export** (PDF/PNG/Salin link), **Duplikat** *(fase lanjut)*, **Tandai Lunas**, **Hapus** (konfirmasi modal) |
| **Badge status** | klik → ubah status cepat |
| **Pagination** | pindah halaman |
| **Empty state** | "Belum ada invoice" + tombol **+ Invoice Baru** |

### 5.6 Invoice Editor — form + live preview (jantung produk)

```
┌─────────────────────────────┬────────────────────────────┐
│  FORM (kiri, scroll)        │  LIVE PREVIEW (kanan, sticky)│
│                             │                             │
│  Template: [Jasa ⌄]         │   ┌───────────────────────┐ │
│  Klien:   [pilih/﹢baru]     │   │  LOGO    INVOICE       │ │
│  No. INV-049 (auto)         │   │  Dari... │ INV-049     │ │
│  Terbit [17 Okt] Tempo[+30] │   │  Untuk...│ 17 Okt      │ │
│                             │   │                        │ │
│  Item                       │   │  Desk.  Qty  Harga  Jml│ │
│  [desk][qty][harga][kat⌄][×]│   │  ...                   │ │
│  (﹢ Tambah item)            │   │  Subtotal  Rp ...      │ │
│  Pajak[11%] Diskon[  ]      │   │  Pajak     Rp ...      │ │
│  Catatan [            ]     │   │  TOTAL     Rp ...      │ │
│                             │   └───────────────────────┘ │
│  (Batal) (Simpan draft) (Simpan)  [Export ⌄]              │
└─────────────────────────────┴────────────────────────────┘
```

| Tombol/tool | Perilaku |
|---|---|
| **Template dropdown** | ganti skin preview seketika (Jasa/Barang/Sewa/Kwitansi); premium ditandai, klik saat Free → paywall |
| **Pilih klien** | dari daftar tersimpan; isi otomatis data klien |
| **﹢ Klien baru** | buka drawer tambah klien tanpa keluar editor |
| **No. invoice** | auto dari prefix + urutan; bisa override manual |
| **Tanggal terbit** | default hari ini (Asia/Jakarta) |
| **Jatuh tempo** | date picker + tombol cepat **+14 / +30 hari** |
| **Baris item** | input deskripsi, qty, harga → **Jumlah dihitung otomatis** |
| **Kategori per item** (⌄) | Barang/Jasa/Transportasi/Lainnya → mengisi data donut |
| **× hapus item** | hapus baris |
| **﹢ Tambah item** | tambah baris baru |
| **Pajak / Diskon** | % atau nominal → total update real-time |
| **Catatan** | teks bebas (termin, ucapan terima kasih) |
| **Live preview** | setiap perubahan form langsung tampil di template |
| **Batal** | konfirmasi jika ada perubahan belum tersimpan |
| **Simpan draft** | simpan status Draft → toast "Draft tersimpan" |
| **Simpan** (primary) | validasi → simpan → **menghitung kuota** → ke daftar/preview; toast "Invoice tersimpan" |
| **Export ⌄** | menu: **PDF**, **PNG**, **Salin link** (lihat 5.7) |

Validasi: minimal 1 item, klien terisi, total > 0. Error ditandai inline.

### 5.7 Export & Share (satu sumber template)

| Aksi | Perilaku | Umpan balik |
|---|---|---|
| **Export PDF** | render HTML → PDF → unduh | toast "PDF diunduh" |
| **Export PNG** | render HTML → PNG → unduh | toast "Gambar diunduh" |
| **Salin link** | buat/ambil URL publik read-only → copy ke clipboard | toast "Link disalin" |
| **Buka link** | halaman view publik (lihat 5.8) | tab baru |

Watermark halus muncul di tiga output untuk **Free**, hilang untuk **Pro**.

> Export PDF/PNG dirender **di sisi browser** (html2canvas + jsPDF) dari elemen
> `#invoice-doc` yang sama — identik dengan view publik, unduhan langsung ke perangkat.

#### 5.7.1 Anatomi dokumen invoice

**Jasa** memakai layout tersendiri (desain referensi): pita **INVOICE** vertikal gelap
di kiri, header hijau berisi identitas usaha, pita putih **Total Tagihan**, **Catatan**,
lalu **Dari** / **Ditagihkan Kepada**; di bawahnya Nomor Invoice + Syarat & Ketentuan,
bar info (No. Rekening · Atas Nama · Tanggal Terbit · Jatuh Tempo), tabel item zebra,
tanda tangan + ringkasan, dan footer hijau (alamat · website). Seluruh teks memakai
**Plus Jakarta Sans**.

**Barang / Sewa** memakai struktur blok yang sama (beda warna/kepala):
1. **Header** — logo + nama usaha + alamat · judul **INVOICE** + nomor.
   *(Barang: bar gelap; Sewa: aksen emas.)*
2. **Meta** — Tanggal terbit & Jatuh tempo.
3. **Ditagihkan kepada** (klien: nama, alamat, telp, email) · **Dari** (usaha: nama, alamat, telp, email).
4. **Tabel item** — No. · Deskripsi · Harga · Qty · Jumlah (kepala tabel berwarna per skin).
5. **Info Pembayaran** (Bank · No. Rekening · Atas Nama) · **Ringkasan** (Subtotal, Diskon, Pajak %, **Total** di bar warna).
6. **Catatan** (ucapan) · **Authorised Sign** (garis + nama penandatangan).
7. **Syarat & Ketentuan**.
8. **Footer** — Telepon · Email · Website. *(Barang: bar gelap.)*

Sumber data: identitas usaha (nama, logo, alamat, telp, email, website, pembayaran,
penandatangan, S&K default) dari `workspaces` (Pengaturan → Profil); kontak klien & S&K
per-invoice disimpan sebagai snapshot di `invoices`. **Kwitansi** tetap format tanda terima
terpisah (terbilang).

### 5.8 Halaman View Publik (link browser)

- URL read-only, bisa dibuka siapa pun tanpa login/akun.
- Menampilkan invoice persis seperti PDF (template sama).
- Tombol bagi penerima: **Unduh PDF**, **Unduh PNG**.
- Tidak menampilkan kontrol edit/hapus.
- (Fase lanjut) tombol **Tandai sudah bayar** / info rekening.

### 5.9 Klien

| Tombol/tool | Perilaku |
|---|---|
| **+ Klien baru** | drawer: nama, email, alamat, telp → simpan |
| **🔍 Cari** | filter daftar |
| Klik baris | detail klien + daftar invoice-nya |
| **⋯** | Edit, Hapus (konfirmasi) |
| Empty state | "Belum ada klien" + **+ Klien baru** |

### 5.10 Template

- Galeri kartu preview template (Jasa, Barang, Sewa, Kwitansi, + premium).
| Tombol | Perilaku |
|---|---|
| **Preview** | modal tampilan penuh template |
| **Jadikan default** | set template default workspace |
| Badge **Pro** | klik saat Free → paywall |

### 5.11 Pengaturan

Tab di dalam halaman: **Profil Usaha · Penomoran · Billing**.

**Profil Usaha** — identitas usaha yang dipakai di semua invoice.
| Field/tombol | Perilaku |
|---|---|
| Nama, alamat | edit → **Simpan perubahan** (toast) |
| Upload logo | preview langsung, batas ukuran file; bisa diganti/dihapus |
| Telepon · Email · Website | tampil di "Dari" & footer invoice |
| Info pembayaran: Nama bank · No. rekening · Atas nama | tampil di blok "Info Pembayaran" invoice |
| Nama penandatangan (opsional) | tampil di atas garis "Authorised Sign" |
| Syarat & ketentuan default (opsional) | prefill S&K di invoice baru |

**Penomoran**
| Field | Perilaku |
|---|---|
| Prefix (`INV-`) | dipakai di invoice berikutnya |
| Nomor urut berikutnya | editable; sistem jaga unik & berurutan |

**Billing**
| Elemen | Perilaku |
|---|---|
| Status plan | "Free — 7/10 hari ini" atau "Pro — aktif s/d 17 Nov 2026" |
| **Upgrade ke Pro** (primary) | buat order → **Midtrans Snap popup** → bayar → webhook mengaktifkan Pro → toast "Selamat, kamu Pro!" |
| Riwayat transaksi | daftar pembayaran |

### 5.12 Menu Akun

| Item | Aksi |
|---|---|
| Profil | data pribadi |
| Billing | → Pengaturan/Billing |
| Bantuan | FAQ/kontak |
| **Keluar** | logout → Login |

---

## 6. State Global (wajib ada semua)

| State | Tampilan |
|---|---|
| **Loading** | skeleton pada kartu/tabel; spinner pada tombol |
| **Empty** | ilustrasi + ajakan + tombol aksi |
| **Error** | pesan jelas + cara perbaikan + tombol coba lagi (nada antarmuka, bukan minta maaf berlebihan) |
| **Kuota habis** | paywall modal (lihat 3.9) |
| **Offline/gagal render** | "Gagal membuat PDF. Coba lagi." + retry |

---

## 7. Responsif

- **Desktop (≥1024px):** sidebar penuh, editor dua kolom (form + preview berdampingan).
- **Tablet (768–1023px):** sidebar collapse ikon; editor jadi tab **Form | Preview**.
- **Mobile (<768px):** nav jadi bottom bar / drawer; preview dibuka via tombol "Lihat preview"; tabel invoice jadi kartu bertumpuk.

---

## 8. Quality Floor (Aksesibilitas & Detail)

- Kontras teks memenuhi WCAG AA.
- **Focus ring** terlihat (2px `primary`) pada semua elemen keyboard.
- `prefers-reduced-motion` dihormati (nonaktifkan animasi non-esensial).
- Semua ikon-only punya `aria-label`/tooltip.
- Nominal pakai figur tabular agar kolom rapi.
- Motion dipakai hemat: satu transisi halus saat preview update & saat modal buka — bukan animasi di tiap kartu.

---

## 9. Checklist "Semua Tombol Berjalan"

Sebelum dianggap selesai, setiap item ini harus punya aksi + state + umpan balik:

- [ ] Login: Masuk, Google, Lupa password, 👁, Ingat saya, Daftar
- [ ] Sign up: Buat akun, Google, Setuju S&K, link Masuk
- [ ] Onboarding: Simpan & mulai, Lewati, Upload logo
- [ ] Sidebar: setiap item nav aktif, workspace switcher, Upgrade card
- [ ] Topbar: Search ⌘K, Notifikasi, Menu akun, Keluar
- [ ] Dashboard: dropdown bulan, toggle chart, hover tooltip, 👁 sembunyikan, klik widget → navigasi
- [ ] Invoice list: + Baru, Cari, Filter status, Filter tanggal, Sort, klik baris, menu ⋯ (Lihat/Edit/Export/Duplikat/Tandai Lunas/Hapus), badge status, pagination
- [ ] Editor: Template, Pilih/﹢Klien, tanggal + cepat, item (tambah/hapus/kategori), Pajak, Diskon, Catatan, Batal, Simpan draft, Simpan, Export (PDF/PNG/Link)
- [ ] View publik: Unduh PDF, Unduh PNG
- [ ] Klien: + Baru, Cari, Edit, Hapus
- [ ] Template: Preview, Jadikan default, badge Pro
- [ ] Pengaturan: Simpan profil, Upload logo, Penomoran, **Upgrade (Midtrans)**, riwayat
- [ ] Paywall: Upgrade ke Pro, Nanti saja
- [ ] Semua aksi destruktif punya konfirmasi; semua aksi sukses punya toast
