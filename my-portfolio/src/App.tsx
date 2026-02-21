import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './hooks/useToast';
import ProtectedRoute from './components/protected-route';
import Portfolio from './pages/Portfolio';
import AdminLogin from './admin/login';
import AdminDashboard from './admin/dashboard';
import AdminContent from './admin/content';
import AdminMessages from './admin/messages';
import AdminMessageDetail from './admin/message-detail';
import AdminProjects from './admin/projects';
import AdminCertifications from './admin/certifications';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin/content"
              element={<ProtectedRoute><AdminContent /></ProtectedRoute>}
            />
            <Route
              path="/admin/messages"
              element={<ProtectedRoute><AdminMessages /></ProtectedRoute>}
            />
            <Route
              path="/admin/messages/:id"
              element={<ProtectedRoute><AdminMessageDetail /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects"
              element={<ProtectedRoute><AdminProjects /></ProtectedRoute>}
            />
            <Route
              path="/admin/certifications"
              element={<ProtectedRoute><AdminCertifications /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
