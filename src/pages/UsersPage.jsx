import React, { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseUrl } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users as UsersIcon, UserPlus, RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);          // Người xem có phải admin?
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [accessDenied, setAccessDenied] = useState(null); // Lý do bị chặn vào trang

  // Form tạo tài khoản mới
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error' | 'warn', text }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) setError(fetchError.message);
    else setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Chỉ admin mới được vào trang này (kể cả staff đăng nhập cũng bị chặn)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccessDenied('Không xác định được phiên đăng nhập, hãy đăng nhập lại.');
        return;
      }
      setCurrentUserEmail((user.email || '').toLowerCase());

      // Tra quyền: theo id trước, không thấy thì tra theo email
      let { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!profile) {
        const { data: byEmail } = await supabase.from('profiles').select('role').eq('email', (user.email || '').toLowerCase()).maybeSingle();
        profile = byEmail;
      }
      setIsAdmin(profile?.role === 'admin');
      if (!profile) setAccessDenied('Không tìm thấy hồ sơ quyền của bạn. Chạy supabase/profiles_repair.sql để đồng bộ hồ sơ.');
      else if (profile.role !== 'admin') setAccessDenied('Chỉ quản trị (admin) mới có quyền truy cập trang này.');
    })();
  }, []);

  // Đổi quyền của 1 tài khoản
  const handleRoleChange = async (user, newRole) => {
    if (!newRole || newRole === user.role) return;

    // Chặn việc tự đổi quyền của chính mình nếu đây là admin duy nhất
    if ((user.email || '').toLowerCase() === currentUserEmail) {
      const otherAdmins = users.filter(u =>
        u.email !== user.email && (u.role || '').trim() === 'admin'
      );
      if (newRole !== 'admin' && otherAdmins.length === 0) {
        setMessage({
          type: 'error',
          text: 'Bạn là quản trị duy nhất — không thể tự hạ quyền, nếu không sẽ không ai quản lý được tài khoản nữa.',
        });
        return;
      }
      const ok = window.confirm(`Bạn sắp tự đổi quyền của chính mình thành "${newRole === 'admin' ? 'Quản trị' : 'Nhân viên'}". Tiếp tục?`);
      if (!ok) return;
    }

    // Cập nhật theo email (an toàn kể cả khi id hồ sơ chưa đồng bộ)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('email', (user.email || '').toLowerCase());

    if (updateError) {
      setMessage({
        type: 'error',
        text: `Không đổi được quyền: ${updateError.message}. Nếu lỗi RLS, hãy chạy file supabase/profiles_rls.sql trong Supabase SQL Editor.`,
      });
    } else {
      setMessage({
        type: 'success',
        text: `✅ Đã đổi quyền của ${user.email} thành ${newRole === 'admin' ? 'Quản trị' : 'Nhân viên'}`,
      });
      fetchUsers();
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    // 1) Lấy JWT của admin đang đăng nhập
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      setMessage({ type: 'error', text: 'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.' });
      setCreating(false);
      return;
    }

    // 2) Gọi Edge Function create-user (chỉ admin mới được phép — kiểm tra phía server)
    let res;
    try {
      res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email, password, role }),
      });
    } catch (networkError) {
      setMessage({
        type: 'error',
        text: 'Không kết nối được máy chủ. Edge Function "create-user" có thể chưa được triển khai (chạy: supabase functions deploy create-user).',
      });
      setCreating(false);
      return;
    }

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage({ type: 'error', text: result.error || `Không tạo được tài khoản (mã ${res.status}).` });
      setCreating(false);
      return;
    }

    if (result.warning) {
      setMessage({ type: 'warn', text: result.warning });
    } else {
      setMessage({ type: 'success', text: `✅ Đã tạo tài khoản ${email} (${role === 'admin' ? 'Quản trị' : 'Nhân viên'})` });
      setEmail('');
      setPassword('');
    }
    fetchUsers();
    setCreating(false);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  // 🚫 Chặn trang nếu không phải admin
  if (accessDenied) {
    return (
      <div className="p-4 sm:p-8">
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-semibold mb-1">Không có quyền truy cập</p>
              <p>{accessDenied}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-amber-600" /> Tài khoản nhân viên
          </h1>
          <p className="text-sm text-slate-500">
            Tạo tài khoản để nhân viên đăng nhập và xem Dashboard báo cáo.
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Thông báo */}
      {message && (
        <Card className={
          message.type === 'success' ? 'border-green-300 bg-green-50'
          : message.type === 'warn' ? 'border-amber-300 bg-amber-50'
          : 'border-red-300 bg-red-50'
        }>
          <CardContent className="p-4 text-sm flex items-start gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              : message.type === 'warn' ? <Info className="w-5 h-5 text-amber-600 shrink-0" />
              : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span className={message.type === 'success' ? 'text-green-800' : message.type === 'warn' ? 'text-amber-800' : 'text-red-700'}>
              {message.text}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Form tạo tài khoản mới */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-600" /> Tạo tài khoản mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="staff-email" className="text-sm font-semibold text-slate-700">Email</label>
              <Input
                id="staff-email"
                type="email"
                placeholder="nhanvien@baotang.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="staff-password" className="text-sm font-semibold text-slate-700">
                Mật khẩu <span className="font-normal text-slate-400">(tối thiểu 6 ký tự)</span>
              </label>
              <Input
                id="staff-password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="staff-role" className="text-sm font-semibold text-slate-700">Quyền</label>
              <select
                id="staff-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="staff">Nhân viên (xem báo cáo)</option>
                <option value="admin">Quản trị (toàn quyền)</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </div>
          </form>
          <p className="text-xs text-slate-400 mt-3">
            Tài khoản được tạo qua Edge Function an toàn (service key phía server, email kích hoạt ngay). Để chặn hoàn toàn việc tự đăng ký từ bên ngoài,
            hãy tắt <strong>"Allow new users to sign up"</strong> trong Supabase Dashboard → Authentication → Sign In / Providers → Email.
          </p>
        </CardContent>
      </Card>

      {/* Danh sách tài khoản */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Danh sách tài khoản ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-600">
              Lỗi: {error}
              <br />
              <span className="text-xs text-slate-500">
                Nếu lỗi liên quan đến RLS, hãy chạy file <code>supabase/profiles_rls.sql</code> trong Supabase SQL Editor.
              </span>
            </p>
          ) : loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Chưa có tài khoản nào.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Quyền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const cleanRole = (user.role || 'staff').trim();
                  const isSelf = (user.email || '').toLowerCase() === currentUserEmail;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.email}
                        {isSelf && (
                          <span className="ml-2 text-xs text-amber-600 font-medium">(bạn)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <select
                          value={cleanRole}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className={`h-8 rounded-md border px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                            cleanRole === 'admin'
                              ? 'border-purple-200 bg-purple-50 text-purple-700'
                              : 'border-blue-200 bg-blue-50 text-blue-700'
                          }`}
                        >
                          <option value="admin">Quản trị (toàn quyền)</option>
                          <option value="staff">Nhân viên (xem báo cáo)</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-slate-500">{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
