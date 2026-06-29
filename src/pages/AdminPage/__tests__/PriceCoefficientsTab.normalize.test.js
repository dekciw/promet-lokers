import { describe, it, expect } from 'vitest';
import { normalizeRules } from '../PriceCoefficientsTab';

describe('normalizeRules', () => {
  it('should migrate old flat thickness structure to body/door and convert to qty-tiered', () => {
    const input = {
      thickness: {
        minQty: 100,
        ml: { '0.5': 0.1 },
        ls: {},
      },
    };
    const result = normalizeRules(input);
    expect(result.thickness.minQty).toBe(1);
    expect(result.thickness.body.ml['0.5']).toEqual({
      qty1: 0.1,
      qty10: 0.1,
      qty50: 0.1,
      qty100: 0.1,
    });
    expect(result.thickness.door).toEqual({ ml: {}, ls: {} });
    expect(result.thickness.ml).toBeUndefined();
    expect(result.thickness.ls).toBeUndefined();
  });

  it('should fill missing qty brackets with 0 when thickness value is already an object', () => {
    const input = {
      thickness: {
        minQty: 100,
        body: {
          ml: { '0.6': { qty1: 0.2 } },
          ls: {},
        },
        door: {
          ml: {},
          ls: {},
        },
      },
    };
    const result = normalizeRules(input);
    expect(result.thickness.body.ml['0.6']).toEqual({
      qty1: 0.2,
      qty10: 0,
      qty50: 0,
      qty100: 0,
    });
  });

  it('should add qty1 bracket with 0 to existing depth object', () => {
    const input = {
      depth: {
        ml: { '450': { qty10: 0.05, qty50: 0.03, qty100: 0.02 } },
        ls: {},
      },
    };
    const result = normalizeRules(input);
    expect(result.depth.ml['450']).toEqual({
      qty1: 0,
      qty10: 0.05,
      qty50: 0.03,
      qty100: 0.02,
    });
  });

  it('should convert height single-rate to qty-tiered object', () => {
    const input = {
      height: {
        ml: { '1830': 0.05 },
        ls: {},
      },
    };
    const result = normalizeRules(input);
    expect(result.height.ml['1830']).toEqual({
      qty1: 0.05,
      qty10: 0.05,
      qty50: 0.05,
      qty100: 0.05,
    });
  });

  it('should preserve ventilation unchanged and migrate color', () => {
    const input = {
      ventilation: {
        roof: { qty1: 0.15, qty10: 0.1, qty50: 0.07, qty100: 0.05 },
        roofBottom: { qty1: 0.25, qty10: 0.2, qty50: 0.15, qty100: 0.1 },
      },
      color: {
        door: {
          cat1: { minQty: 30, tiers: [{ minQty: 30, rate: 0.05 }] },
        },
      },
    };
    const result = normalizeRules(input);
    expect(result.ventilation).toEqual(input.ventilation);
    // Color is migrated from legacy shape to qty-bracket shape
    expect(result.color.door.cat1).toEqual({
      qty1: '',
      qty10: 0.05,
      qty50: 0.05,
      qty100: 0.05,
    });
  });

  it('should handle empty object without throwing', () => {
    const result = normalizeRules({});
    expect(result).toEqual({});
  });

  it('should not mutate the input object', () => {
    const input = {
      thickness: {
        minQty: 100,
        ml: { '0.5': 0.1 },
        ls: {},
      },
    };
    const snapshot = structuredClone(input);
    normalizeRules(input);
    expect(input).toEqual(snapshot);
  });

  it('should handle depth with single number value', () => {
    const input = {
      depth: {
        ml: { '450': 0.05 },
        ls: {},
      },
    };
    const result = normalizeRules(input);
    expect(result.depth.ml['450']).toEqual({
      qty1: 0.05,
      qty10: 0.05,
      qty50: 0.05,
      qty100: 0.05,
    });
  });

  it('should handle mixed thickness body keys with different shapes', () => {
    const input = {
      thickness: {
        minQty: 100,
        body: {
          ml: {
            '0.5': 0.1,
            '0.6': { qty1: 0.2, qty10: 0.15 },
            '0.7': 0.85,
          },
          ls: {},
        },
        door: {
          ml: {},
          ls: {},
        },
      },
    };
    const result = normalizeRules(input);
    expect(result.thickness.body.ml['0.5']).toEqual({
      qty1: 0.1,
      qty10: 0.1,
      qty50: 0.1,
      qty100: 0.1,
    });
    expect(result.thickness.body.ml['0.6']).toEqual({
      qty1: 0.2,
      qty10: 0.15,
      qty50: 0,
      qty100: 0,
    });
    expect(result.thickness.body.ml['0.7']).toEqual({
      qty1: 0.85,
      qty10: 0.85,
      qty50: 0.85,
      qty100: 0.85,
    });
  });

  it('should preserve existing body/door structure and normalize values', () => {
    const input = {
      thickness: {
        minQty: 1,
        body: {
          ml: { '0.5': 0.1 },
          ls: {},
        },
        door: {
          ml: { '0.5': 0.15 },
          ls: {},
        },
      },
    };
    const result = normalizeRules(input);
    expect(result.thickness.body.ml['0.5']).toEqual({
      qty1: 0.1,
      qty10: 0.1,
      qty50: 0.1,
      qty100: 0.1,
    });
    expect(result.thickness.door.ml['0.5']).toEqual({
      qty1: 0.15,
      qty10: 0.15,
      qty50: 0.15,
      qty100: 0.15,
    });
  });
});
