import { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Configurator from './components/Configurator/Configurator';
import Parameters from './components/Parameters/Parameters';
import Footer from './components/Footer/Footer';
import { loadCatalog } from './api/loadCatalog';
import './index.css';

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
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(false);

  const [seriesId, setSeriesId] = useState('');
  const [modelId, setModelId] = useState('');
  const [thickness, setThickness] = useState('0.5');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [bodyThickness, setBodyThickness] = useState('0.5');
  const [doorThickness, setDoorThickness] = useState('0.5');
  const [lockId, setLockId] = useState('key_basic');
  const [ventilation, setVentilation] = useState(false);
  const [bodyColor, setBodyColor] = useState(null);
  const [doorColor, setDoorColor] = useState(null);

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch(() => setCatalogError(true));
  }, []);

  function handleModelChange(newModelId) {
    setModelId(newModelId);
    if (newModelId && catalog?.models[newModelId]) {
      const specs = catalog.models[newModelId].defaultSpecs;
      setWidth(String(specs.width));
      setHeight(String(specs.height));
      setDepth(String(specs.depth));
      setThickness(specs.thickness);
      setBodyThickness(specs.bodyThickness);
      setDoorThickness(specs.doorThickness);
    } else {
      setWidth('');
      setHeight('');
      setDepth('');
      setThickness('0.5');
      setBodyThickness('0.5');
      setDoorThickness('0.5');
    }
  }

  if (catalogError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#0C53B3' }}>
        Не удалось загрузить каталог. Проверьте подключение к интернету.
      </div>
    );
  }

  if (!catalog) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#0C53B3' }}>
        Загрузка каталога...
      </div>
    );
  }

  const config = {
    seriesId,
    modelId,
    thickness,
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
          setThickness={setThickness}
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
