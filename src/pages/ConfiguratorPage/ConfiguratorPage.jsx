import { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import Header from '../../shared/components/Header/Header';
import LoadingScreen from '../../shared/components/LoadingScreen/LoadingScreen';
import { Configurator } from '../../modules/Configurator';
import { Parameters } from '../../modules/Parameters';
import { AppProvider } from '../../shared/context/AppContext';
import { useCatalog } from '../../shared/hooks/useCatalog';
import { useConfig } from '../../shared/hooks/useConfig';
import { useHistory } from '../../shared/hooks/useHistory';
import { calcPrice } from '../../shared/utils/calcPrice';

const RESTORE_KEY = 'promet_restore_snapshot_v1';

export default function ConfiguratorPage({ onLogout, username, isAdmin, uid, user, openAuthModal }) {
  const { catalog, catalogError, isLoading, retry } = useCatalog();
  const { config, setters, isResetting, resetKey } = useConfig(catalog);
  const [parametersUnlocked, setParametersUnlocked] = useState(false);
  const { restoreConfig } = useHistory(uid);

  // HIST-03: apply restore snapshot from sessionStorage (set by HistoryPage on "Восстановить")
  useEffect(() => {
    if (!catalog) return;
    const raw = sessionStorage.getItem(RESTORE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(RESTORE_KEY);
    try {
      restoreConfig(JSON.parse(raw), setters);
    } catch (err) {
      console.warn('[restore] failed to parse snapshot:', err.message);
    }
  }, [catalog]); // eslint-disable-line react-hooks/exhaustive-deps

  if (catalogError) {
    return (
      <div className='app-status'>
        <p>Не удалось загрузить каталог. Проверьте подключение к интернету.</p>
        <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{catalogError}</p>
        <button className='app-status__retry' onClick={retry} disabled={isLoading}>
          {isLoading ? 'Загрузка…' : 'Повторить'}
        </button>
      </div>
    );
  }

  const price = catalog ? calcPrice(config, catalog) : null;
  const ctx = catalog
    ? { config, setters, catalog, price, isResetting, resetKey, parametersUnlocked, setParametersUnlocked, uid, user, openAuthModal }
    : null;

  return (
    <MotionConfig reducedMotion='user'>
      <AnimatePresence mode='wait'>
        {isLoading ? (
          <LoadingScreen key='loading' />
        ) : (
          <motion.div
            key='app'
            className='app-wrapper'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <AppProvider value={ctx}>
              <Header onLogout={onLogout} username={username} isAdmin={isAdmin} user={user} onLogin={() => openAuthModal(null, 'login')} />
              <div className='main-scroll'>
                <motion.div
                  className='layout'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
                >
                  <Configurator />
                  <Parameters />
                </motion.div>
              </div>
            </AppProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
