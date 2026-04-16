import { MotionConfig } from 'motion/react';
import Header from '../../shared/components/Header/Header';
import Footer from '../../shared/components/Footer/Footer';
import CatalogSkeleton from '../../shared/components/CatalogSkeleton/CatalogSkeleton';
import { Configurator } from '../../modules/Configurator';
import { Parameters } from '../../modules/Parameters';
import { AppProvider } from '../../shared/context/AppContext';
import { useCatalog } from '../../shared/hooks/useCatalog';
import { useConfig } from '../../shared/hooks/useConfig';
import { calcPrice } from '../../shared/utils/calcPrice';

export default function ConfiguratorPage() {
  const { catalog, catalogError, retry } = useCatalog();
  const { config, setters, isResetting, resetKey } = useConfig(catalog);

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
    <MotionConfig reducedMotion="user">
      <AppProvider value={ctx}>
        <Header />
        <div className='layout'>
          <Configurator />
          <Parameters />
        </div>
        <Footer />
      </AppProvider>
    </MotionConfig>
  );
}
