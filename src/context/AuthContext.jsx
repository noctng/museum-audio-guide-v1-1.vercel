import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Lắng nghe các thay đổi trạng thái đăng nhập (đăng nhập, đăng xuất)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Dọn dẹp subscription khi component bị hủy
    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook tùy chỉnh để dễ dàng sử dụng context
export function useAuth() {
  return useContext(AuthContext);
}