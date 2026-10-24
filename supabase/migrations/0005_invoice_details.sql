-- ============================================================================
-- Bayaro — Migrasi 0005: detail invoice lengkap (Invoice From, Payment Info,
-- Terms & Conditions, Authorised Sign, kontak klien).
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

-- Identitas usaha (dipakai di semua invoice) --------------------------------
alter table public.workspaces add column if not exists phone text;
alter table public.workspaces add column if not exists email text;
alter table public.workspaces add column if not exists website text;
alter table public.workspaces add column if not exists signatory text;        -- nama penandatangan (Authorised Sign)
alter table public.workspaces add column if not exists bank_name text;        -- Payment Info: nama bank
alter table public.workspaces add column if not exists account_number text;   -- Payment Info: no. rekening
alter table public.workspaces add column if not exists account_holder text;   -- Payment Info: atas nama
alter table public.workspaces add column if not exists terms text;            -- Syarat & ketentuan default

-- Snapshot per invoice ------------------------------------------------------
alter table public.invoices add column if not exists client_email text;
alter table public.invoices add column if not exists client_phone text;
alter table public.invoices add column if not exists terms text;              -- syarat & ketentuan invoice ini
