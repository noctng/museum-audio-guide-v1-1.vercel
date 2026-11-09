import { supabase } from './supabaseClient';

// Một session coi là "đang online" nếu có ping trong khoảng thời gian này
export const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 phút

// Tần suất heartbeat gửi lên server (bắt nhịp mỗi 30 giây)
export const HEARTBEAT_MS = 30 * 1000;

const activeSinceISO = () => new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();

// Tên hiển thị của từng trang trên dashboard / footer
export const PAGE_LABELS = {
  home: 'Trang chủ (chọn ngôn ngữ)',
  artifact_input: 'Nhập mã hiện vật',
  artifact_player: 'Trình phát audio',
  artifact: 'Hiện vật (trang cũ)',
};

/**
 * Ghi nhận 1 lượt truy cập cho trang.
 * Dùng RPC security definer nên không gặp vấn đề RLS, và chống race-condition.
 */
export function recordPageVisit(page) {
  return supabase.rpc('bump_page_visit', { p_page: page }).then(({ error }) => {
    if (error) {
      console.warn(`Không ghi được lượt truy cập (${page}):`, error.message);
    }
  });
}

/**
 * Đăng ký / bắt nhịp session. Chỉ mới vào: insert, sau đó: update last_seen + page.
 */
export function pingSession(sessionId, page) {
  return supabase.rpc('ping_session', { p_id: sessionId, p_page: page }).then(({ error }) => {
    if (error) {
      console.warn('Ping session thất bại:', error.message);
    }
  });
}

/**
 * Xoá session khi rời trang.
 */
export function removeSession(sessionId) {
  return supabase.rpc('remove_session', { p_id: sessionId }).then(({ error }) => {
    if (error) {
      console.warn('Xoá session thất bại:', error.message);
    }
  });
}

/**
 * Đọc tổng lượt truy cập, phân theo trang: { home: 12, artifact: 0, ... }
 */
export async function fetchVisitStats() {
  const { data, error } = await supabase.from('page_visits').select('page, count');
  if (error) {
    console.warn('Không đọc được page_visits:', error.message);
    return {};
  }
  return Object.fromEntries((data || []).map(r => [r.page, r.count || 0]));
}

/**
 * Đọc số người đang online (có ping trong ACTIVE_WINDOW_MS phút gần nhất).
 * Trả về { total, byPage: { home: 3, ... } }
 */
export async function fetchActiveUsers() {
  const { data, error } = await supabase
    .from('active_sessions')
    .select('page')
    .gte('last_seen', activeSinceISO());

  if (error) {
    console.warn('Không đọc được active_sessions:', error.message);
    return { total: 0, byPage: {} };
  }

  const byPage = {};
  (data || []).forEach(r => {
    byPage[r.page] = (byPage[r.page] || 0) + 1;
  });
  return { total: (data || []).length, byPage };
}
