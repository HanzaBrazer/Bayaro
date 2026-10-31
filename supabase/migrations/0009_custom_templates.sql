-- ============================================================================
-- Bayaro — Migrasi 0009: template kustom (builder blok + kop surat).
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

-- 1) Tabel template kustom ----------------------------------------------------
create table if not exists public.custom_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'Template tanpa nama',
  layout jsonb not null,                       -- divalidasi zod di server
  letterhead_url text,                         -- gambar kop surat (opsional)
  letterhead_top integer not null default 0,   -- jarak atas area aman (px A4)
  letterhead_bottom integer not null default 0,-- jarak bawah area aman (px A4)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_templates_workspace
  on public.custom_templates(workspace_id);

-- 2) RLS: hanya pemilik workspace --------------------------------------------
alter table public.custom_templates enable row level security;

drop policy if exists custom_templates_owner on public.custom_templates;
create policy custom_templates_owner on public.custom_templates for all
  using (workspace_id in (select w.id from public.workspaces w where w.owner_user_id = auth.uid()))
  with check (workspace_id in (select w.id from public.workspaces w where w.owner_user_id = auth.uid()));

-- 3) Bucket kop surat: publik dibaca (kop tampil di invoice publik) ----------
insert into storage.buckets (id, name, public)
values ('letterheads', 'letterheads', true)
on conflict (id) do nothing;

drop policy if exists letterheads_public_read on storage.objects;
create policy letterheads_public_read on storage.objects
  for select using (bucket_id = 'letterheads');

drop policy if exists letterheads_auth_insert on storage.objects;
create policy letterheads_auth_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'letterheads');

drop policy if exists letterheads_auth_update on storage.objects;
create policy letterheads_auth_update on storage.objects
  for update to authenticated using (bucket_id = 'letterheads');

drop policy if exists letterheads_auth_delete on storage.objects;
create policy letterheads_auth_delete on storage.objects
  for delete to authenticated using (bucket_id = 'letterheads');
