-- ============================================================
-- Sửa lỗi "Không xác định được quyền của bạn (không tìm thấy hồ sơ)"
-- Chạy 1 lần trong Supabase SQL Editor
--
-- Nguyên nhân: dòng trong profiles được tạo tay với id KHÔNG khớp
-- với id thật trong auth.users, và role không phải 'admin'.
-- ============================================================

-- 1) Đồng bộ: tạo dòng profiles đúng id của từng tài khoản trong Auth
insert into public.profiles (id, email, role)
select
  u.id,
  u.email,
  coalesce(p.role, 'staff') as role
from auth.users u
left join public.profiles p on lower(p.email) = lower(u.email)
where not exists (
  select 1 from public.profiles p2 where p2.id = u.id
)
on conflict (id) do nothing;

-- 2) Gắn quyền admin cho tài khoản quản trị của bạn
--    (đổi email nếu tài khoản admin là email khác)
update public.profiles
set role = 'admin'
where lower(email) = lower('noc.bmt@gmail.com');

-- 3) Xoá các dòng profiles cũ id sai (tồn tại từ trước, không khớp Auth)
delete from public.profiles p
where not exists (
  select 1 from auth.users u where u.id = p.id
);

-- 4) Kiểm tra kết quả: mọi tài khoản phải có đúng 1 dòng, id khớp Auth
--    select p.email, p.role, p.id = (select u.id from auth.users u where u.email = p.email) as khop_auth
--    from public.profiles p;
