import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import IndexPage from './pages/IndexPage';
import LoginPage from './pages/LoginPage';
import AdminUploadPage from './components/AdminUpload';
import ArtifactManagementPage from './pages/ArtifactManagement';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { createPageUrl } from './lib/utils';

// Component Layout cho các trang admin
function AdminLayout() {
    return (
        <Layout>
            <Routes>
                <Route path="/artifacts" element={<ArtifactManagementPage />} />
                <Route path="/upload" element={<AdminUploadPage />} />
            </Routes>
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