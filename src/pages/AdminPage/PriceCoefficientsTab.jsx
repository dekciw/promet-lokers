import { useState, useEffect } from 'react';
import { usePriceRulesAdmin } from '../../shared/hooks/usePriceRulesAdmin';
import { cx } from '../../shared/utils/cx.js';
import styles from './PriceCoefficientsTab.module.css';

function setByPath(obj, path, value) {
  const next = structuredClone(obj);
  let cur = next;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
  cur[path[path.length - 1]] = value;
  return next;
}

function RateInput({ value, onChange, ariaLabel }) {
  const display = value === '' || value === null || value === undefined ? '' : String(value);
  return (
    <input
      type="number"
      step="0.01"
      inputMode="decimal"
      className={styles.rateInput}
      value={display}
      aria-label={ariaLabel}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === '' ? '' : Number(raw));
      }}
      onWheel={(e) => e.currentTarget.blur()}
    />
  );
}

export default function PriceCoefficientsTab({ onNotify }) {
  const { priceRules, isLoading, error, isSaving, loadPriceRules, savePriceRules } = usePriceRulesAdmin();
  const [local, setLocal] = useState(null);
  const [hasInit, setHasInit] = useState(false);

  useEffect(() => {
    if (priceRules && !hasInit) {
      setLocal(structuredClone(priceRules));
      setHasInit(true);
    }
  }, [priceRules, hasInit]);

  if (isLoading) return <div className={styles.state}>Загрузка коэффициентов…</div>;
  if (error) {
    return (
      <div className={cx(styles.state, styles.stateError)}>
        Ошибка загрузки: {error}
        <div>
          <button type="button" className={styles.retryBtn} onClick={loadPriceRules}>
            Повторить
          </button>
        </div>
      </div>
    );
  }
  if (!local) return <div className={styles.state}>Нет данных</div>;

  function update(path, value) {
    setLocal((prev) => setByPath(prev, path, value));
  }

  function buildPayload(obj) {
    const clone = structuredClone(obj);
    function walk(o) {
      for (const k of Object.keys(o)) {
        if (o[k] === '' || Number.isNaN(o[k])) o[k] = 0;
        else if (o[k] && typeof o[k] === 'object') walk(o[k]);
      }
    }
    walk(clone);
    return clone;
  }

  async function handleSave() {
    try {
      await savePriceRules(buildPayload(local));
      onNotify?.('ok', 'Коэффициенты сохранены');
    } catch (err) {
      onNotify?.('error', `Ошибка сохранения: ${err.message}`);
    }
  }

  const vent = local.ventilation ?? { roof: {}, roofBottom: {} };
  const thickness = local.thickness ?? { minQty: 100, ml: {}, ls: {} };
  const depth = local.depth ?? { ml: {}, ls: {} };
  const height = local.height ?? { ml: {}, ls: {} };

  const QTY_BRACKETS = ['qty1', 'qty10', 'qty50', 'qty100'];
  const DEPTH_BRACKETS = ['qty10', 'qty50', 'qty100'];
  const THICKNESS_KEYS = ['0.5', '0.6', '0.7'];
  const SERIES = ['ml', 'ls'];

  return (
    <div className={styles.tab}>
      {/* Section 1: Ventilation (PRICE-02) */}
      <section className={styles.section} aria-labelledby="vent-heading">
        <h2 id="vent-heading" className={styles.sectionTitle}>Вентиляция</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Тип</th>
                {QTY_BRACKETS.map((q) => <th key={q}>{q}</th>)}
              </tr>
            </thead>
            <tbody>
              {['roof', 'roofBottom'].map((type) => (
                <tr key={type}>
                  <td className={styles.rowLabel}>
                    {type === 'roof' ? 'Крыша' : 'Крыша + низ'}
                  </td>
                  {QTY_BRACKETS.map((q) => (
                    <td key={q}>
                      <RateInput
                        value={vent[type]?.[q] ?? ''}
                        onChange={(v) => update(['ventilation', type, q], v)}
                        ariaLabel={`Вентиляция ${type} ${q}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Thickness (PRICE-03) */}
      <section className={styles.section} aria-labelledby="thick-heading">
        <h2 id="thick-heading" className={styles.sectionTitle}>Толщина металла</h2>
        <div className={styles.minQtyRow}>
          <label className={styles.minQtyLabel}>
            Минимальное количество:
            <RateInput
              value={thickness.minQty ?? ''}
              onChange={(v) => update(['thickness', 'minQty'], v)}
              ariaLabel="Минимальное количество для толщины"
            />
          </label>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Серия</th>
                {THICKNESS_KEYS.map((k) => <th key={k}>{k} мм</th>)}
              </tr>
            </thead>
            <tbody>
              {SERIES.map((s) => (
                <tr key={s}>
                  <td className={styles.rowLabel}>{s.toUpperCase()}</td>
                  {THICKNESS_KEYS.map((k) => (
                    <td key={k}>
                      <RateInput
                        value={thickness[s]?.[k] ?? ''}
                        onChange={(v) => update(['thickness', s, k], v)}
                        ariaLabel={`Толщина ${s.toUpperCase()} ${k}мм`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Depth (PRICE-04) */}
      {SERIES.map((s) => {
        const depthKeys = Object.keys(depth[s] ?? {}).sort((a, b) => Number(a) - Number(b));
        if (depthKeys.length === 0) return null;
        return (
          <section key={`depth-${s}`} className={styles.section} aria-labelledby={`depth-${s}-heading`}>
            <h2 id={`depth-${s}-heading`} className={styles.sectionTitle}>
              Глубина — {s.toUpperCase()}
            </h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Глубина (мм)</th>
                    {DEPTH_BRACKETS.map((q) => <th key={q}>{q}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {depthKeys.map((d) => (
                    <tr key={d}>
                      <td className={styles.rowLabel}>{d}</td>
                      {DEPTH_BRACKETS.map((q) => (
                        <td key={q}>
                          <RateInput
                            value={depth[s][d]?.[q] ?? ''}
                            onChange={(v) => update(['depth', s, d, q], v)}
                            ariaLabel={`Глубина ${s.toUpperCase()} ${d}мм ${q}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {/* Section 4: Height (PRICE-05) */}
      {SERIES.map((s) => {
        const heightKeys = Object.keys(height[s] ?? {}).sort((a, b) => Number(a) - Number(b));
        if (heightKeys.length === 0) return null;
        return (
          <section key={`height-${s}`} className={styles.section} aria-labelledby={`height-${s}-heading`}>
            <h2 id={`height-${s}-heading`} className={styles.sectionTitle}>
              Высота — {s.toUpperCase()}
            </h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Высота (мм)</th>
                    <th>Надбавка</th>
                  </tr>
                </thead>
                <tbody>
                  {heightKeys.map((h) => (
                    <tr key={h}>
                      <td className={styles.rowLabel}>{h}</td>
                      <td>
                        <RateInput
                          value={height[s][h] ?? ''}
                          onChange={(v) => update(['height', s, h], v)}
                          ariaLabel={`Высота ${s.toUpperCase()} ${h}мм`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {/* Save bar (PRICE-06) */}
      <div className={styles.saveBar}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={isSaving}
          aria-label="Сохранить коэффициенты"
        >
          {isSaving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
