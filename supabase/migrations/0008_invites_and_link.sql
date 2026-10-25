-- ============================================================================
-- Bayaro — Migrasi 0008: undangan lewat email + nonaktifkan tautan publik.
-- Undangan TIDAK memberi hak khusus (semua pemegang tautan haknya sama):
-- tabel ini adalah CATATAN PENGIRIMAN, bukan kontrol akses.
-- Pencabutan akses yang sesungguhnya = invoices.link_active = false.
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

-- 1) Saklar tautan publik -----------------------------------------------------
alter table public.invoices
  add column if not exists link_active boolean not null default true;

-- 2) Catatan undangan ---------------------------------------------------------
create table if not exists public.invoice_invites (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  send_count integer not null default 1
);

create index if not exists idx_invoice_invites_invoice on public.invoice_invites(invoice_id);

-- Satu baris per (invoice, email): undang ulang memperbarui waktu kirim.
create unique index if not exists uniq_invoice_invite
  on public.invoice_invites(invoice_id, lower(email));

-- 3) RLS: hanya pemilik workspace invoice terkait ----------------------------
alter table public.invoice_invites enable row level security;

drop policy if exists invites_owner on public.invoice_invites;
create policy invites_owner on public.invoice_invites for all
  using (
    invoice_id in (
      select i.id from public.invoices i
      where i.workspace_id in (
        select w.id from public.workspaces w where w.owner_user_id = auth.uid()
      )
    )
  )
  with check (
    invoice_id in (
      select i.id from public.invoices i
      where i.workspace_id in (
        select w.id from public.workspaces w where w.owner_user_id = auth.uid()
      )
    )
  );
