import { useState, useRef, useCallback } from 'react';
import ColorPicker from '../ColorPicker/ColorPicker';
import { useClickOutside } from '../../hooks/useClickOutside';
import { clamp } from '../../utils/clamp';
import './Parameters.css';

const HEIGHT_MIN = 1400;
const HEIGHT_MAX = 1900;
const DEPTH_MIN = 300;
const WIDTH_RANGE = 50;
const LIMIT_HINT_DURATION = 1500;
const EXTRA_THICKNESS = ['0.5', '0.6', '0.7'];

function CustomSelect({ id, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeDropdown = useCallback(() => setOpen(false), []);
  useClickOutside(ref, closeDropdown);

  const selected = options.find(o => o.value === value);

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div className={`cselect${open ? ' cselect--open' : ''}`} ref={ref}>
      <button
        type='button'
        id={id}
        className='cselect-trigger'
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        aria-expanded={open}
      >
        <span className={`cselect-text${!selected ? ' cselect-text--placeholder' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <img className='cselect-arrow' src='/img/arrow-down.svg' alt='' />
      </button>

      {open && (
        <ul className='cselect-dropdown'>
          {options.map(o => (
            <li
              key={o.value}
              className={`cselect-item${o.value === value ? ' cselect-item--active' : ''}`}
              onClick={() => handleSelect(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepperInput({ id, value, min, max, step = 50, onChange }) {
  const [limitSide, setLimitSide] = useState(null);
  const timerRef = useRef(null);

  function triggerLimit(side) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLimitSide(side);
    timerRef.current = setTimeout(() => setLimitSide(null), LIMIT_HINT_DURATION);
  }

  function handleStep(dir) {
    const current = Number(value);
    if (dir < 0 && current <= min) { triggerLimit('min'); return; }
    if (dir > 0 && current >= max) { triggerLimit('max'); return; }
    onChange(String(clamp(current + dir * step, min, max)));
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
            if (!isNaN(val)) onChange(String(clamp(val, min, max)));
          }}
        />
        <button className='stepper-btn' type='button' onClick={() => handleStep(1)}>+</button>
      </div>
      {hintText && <span className='stepper-hint'>{hintText}</span>}
    </div>
  );
}

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

  const lockEntries = Object.entries(catalog.locks).sort((a, b) => a[1].surcharge - b[1].surcharge);

  const currentModel = modelId ? catalog.models[modelId] : null;
  const bodyThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.bodyThickness);
  const doorThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.doorThickness);

  const defaultWidth = currentModel?.defaultSpecs?.width ?? null;
  const minWidth = defaultWidth !== null ? defaultWidth - WIDTH_RANGE : undefined;
  const maxWidth = defaultWidth !== null ? defaultWidth + WIDTH_RANGE : undefined;

  const defaultDepth = currentModel?.defaultSpecs?.depth ?? null;
  const minDepth = defaultDepth !== null ? DEPTH_MIN : undefined;
  const maxDepth = defaultDepth !== null ? defaultDepth : undefined;

  return (
    <aside className='parameters'>
      <h2 className='title'>Параметры</h2>

      <div className='param-group'>
        <label className='group-label' htmlFor='series'>Серия шкафа</label>
        <CustomSelect
          id='series'
          value={seriesId}
          onChange={setSeriesId}
          placeholder='Выберите серию'
          options={catalog.series.map(s => ({ value: s.id, label: s.name }))}
        />
      </div>

      <div className='param-group'>
        <label className='group-label' htmlFor='model'>Модель шкафа</label>
        <CustomSelect
          id='model'
          value={modelId}
          onChange={onModelChange}
          placeholder='Выберите модель'
          options={modelEntries.map(([id, m]) => ({ value: id, label: m.name }))}
        />
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение габаритов</span>
        <div className='dim-fields'>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='width'>Ширина (мм)</label>
            <StepperInput id='width' value={width} min={minWidth} max={maxWidth} onChange={setWidth} />
          </div>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='height'>Высота (мм)</label>
            <StepperInput id='height' value={height} min={HEIGHT_MIN} max={HEIGHT_MAX} onChange={setHeight} />
          </div>
          <div className='param-group'>
            <label className='group-label group-label--sm' htmlFor='depth'>Глубина (мм)</label>
            <StepperInput id='depth' value={depth} min={minDepth} max={maxDepth} onChange={setDepth} />
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
        <ColorPicker placeholder='Стандартный цвет' selected={bodyColor} onSelect={setBodyColor} />
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение цвета двери</span>
        <ColorPicker placeholder='Стандартный цвет' selected={doorColor} onSelect={setDoorColor} />
      </div>
    </aside>
  );
}
