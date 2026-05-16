import { useState } from 'react';
import { Toaster } from 'sonner';
import { LoginScreen } from './modules/Auth';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import './index.css';

export default function App() {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('promet_auth') === '1');

  if (!isAuth) return <LoginScreen onAuth={() => setIsAuth(true)} />;

  function handleLogout() {
    localStorage.removeItem('promet_auth');
    setIsAuth(false);
  }

  return (
    <>
      <ConfiguratorPage onLogout={handleLogout} />
      <Toaster position="bottom-right" richColors duration={4000} />
    </>
  );
}
