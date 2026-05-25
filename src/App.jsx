import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './shared/lib/firebase';
import { LoginScreen } from './modules/Auth';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
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

  return (
    <ErrorBoundary>
      <ConfiguratorPage onLogout={handleLogout} username={username} />
    </ErrorBoundary>
  );
}
