import { useState } from 'react';
import Header from './components/Header/Header';
import Configurator from './components/Configurator/Configurator';
import Parameters from './components/Parameters/Parameters';
import Footer from './components/Footer/Footer';
import LoginScreen from './components/LoginScreen/LoginScreen';
import { useCatalog } from './hooks/useCatalog';
import { useConfig } from './hooks/useConfig';
import { calcPrice } from './utils/calcPrice';
import CatalogSkeleton from './components/CatalogSkeleton/CatalogSkeleton';
import { AppProvider } from './context/AppContext';
import './index.css';

export default function App() {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('promet_auth') === '1');
  const { catalog, catalogError, retry } = useCatalog();
  const { config, setters, isResetting, resetKey } = useConfig(catalog);

  if (!isAuth) {
    return <LoginScreen onAuth={() => setIsAuth(true)} />;
  }

  if (catalogError) {
    return (
      <div className='app-status'>
        <p>Не удалось загрузить каталог. Проверьте подключение к интернету.</p>
        <button className='app-status__retry' onClick={retry}>
          Повторить
        </button>
      </div>
    );
  }

  if (!catalog) {
    return (
      <>
        <Header />
        <CatalogSkeleton />
      </>
    );
  }

  const price = calcPrice(config, catalog);
  const ctx = { config, setters, catalog, price, isResetting, resetKey };

  return (
    <AppProvider value={ctx}>
      <Header />
      <div className='layout'>
        <Configurator />
        <Parameters />
      </div>
      <Footer />
    </AppProvider>
  );
}
