import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute ensures that the user is authenticated and has the required role.
 * If not authenticated, redirects to /login.
 * If authenticated but lacks the required role, redirects to the dashboard.
 */
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, session } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session?.role)) {
    // User is authenticated but doesn't have the required role
    // Redirect to dashboard as a safe fallback
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
