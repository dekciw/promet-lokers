import { useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import Header from '../../shared/components/Header/Header';
import Footer from '../../shared/components/Footer/Footer';
import LoadingScreen from '../../shared/components/LoadingScreen/LoadingScreen';
import { Configurator } from '../../modules/Configurator';
import { Parameters } from '../../modules/Parameters';
import { AppProvider } from '../../shared/context/AppContext';
import { useCatalog } from '../../shared/hooks/useCatalog';
import { useConfig } from '../../shared/hooks/useConfig';
import { calcPrice } from '../../shared/utils/calcPrice';

export default function ConfiguratorPage({ onLogout, username }) {
  const { catalog, catalogError, retry } = useCatalog();
  const { config, setters, isResetting, resetKey } = useConfig(catalog);
  const [parametersUnlocked, setParametersUnlocked] = useState(false);

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

  const price = catalog ? calcPrice(config, catalog) : null;
  const ctx = catalog
    ? { config, setters, catalog, price, isResetting, resetKey, parametersUnlocked, setParametersUnlocked }
    : null;

  return (
    <MotionConfig reducedMotion='user'>
      <AnimatePresence mode='wait'>
        {!catalog ? (
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
              <Header onLogout={onLogout} username={username} />
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
                <Footer />
              </div>
            </AppProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
