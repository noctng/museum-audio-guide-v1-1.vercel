import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { createPageUrl } from '@/lib/utils';
import { Home, UploadCloud, ListVideo, LogOut, BarChart3 } from 'lucide-react'; // Import LogOut
import { Button } from './ui/button';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: BarChart3,
    section: 'admin'
  },
  {
    title: 'Artifacts',
    url: '/admin/artifacts', // New URL
    icon: ListVideo,          // New Icon
    section: 'admin'
  },
  {
    title: 'Upload Audio',
    url: '/admin/upload', // Sửa lại URL
    icon: UploadCloud,
    section: 'admin'
  }
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth(); // Lấy hàm signOut

  const handleLogout = async () => {
    await signOut();
    navigate('/login'); // Chuyển hướng về trang login sau khi đăng xuất
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <nav className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Museum Guide</h1>
          <p className="text-sm text-slate-500">Admin Panel</p>
        </div>

        <div className="space-y-2 mt-8 flex-1">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
        </div>

        {/* Nút Logout ở cuối */}
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
        </Button>
      </nav>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}