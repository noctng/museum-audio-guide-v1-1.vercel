import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);   // Đang tải phiên đăng nhập
  const [role, setRole] = useState(null);          // 'admin' | 'staff'
  const [roleLoading, setRoleLoading] = useState(true); // Đang tải quyền từ profiles

  // Đọc quyền của người dùng từ bảng profiles (tra theo id, không thấy thì tra theo email)
  useEffect(() => {
    const user = session?.user;
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    let disposed = false;
    setRoleLoading(true);

    (async () => {
      let { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!profile) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', (user.email || '').toLowerCase())
          .maybeSingle();
        profile = byEmail;
      }
      if (disposed) return;
      // Trim để né các giá trị dính ký tự xuống dòng khi dán tay trong Supabase
      setRole((profile?.role || 'staff').trim());
      setRoleLoading(false);
    })();

    return () => { disposed = true; };
  }, [session?.user?.id]);

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
    role,
    isAdmin: role === 'admin',
    loading: loading || roleLoading, // đợi cả phiên + quyền rồi mới render
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
