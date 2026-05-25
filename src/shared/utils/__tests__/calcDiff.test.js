import { describe, it, expect } from 'vitest';
import { calcDiff } from '../calcDiff.js';

const DEFAULTS = {
  width: 600,
  height: 1830,
  depth: 500,
  bodyThickness: '0.5',
  doorThickness: '0.5',
  lockName: 'Ключевой (Базовый)',
  ventilationType: undefined,
  bodyColorName: undefined,
  doorColorName: undefined,
};

describe('calcDiff', () => {
  it('returns [] when defaults is null', () => {
    expect(calcDiff({}, null)).toEqual([]);
  });

  it('returns [] when nothing changed', () => {
    expect(calcDiff({ ...DEFAULTS }, DEFAULTS)).toEqual([]);
  });

  it('returns changed width with formatted value', () => {
    const result = calcDiff({ ...DEFAULTS, width: 700 }, DEFAULTS);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ label: 'Ширина:', value: '700 мм' });
  });

  it('returns multiple changed fields', () => {
    const result = calcDiff({ ...DEFAULTS, width: 700, height: 2000 }, DEFAULTS);
    expect(result).toHaveLength(2);
    const labels = result.map(r => r.label);
    expect(labels).toContain('Ширина:');
    expect(labels).toContain('Высота:');
  });

  it('formats ventilationType=roof as Крыша (fallback without catalog)', () => {
    const result = calcDiff({ ...DEFAULTS, ventilationType: 'roof' }, { ...DEFAULTS, ventilationType: undefined });
    expect(result[0].value).toBe('Крыша');
  });

  it('formats ventilationType=roofBottom as Крыша + дно (fallback without catalog)', () => {
    const result = calcDiff({ ...DEFAULTS, ventilationType: 'roofBottom' }, { ...DEFAULTS, ventilationType: undefined });
    expect(result[0].value).toBe('Крыша + дно');
  });

  it('uses catalog name for ventilationType when catalog is provided', () => {
    const ventilationCatalog = {
      roof: { name: 'Вентиляция крыши' },
      roofBottom: { name: 'Вентиляция крыши и дна' },
    };
    const result = calcDiff(
      { ...DEFAULTS, ventilationType: 'roofBottom' },
      { ...DEFAULTS, ventilationType: undefined },
      ventilationCatalog
    );
    expect(result[0].value).toBe('Вентиляция крыши и дна');
  });

  it('falls back to hardcoded name if catalog entry has no name', () => {
    const ventilationCatalog = { roofBottom: {} };
    const result = calcDiff(
      { ...DEFAULTS, ventilationType: 'roofBottom' },
      { ...DEFAULTS, ventilationType: undefined },
      ventilationCatalog
    );
    expect(result[0].value).toBe('Крыша + дно');
  });

  it('detects lock change', () => {
    const result = calcDiff({ ...DEFAULTS, lockName: 'D111X' }, DEFAULTS);
    expect(result[0]).toEqual({ label: 'Замок:', value: 'D111X' });
  });

  it('detects door color change', () => {
    const result = calcDiff({ ...DEFAULTS, doorColorName: 'RAL 9016' }, DEFAULTS);
    expect(result[0]).toEqual({ label: 'Цвет двери:', value: 'RAL 9016' });
  });
});
