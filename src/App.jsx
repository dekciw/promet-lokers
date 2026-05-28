import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams, useLocation } from 'react-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './shared/lib/firebase';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import AdminPage from './pages/AdminPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './shared/components/ProtectedRoute/ProtectedRoute';
import ErrorBoundary from './shared/components/ErrorBoundary/ErrorBoundary';
import LoadingScreen from './shared/components/LoadingScreen/LoadingScreen';
import AuthModal from './shared/components/AuthModal/AuthModal';
import './index.css';

const MASTER_ADMIN_EMAIL = 'admin@promet.ru';
const INVITE_CODE_KEY = 'promet_invite_code';
const REGISTER_TRIGGER_KEY = 'promet_open_register';

// Stashes the invite code from ?code= into sessionStorage, sets a trigger flag, then redirects to /
function RegisterRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      sessionStorage.setItem(INVITE_CODE_KEY, code);
      sessionStorage.setItem(REGISTER_TRIGGER_KEY, '1');
    }
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
        setAdminAllowed(role === 'admin' || firebaseUser.email === MASTER_ADMIN_EMAIL);
      } catch {
        setAdminAllowed(firebaseUser.email === MASTER_ADMIN_EMAIL);
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

  // Auto-open register popup when arriving via invite link (/register?code=XXX)
  useEffect(() => {
    if (authState !== 'ready' || user) return;
    const trigger = sessionStorage.getItem(REGISTER_TRIGGER_KEY);
    if (!trigger) return;
    sessionStorage.removeItem(REGISTER_TRIGGER_KEY);
    openAuthModal(null, 'register');
  }, [authState, location.pathname, openAuthModal]);

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
