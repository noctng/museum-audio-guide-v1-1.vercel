-- ============================================================
-- Bảng ghi nhận LƯỢT NGHE (mỗi lần audio phát = 1 bản ghi)
-- Chạy file này trong Supabase Dashboard → SQL Editor
-- (Supabase sẽ tự tạo bảng; nếu đã tồn tại thì bỏ qua lỗi)
-- ============================================================

create table if not exists public.listen_events (
  id            bigint generated always as identity primary key,
  artifact_code text        not null,
  language      text        not null,
  created_at    timestamptz not null default now()
);

-- Index phục vụ thống kê
create index if not exists listen_events_artifact_idx on public.listen_events (artifact_code);
create index if not exists listen_events_language_idx on public.listen_events (language);

-- Bật RLS cho bảng mới
alter table public.listen_events enable row level security;

-- Khách ẩn danh CHỈ được GHI event nghe
create policy "listen_events_public_insert"
on public.listen_events
for insert
to anon, authenticated
with check (true);

-- Chỉ admin đã đăng nhập mới được XEM thống kê
create policy "listen_events_admin_select"
on public.listen_events
for select
to authenticated
using (true);
