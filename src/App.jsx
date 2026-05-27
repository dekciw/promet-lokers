import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './shared/lib/firebase';
import { LoginScreen, RegisterScreen } from './modules/Auth';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import AdminPage from './pages/AdminPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './shared/components/ProtectedRoute/ProtectedRoute';
import ErrorBoundary from './shared/components/ErrorBoundary/ErrorBoundary';
import LoadingScreen from './shared/components/LoadingScreen/LoadingScreen';
import './index.css';

const MASTER_ADMIN_EMAIL = 'admin@promet.ru';

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [adminAllowed, setAdminAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAdminAllowed(false);
        setAuthState('anonymous');
        return;
      }
      // Read Firestore role — master admin email always has access even without a doc
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        const role = snap.exists() ? snap.data().role : null;
        setAdminAllowed(role === 'admin' || firebaseUser.email === MASTER_ADMIN_EMAIL);
      } catch {
        setAdminAllowed(firebaseUser.email === MASTER_ADMIN_EMAIL);
      }
      setUser(firebaseUser);
      setAuthState('authenticated');
    });
    return unsubscribe;
  }, []);

  async function handleLogout() {
    await signOut(auth);
  }

  if (authState === 'loading') return <LoadingScreen />;

  if (authState === 'anonymous') {
    return (
      <Routes>
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  const username = user.displayName || user.email;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/configurator" replace />} />
        <Route path="/login" element={<Navigate to="/configurator" replace />} />
        <Route path="/register" element={<Navigate to="/configurator" replace />} />
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
