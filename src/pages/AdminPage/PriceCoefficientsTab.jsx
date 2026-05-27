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

// Decimal ↔ percent helpers (stored as 0.15, displayed as 15)
function decimalToPct(v) {
  if (v === '' || v === null || v === undefined) return '';
  const pct = Math.round(Number(v) * 10000) / 100;
  return isNaN(pct) ? '' : String(pct);
}
function pctToDecimal(raw) {
  const s = String(raw).replace(',', '.');
  if (s === '') return '';
  const n = parseFloat(s);
  return isNaN(n) ? '' : n / 100;
}

function PctInput({ value, onChange, ariaLabel }) {
  return (
    <div className={styles.pctWrap}>
      <input
        type="number"
        step="0.1"
        min="0"
        inputMode="decimal"
        className={styles.rateInput}
        value={decimalToPct(value)}
        aria-label={ariaLabel}
        onChange={(e) => onChange(pctToDecimal(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
      />
      <span className={styles.pctSign}>%</span>
    </div>
  );
}

const QTY_LABELS = {
  qty1:   '1–9 шт',
  qty10:  '10–49 шт',
  qty50:  '50–99 шт',
  qty100: 'от 100 шт',
};

const QTY_BRACKETS   = ['qty1', 'qty10', 'qty50', 'qty100'];
const DEPTH_BRACKETS = ['qty10', 'qty50', 'qty100'];
const THICKNESS_KEYS = ['0.45', '0.5', '0.6', '0.7'];
const SERIES = ['ml', 'ls'];

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

  const vent      = local.ventilation ?? { roof: {}, roofBottom: {} };
  const thickness = local.thickness   ?? { minQty: 100, ml: {}, ls: {} };
  const depth     = local.depth       ?? { ml: {}, ls: {} };
  const height    = local.height      ?? { ml: {}, ls: {} };

  return (
    <div className={styles.tab}>

      {/* ── Вентиляция ── */}
      <section className={styles.section} aria-labelledby="vent-heading">
        <div className={styles.sectionHead}>
          <h2 id="vent-heading" className={styles.sectionTitle}>Вентиляция</h2>
          <p className={styles.sectionDesc}>
            Надбавка к цене при заказе шкафа с вентиляционными отверстиями. Зависит от типа и объёма заказа.
          </p>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Тип вентиляции</th>
                {QTY_BRACKETS.map((q) => <th key={q}>{QTY_LABELS[q]}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['roof',       'Вент. отверстия + патрубок в центре крыши'],
                ['roofBottom', 'Вент. отверстия + патрубки в каждой секции'],
              ].map(([type, label]) => (
                <tr key={type}>
                  <td className={styles.rowLabel}>{label}</td>
                  {QTY_BRACKETS.map((q) => (
                    <td key={q}>
                      <PctInput
                        value={vent[type]?.[q] ?? ''}
                        onChange={(v) => update(['ventilation', type, q], v)}
                        ariaLabel={`Вентиляция ${label} ${QTY_LABELS[q]}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Толщина металла ── */}
      <section className={styles.section} aria-labelledby="thick-heading">
        <div className={styles.sectionHead}>
          <h2 id="thick-heading" className={styles.sectionTitle}>Толщина металла</h2>
          <p className={styles.sectionDesc}>
            Надбавка при выборе нестандартной толщины металла. Применяется только при заказе от указанного количества шт.
          </p>
        </div>
        <div className={styles.minQtyRow}>
          <label className={styles.minQtyLabel}>
            Минимальный заказ для надбавки:
            <div className={styles.minQtyInputWrap}>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                className={styles.minQtyInput}
                value={thickness.minQty ?? ''}
                aria-label="Минимальное количество для толщины"
                onChange={(e) => {
                  const v = e.target.value;
                  update(['thickness', 'minQty'], v === '' ? '' : Number(v));
                }}
                onWheel={(e) => e.currentTarget.blur()}
              />
              <span className={styles.pctSign}>шт</span>
            </div>
          </label>
        </div>
        <div className={styles.splitTables}>
          {SERIES.map((s) => (
            <div key={s} className={styles.splitBlock}>
              <div className={styles.splitLabel}>{s.toUpperCase()}</div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Толщина</th>
                      <th>Надбавка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {THICKNESS_KEYS.map((k) => (
                      <tr key={k}>
                        <td className={styles.rowLabel}>{k} мм</td>
                        <td>
                          <PctInput
                            value={thickness[s]?.[k] ?? ''}
                            onChange={(v) => update(['thickness', s, k], v)}
                            ariaLabel={`Толщина ${s.toUpperCase()} ${k}мм`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Глубина ML + LS ── */}
      <section className={styles.section} aria-labelledby="depth-heading">
        <div className={styles.sectionHead}>
          <h2 id="depth-heading" className={styles.sectionTitle}>Глубина</h2>
          <p className={styles.sectionDesc}>
            Надбавка при нестандартной глубине шкафа. При заказе менее 10 шт — цена по запросу.
          </p>
        </div>
        <div className={styles.splitTables}>
          {SERIES.map((s) => {
            const depthKeys = Object.keys(depth[s] ?? {}).sort((a, b) => Number(a) - Number(b));
            if (depthKeys.length === 0) return null;
            return (
              <div key={s} className={styles.splitBlock}>
                <div className={styles.splitLabel}>{s.toUpperCase()}</div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Глубина, мм</th>
                        {DEPTH_BRACKETS.map((q) => <th key={q}>{QTY_LABELS[q]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {depthKeys.map((d) => (
                        <tr key={d}>
                          <td className={styles.rowLabel}>{d}</td>
                          {DEPTH_BRACKETS.map((q) => (
                            <td key={q}>
                              <PctInput
                                value={depth[s][d]?.[q] ?? ''}
                                onChange={(v) => update(['depth', s, d, q], v)}
                                ariaLabel={`Глубина ${s.toUpperCase()} ${d}мм ${QTY_LABELS[q]}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Высота ML + LS ── */}
      <section className={styles.section} aria-labelledby="height-heading">
        <div className={styles.sectionHead}>
          <h2 id="height-heading" className={styles.sectionTitle}>Высота</h2>
          <p className={styles.sectionDesc}>
            Надбавка при нестандартной высоте шкафа. Применяется только при заказе от 100 шт, иначе — цена по запросу.
          </p>
        </div>
        <div className={styles.splitTables}>
          {SERIES.map((s) => {
            const heightKeys = Object.keys(height[s] ?? {}).sort((a, b) => Number(a) - Number(b));
            if (heightKeys.length === 0) return null;
            return (
              <div key={s} className={styles.splitBlock}>
                <div className={styles.splitLabel}>{s.toUpperCase()}</div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Высота, мм</th>
                        <th>Надбавка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heightKeys.map((h) => (
                        <tr key={h}>
                          <td className={styles.rowLabel}>{h}</td>
                          <td>
                            <PctInput
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
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Сохранить ── */}
      <div className={styles.saveBar}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={isSaving}
          aria-label="Сохранить коэффициенты"
        >
          {isSaving ? 'Сохраняем…' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
}
