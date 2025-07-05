import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { createPageUrl } from '@/lib/utils';
import { Home, UploadCloud, ListVideo, LogOut } from 'lucide-react'; // Import LogOut
import { Button } from './ui/button';

const navigationItems = [
  // ... other items
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

        <div className="space-y-4 mt-8 flex-1">
            {/* ... (phần map navigationItems giữ nguyên) ... */}
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