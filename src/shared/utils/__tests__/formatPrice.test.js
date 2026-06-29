import { describe, it, expect } from 'vitest';
import { formatRub, calcPriceBreakdown, VAT_RATE } from '../formatPrice.js';

describe('formatRub', () => {
  it('formats whole number with ,00 kopecks', () => {
    expect(formatRub(11111)).toBe('11 111,00 руб.');
  });

  it('formats single decimal with trailing zero', () => {
    expect(formatRub(11111.5)).toBe('11 111,50 руб.');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatRub(11111.555)).toBe('11 111,56 руб.');
  });

  it('formats zero', () => {
    expect(formatRub(0)).toBe('0,00 руб.');
  });

  it('formats large numbers with multiple thousand groups', () => {
    expect(formatRub(1234567.89)).toBe('1 234 567,89 руб.');
  });

  it('uses regular space U+0020 as thousand separator', () => {
    const result = formatRub(11111);
    // Verify it's a regular space, not narrow no-break space (U+202F)
    expect(result.charCodeAt(2)).toBe(0x0020);
  });

  it('handles NaN as 0', () => {
    expect(formatRub(NaN)).toBe('0,00 руб.');
  });

  it('handles null/undefined as 0', () => {
    expect(formatRub(null)).toBe('0,00 руб.');
    expect(formatRub(undefined)).toBe('0,00 руб.');
  });
});

describe('calcPriceBreakdown', () => {
  it('calculates breakdown for round numbers', () => {
    const result = calcPriceBreakdown(10000, 5);
    expect(result).toEqual({
      unitNoVat: 10000,
      unitWithVat: 12200,
      totalNoVat: 50000,
      totalWithVat: 61000,
    });
  });

  it('calculates breakdown with precise VAT (no rounding)', () => {
    const result = calcPriceBreakdown(11111, 1);
    expect(result.unitNoVat).toBe(11111);
    expect(result.unitWithVat).toBe(13555.42);
    expect(result.totalNoVat).toBe(11111);
    expect(result.totalWithVat).toBe(13555.42);
  });

  it('uses VAT_RATE constant (1.22)', () => {
    expect(VAT_RATE).toBe(1.22);
    const result = calcPriceBreakdown(100, 1);
    expect(result.unitWithVat).toBe(100 * VAT_RATE);
  });

  it('does not round VAT values to integers', () => {
    const result = calcPriceBreakdown(9999, 3);
    // 9999 * 1.22 = 12198.78
    // 9999 * 3 * 1.22 = 36596.34
    expect(result.unitWithVat).toBe(12198.78);
    expect(result.totalWithVat).toBe(36596.34);
  });

  it('handles qty=1', () => {
    const result = calcPriceBreakdown(5000, 1);
    expect(result.totalNoVat).toBe(5000);
    expect(result.totalWithVat).toBe(6100);
  });

  it('handles zero price', () => {
    const result = calcPriceBreakdown(0, 10);
    expect(result).toEqual({
      unitNoVat: 0,
      unitWithVat: 0,
      totalNoVat: 0,
      totalWithVat: 0,
    });
  });
});
