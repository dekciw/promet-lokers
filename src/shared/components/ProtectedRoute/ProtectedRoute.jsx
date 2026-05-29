import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';

export default function ProtectedRoute({ isAllowed, redirectPath = '/configurator', children, openAuthModal }) {
  useEffect(() => {
    if (!isAllowed && openAuthModal) {
      openAuthModal(null, 'login');
    }
  }, []);

  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }
  return children ? children : <Outlet />;
}
