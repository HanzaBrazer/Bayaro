-- ============================================================================
-- Bayaro — Migrasi 0002 (Langkah 3): workspace default otomatis + storage logo
-- Jalankan di Supabase -> SQL Editor -> Run. Aman dijalankan ulang.
-- ============================================================================

-- 1) Trigger: profil + workspace default saat user baru daftar (email & Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.workspaces (owner_user_id, name)
  values (new.id, 'Usaha Saya');

  return new;
end;
$$;

-- Backfill: user lama yang belum punya workspace (mis. akun test Langkah 2)
insert into public.workspaces (owner_user_id, name)
select u.id, 'Usaha Saya'
from public.users u
where not exists (select 1 from public.workspaces w where w.owner_user_id = u.id);

-- 2) Storage bucket untuk logo usaha (publik dibaca)
insert into storage.buckets (id, name, public)
values ('workspace-logos', 'workspace-logos', true)
on conflict (id) do nothing;

-- 3) Policy object storage: baca publik, tulis hanya user terautentikasi
drop policy if exists logos_public_read on storage.objects;
create policy logos_public_read on storage.objects
  for select using (bucket_id = 'workspace-logos');

drop policy if exists logos_auth_insert on storage.objects;
create policy logos_auth_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'workspace-logos');

drop policy if exists logos_auth_update on storage.objects;
create policy logos_auth_update on storage.objects
  for update to authenticated using (bucket_id = 'workspace-logos');

drop policy if exists logos_auth_delete on storage.objects;
create policy logos_auth_delete on storage.objects
  for delete to authenticated using (bucket_id = 'workspace-logos');
