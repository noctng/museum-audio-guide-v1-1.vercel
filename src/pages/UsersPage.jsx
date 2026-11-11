import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users as UsersIcon, UserPlus, RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    // 1) Tạo tài khoản trong Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });

    if (signUpError) {
      setMessage({
        type: 'error',
        text:
          signUpError.status === 422 || /registered/i.test(signUpError.message)
            ? `Email ${email} đã được đăng ký.`
            : `Không tạo được tài khoản: ${signUpError.message}`,
      });
      setCreating(false);
      return;
    }

    // 2) Nếu Supabase yêu cầu xác nhận email => chưa có session
    if (!data.session) {
      setMessage({
        type: 'warn',
        text: `Đã tạo tài khoản ${email}, nhưng đang bật xác nhận email nên nhân viên phải mở link trong hộp thư để kích hoạt. (Mẹo: tắt "Confirm email" trong Supabase Dashboard → Authentication để kích hoạt ngay.)`,
      });
      setEmail('');
      setPassword('');
      setCreating(false);
      return;
    }

    // 3) Ghi hồ sơ vào bảng profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      role,
    });

    if (profileError) {
      setMessage({
        type: 'error',
        text: `Tài khoản đã tạo nhưng chưa ghi được hồ sơ: ${profileError.message}. Hãy chạy file supabase/profiles_rls.sql trong Supabase SQL Editor.`,
      });
    } else {
      setMessage({ type: 'success', text: `✅ Đã tạo tài khoản ${email} (${role === 'admin' ? 'Quản trị' : 'Nhân viên'})` });
      setEmail('');
      setPassword('');
      fetchUsers();
    }
    setCreating(false);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

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
            Lưu ý: để khoá quyền truy cập của một nhân viên, hãy đổi mật khẩu hoặc xoá tài khoản trong
            Supabase Dashboard → Authentication → Users (vì lý do bảo mật, việc xoá tài khoản Auth không thể thực hiện từ trang này).
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <span className={
                        `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`
                      }>
                        {user.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
