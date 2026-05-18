import { useState } from 'react';
import { LoginScreen } from './modules/Auth';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import './index.css';

export default function App() {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('promet_auth') === '1');
  const [username, setUsername] = useState(() => localStorage.getItem('promet_user') ?? '');

  if (!isAuth) return <LoginScreen onAuth={login => { setUsername(login); setIsAuth(true); }} />;

  function handleLogout() {
    localStorage.removeItem('promet_auth');
    localStorage.removeItem('promet_user');
    setIsAuth(false);
    setUsername('');
  }

  return <ConfiguratorPage onLogout={handleLogout} username={username} />;
}
