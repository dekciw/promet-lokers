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

function RubleInput({ value, onChange, ariaLabel }) {
  return (
    <div className={styles.pctWrap}>
      <input
        type="number"
        step="1"
        min="0"
        inputMode="numeric"
        className={styles.rateInput}
        value={value ?? ''}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
      />
      <span className={styles.pctSign}>₽</span>
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
const THICK_BRACKETS = ['qty1', 'qty10', 'qty50', 'qty100'];
const THICKNESS_KEYS = ['0.5', '0.6', '0.7'];
const SERIES = ['ml', 'ls'];

const COLOR_RULE_KEYS = [
  ['door', 'Цвет двери'],
  ['full', 'Цвет корпуса'],
];

const COLOR_CATS = [
  ['cat1', '1 категория'],
  ['cat2', '2 категория'],
  ['cat3', '3 категория'],
];

function toQtyObj(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return {
      qty1: value,
      qty10: value,
      qty50: value,
      qty100: value,
    };
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      qty1: value.qty1 ?? 0,
      qty10: value.qty10 ?? 0,
      qty50: value.qty50 ?? 0,
      qty100: value.qty100 ?? 0,
    };
  }
  return {
    qty1: 0,
    qty10: 0,
    qty50: 0,
    qty100: 0,
  };
}

function tiersToQtyObj(catRule) {
  // Handle bare number - expand to all brackets
  if (typeof catRule === 'number' && Number.isFinite(catRule)) {
    return toQtyObj(catRule);
  }

  // Handle legacy {minQty, tiers: [{minQty, rate}]} structure
  if (catRule && typeof catRule === 'object' && Array.isArray(catRule.tiers)) {
    const tiers = catRule.tiers || [];
    const brackets = [
      { key: 'qty1', upper: 9 },
      { key: 'qty10', upper: 49 },
      { key: 'qty50', upper: 99 },
      { key: 'qty100', upper: Infinity },
    ];

    const result = {};
    for (const { key, upper } of brackets) {
      // Find the largest tier.minQty that is <= upper bound of bracket
      const validTiers = tiers.filter((t) => t.minQty <= upper);
      if (validTiers.length > 0) {
        // Sort descending by minQty and take first (largest)
        const tier = validTiers.sort((a, b) => b.minQty - a.minQty)[0];
        result[key] = tier.rate;
      } else {
        result[key] = '';
      }
    }
    return result;
  }

  // Handle already qty-shaped or partial qty objects
  if (catRule && typeof catRule === 'object' && !Array.isArray(catRule)) {
    return toQtyObj(catRule);
  }

  return toQtyObj(null);
}

export function normalizeRules(priceRules) {
  const result = structuredClone(priceRules);

  if (result.thickness) {
    result.thickness.minQty = 1;

    // Migrate old flat structure (thickness.ml/ls) to new body/door structure
    if (result.thickness.ml && !result.thickness.body) {
      result.thickness.body = { ml: result.thickness.ml, ls: result.thickness.ls || {} };
      result.thickness.door = { ml: {}, ls: {} };
      delete result.thickness.ml;
      delete result.thickness.ls;
    }

    // Normalize body and door to qty-tiered structure
    for (const part of ['body', 'door']) {
      if (result.thickness[part]) {
        for (const series of ['ml', 'ls']) {
          if (result.thickness[part][series]) {
            const seriesData = result.thickness[part][series];
            for (const key of Object.keys(seriesData)) {
              seriesData[key] = toQtyObj(seriesData[key]);
            }
          }
        }
      }
    }
  }

  if (result.depth) {
    for (const series of ['ml', 'ls']) {
      if (result.depth[series]) {
        const seriesData = result.depth[series];
        for (const key of Object.keys(seriesData)) {
          seriesData[key] = toQtyObj(seriesData[key]);
        }
      }
    }
  }

  if (result.height) {
    for (const series of ['ml', 'ls']) {
      if (result.height[series]) {
        const seriesData = result.height[series];
        for (const key of Object.keys(seriesData)) {
          seriesData[key] = toQtyObj(seriesData[key]);
        }
      }
    }
  }

  if (result.color) {
    for (const ruleKey of ['door', 'full']) {
      if (result.color[ruleKey]) {
        const ruleData = result.color[ruleKey];
        for (const cat of Object.keys(ruleData)) {
          ruleData[cat] = tiersToQtyObj(ruleData[cat]);
        }
      }
    }
  }

  return result;
}

export default function PriceCoefficientsTab({ onNotify }) {
  const { priceRules, locks, isLoading, error, isSaving, loadPriceRules, savePriceRules } = usePriceRulesAdmin();
  const [local, setLocal] = useState(null);
  const [localLocks, setLocalLocks] = useState(null);
  const [hasInit, setHasInit] = useState(false);

  useEffect(() => {
    if (priceRules && locks && !hasInit) {
      setLocal(structuredClone(normalizeRules(priceRules)));
      setLocalLocks(structuredClone(locks));
      setHasInit(true);
    }
  }, [priceRules, locks, hasInit]);

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

  function updateLock(id, perSection) {
    setLocalLocks((prev) => ({
      ...prev,
      [id]: { ...prev[id], perSection: perSection === '' ? 0 : Number(perSection) },
    }));
  }

  async function handleSave() {
    try {
      await savePriceRules(buildPayload(local), localLocks);
      onNotify?.('ok', 'Коэффициенты сохранены');
    } catch (err) {
      onNotify?.('error', `Ошибка сохранения: ${err.message}`);
    }
  }

  const vent      = local.ventilation ?? { roof: {}, roofBottom: {} };
  const thickness = local.thickness   ?? { minQty: 1, body: { ml: {}, ls: {} }, door: { ml: {}, ls: {} } };
  const depth     = local.depth       ?? { ml: {}, ls: {} };
  const height    = local.height      ?? { ml: {}, ls: {} };
  const color     = local.color       ?? { door: {}, full: {} };

  const lockEntries = Object.entries(localLocks ?? {})
    .sort((a, b) => (a[1].perSection ?? 0) - (b[1].perSection ?? 0));

  return (
    <div className={styles.tab}>

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

      <section className={styles.section} aria-labelledby="thick-body-heading">
        <div className={styles.sectionHead}>
          <h2 id="thick-body-heading" className={styles.sectionTitle}>Толщина металла корпуса</h2>
          <p className={styles.sectionDesc}>
            Коэффициенты надбавки за нестандартную толщину металла корпуса для объёмов 1–9, 10–49, 50–99, от 100 шт. Будут применяться в расчёте после настройки логики (Фаза 5).
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
                      {THICK_BRACKETS.map((q) => <th key={q}>{QTY_LABELS[q]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {THICKNESS_KEYS.map((k) => (
                      <tr key={k}>
                        <td className={styles.rowLabel}>{k} мм</td>
                        {THICK_BRACKETS.map((q) => (
                          <td key={q}>
                            <PctInput
                              value={thickness.body?.[s]?.[k]?.[q] ?? 0}
                              onChange={(v) => update(['thickness', 'body', s, k, q], v)}
                              ariaLabel={`Толщина корпуса ${s.toUpperCase()} ${k}мм ${QTY_LABELS[q]}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="thick-door-heading">
        <div className={styles.sectionHead}>
          <h2 id="thick-door-heading" className={styles.sectionTitle}>Толщина металла двери</h2>
          <p className={styles.sectionDesc}>
            Коэффициенты надбавки за нестандартную толщину металла двери для объёмов 1–9, 10–49, 50–99, от 100 шт. Будут применяться в расчёте после настройки логики (Фаза 5).
          </p>
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
                      {THICK_BRACKETS.map((q) => <th key={q}>{QTY_LABELS[q]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {THICKNESS_KEYS.map((k) => (
                      <tr key={k}>
                        <td className={styles.rowLabel}>{k} мм</td>
                        {THICK_BRACKETS.map((q) => (
                          <td key={q}>
                            <PctInput
                              value={thickness.door?.[s]?.[k]?.[q] ?? 0}
                              onChange={(v) => update(['thickness', 'door', s, k, q], v)}
                              ariaLabel={`Толщина двери ${s.toUpperCase()} ${k}мм ${QTY_LABELS[q]}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="depth-heading">
        <div className={styles.sectionHead}>
          <h2 id="depth-heading" className={styles.sectionTitle}>Глубина</h2>
          <p className={styles.sectionDesc}>
            Коэффициенты надбавки за нестандартную глубину шкафа для объёмов 1–9, 10–49, 50–99, от 100 шт. Будут применяться в расчёте после настройки логики (Фаза 5).
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
                        {THICK_BRACKETS.map((q) => <th key={q}>{QTY_LABELS[q]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {depthKeys.map((d) => (
                        <tr key={d}>
                          <td className={styles.rowLabel}>{d}</td>
                          {THICK_BRACKETS.map((q) => (
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

      <section className={styles.section} aria-labelledby="height-heading">
        <div className={styles.sectionHead}>
          <h2 id="height-heading" className={styles.sectionTitle}>Высота</h2>
          <p className={styles.sectionDesc}>
            Коэффициенты надбавки за нестандартную высоту шкафа для объёмов 1–9, 10–49, 50–99, от 100 шт. Будут применяться в расчёте после настройки логики (Фаза 5).
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
                        {THICK_BRACKETS.map((q) => <th key={q}>{QTY_LABELS[q]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {heightKeys.map((h) => (
                        <tr key={h}>
                          <td className={styles.rowLabel}>{h}</td>
                          {THICK_BRACKETS.map((q) => (
                            <td key={q}>
                              <PctInput
                                value={height[s][h]?.[q] ?? ''}
                                onChange={(v) => update(['height', s, h, q], v)}
                                ariaLabel={`Высота ${s.toUpperCase()} ${h}мм ${QTY_LABELS[q]}`}
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

      <section className={styles.section} aria-labelledby="color-heading">
        <div className={styles.sectionHead}>
          <h2 id="color-heading" className={styles.sectionTitle}>Цвет</h2>
          <p className={styles.sectionDesc}>
            Надбавка за нестандартный цвет (не RAL 7038) по категории и объёму заказа. Категория цвета задаётся в каталоге.
          </p>
        </div>
        <div className={styles.splitTables}>
          {COLOR_RULE_KEYS.map(([ruleKey, ruleLabel]) => (
            <div key={ruleKey} className={styles.splitBlock}>
              <div className={styles.splitLabel}>{ruleLabel}</div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Категория</th>
                      {THICK_BRACKETS.map((q) => <th key={q}>{QTY_LABELS[q]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {COLOR_CATS.map(([cat, catLabel]) => (
                      <tr key={cat}>
                        <td className={styles.rowLabel}>{catLabel}</td>
                        {THICK_BRACKETS.map((q) => (
                          <td key={q}>
                            <PctInput
                              value={color[ruleKey]?.[cat]?.[q] ?? ''}
                              onChange={(v) => update(['color', ruleKey, cat, q], v)}
                              ariaLabel={`${ruleLabel} ${catLabel} ${QTY_LABELS[q]}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="locks-heading">
        <div className={styles.sectionHead}>
          <h2 id="locks-heading" className={styles.sectionTitle}>Замки</h2>
          <p className={styles.sectionDesc}>
            Доплата за нестандартный замок — за одну дверную секцию. Итоговая надбавка умножается на количество дверей модели.
          </p>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Замок</th>
                <th>Доплата за секцию, ₽</th>
              </tr>
            </thead>
            <tbody>
              {lockEntries.map(([id, lock]) => (
                <tr key={id}>
                  <td className={styles.rowLabel}>{lock.name}</td>
                  <td>
                    <RubleInput
                      value={localLocks[id]?.perSection ?? ''}
                      onChange={(v) => updateLock(id, v)}
                      ariaLabel={`Замок ${lock.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
