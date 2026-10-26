-- ============================================================================
-- Bayaro — Migrasi 0007: klaim & bukti pembayaran dari halaman invoice publik.
-- Klien menekan "Saya sudah membayar" + unggah bukti; owner yang mengonfirmasi.
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

-- 1) Tabel klaim pembayaran -------------------------------------------------
create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  image_path text not null,                    -- path di bucket PRIVAT payment-proofs
  amount numeric(14,2),
  paid_at date,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_payment_proofs_invoice on public.payment_proofs(invoice_id);
create index if not exists idx_payment_proofs_status on public.payment_proofs(status);

-- Maksimal SATU klaim menunggu konfirmasi per invoice (anti-spam).
create unique index if not exists uniq_payment_proof_pending
  on public.payment_proofs(invoice_id) where status = 'pending';

-- 2) RLS: hanya pemilik workspace yang boleh melihat/mengubah klaim.
--    Penyisipan dari halaman publik dilakukan server memakai service role.
alter table public.payment_proofs enable row level security;

drop policy if exists proofs_owner on public.payment_proofs;
create policy proofs_owner on public.payment_proofs for all
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

-- 3) Bucket PRIVAT untuk bukti bayar (berisi data mutasi/rekening).
--    Tidak ada policy anon: akses hanya lewat signed URL yang dibuat server.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
