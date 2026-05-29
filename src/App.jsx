import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './shared/lib/firebase';
import { ADMIN_EMAIL } from './shared/constants/admin';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import AdminPage from './pages/AdminPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './shared/components/ProtectedRoute/ProtectedRoute';
import ErrorBoundary from './shared/components/ErrorBoundary/ErrorBoundary';
import LoadingScreen from './shared/components/LoadingScreen/LoadingScreen';
import AuthModal from './shared/components/AuthModal/AuthModal';
import './index.css';

const REGISTER_TRIGGER_KEY = 'promet_open_register';

// Redirects /register to /configurator and sets a trigger flag to open the register popup.
function RegisterRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem(REGISTER_TRIGGER_KEY, '1');
    navigate('/configurator', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, view: 'login', onSuccess: null });
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAdminAllowed(false);
        setAuthState('ready');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        const role = snap.exists() ? snap.data().role : null;
        setAdminAllowed(role === 'admin' || firebaseUser.email === ADMIN_EMAIL);
      } catch {
        setAdminAllowed(firebaseUser.email === ADMIN_EMAIL);
      }
      setUser(firebaseUser);
      setAuthState('ready');
    });
    return unsubscribe;
  }, []);

  const openAuthModal = useCallback((onSuccess = null, view = 'login') => {
    setAuthModal({ open: true, view, onSuccess });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, open: false, onSuccess: null }));
  }, []);

  // Auto-open register popup when:
  //   - arriving via /register redirect (REGISTER_TRIGGER_KEY set in sessionStorage), or
  //   - URL contains ?action=register
  useEffect(() => {
    if (authState !== 'ready' || user) return;
    const trigger = sessionStorage.getItem(REGISTER_TRIGGER_KEY);
    const params = new URLSearchParams(location.search);
    const actionRegister = params.get('action') === 'register';
    if (!trigger && !actionRegister) return;
    if (trigger) sessionStorage.removeItem(REGISTER_TRIGGER_KEY);
    openAuthModal(null, 'register');
  }, [authState, location.pathname, location.search, openAuthModal]);

  // F04: слушаем статус в реальном времени — выходим немедленно при блокировке.
  // Не нужен для master admin (у него нет Firestore-документа).
  useEffect(() => {
    if (!user || user.email === ADMIN_EMAIL) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && snap.data().status === 'disabled') {
        signOut(auth);
      }
    });
    return unsub;
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
  }

  if (authState === 'loading') return <LoadingScreen />;

  const username = user ? (user.displayName || user.email) : null;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/register" element={<RegisterRedirect />} />
        <Route path="/" element={<Navigate to="/configurator" replace />} />
        <Route path="/login" element={<Navigate to="/configurator" replace />} />
        <Route
          path="/configurator"
          element={
            <ConfiguratorPage
              onLogout={handleLogout}
              username={username}
              isAdmin={adminAllowed}
              uid={user?.uid}
              user={user}
              openAuthModal={openAuthModal}
            />
          }
        />
        <Route element={<ProtectedRoute isAllowed={adminAllowed} redirectPath="/configurator" openAuthModal={openAuthModal} />}>
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
              user={user}
              onLogout={handleLogout}
              username={username}
              isAdmin={adminAllowed}
              onLogin={() => openAuthModal(null, 'login')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/configurator" replace />} />
      </Routes>

      <AuthModal
        open={authModal.open}
        view={authModal.view}
        onClose={closeAuthModal}
        onSuccess={authModal.onSuccess}
      />
    </ErrorBoundary>
  );
}
