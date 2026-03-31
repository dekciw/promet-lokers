---
wave: 2
depends_on:
  - 01-PLAN-data-layer.md
files_modified:
  - src/App.jsx
  - src/components/Parameters/Parameters.jsx
autonomous: true
requirements:
  - CONF-01
  - CONF-02
  - CONF-04
---

# Plan 2: State Lift — App.jsx owns config, Parameters accepts props

## Goal
Lift all configuration state from Parameters.jsx into App.jsx, wire up calcPrice, and pass config + setters down to Parameters via props.

## must_haves
- `Parameters.jsx` contains zero `useState` calls
- `App.jsx` is the sole owner of all nine config state values: `seriesId`, `modelId`, `thickness`, `width`, `height`, `lockId`, `ventilation`, `bodyColor`, `doorColor`
- `calcPrice` is defined in `App.jsx` and computes price from `config` and `STUB_CATALOG`
- When `modelId` changes, `width` and `height` are auto-filled from `STUB_CATALOG.models[modelId].defaultSpecs`
- When `modelId` is cleared, `width` and `height` reset to `''`
- `price` is `null` when no model is selected

---

## Tasks

### Task 1: Rewrite App.jsx — state, calcPrice, handlers, prop passing

<read_first>
- src/App.jsx
- src/data/stubCatalog.js
- src/components/Parameters/Parameters.jsx
</read_first>

<action>
Replace `src/App.jsx` entirely with:

```jsx
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
```
</action>

<acceptance_criteria>
- `src/App.jsx` contains `import { STUB_CATALOG } from './data/stubCatalog'`
- `src/App.jsx` contains `function calcPrice(config, catalog)`
- `src/App.jsx` contains `const price = calcPrice(config, STUB_CATALOG)`
- `src/App.jsx` contains `const [seriesId, setSeriesId] = useState('')`
- `src/App.jsx` contains `const [modelId, setModelId] = useState('')`
- `src/App.jsx` contains `function handleModelChange(newModelId)`
- `src/App.jsx` contains `setWidth(String(specs.width))`
- `src/App.jsx` contains `setHeight(String(specs.height))`
- `src/App.jsx` contains `<Configurator config={config} price={price} catalog={STUB_CATALOG}`
- `src/App.jsx` contains `onModelChange={handleModelChange}`
</acceptance_criteria>

---

### Task 2: Rewrite Parameters.jsx — props-only, no internal useState

<read_first>
- src/components/Parameters/Parameters.jsx
- src/components/ColorPicker/ColorPicker.jsx
- src/App.jsx
</read_first>

<action>
Replace `src/components/Parameters/Parameters.jsx` entirely with:

```jsx
import ColorPicker from '../ColorPicker/ColorPicker';
import './Parameters.css';

const THICKNESS_OPTIONS = ['0.5', '0.6', '0.7'];

export default function Parameters({
  config,
  catalog,
  setSeriesId,
  onModelChange,
  setThickness,
  setWidth,
  setHeight,
  setLockId,
  setVentilation,
  setBodyColor,
  setDoorColor,
}) {
  const { seriesId, modelId, thickness, width, height, lockId, ventilation, bodyColor, doorColor } =
    config;

  const modelEntries = Object.entries(catalog.models).filter(
    ([, m]) => !seriesId || m.seriesId === seriesId
  );

  const lockEntries = Object.entries(catalog.locks);

  return (
    <aside className='parameters'>
      <h2 className='title'>Параметры</h2>

      <div className='param-group'>
        <label className='group-label' htmlFor='series'>
          Серия шкафа
        </label>
        <div className='select-wrap'>
          <select
            className='select'
            id='series'
            value={seriesId}
            onChange={e => setSeriesId(e.target.value)}
          >
            <option value=''>Выберите серию</option>
            {catalog.series.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <img className='arrow' src='/img/arrow-down.svg' alt='' />
        </div>
      </div>

      <div className='param-group'>
        <label className='group-label' htmlFor='model'>
          Модель шкафа
        </label>
        <div className='select-wrap'>
          <select
            className='select'
            id='model'
            value={modelId}
            onChange={e => onModelChange(e.target.value)}
          >
            <option value=''>Выберите модель шкафа</option>
            {modelEntries.map(([id, m]) => (
              <option key={id} value={id}>
                {m.name}
              </option>
            ))}
          </select>
          <img className='arrow' src='/img/arrow-down.svg' alt='' />
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение толщины металла (мм)</span>
        <div className='toggle-group'>
          {THICKNESS_OPTIONS.map(t => (
            <button
              key={t}
              className={`toggle-btn${thickness === t ? ' toggle-btn--active' : ''}`}
              onClick={() => setThickness(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение габаритов</span>
        <div className='dim-fields'>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='width'>
              Ширина (мм)
            </label>
            <input
              className='group-input'
              type='number'
              id='width'
              value={width}
              onChange={e => setWidth(e.target.value)}
            />
          </div>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='height'>
              Высота (мм)
            </label>
            <input
              className='group-input'
              type='number'
              id='height'
              value={height}
              onChange={e => setHeight(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Выбор замка</span>
        <ul className='lock-list'>
          {lockEntries.map(([id, lock]) => (
            <li key={id}>
              <button
                className={`lock-item${lockId === id ? ' lock-item--active' : ''}`}
                onClick={() => setLockId(id)}
              >
                <span className='lock-name'>{lock.name}</span>
                {lock.surcharge > 0 && (
                  <span className='lock-price'>+{lock.surcharge.toLocaleString('ru-RU')} ₽</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className='param-group'>
        <span className='group-label'>Дополнительная вентиляция шкафа</span>
        <div className='vent-toggle'>
          <button
            className={`vent-btn${ventilation ? ' vent-btn--active' : ''}`}
            onClick={() => setVentilation(true)}
          >
            Да
          </button>
          <button
            className={`vent-btn${!ventilation ? ' vent-btn--active' : ''}`}
            onClick={() => setVentilation(false)}
          >
            Нет
          </button>
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение цвета корпуса</span>
        <ColorPicker
          placeholder='Выберите цвет корпуса'
          selected={bodyColor}
          onSelect={setBodyColor}
        />
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение цвета двери</span>
        <ColorPicker
          placeholder='Выберите цвет двери'
          selected={doorColor}
          onSelect={setDoorColor}
        />
      </div>
    </aside>
  );
}
```

Remove old `SERIES_OPTIONS`, `MODEL_OPTIONS`, `LOCK_OPTIONS` constants and all `useState` / `useRef` / `useEffect` imports.
</action>

<acceptance_criteria>
- `src/components/Parameters/Parameters.jsx` does NOT contain `useState`
- `src/components/Parameters/Parameters.jsx` does NOT contain `SERIES_OPTIONS`
- `src/components/Parameters/Parameters.jsx` does NOT contain `MODEL_OPTIONS`
- `src/components/Parameters/Parameters.jsx` does NOT contain `LOCK_OPTIONS`
- `src/components/Parameters/Parameters.jsx` contains `export default function Parameters({`
- `src/components/Parameters/Parameters.jsx` contains `config,` in the destructured props
- `src/components/Parameters/Parameters.jsx` contains `catalog,` in the destructured props
- `src/components/Parameters/Parameters.jsx` contains `onModelChange(e.target.value)`
- `src/components/Parameters/Parameters.jsx` contains `catalog.series.map`
- `src/components/Parameters/Parameters.jsx` contains `Object.entries(catalog.models)`
- `src/components/Parameters/Parameters.jsx` contains `Object.entries(catalog.locks)`
</acceptance_criteria>

---

## Verification

1. `npm run dev` — app loads without errors
2. Select "Серия «ML»" — model dropdown shows only ML models
3. Select "Шкаф металлический усиленный" — width auto-fills to `400`, height to `1850`
4. Select different model — fields update to that model's defaultSpecs
5. Clear model — width and height reset to empty
6. `npm run lint` — zero warnings in App.jsx and Parameters.jsx
