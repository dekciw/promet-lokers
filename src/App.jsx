import { useState } from 'react';
import Header from './components/Header/Header';
import Configurator from './components/Configurator/Configurator';
import Parameters from './components/Parameters/Parameters';
import Footer from './components/Footer/Footer';
import { STUB_CATALOG } from './data/stubCatalog';
import './index.css';

function calcPrice(config, catalog) {
  const model = catalog.models[config.modelId];
  if (!model) return null;

  const thicknessSurcharge =
    config.thickness !== '0.5'
      ? (catalog.thicknessSurcharges[config.thickness] ?? 0)
      : 0;
  const lockSurcharge = catalog.locks[config.lockId]?.surcharge ?? 0;
  const ventSurcharge = config.ventilation ? catalog.ventSurcharge : 0;
  const bodyColorSurcharge = config.bodyColor?.surcharge ?? 0;
  const doorColorSurcharge = config.doorColor?.surcharge ?? 0;

  return (
    model.basePrice +
    thicknessSurcharge +
    lockSurcharge +
    ventSurcharge +
    bodyColorSurcharge +
    doorColorSurcharge
  );
}

export default function App() {
  const [seriesId, setSeriesId] = useState('');
  const [modelId, setModelId] = useState('');
  const [thickness, setThickness] = useState('0.5');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lockId, setLockId] = useState('key_basic');
  const [ventilation, setVentilation] = useState(false);
  const [bodyColor, setBodyColor] = useState(null);
  const [doorColor, setDoorColor] = useState(null);

  function handleModelChange(newModelId) {
    setModelId(newModelId);
    if (newModelId && STUB_CATALOG.models[newModelId]) {
      const specs = STUB_CATALOG.models[newModelId].defaultSpecs;
      setWidth(String(specs.width));
      setHeight(String(specs.height));
    } else {
      setWidth('');
      setHeight('');
    }
  }

  const config = {
    seriesId,
    modelId,
    thickness,
    width,
    height,
    lockId,
    ventilation,
    bodyColor,
    doorColor,
  };

  const price = calcPrice(config, STUB_CATALOG);

  return (
    <>
      <Header />
      <div className='layout'>
        <Configurator config={config} price={price} catalog={STUB_CATALOG} />
        <Parameters
          config={config}
          catalog={STUB_CATALOG}
          setSeriesId={setSeriesId}
          onModelChange={handleModelChange}
          setThickness={setThickness}
          setWidth={setWidth}
          setHeight={setHeight}
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
