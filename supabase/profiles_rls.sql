-- ============================================================
-- Bảo vệ bảng profiles + cấp quyền quản lý tài khoản nhân viên
-- Chạy 1 lần trong Supabase SQL Editor
-- ============================================================

-- Bật RLS (trước đó bảng này đang cho ẩn danh đọc tự do)
alter table public.profiles enable row level security;

do $$
begin
  -- Admin/Staff đăng nhập mới được xem danh sách tài khoản
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'profiles_authenticated_select'
  ) then
    create policy profiles_authenticated_select
      on public.profiles for select
      to authenticated
      using (true);
  end if;

  -- Admin đăng nhập được thêm hồ sơ nhân viên khi tạo tài khoản
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'profiles_authenticated_insert'
  ) then
    create policy profiles_authenticated_insert
      on public.profiles for insert
      to authenticated
      with check (true);
  end if;

  -- Cho phép cập nhật (đổi role, đổi tên hiển thị...)
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'profiles_authenticated_update'
  ) then
    create policy profiles_authenticated_update
      on public.profiles for update
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;
