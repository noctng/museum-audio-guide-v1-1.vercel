-- ============================================================
-- Gán quyền admin + dọn dữ liệu role bị dính ký tự xuống dòng
-- Chạy 1 lần trong Supabase SQL Editor
-- ============================================================

-- 1) Dọn giá trị role bị dính \r\n (thường do dán tay trong Table Editor)
update public.profiles
set role = trim(role)
where role like E'%\r%' or role like E'%\n%';

-- 2) Gán quyền admin cho tài khoản của bạn
update public.profiles
set role = 'admin'
where lower(email) = lower('hoangtutng2011@gmail.com');

-- 3) Kiểm tra kết quả
select email, role, created_at from public.profiles order by created_at asc;
