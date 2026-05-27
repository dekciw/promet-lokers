import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './shared/lib/firebase';
import { isAdmin } from './shared/utils/isAdmin';
import { LoginScreen } from './modules/Auth';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import AdminPage from './pages/AdminPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './shared/components/ProtectedRoute/ProtectedRoute';
import ErrorBoundary from './shared/components/ErrorBoundary/ErrorBoundary';
import LoadingScreen from './shared/components/LoadingScreen/LoadingScreen';
import './index.css';

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthState(firebaseUser ? 'authenticated' : 'anonymous');
    });
    return unsubscribe;
  }, []);

  async function handleLogout() {
    await signOut(auth);
  }

  if (authState === 'loading') return <LoadingScreen />;
  if (authState === 'anonymous') return <LoginScreen />;

  const username = user.displayName || user.email;
  const adminAllowed = isAdmin(user.email);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/configurator" replace />} />
        <Route
          path="/configurator"
          element={
            <ConfiguratorPage
              onLogout={handleLogout}
              username={username}
              isAdmin={adminAllowed}
              uid={user?.uid}
            />
          }
        />
        <Route element={<ProtectedRoute isAllowed={adminAllowed} redirectPath="/configurator" />}>
          <Route
            path="/admin/*"
            element={<AdminPage onLogout={handleLogout} username={username} />}
          />
        </Route>
        <Route
          path="/history"
          element={
            <HistoryPage
              uid={user?.uid}
              onLogout={handleLogout}
              username={username}
              isAdmin={adminAllowed}
            />
          }
        />
        <Route path="*" element={<Navigate to="/configurator" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
