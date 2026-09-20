import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './hooks/useSettings';
import { AuthProvider, useAuth } from './hooks/useAuth';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/public/Landing';
import Report from './pages/public/Report';
import Success from './pages/public/Success';
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Cases from './pages/admin/Cases';
import CaseDetail from './pages/admin/CaseDetail';
import Reviews from './pages/admin/Reviews';
import AdminSettings from './pages/admin/Settings';
import Spinner from './components/Spinner';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <Spinner label="Loading..." />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}

function AdminLoggedInRedirect() {
  const { admin, loading } = useAuth();
  if (loading) return <Spinner label="Loading..." />;
  if (admin) return <Navigate to="/admin/dashboard" replace />;
  return <AdminLogin />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/report" element={<Report />} />
        <Route path="/report/success" element={<Success />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoggedInRedirect />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/:caseId" element={<CaseDetail />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}