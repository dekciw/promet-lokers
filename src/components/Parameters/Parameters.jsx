import { useState, useRef } from 'react';
import ColorPicker from '../ColorPicker/ColorPicker';
import './Parameters.css';

function StepperInput({ id, value, min, max, step = 50, onChange }) {
  const [limitSide, setLimitSide] = useState(null);
  const timerRef = useRef(null);

  function triggerLimit(side) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLimitSide(side);
    timerRef.current = setTimeout(() => setLimitSide(null), 1500);
  }

  function handleStep(dir) {
    const current = Number(value);
    if (dir < 0 && current <= min) { triggerLimit('min'); return; }
    if (dir > 0 && current >= max) { triggerLimit('max'); return; }
    onChange(String(Math.min(Math.max(current + dir * step, min), max)));
  }

  const hintText =
    limitSide === 'min' ? 'Минимальное значение' :
    limitSide === 'max' ? 'Максимальное значение' : null;

  return (
    <div className={`stepper${limitSide ? ' stepper--limit' : ''}`}>
      <div className='stepper-row'>
        <button className='stepper-btn' type='button' onClick={() => handleStep(-1)}>−</button>
        <input
          className='stepper-field'
          type='number'
          id={id}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(e.target.value)}
          onBlur={e => {
            if (min == null || max == null) return;
            const val = Number(e.target.value);
            if (!isNaN(val)) onChange(String(Math.min(Math.max(val, min), max)));
          }}
        />
        <button className='stepper-btn' type='button' onClick={() => handleStep(1)}>+</button>
      </div>
      {hintText && <span className='stepper-hint'>{hintText}</span>}
    </div>
  );
}

const EXTRA_THICKNESS = ['0.5', '0.6', '0.7'];

function buildThicknessOptions(baseVal) {
  if (!baseVal || EXTRA_THICKNESS.includes(baseVal)) return EXTRA_THICKNESS;
  return [baseVal, ...EXTRA_THICKNESS];
}

export default function Parameters({
  config,
  catalog,
  setSeriesId,
  onModelChange,
  setWidth,
  setHeight,
  setDepth,
  setBodyThickness,
  setDoorThickness,
  setLockId,
  setVentilation,
  setBodyColor,
  setDoorColor,
}) {
  const { seriesId, modelId, width, height, depth, bodyThickness, doorThickness, lockId, ventilation, bodyColor, doorColor } =
    config;

  const modelEntries = Object.entries(catalog.models).filter(
    ([, m]) => !seriesId || m.seriesId === seriesId
  );

  const lockEntries = Object.entries(catalog.locks);

  const currentModel = modelId ? catalog.models[modelId] : null;
  const bodyThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.bodyThickness);
  const doorThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.doorThickness);

  const defaultWidth = currentModel?.defaultSpecs?.width ?? null;
  const minWidth = defaultWidth !== null ? defaultWidth - 50 : undefined;
  const maxWidth = defaultWidth !== null ? defaultWidth + 50 : undefined;

  const defaultDepth = currentModel?.defaultSpecs?.depth ?? null;
  const minDepth = defaultDepth !== null ? 300 : undefined;
  const maxDepth = defaultDepth !== null ? defaultDepth : undefined;

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
            <option value='' disabled hidden>Выберите серию</option>
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
            <option value='' disabled hidden>Выберите модель шкафа</option>
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
        <span className='group-label'>Изменение габаритов</span>
        <div className='dim-fields'>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='width'>
              Ширина (мм)
            </label>
            <StepperInput
              id='width'
              value={width}
              min={minWidth}
              max={maxWidth}
              onChange={setWidth}
            />
          </div>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='height'>
              Высота (мм)
            </label>
            <StepperInput
              id='height'
              value={height}
              min={1400}
              max={1900}
              onChange={setHeight}
            />
          </div>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='depth'>
              Глубина (мм)
            </label>
            <StepperInput
              id='depth'
              value={depth}
              min={minDepth}
              max={maxDepth}
              onChange={setDepth}
            />
          </div>
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Толщина металла корпуса (мм)</span>
        <div className='toggle-group'>
          {bodyThicknessOptions.map(t => (
            <button
              key={t}
              className={`toggle-btn${bodyThickness === t ? ' toggle-btn--active' : ''}`}
              onClick={() => setBodyThickness(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className='param-group'>
        <span className='group-label'>Толщина металла двери (мм)</span>
        <div className='toggle-group'>
          {doorThicknessOptions.map(t => (
            <button
              key={t}
              className={`toggle-btn${doorThickness === t ? ' toggle-btn--active' : ''}`}
              onClick={() => setDoorThickness(t)}
            >
              {t}
            </button>
          ))}
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
          placeholder='Стандартный цвет'
          selected={bodyColor}
          onSelect={setBodyColor}
        />
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение цвета двери</span>
        <ColorPicker
          placeholder='Стандартный цвет'
          selected={doorColor}
          onSelect={setDoorColor}
        />
      </div>
    </aside>
  );
}
