import { describe, it, expect } from 'vitest';
import { calcPrice } from '../calcPrice.js';

const MODEL_ML = {
  seriesId: 'ml',
  basePrice: 10000,
  cpBezNDS: 7000,
  doorWeight: 20,
  bodyWeight: 30,
  doorCount: 2,
  defaultSpecs: {
    width: 600,
    height: 1830,
    depth: 500,
    bodyThickness: '0.5',
    doorThickness: '0.5',
    lockId: 'key_basic',
  },
};

const CATALOG_BASE = {
  models: { 'ml-01': MODEL_ML },
  locks: {
    key_basic:    { name: 'Ключевой (Базовый)', perSection: 0 },
    euro_locks:   { name: 'Евро замок',         perSection: 500 },
  },
  priceRules: {
    thickness:   {
      minQty: 1,
      body: {
        ml: {
          '0.5': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 },
          '0.6': { qty1: 0.3, qty10: 0.25, qty50: 0.2, qty100: 0.15 },
          '0.7': { qty1: 0.9, qty10: 0.85, qty50: 0.8, qty100: 0.7 }
        },
        ls: {
          '0.5': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 },
          '0.6': { qty1: 0.32, qty10: 0.27, qty50: 0.22, qty100: 0.17 },
          '0.7': { qty1: 0.95, qty10: 0.88, qty50: 0.82, qty100: 0.75 }
        }
      },
      door: {
        ml: {
          '0.5': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 },
          '0.6': { qty1: 0.28, qty10: 0.22, qty50: 0.18, qty100: 0.12 },
          '0.7': { qty1: 0.95, qty10: 0.85, qty50: 0.75, qty100: 0.65 }
        },
        ls: {
          '0.5': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 },
          '0.6': { qty1: 0.30, qty10: 0.24, qty50: 0.19, qty100: 0.13 },
          '0.7': { qty1: 1.0, qty10: 0.90, qty50: 0.78, qty100: 0.68 }
        }
      }
    },
    depth:       {
      ml: {
        '450': { qty1: 0.08, qty10: 0.05, qty50: 0.03, qty100: 0.02 },
        '500': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 }
      },
      ls: {
        '450': { qty1: 0.09, qty10: 0.06, qty50: 0.04, qty100: 0.03 }
      }
    },
    height: {
      ml: {
        '1800': { qty1: -0.02, qty10: -0.02, qty50: -0.02, qty100: -0.02 },
        '1830': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 },
        '1860': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 },
        '2000': { qty1: 0.08, qty10: 0.07, qty50: 0.06, qty100: 0.05 }
      },
      ls: {
        '1800': { qty1: -0.03, qty10: -0.03, qty50: -0.03, qty100: -0.03 },
        '1830': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 },
        '2000': { qty1: 0.10, qty10: 0.09, qty50: 0.07, qty100: 0.06 }
      }
    },
    ventilation: {
      roof:       { qty1: 0.15, qty10: 0.1, qty50: 0.07, qty100: 0.05 },
      roofBottom: { qty1: 0.25, qty10: 0.2, qty50: 0.15, qty100: 0.1 },
    },
    color: {
      door: {
        cat1: { minQty: 30, tiers: [{ minQty: 30, rate: 0.05 }, { minQty: 50, rate: 0.03 }] },
        cat2: { minQty: 50, tiers: [{ minQty: 50, rate: 0.07 }] },
      },
      full: {
        cat1: { minQty: 50, tiers: [{ minQty: 50, rate: 0.12 }] },
      },
    },
  },
};

const BASE_CONFIG = {
  modelId:        'ml-01',
  width:          '',
  height:         '',
  depth:          '',
  bodyThickness:  '0.5',
  doorThickness:  '0.5',
  lockId:         'key_basic',
  ventilationType: null,
  bodyColor:      null,
  doorColor:      null,
  quantity:       100,
};

describe('calcPrice', () => {
  it('returns null when modelId is empty', () => {
    expect(calcPrice({ ...BASE_CONFIG, modelId: '' }, CATALOG_BASE)).toBeNull();
  });

  it('returns standard price with no changes', () => {
    const r = calcPrice(BASE_CONFIG, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(10000);
    expect(r.changeCount).toBe(0);
  });

  it('не считает толщину изменённой когда defaultSpecs.bodyThickness отсутствует (legacy модель)', () => {
    // Если в Firestore у легаси-модели нет поля bodyThickness в defaultSpecs,
    // applySpecs ставит config.bodyThickness='0.5' через ?? 0.5.
    // Без null-guard сравнение Number('0.5') !== Math.max(0.5, NaN)=NaN → true → неверно считается изменённым.
    const catalogNoThickness = {
      ...CATALOG_BASE,
      models: {
        'ml-01': {
          ...MODEL_ML,
          defaultSpecs: { width: 600, height: 1830, depth: 500, lockId: 'key_basic' },
        },
      },
    };
    const r = calcPrice(BASE_CONFIG, catalogNoThickness);
    expect(r.changeCount).toBe(0);
    expect(r.manual).toBe(false);
  });

  it('не считает толщину изменённой когда defaultSpecs.bodyThickness=0 (legacy legacy ноль)', () => {
    // В Firestore хранится bodyThickness=0 — clamping в applySpecs даёт '0.5',
    // сравнение должно быть Math.max(0.5, 0)=0.5 → не изменено.
    const catalogZeroThickness = {
      ...CATALOG_BASE,
      models: {
        'ml-01': {
          ...MODEL_ML,
          defaultSpecs: { ...MODEL_ML.defaultSpecs, bodyThickness: 0, doorThickness: 0 },
        },
      },
    };
    const r = calcPrice(BASE_CONFIG, catalogZeroThickness);
    expect(r.changeCount).toBe(0);
    expect(r.manual).toBe(false);
  });

  it('returns manual:true when width changes', () => {
    const r = calcPrice({ ...BASE_CONFIG, width: '700' }, CATALOG_BASE);
    expect(r.manual).toBe(true);
  });

  it('returns manual:true when changeCount > 2', () => {
    const r = calcPrice({
      ...BASE_CONFIG,
      height:          '2000',
      depth:           '450',
      ventilationType: 'roof',
    }, CATALOG_BASE);
    expect(r.manual).toBe(true);
    expect(r.changeCount).toBe(3);
  });

  it('applies height surcharge at 100+ qty', () => {
    const r = calcPrice({ ...BASE_CONFIG, height: '2000' }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.05));
  });

  it('applies height surcharge for qty 1-9 (qty1 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, height: '2000', quantity: 5 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.08));
  });

  it('applies height surcharge for qty 10-49 (qty10 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, height: '2000', quantity: 25 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.07));
  });

  it('applies height surcharge for qty 50-99 (qty50 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, height: '2000', quantity: 75 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.06));
  });

  it('applies different height rates for ML vs LS series', () => {
    const catalogLS = {
      ...CATALOG_BASE,
      models: {
        'ls-01': {
          ...MODEL_ML,
          seriesId: 'ls',
        },
      },
    };
    const rML = calcPrice({ ...BASE_CONFIG, height: '2000', quantity: 5 }, CATALOG_BASE);
    const rLS = calcPrice({ modelId: 'ls-01', height: '2000', quantity: 5, bodyThickness: '0.5', doorThickness: '0.5', lockId: 'key_basic', ventilationType: null, bodyColor: null, doorColor: null, width: '', depth: '' }, catalogLS);
    expect(rML.manual).toBe(false);
    expect(rLS.manual).toBe(false);
    expect(rML.clientPrice).toBe(Math.round(10000 * 1.08)); // ML qty1 = 0.08
    expect(rLS.clientPrice).toBe(Math.round(10000 * 1.10)); // LS qty1 = 0.10
  });

  it('applies depth surcharge for qty 1-9 (qty1 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, depth: '450', quantity: 5 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.08));
  });

  it('applies depth surcharge at qty 10+', () => {
    const r = calcPrice({ ...BASE_CONFIG, depth: '450', quantity: 10 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.05));
  });

  it('applies depth surcharge for qty 50-99 (qty50 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, depth: '450', quantity: 60 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.03));
  });

  it('applies different depth rates for ML vs LS series', () => {
    const catalogLS = {
      ...CATALOG_BASE,
      models: {
        'ls-01': {
          ...MODEL_ML,
          seriesId: 'ls',
        },
      },
    };
    const rML = calcPrice({ ...BASE_CONFIG, depth: '450', quantity: 5 }, CATALOG_BASE);
    const rLS = calcPrice({ modelId: 'ls-01', depth: '450', quantity: 5, bodyThickness: '0.5', doorThickness: '0.5', lockId: 'key_basic', ventilationType: null, bodyColor: null, doorColor: null, width: '', height: '' }, catalogLS);
    expect(rML.manual).toBe(false);
    expect(rLS.manual).toBe(false);
    expect(rML.clientPrice).toBe(Math.round(10000 * 1.08)); // ML qty1 = 0.08
    expect(rLS.clientPrice).toBe(Math.round(10000 * 1.09)); // LS qty1 = 0.09
  });

  it('applies lock surcharge linearly by doorCount', () => {
    const r = calcPrice({ ...BASE_CONFIG, lockId: 'euro_locks' }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // 500 perSection × 2 doors = 1000
    expect(r.lockSurcharge).toBe(1000);
    expect(r.clientPrice).toBe(10000 + 1000);
  });

  it('applies ventilation surcharge at qty 100', () => {
    const r = calcPrice({ ...BASE_CONFIG, ventilationType: 'roof' }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.05));
  });

  it('computes weight with no multiplier when thickness equals model default', () => {
    const r = calcPrice(BASE_CONFIG, CATALOG_BASE);
    // config=default(0.5) === modelDefault(0.5) → mult=1 for both
    // doorW=20 × 1 + bodyW=30 × 1 = 50
    expect(r.weight).toBe(50);
  });

  it('computes weight with upgraded door thickness', () => {
    const r = calcPrice({ ...BASE_CONFIG, doorThickness: '0.7' }, { ...CATALOG_BASE,
      models: { 'ml-01': { ...MODEL_ML, defaultSpecs: { ...MODEL_ML.defaultSpecs } } },
      priceRules: {
        ...CATALOG_BASE.priceRules,
        thickness: {
          minQty: 1,
          body: { ml: { '0.7': { qty1: 0, qty10: 0, qty50: 0, qty100: 0 } }, ls: {} },
          door: { ml: { '0.7': { qty1: 0.95, qty10: 0.85, qty50: 0.75, qty100: 0.65 } }, ls: {} }
        }
      },
    });
    // door upgraded 0.5→0.7: 20 × (1+5/9) ≈ 31.11, body stays at default: 30 × 1 = 30
    const expected = Math.round((20 * (1 + 5 / 9) + 30 * 1) * 100) / 100;
    expect(r.weight).toBe(expected);
  });

  it('leadTime is null for 0 changes', () => {
    const r = calcPrice(BASE_CONFIG, CATALOG_BASE);
    expect(r.leadTime).toBeNull();
  });

  it('leadTime is 7–14 дней for 1 change', () => {
    const r = calcPrice({ ...BASE_CONFIG, ventilationType: 'roof' }, CATALOG_BASE);
    expect(r.leadTime).toBe('7–14 дней');
  });

  // Толщина корпуса (CALC-01) - qty-bracket tests
  it('applies body thickness surcharge for qty 1-9 (qty1 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, bodyThickness: '0.6', quantity: 5 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // bodyThickness 0.6: qty1=0.3, bodyW=30, totalW=50, rate = 0.3 × (30/50) = 0.18
    expect(r.clientPrice).toBe(Math.round(10000 * 1.18));
  });

  it('applies body thickness surcharge for qty 10-49 (qty10 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, bodyThickness: '0.6', quantity: 10 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // bodyThickness 0.6: qty10=0.25, rate = 0.25 × (30/50) = 0.15
    expect(r.clientPrice).toBe(Math.round(10000 * 1.15));
  });

  it('applies body thickness surcharge for qty 50-99 (qty50 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, bodyThickness: '0.7', quantity: 60 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // bodyThickness 0.7: qty50=0.8, rate = 0.8 × (30/50) = 0.48
    expect(r.clientPrice).toBe(Math.round(10000 * 1.48));
  });

  // Толщина двери (CALC-02) - qty-bracket tests
  it('applies door thickness surcharge for qty 1-9 (qty1 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, doorThickness: '0.6', quantity: 5 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // doorThickness 0.6: qty1=0.28, doorW=20, totalW=50, rate = 0.28 × (20/50) = 0.112
    expect(r.clientPrice).toBe(Math.round(10000 * 1.112));
  });

  it('applies door thickness surcharge for qty 10-49 (qty10 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, doorThickness: '0.6', quantity: 10 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // doorThickness 0.6: qty10=0.22, rate = 0.22 × (20/50) = 0.088
    expect(r.clientPrice).toBe(Math.round(10000 * 1.088));
  });

  it('applies door thickness surcharge for qty 50-99 (qty50 bracket)', () => {
    const r = calcPrice({ ...BASE_CONFIG, doorThickness: '0.7', quantity: 75 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // doorThickness 0.7: qty50=0.75, rate = 0.75 × (20/50) = 0.30
    expect(r.clientPrice).toBe(Math.round(10000 * 1.30));
  });

  // Обе толщины равны - проверка раздельных таблиц body/door
  it('applies both body and door thickness when both changed to same value', () => {
    const r = calcPrice({ ...BASE_CONFIG, bodyThickness: '0.7', doorThickness: '0.7', quantity: 50 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    // body 0.7 qty50=0.8 × (30/50) = 0.48
    // door 0.7 qty50=0.75 × (20/50) = 0.30
    // totalRate = 0.48 + 0.30 = 0.78
    expect(r.clientPrice).toBe(Math.round(10000 * 1.78));
    expect(r.changeCount).toBe(1); // обе толщины считаются как одно изменение
  });

  // ML vs LS series - разные таблицы
  it('applies different body thickness rates for ML vs LS series', () => {
    const catalogLS = {
      ...CATALOG_BASE,
      models: {
        'ls-01': {
          ...MODEL_ML,
          seriesId: 'ls',
        },
      },
    };
    const rML = calcPrice({ ...BASE_CONFIG, bodyThickness: '0.6', quantity: 5 }, CATALOG_BASE);
    const rLS = calcPrice({ modelId: 'ls-01', bodyThickness: '0.6', quantity: 5, doorThickness: '0.5', lockId: 'key_basic', ventilationType: null, bodyColor: null, doorColor: null, width: '', height: '', depth: '' }, catalogLS);
    expect(rML.manual).toBe(false);
    expect(rLS.manual).toBe(false);
    // ML: qty1=0.3 × (30/50) = 0.18 → 10000 × 1.18 = 11800
    expect(rML.clientPrice).toBe(11800);
    // LS: qty1=0.32 × (30/50) = 0.192 → 10000 × 1.192 = 11920
    expect(rLS.clientPrice).toBe(11920);
  });

  it('applies different door thickness rates for ML vs LS series', () => {
    const catalogLS = {
      ...CATALOG_BASE,
      models: {
        'ls-01': {
          ...MODEL_ML,
          seriesId: 'ls',
        },
      },
    };
    const rML = calcPrice({ ...BASE_CONFIG, doorThickness: '0.6', quantity: 10 }, CATALOG_BASE);
    const rLS = calcPrice({ modelId: 'ls-01', doorThickness: '0.6', quantity: 10, bodyThickness: '0.5', lockId: 'key_basic', ventilationType: null, bodyColor: null, doorColor: null, width: '', height: '', depth: '' }, catalogLS);
    expect(rML.manual).toBe(false);
    expect(rLS.manual).toBe(false);
    // ML: qty10=0.22 × (20/50) = 0.088 → 10000 × 1.088 = 10880
    expect(rML.clientPrice).toBe(10880);
    // LS: qty10=0.24 × (20/50) = 0.096 → 10000 × 1.096 = 10960
    expect(rLS.clientPrice).toBe(10960);
  });
});
