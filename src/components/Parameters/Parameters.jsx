import { useState, useRef, useCallback, useEffect } from 'react';
import ColorPicker from '../ColorPicker/ColorPicker';
import { useClickOutside } from '../../hooks/useClickOutside';
import { clamp } from '../../utils/clamp';
import { useAppContext } from '../../context/AppContext';
import styles from './Parameters.module.css';

const HEIGHT_MIN = 1400;
const HEIGHT_MAX = 1900;
const DEPTH_MIN = 300;
const WIDTH_RANGE = 50;
const LIMIT_HINT_DURATION = 1500;
const EXTRA_THICKNESS = ['0.5', '0.6', '0.7'];

// ── Slot counter ──────────────────────────────────────────────
const SLOT_SETS = 3;   // 30 цифр в колонке (0-9 повторяется 3 раза)
const SLOT_HIGH = 22;  // сброс когда позиция >= 22
const SLOT_LOW  = 8;   // сброс когда позиция < 8
const DIGIT_H   = 20;  // высота одной ячейки в px

function SlotDigit({ digit, direction }) {
  const posRef  = useRef(10 + digit); // стартуем в средней группе
  const prevRef = useRef(digit);
  const [pos, setPos]       = useState(10 + digit);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (prevRef.current === digit) return;
    const prev = prevRef.current;
    prevRef.current = digit;

    const delta = direction === 'up'
      ? (digit >= prev ? digit - prev : 10 - prev + digit)       // вперёд / через 9→0
      : (digit <= prev ? digit - prev : -(prev + 10 - digit));   // назад  / через 0→9

    const cur  = posRef.current;
    const next = cur + delta;

    if (next >= SLOT_HIGH || next < SLOT_LOW) {
      // мгновенный прыжок на эквивалентную позицию, потом анимация
      const adj  = next >= SLOT_HIGH ? -10 : 10;
      const snap = cur + adj;
      const fin  = snap + delta;
      posRef.current = snap;
      setInstant(true);
      setPos(snap);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          posRef.current = fin;
          setInstant(false);
          setPos(fin);
        })
      );
    } else {
      posRef.current = next;
      setPos(next);
    }
  }, [digit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', height: DIGIT_H, width: '1ch', verticalAlign: 'top' }}>
      <span style={{
        display: 'block',
        transform: `translateY(${-pos * DIGIT_H}px)`,
        transition: instant ? 'none' : 'transform 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)',
        willChange: 'transform',
      }}>
        {Array.from({ length: SLOT_SETS * 10 }, (_, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: DIGIT_H }}>
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

function SlotCounter({ value, direction }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
      {String(value).split('').map((ch, i) => (
        <SlotDigit key={i} digit={Number(ch)} direction={direction} />
      ))}
    </span>
  );
}
// ─────────────────────────────────────────────────────────────

function CustomSelect({ id, value, onChange, options, placeholder, disabled, isOpen, onOpenChange }) {
  const ref = useRef(null);
  const closeDropdown = useCallback(() => onOpenChange(false), [onOpenChange]);
  useClickOutside(ref, closeDropdown);

  const selected = options.find(o => o.value === value);

  function handleSelect(val) {
    onChange(val);
    onOpenChange(false);
  }

  return (
    <div className={`${styles.cselect}${isOpen ? ` ${styles.cselectOpen}` : ''}${disabled ? ` ${styles.cselectDisabled}` : ''}`} ref={ref}>
      <button
        type='button'
        id={id}
        className={styles.cselectTrigger}
        onClick={e => { if (disabled) return; e.stopPropagation(); onOpenChange(!isOpen); }}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={`${styles.cselectText}${!selected ? ` ${styles.cselectTextPlaceholder}` : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <img className={styles.cselectArrow} src='/img/arrow-down.svg' alt='' />
      </button>

      {isOpen && (
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
  const [direction, setDirection] = useState('none');
  const [focused, setFocused] = useState(false);
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
    setDirection(dir > 0 ? 'up' : 'down');
    onChange(String(clamp(current + dir * step, min, max)));
  }

  const hintText =
    limitSide === 'min' ? 'Минимальное значение' :
    limitSide === 'max' ? 'Максимальное значение' : null;

  return (
    <div className={`${styles.stepper}${limitSide ? ` ${styles.stepperLimit}` : ''}`}>
      <div className={styles.stepperRow}>
        <button className={styles.stepperBtn} type='button' onClick={() => handleStep(-1)}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}><path d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
        </button>
        <div className={styles.stepperDisplay}>
          {!focused && value && (
            <SlotCounter value={value} direction={direction} />
          )}
          <input
            className={`${styles.stepperField}${focused ? '' : ` ${styles.stepperFieldHidden}`}`}
            type='number'
            id={id}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={e => {
              setFocused(false);
              setDirection('none');
              if (min == null || max == null) return;
              const val = Number(e.target.value);
              if (!isNaN(val)) onChange(String(clamp(val, min, max)));
            }}
          />
        </div>
        <button className={styles.stepperBtn} type='button' onClick={() => handleStep(1)}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
        </button>
      </div>
      {hintText && <span className={styles.stepperHint}>{hintText}</span>}
    </div>
  );
}

function buildThicknessOptions(baseVal) {
  if (!baseVal || EXTRA_THICKNESS.includes(baseVal)) return EXTRA_THICKNESS;
  return [baseVal, ...EXTRA_THICKNESS];
}

export default function Parameters() {
  const { config, catalog, setters } = useAppContext();
  const { setSeriesId, onModelChange, setWidth, setHeight, setDepth, setBodyThickness, setDoorThickness, setLockId, setVentilation, setBodyColor, setDoorColor, onReset } = setters;
  const { seriesId, modelId, width, height, depth, bodyThickness, doorThickness, lockId, ventilation, bodyColor, doorColor } =
    config;

  const [openSelectId, setOpenSelectId] = useState(null);
  const handleSeriesOpen = useCallback((v) => setOpenSelectId(v ? 'series' : null), []);
  const handleModelOpen = useCallback((v) => setOpenSelectId(v ? 'model' : null), [])


  const modelEntries = seriesId
    ? Object.entries(catalog.models).filter(([, m]) => m.seriesId === seriesId)
    : [];

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

  const specs = currentModel?.defaultSpecs;
  const hasChanges = !!(modelId && specs && (
    String(width) !== String(specs.width) ||
    String(height) !== String(specs.height) ||
    String(depth) !== String(specs.depth) ||
    bodyThickness !== specs.bodyThickness ||
    doorThickness !== specs.doorThickness ||
    lockId !== (specs.lockId ?? 'key_basic') ||
    ventilation !== (specs.ventilation ?? false) ||
    bodyColor !== null ||
    doorColor !== null
  ));

  return (
    <aside className={styles.parameters}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Параметры</h2>
        {seriesId && (
          <button type='button' className={styles.resetBtn} onClick={onReset}>
            <span className={styles.resetBtnSign}>
              <svg viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M2 7a5 5 0 1 0 1.5-3.5L2 5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                <path d='M2 2v3h3' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
              </svg>
            </span>
            <span className={styles.resetBtnText}>Сбросить</span>
          </button>
        )}
      </div>

      <div className={styles.steps}>
        <div className={`${styles.step} ${seriesId ? styles.stepDone : styles.stepActive}`}>
          <div className={styles.stepCircle}>{seriesId ? '✓' : '1'}</div>
          <span className={styles.stepLabel}>Серия</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${modelId ? styles.stepDone : seriesId ? styles.stepActive : styles.stepPending}`}>
          <div className={styles.stepCircle}>{modelId ? '✓' : '2'}</div>
          <span className={styles.stepLabel}>Модель</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${hasChanges ? styles.stepDone : modelId ? styles.stepActive : styles.stepPending}`}>
          <div className={styles.stepCircle}>{hasChanges ? '✓' : '3'}</div>
          <span className={styles.stepLabel}>Параметры</span>
        </div>
      </div>

      <div className={styles.paramGroup}>
        <label className={styles.groupLabel} htmlFor='series'>Серия шкафа</label>
        <CustomSelect
          id='series'
          value={seriesId}
          onChange={setSeriesId}
          placeholder='Выберите серию'
          options={catalog.series.map(s => ({ value: s.id, label: s.name }))}
          isOpen={openSelectId === 'series'}
          onOpenChange={handleSeriesOpen}
        />
        {!seriesId && (
          <p className={styles.hint}>Начните с выбора серии шкафа</p>
        )}
      </div>

      <div key={seriesId || 'no-series'} className={`${styles.paramGroup} ${styles.modelGroup}`}>
        <label className={styles.groupLabel} htmlFor='model'>Модель шкафа</label>
        <CustomSelect
          id='model'
          value={modelId}
          onChange={onModelChange}
          placeholder='Выберите модель'
          options={modelEntries.map(([id, m]) => ({ value: id, label: m.name }))}
          disabled={!seriesId}
          isOpen={openSelectId === 'model'}
          onOpenChange={handleModelOpen}
        />
        {seriesId && !modelId && (
          <p className={styles.hint}>Теперь выберите модель шкафа</p>
        )}
      </div>

      <div
        className={`${styles.paramsBody}${!modelId ? ` ${styles.paramsDisabled}` : ''}`}
        data-tooltip={!modelId ? 'Не выбрана модель шкафа' : undefined}
      >

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

      <div className={styles.paramsGrid}>

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

      </div>{/* /paramsGrid */}
      </div>{/* /paramsDisabled */}
    </aside>
  );
}
