import { describe, it, expect } from 'vitest';
import { getNZFilename } from '../generateNZ.js';

describe('getNZFilename (DOC_5)', () => {
  it('форматирует {article}_{YYYY-MM-DD}.pdf для известной модели', () => {
    const result = getNZFilename({ article: 'МЛ-186' }, new Date('2026-05-06T10:30:00Z'));
    expect(result).toBe('МЛ-186_2026-05-06.pdf');
  });

  it('форматирует артикул LS-100 с датой 2026-12-01', () => {
    const result = getNZFilename({ article: 'LS-100' }, new Date('2026-12-01T00:00:00Z'));
    expect(result).toBe('LS-100_2026-12-01.pdf');
  });

  it('использует fallback "НЗ" если model отсутствует', () => {
    expect(getNZFilename(null, new Date('2026-05-06T00:00:00Z'))).toBe('НЗ_2026-05-06.pdf');
  });

  it('использует fallback "НЗ" если article отсутствует', () => {
    expect(getNZFilename({ article: undefined }, new Date('2026-05-06T00:00:00Z'))).toBe('НЗ_2026-05-06.pdf');
  });

  it('падит месяц и день нулями (январь 1 → 2026-01-01)', () => {
    expect(getNZFilename({ article: 'X' }, new Date('2026-01-01T00:00:00Z'))).toBe('X_2026-01-01.pdf');
  });

  it('форматирует месяц 9 как 09', () => {
    expect(getNZFilename({ article: 'X' }, new Date('2026-09-15T00:00:00Z'))).toBe('X_2026-09-15.pdf');
  });
});

describe('generateNZ', () => {
  it('экспортирует асинхронную функцию generateNZ', async () => {
    const mod = await import('../generateNZ.js');
    expect(typeof mod.generateNZ).toBe('function');
    // async функции — это AsyncFunction, проверяем имя конструктора
    expect(mod.generateNZ.constructor.name).toBe('AsyncFunction');
  });
});
