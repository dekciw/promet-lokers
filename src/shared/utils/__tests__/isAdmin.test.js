import { describe, it, expect } from 'vitest';
import { isAdmin } from '../isAdmin';

describe('isAdmin', () => {
  it('returns true for admin@promet.ru', () => {
    expect(isAdmin('admin@promet.ru')).toBe(true);
  });

  it('returns false for a regular user email', () => {
    expect(isAdmin('user@promet.ru')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAdmin('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAdmin(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAdmin(undefined)).toBe(false);
  });

  it('returns false for uppercase variant (case-sensitive)', () => {
    expect(isAdmin('ADMIN@PROMET.RU')).toBe(false);
  });

  it('returns false for email with trailing space (no trimming tolerance)', () => {
    expect(isAdmin('admin@promet.ru ')).toBe(false);
  });
});
