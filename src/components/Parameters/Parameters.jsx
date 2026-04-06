import { useState, useRef, useCallback } from 'react';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import { useClickOutside } from '../../hooks/useClickOutside';
import { clamp } from '../../utils/clamp';
import styles from './Parameters.module.css';

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
    <div className={`${styles.cselect}${open ? ` ${styles.cselectOpen}` : ''}`} ref={ref}>
      <button
        type='button'
        id={id}
        className={styles.cselectTrigger}
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        aria-expanded={open}
      >
        <span className={`${styles.cselectText}${!selected ? ` ${styles.cselectTextPlaceholder}` : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <img className={styles.cselectArrow} src='/img/arrow-down.svg' alt='' />
      </button>

      {open && (
        <ul className={styles.cselectDropdown}>
          {options.map(o => (
            <li
              key={o.value}
              className={`${styles.cselectItem}${o.value === value ? ` ${styles.cselectItemActive}` : ''}`}
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
    <div className={`${styles.stepper}${limitSide ? ` ${styles.stepperLimit}` : ''}`}>
      <div className={styles.stepperRow}>
        <button className={styles.stepperBtn} type='button' onClick={() => handleStep(-1)}>−</button>
        <input
          className={styles.stepperField}
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
        <button className={styles.stepperBtn} type='button' onClick={() => handleStep(1)}>+</button>
      </div>
      {hintText && <span className={styles.stepperHint}>{hintText}</span>}
    </div>
  );
}

function buildThicknessOptions(baseVal) {
  if (!baseVal || EXTRA_THICKNESS.includes(baseVal)) return EXTRA_THICKNESS;
  return [baseVal, ...EXTRA_THICKNESS];
}

export function Parameters({
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
    <aside className={styles.parameters}>
      <h2 className={styles.title}>Параметры</h2>

      <div className={styles.paramGroup}>
        <label className={styles.groupLabel} htmlFor='series'>Серия шкафа</label>
        <CustomSelect
          id='series'
          value={seriesId}
          onChange={setSeriesId}
          placeholder='Выберите серию'
          options={catalog.series.map(s => ({ value: s.id, label: s.name }))}
        />
      </div>

      <div className={styles.paramGroup}>
        <label className={styles.groupLabel} htmlFor='model'>Модель шкафа</label>
        <CustomSelect
          id='model'
          value={modelId}
          onChange={onModelChange}
          placeholder='Выберите модель'
          options={modelEntries.map(([id, m]) => ({ value: id, label: m.name }))}
        />
      </div>

      <div className={styles.paramGroup}>
        <span className={styles.groupLabel}>Изменение габаритов</span>
        <div className={styles.dimFields}>
          <div className={styles.paramGroup}>
            <label className={`${styles.groupLabel} ${styles.groupLabelSm}`} htmlFor='width'>Ширина (мм)</label>
            <StepperInput id='width' value={width} min={minWidth} max={maxWidth} onChange={setWidth} />
          </div>
          <div className={styles.paramGroup}>
            <label className={`${styles.groupLabel} ${styles.groupLabelSm}`} htmlFor='height'>Высота (мм)</label>
            <StepperInput id='height' value={height} min={HEIGHT_MIN} max={HEIGHT_MAX} onChange={setHeight} />
          </div>
          <div className={styles.paramGroup}>
            <label className={`${styles.groupLabel} ${styles.groupLabelSm}`} htmlFor='depth'>Глубина (мм)</label>
            <StepperInput id='depth' value={depth} min={minDepth} max={maxDepth} onChange={setDepth} />
          </div>
        </div>
      </div>

      <div className={styles.paramGroup}>
        <span className={styles.groupLabel}>Толщина металла корпуса (мм)</span>
        <div className={styles.toggleGroup}>
          {bodyThicknessOptions.map(t => (
            <button
              key={t}
              className={`${styles.toggleBtn}${bodyThickness === t ? ` ${styles.toggleBtnActive}` : ''}`}
              onClick={() => setBodyThickness(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.paramGroup}>
        <span className={styles.groupLabel}>Толщина металла двери (мм)</span>
        <div className={styles.toggleGroup}>
          {doorThicknessOptions.map(t => (
            <button
              key={t}
              className={`${styles.toggleBtn}${doorThickness === t ? ` ${styles.toggleBtnActive}` : ''}`}
              onClick={() => setDoorThickness(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.paramGroup}>
        <span className={styles.groupLabel}>Выбор замка</span>
        <ul className={styles.lockList}>
          {lockEntries.map(([id, lock]) => (
            <li key={id}>
              <button
                className={`${styles.lockItem}${lockId === id ? ` ${styles.lockItemActive}` : ''}`}
                onClick={() => setLockId(id)}
              >
                <span className={styles.lockName}>{lock.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.paramGroup}>
        <span className={styles.groupLabel}>Дополнительная вентиляция шкафа</span>
        <div className={styles.ventToggle}>
          <button
            className={`${styles.ventBtn}${ventilation ? ` ${styles.ventBtnActive}` : ''}`}
            onClick={() => setVentilation(true)}
          >
            Да
          </button>
          <button
            className={`${styles.ventBtn}${!ventilation ? ` ${styles.ventBtnActive}` : ''}`}
            onClick={() => setVentilation(false)}
          >
            Нет
          </button>
        </div>
      </div>

      <div className={styles.paramGroup}>
        <span className={styles.groupLabel}>Изменение цвета корпуса</span>
        <ColorPicker placeholder='Стандартный цвет' selected={bodyColor} onSelect={setBodyColor} />
      </div>

      <div className={styles.paramGroup}>
        <span className={styles.groupLabel}>Изменение цвета двери</span>
        <ColorPicker placeholder='Стандартный цвет' selected={doorColor} onSelect={setDoorColor} />
      </div>
    </aside>
  );
}
