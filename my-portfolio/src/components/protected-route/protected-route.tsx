import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotAuthorized from '../../admin/not-authorized';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin" replace />;

  if (!isAdmin) return <NotAuthorized />;

  return <>{children}</>;
}
