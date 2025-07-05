import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session } = useAuth();

  if (!session) {
    // Nếu không có session, chuyển hướng đến trang đăng nhập
    return <Navigate to="/login" />;
  }

  // Nếu đã đăng nhập, hiển thị nội dung của route
  return children;
}