import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import AdminUploadPage from './components/AdminUpload';
import Layout from './components/Layout';
import { createPageUrl } from './lib/utils';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith(createPageUrl('adminupload'));

  if (isAdminRoute) {
    return (
      <Layout>
        <Routes>
          <Route path={createPageUrl('adminupload')} element={<AdminUploadPage />} />
        </Routes>
      </Layout>
    );
  }

  // Các trang công khai không có Layout admin
  return (
    <Routes>
      <Route path={createPageUrl('Index')} element={<IndexPage />} />
      <Route path={createPageUrl('adminupload')} element={<AdminUploadPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;