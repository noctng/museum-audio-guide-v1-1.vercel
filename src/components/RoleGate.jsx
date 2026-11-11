import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Chặn các route dành riêng cho admin (quản lý hiện vật, upload, tài khoản).
 * Nhân viên (staff) truy cập sẽ bị đẩy về /admin/dashboard — nơi duy nhất
 * mà staff được phép xem (báo cáo thống kê).
 */
export default function RoleGate({ children }) {
  const { session, isAdmin, loading } = useAuth();

  if (!session) {
    return <Navigate to="/login" />;
  }

  // Đang tải quyền -> không render gì để tránh nhấp nháy sai màn hình
  if (loading) return null;

  if (!isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
