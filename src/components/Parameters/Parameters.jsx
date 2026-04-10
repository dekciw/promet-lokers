import { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
const SLOT_SETS = 3;
const SLOT_HIGH = 22;
const SLOT_LOW  = 8;
const DIGIT_H   = 20;

function SlotDigit({ digit, direction }) {
  const posRef  = useRef(10 + digit);
  const prevRef = useRef(digit);
  const [pos, setPos]         = useState(10 + digit);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (prevRef.current === digit) return;
    const prev = prevRef.current;
    prevRef.current = digit;

    const delta = direction === 'up'
      ? (digit >= prev ? digit - prev : 10 - prev + digit)
      : (digit <= prev ? digit - prev : -(prev + 10 - digit));

    const cur  = posRef.current;
    const next = cur + delta;

    if (next >= SLOT_HIGH || next < SLOT_LOW) {
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
              <span className={styles.cselectItemLabel}>{o.label}</span>
              {o.value === value && (
                <svg className={styles.cselectItemCheck} width='14' height='14' viewBox='0 0 14 14' fill='none'>
                  <path d='M2.5 7l3 3 6-6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/>
                </svg>
              )}
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
        <div className={styles.stepperDisplay} id={id}>
          {value && <SlotCounter value={value} direction={direction} />}
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

// ── Stepper ────────────────────────────────────────────────────
const STEP_LABELS = ['Серия', 'Модель', 'Параметры'];

const slideVariants = {
  initial: (dir) => ({ x: dir > 0 ? '-45%' : '45%', opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit:    (dir) => ({ x: dir > 0 ? '45%'  : '-45%', opacity: 0 }),
};

export default function Parameters() {
  const { config, catalog, setters } = useAppContext();
  const {
    setSeriesId, onModelChange, setWidth, setHeight, setDepth,
    setBodyThickness, setDoorThickness, setLockId, setVentilation,
    setBodyColor, setDoorColor, onReset,
  } = setters;
  const {
    seriesId, modelId, width, height, depth,
    bodyThickness, doorThickness, lockId, ventilation, bodyColor, doorColor,
  } = config;

  // ── stepper state ──────────────────────────────────────────
  const [stepperStep, setStepperStep] = useState(
    () => modelId ? 3 : seriesId ? 2 : 1
  );
  const [direction, setDirection] = useState(1);
  const [isSliding, setIsSliding] = useState(false);

  // ── dropdown mutual exclusion ──────────────────────────────
  const [openSelectId, setOpenSelectId] = useState(null);
  const handleSeriesOpen = useCallback((v) => setOpenSelectId(v ? 'series' : null), []);
  const handleModelOpen  = useCallback((v) => setOpenSelectId(v ? 'model'  : null), []);

  // ── navigation ────────────────────────────────────────────
  const stepperStepRef = useRef(stepperStep);
  stepperStepRef.current = stepperStep;

  function goToStep(newStep) {
    if (newStep === stepperStepRef.current) return;
    setIsSliding(true);
    setOpenSelectId(null);
    setDirection(newStep > stepperStepRef.current ? 1 : -1);
    setStepperStep(newStep);
    setTimeout(() => setIsSliding(false), 450);
  }

  function handleStepClick(step) {
    if (step === 2 && !seriesId) return;
    if (step === 3 && !modelId) return;
    goToStep(step);
  }

  function handleReset() {
    onReset();
    setDirection(-1);
    setStepperStep(1);
    setIsSliding(false);
  }

  // ── auto-advance ───────────────────────────────────────────
  useEffect(() => {
    if (seriesId && stepperStepRef.current === 1) {
      const t = setTimeout(() => goToStep(2), 350);
      return () => clearTimeout(t);
    }
  }, [seriesId]); // eslint-disable-line

  useEffect(() => {
    if (modelId && stepperStepRef.current === 2) {
      const t = setTimeout(() => goToStep(3), 350);
      return () => clearTimeout(t);
    }
  }, [modelId]); // eslint-disable-line

  // ── derived data ───────────────────────────────────────────
  const modelEntries = seriesId
    ? Object.entries(catalog.models).filter(([, m]) => m.seriesId === seriesId)
    : [];
  const lockEntries = Object.entries(catalog.locks).sort((a, b) => a[1].surcharge - b[1].surcharge);
  const currentModel = modelId ? catalog.models[modelId] : null;
  const bodyThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.bodyThickness);
  const doorThicknessOptions = buildThicknessOptions(currentModel?.defaultSpecs?.doorThickness);

  const defaultWidth = currentModel?.defaultSpecs?.width ?? null;
  const minWidth  = defaultWidth !== null ? defaultWidth - WIDTH_RANGE : undefined;
  const maxWidth  = defaultWidth !== null ? defaultWidth + WIDTH_RANGE : undefined;
  const defaultDepth = currentModel?.defaultSpecs?.depth ?? null;
  const minDepth  = defaultDepth !== null ? DEPTH_MIN : undefined;
  const maxDepth  = defaultDepth !== null ? defaultDepth : undefined;

  const specs = currentModel?.defaultSpecs;
  const hasChanges = !!(modelId && specs && (
    String(width)     !== String(specs.width)  ||
    String(height)    !== String(specs.height) ||
    String(depth)     !== String(specs.depth)  ||
    bodyThickness     !== specs.bodyThickness  ||
    doorThickness     !== specs.doorThickness  ||
    lockId            !== (specs.lockId ?? 'key_basic') ||
    ventilation       !== (specs.ventilation ?? false)  ||
    bodyColor         !== null ||
    doorColor         !== null
  ));

  // ── step status ────────────────────────────────────────────
  function getStepStatus(step) {
    if (step === stepperStep) return 'active';
    if (step === 1 && seriesId)    return 'complete';
    if (step === 2 && modelId)     return 'complete';
    if (step === 3 && hasChanges)  return 'complete';
    return 'inactive';
  }

  function getCircleStyle(status) {
    if (status === 'active') return {
      background: 'var(--c-primary)',
      boxShadow: 'none',
      transform: 'scale(1.1)',
    };
    if (status === 'complete') return {
      background: 'var(--c-primary)',
      boxShadow: 'none',
      transform: 'scale(1)',
    };
    return {
      background: 'transparent',
      boxShadow: 'none',
      transform: 'scale(1)',
    };
  }

  // ── render ─────────────────────────────────────────────────
  return (
    <aside className={styles.parameters}>

      {/* Title row */}
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Параметры</h2>
        {seriesId && (
          <button type='button' className={styles.resetBtn} onClick={handleReset}>
            <span className={styles.resetBtnSign}>
              <svg width='12' height='12' viewBox='0 0 15 15' fill='none'>
                <path d='M2 2l11 11M13 2L2 13' stroke='white' strokeWidth='2.5' strokeLinecap='round'/>
              </svg>
            </span>
            <span className={styles.resetBtnText}>Сбросить</span>
          </button>
        )}
      </div>

      {/* Step indicators */}
      <div className={styles.steps}>
        {STEP_LABELS.map((label, i) => {
          const step   = i + 1;
          const status = getStepStatus(step);
          const canClick = step === 1 || (step === 2 && !!seriesId) || (step === 3 && !!modelId);

          return (
            <Fragment key={step}>
              <button
                type='button'
                className={styles.stepBtn}
                onClick={() => handleStepClick(step)}
                disabled={!canClick || isSliding}
              >
                <span className={styles.stepLabel} data-status={status}>
                  {label}
                </span>
                <motion.div
                  className={styles.stepCircle}
                  animate={getCircleStyle(status)}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  style={{ border: status === 'inactive' ? '1.5px solid var(--c-border)' : 'none' }}
                >
                  {status === 'complete' ? (
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
                      <motion.path
                        d='M5 13l4 4L19 7'
                        stroke='white'
                        strokeWidth={2.5}
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      />
                    </svg>
                  ) : status === 'active' ? (
                    <div className={styles.stepDot} />
                  ) : (
                    <span className={styles.stepNum}>{step}</span>
                  )}
                </motion.div>
              </button>

              {i < STEP_LABELS.length - 1 && (
                <div className={styles.stepLineWrap}>
                  <motion.div
                    className={styles.stepLineFill}
                    initial={{ scaleX: (i === 0 ? !!seriesId : !!modelId) ? 1 : 0 }}
                    animate={{ scaleX: (i === 0 ? !!seriesId : !!modelId) ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Animated content */}
      <div
        className={styles.stepContent}
        style={{ overflow: isSliding ? 'hidden' : 'visible' }}
      >
        <AnimatePresence initial={false} custom={direction} mode='popLayout'>
          <motion.div
            key={stepperStep}
            custom={direction}
            variants={slideVariants}
            initial='initial'
            animate='animate'
            exit='exit'
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            style={{ width: '100%' }}
          >
            {/* ── Step 1: Серия ── */}
            {stepperStep === 1 && (
              <div className={styles.stepPane}>
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
                  {!seriesId && <p className={styles.hint}>Начните с выбора серии шкафа</p>}
                </div>
              </div>
            )}

            {/* ── Step 2: Модель ── */}
            {stepperStep === 2 && (
              <div className={styles.stepPane}>
                <div className={styles.paramGroup}>
                  <label className={styles.groupLabel} htmlFor='model'>Модель шкафа</label>
                  <CustomSelect
                    id='model'
                    value={modelId}
                    onChange={onModelChange}
                    placeholder='Выберите модель'
                    options={modelEntries.map(([id, m]) => ({ value: id, label: m.name }))}
                    isOpen={openSelectId === 'model'}
                    onOpenChange={handleModelOpen}
                  />
                  {!modelId && <p className={styles.hint}>Теперь выберите модель шкафа</p>}
                </div>
              </div>
            )}

            {/* ── Step 3: Параметры ── */}
            {stepperStep === 3 && (
              <div className={styles.stepPane}>
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
                        >{t}</button>
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
                        >{t}</button>
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
                      >Да</button>
                      <button
                        className={`${styles.ventBtn}${!ventilation ? ` ${styles.ventBtnActive}` : ''}`}
                        onClick={() => setVentilation(false)}
                      >Нет</button>
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
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </aside>
  );
}
