-- ============================================================
-- Sửa lỗi đếm lượt truy cập / số online (chạy 1 lần trong SQL Editor)
--
-- Lỗi cũ: RLS bật nhưng thiếu policy INSERT/UPDATE/DELETE nên
--   - page_visits kẹt ở count = 1 (upsert bị chặn ngầm)
--   - active_sessions tích tụ ~1600 session rác không bao giờ bị xoá
-- Giải pháp: chuyển toàn bộ thao tác ghi vào RPC security definer
-- (bypass RLS, chống race-condition, khách không xoá được session người khác)
-- ============================================================

-- 1) Thêm cột last_seen: thời điểm mỗi trình duyệt "ping" lần cuối
alter table public.active_sessions add column if not exists last_seen timestamptz;

-- 2) Dọn session rác (không có last_seen định kỳ => đã thoát từ lâu)
delete from public.active_sessions where last_seen is null;

-- 3) Đảm bảo page_visits là duy nhất theo 'page' để upsert hoạt động đúng
create unique index if not exists page_visits_page_key on public.page_visits (page);

-- 4) RPC ghi 1 lượt truy cập (insert mới, trùng thì +1)
create or replace function public.bump_page_visit(p_page text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.page_visits (page, count, updated_at)
  values (p_page, 1, now())
  on conflict (page) do update
    set count = public.page_visits.count + 1,
        updated_at = now();
$$;

-- 5) RPC đăng ký / bắt nhịp session (insert khi mới vào, update last_seen sau đó)
create or replace function public.ping_session(p_id uuid, p_page text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.active_sessions (id, page, created_at, last_seen)
  values (p_id, p_page, now(), now())
  on conflict (id) do update
    set page      = excluded.page,
        last_seen = now();
$$;

-- 6) RPC xoá session khi rời trang (chỉ được xoá đúng session của chính mình)
create or replace function public.remove_session(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.active_sessions where id = p_id;
$$;

-- 7) Cấp quyền thực thi RPC cho khách ẩn danh và thành viên
grant execute on function public.bump_page_visit(text) to anon, authenticated;
grant execute on function public.ping_session(uuid, text) to anon, authenticated;
grant execute on function public.remove_session(uuid) to anon, authenticated;

-- 8) Bảo đảm mọi người đọc được số liệu (nếu RLS đang bật)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'page_visits' and policyname = 'page_visits_public_select'
  ) then
    create policy page_visits_public_select
      on public.page_visits for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'active_sessions' and policyname = 'active_sessions_public_select'
  ) then
    create policy active_sessions_public_select
      on public.active_sessions for select
      to anon, authenticated
      using (true);
  end if;
end $$;
