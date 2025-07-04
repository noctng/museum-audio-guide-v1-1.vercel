import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, UploadCloud } from 'lucide-react'; // Import UploadCloud

const navigationItems = [
  {
    title: 'Audio Guide',
    url: createPageUrl('Index'),
    icon: Home,
    section: 'main'
  },
  {
    title: 'Upload Audio',
    url: createPageUrl('AdminUpload'),
    icon: UploadCloud,
    section: 'admin'
  }
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <nav className="w-64 bg-white border-r border-slate-200 p-4 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Museum Guide</h1>
          <p className="text-sm text-slate-500">Admin Panel</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Guide</h3>
            {navigationItems.filter(item => item.section === 'main').map((item) => (
              <Link key={item.title} to={item.url}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-left transition-colors ${
                    location.pathname === item.url 
                      ? 'bg-amber-100 text-amber-800 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </button>
              </Link>
            ))}
          </div>
          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Management</h3>
            {navigationItems.filter(item => item.section === 'admin').map((item) => (
              <Link key={item.title} to={item.url}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-left transition-colors ${
                    location.pathname === item.url 
                      ? 'bg-amber-100 text-amber-800 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}