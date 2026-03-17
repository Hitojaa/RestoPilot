import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, hasOnboarded } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!hasOnboarded(user.id)) return <Navigate to="/onboarding" replace />;

  return children;
}
