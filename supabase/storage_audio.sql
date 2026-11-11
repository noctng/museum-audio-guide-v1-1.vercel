-- ============================================================
-- Tạo bucket 'audio' cho file MP3 + chính sách bảo mật
-- Chạy 1 lần trong Supabase SQL Editor
-- ============================================================

-- 1) Bucket công khai cho đọc, giới hạn 50MB, chỉ nhận MP3
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', true, 52428800, array['audio/mpeg'])
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800,
      allowed_mime_types = array['audio/mpeg'];

-- 2) Ai cũng đọc được file audio (khách tham quan cần phát audio)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'audio_public_read'
  ) then
    create policy audio_public_read
      on storage.objects for select
      to public
      using (bucket_id = 'audio');
  end if;
end $$;

-- 3) Chỉ ADMIN (role='admin' trong profiles) được upload
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'audio_admin_upload'
  ) then
    create policy audio_admin_upload
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'audio'
        and exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

-- 4) Admin được xoá / thay thế file
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'audio_admin_delete'
  ) then
    create policy audio_admin_delete
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'audio'
        and exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;
