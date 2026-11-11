import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import IndexPage from './pages/IndexPage';
import LoginPage from './pages/LoginPage';
import AdminUploadPage from './components/AdminUpload';
import ArtifactManagementPage from './pages/ArtifactManagement';
import UsersPage from './pages/UsersPage';
const DashboardPage = lazy(() => import('./pages/DashboardPage')); // code-split: chỉ tải khi vào /admin/dashboard
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { createPageUrl } from './lib/utils';

// Component Layout cho các trang admin
function AdminLayout() {
    return (
        <Layout>
            <Suspense fallback={<div className="p-8 text-slate-500">Đang tải...</div>}>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/artifacts" element={<ArtifactManagementPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/upload" element={<AdminUploadPage />} />
              </Routes>
            </Suspense>
        </Layout>
    )
}

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={createPageUrl('Index')} element={<IndexPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;