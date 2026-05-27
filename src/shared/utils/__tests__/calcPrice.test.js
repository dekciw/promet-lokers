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
    thickness:   { minQty: 100, ml: { '0.5': 0.1, '0.6': 0.25, '0.7': 0.85 }, ls: { '0.5': 0.1, '0.6': 0.25, '0.7': 0.85 } },
    depth:       { minQty: 10,  ml: { '450': { qty10: 0.05, qty50: 0.03, qty100: 0.02 } }, ls: {} },
    height:      { minQty: 100, ml: { '1800': -0.02, '1830': 0, '1860': 0, '2000': 0.05 }, ls: {} },
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

  it('returns manual:true for height change at qty < 100', () => {
    const r = calcPrice({ ...BASE_CONFIG, height: '2000', quantity: 50 }, CATALOG_BASE);
    expect(r.manual).toBe(true);
  });

  it('applies depth surcharge at qty 10+', () => {
    const r = calcPrice({ ...BASE_CONFIG, depth: '450', quantity: 10 }, CATALOG_BASE);
    expect(r.manual).toBe(false);
    expect(r.clientPrice).toBe(Math.round(10000 * 1.05));
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
      priceRules: { ...CATALOG_BASE.priceRules, thickness: { minQty: 100, ml: { '0.7': 0.85 }, ls: {} } },
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
});
