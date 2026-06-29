import { describe, it, expect } from 'vitest';
import { normalizeRules } from '../PriceCoefficientsTab';

describe('normalizeRules - color migration', () => {
  it('migrates legacy color.door.cat1 with minQty and tiers to qty-bracket shape', () => {
    const input = {
      color: {
        door: {
          cat1: {
            minQty: 30,
            tiers: [
              { minQty: 30, rate: 0.05 },
              { minQty: 50, rate: 0.03 },
            ],
          },
        },
      },
    };

    const result = normalizeRules(input);

    expect(result.color.door.cat1).toEqual({
      qty1: '',
      qty10: 0.05,
      qty50: 0.03,
      qty100: 0.03,
    });
  });

  it('migrates legacy color.full.cat1 with single tier', () => {
    const input = {
      color: {
        full: {
          cat1: {
            minQty: 50,
            tiers: [{ minQty: 50, rate: 0.12 }],
          },
        },
      },
    };

    const result = normalizeRules(input);

    expect(result.color.full.cat1).toEqual({
      qty1: '',
      qty10: '',
      qty50: 0.12,
      qty100: 0.12,
    });
  });

  it('preserves already qty-shaped color.door.cat2', () => {
    const input = {
      color: {
        door: {
          cat2: {
            qty1: 0.01,
            qty10: 0.02,
            qty50: 0.03,
            qty100: 0.04,
          },
        },
      },
    };

    const result = normalizeRules(input);

    expect(result.color.door.cat2).toEqual({
      qty1: 0.01,
      qty10: 0.02,
      qty50: 0.03,
      qty100: 0.04,
    });
  });

  it('expands bare number color.door.cat3 to all qty brackets', () => {
    const input = {
      color: {
        door: {
          cat3: 0.06,
        },
      },
    };

    const result = normalizeRules(input);

    expect(result.color.door.cat3).toEqual({
      qty1: 0.06,
      qty10: 0.06,
      qty50: 0.06,
      qty100: 0.06,
    });
  });

  it('removes minQty and tiers keys from legacy color structure', () => {
    const input = {
      color: {
        door: {
          cat1: {
            minQty: 30,
            tiers: [{ minQty: 30, rate: 0.05 }],
          },
        },
      },
    };

    const result = normalizeRules(input);

    expect(result.color.door.cat1).not.toHaveProperty('minQty');
    expect(result.color.door.cat1).not.toHaveProperty('tiers');
    expect(Object.keys(result.color.door.cat1)).toEqual(['qty1', 'qty10', 'qty50', 'qty100']);
  });

  it('tolerates absent color without throwing', () => {
    const input1 = {};
    const input2 = { color: {} };

    expect(() => normalizeRules(input1)).not.toThrow();
    expect(() => normalizeRules(input2)).not.toThrow();
  });

  it('does not mutate input object', () => {
    const input = {
      color: {
        door: {
          cat1: {
            minQty: 30,
            tiers: [{ minQty: 30, rate: 0.05 }],
          },
        },
      },
    };

    const original = JSON.stringify(input);
    normalizeRules(input);

    expect(JSON.stringify(input)).toBe(original);
  });

  it('handles mixed legacy and qty-shaped categories in same ruleKey', () => {
    const input = {
      color: {
        door: {
          cat1: { minQty: 30, tiers: [{ minQty: 30, rate: 0.05 }] },
          cat2: { qty1: 0.01, qty10: 0.02 }, // partial object, missing qty50/qty100
        },
      },
    };

    const result = normalizeRules(input);

    expect(result.color.door.cat1).toEqual({
      qty1: '',
      qty10: 0.05,
      qty50: 0.05,
      qty100: 0.05,
    });
    expect(result.color.door.cat2).toEqual({
      qty1: 0.01,
      qty10: 0.02,
      qty50: 0,
      qty100: 0,
    });
  });

  it('fills missing brackets with 0 for partial qty objects', () => {
    const input = {
      color: {
        full: {
          cat1: { qty10: 0.05, qty100: 0.02 }, // missing qty1, qty50
        },
      },
    };

    const result = normalizeRules(input);

    expect(result.color.full.cat1).toEqual({
      qty1: 0,
      qty10: 0.05,
      qty50: 0,
      qty100: 0.02,
    });
  });

  it('preserves ventilation untouched', () => {
    const input = {
      color: {
        door: { cat1: 0.05 },
      },
      ventilation: {
        roof: { qty1: 0.01, qty10: 0.02, qty50: 0.03, qty100: 0.04 },
      },
    };

    const result = normalizeRules(input);

    expect(result.ventilation).toEqual(input.ventilation);
  });
});
