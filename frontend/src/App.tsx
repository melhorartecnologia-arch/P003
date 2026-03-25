import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth();
  return hasRole('admin') ? <>{children}</> : <Navigate to="/" />;
}

function OperatorRoute({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth();
  return hasRole('admin', 'operador') ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />

      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/documentos" element={<DocumentsPage />} />
                <Route path="/documentos/:id" element={<DocumentDetailPage />} />
                <Route path="/busca" element={<SearchPage />} />
                <Route
                  path="/upload"
                  element={<OperatorRoute><UploadPage /></OperatorRoute>}
                />
                <Route
                  path="/usuarios"
                  element={<AdminRoute><UsersPage /></AdminRoute>}
                />
                <Route
                  path="/auditoria"
                  element={<AdminRoute><AuditPage /></AdminRoute>}
                />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
