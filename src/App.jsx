import { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Configurator from './components/Configurator/Configurator';
import Parameters from './components/Parameters/Parameters';
import Footer from './components/Footer/Footer';
import LoginScreen from './components/LoginScreen/LoginScreen';
import { loadCatalog } from './api/loadCatalog';
import './index.css';

const DEFAULT_THICKNESS = '0.5';

function calcPrice(config, catalog) {
  const model = catalog.models[config.modelId];
  if (!model) return null;

  const lockSurcharge = catalog.locks[config.lockId]?.surcharge ?? 0;
  const ventSurcharge = config.ventilation ? catalog.ventSurcharge : 0;
  const bodyColorSurcharge = config.bodyColor?.surcharge ?? 0;
  const doorColorSurcharge = config.doorColor?.surcharge ?? 0;

  return (
    model.basePrice +
    lockSurcharge +
    ventSurcharge +
    bodyColorSurcharge +
    doorColorSurcharge
  );
}

export default function App() {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('promet_auth') === '1');

  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [seriesId, setSeriesId] = useState('');
  const [modelId, setModelId] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [bodyThickness, setBodyThickness] = useState(DEFAULT_THICKNESS);
  const [doorThickness, setDoorThickness] = useState(DEFAULT_THICKNESS);
  const [lockId, setLockId] = useState('key_basic');
  const [ventilation, setVentilation] = useState(false);
  const [bodyColor, setBodyColor] = useState(null);
  const [doorColor, setDoorColor] = useState(null);

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch(() => setCatalogError(true));
  }, [retryKey]);

  function handleModelChange(newModelId) {
    setModelId(newModelId);
    if (newModelId && catalog?.models[newModelId]) {
      const specs = catalog.models[newModelId].defaultSpecs;
      setWidth(String(specs.width));
      setHeight(String(specs.height));
      setDepth(String(specs.depth));
      setBodyThickness(specs.bodyThickness);
      setDoorThickness(specs.doorThickness);
    } else {
      setWidth('');
      setHeight('');
      setDepth('');
      setBodyThickness(DEFAULT_THICKNESS);
      setDoorThickness(DEFAULT_THICKNESS);
    }
  }

  if (!isAuth) {
    return <LoginScreen onAuth={() => setIsAuth(true)} />;
  }

  if (catalogError) {
    return (
      <div className='app-status'>
        <p>Не удалось загрузить каталог. Проверьте подключение к интернету.</p>
        <button
          className='app-status__retry'
          onClick={() => { setCatalogError(false); setRetryKey(k => k + 1); }}
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className='app-status'>
        Загрузка каталога...
      </div>
    );
  }

  const config = {
    seriesId,
    modelId,
    width,
    height,
    depth,
    bodyThickness,
    doorThickness,
    lockId,
    ventilation,
    bodyColor,
    doorColor,
  };

  const price = calcPrice(config, catalog);

  return (
    <>
      <Header />
      <div className='layout'>
        <Configurator config={config} price={price} catalog={catalog} />
        <Parameters
          config={config}
          catalog={catalog}
          setSeriesId={setSeriesId}
          onModelChange={handleModelChange}
          setWidth={setWidth}
          setHeight={setHeight}
          setDepth={setDepth}
          setBodyThickness={setBodyThickness}
          setDoorThickness={setDoorThickness}
          setLockId={setLockId}
          setVentilation={setVentilation}
          setBodyColor={setBodyColor}
          setDoorColor={setDoorColor}
        />
      </div>
      <Footer />
    </>
  );
}
