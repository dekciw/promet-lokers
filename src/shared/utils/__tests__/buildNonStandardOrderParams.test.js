import { describe, it, expect } from 'vitest';
import { buildNonStandardOrderParams } from '../buildNonStandardOrderParams.js';

const CATALOG = {
  series: [{ id: 'ml', name: 'ML-серия' }, { id: 'ls', name: 'LS-серия' }],
  models: {
    'ml-186': {
      name: 'МЛ-186',
      article: 'МЛ-186',
      seriesId: 'ml',
      defaultSpecs: {
        width: 600, height: 1830, depth: 500,
        bodyThickness: '0.5', doorThickness: '0.5',
        lockId: 'key_basic',
      },
    },
  },
  locks: {
    key_basic: { name: 'Ключевой (Базовый)' },
    key_code: { name: 'Практик EL Code' },
  },
};

const STANDARD_CONFIG = {
  seriesId: 'ml',
  modelId: 'ml-186',
  width: '600', height: '1830', depth: '500',
  bodyThickness: '0.5', doorThickness: '0.5',
  lockId: 'key_basic',
  ventilationType: null,
  bodyColor: null,
  doorColor: null,
  quantity: 10,
};

describe('buildNonStandardOrderParams', () => {
  // A. Базовые случаи

  it('возвращает [] когда модель не выбрана (modelId пустая строка)', () => {
    expect(buildNonStandardOrderParams({ modelId: '' }, CATALOG)).toEqual([]);
  });

  it('возвращает [] когда modelId отсутствует в catalog', () => {
    expect(buildNonStandardOrderParams({ modelId: 'unknown-model' }, CATALOG)).toEqual([]);
  });

  it('возвращает 11 параметров для выбранной модели', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    expect(result).toHaveLength(11);
  });

  it('все параметры стандартной конфигурации имеют isNonStandard=false', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    result.forEach(item => {
      expect(item.isNonStandard, `${item.label} должен быть стандартным`).toBe(false);
    });
  });

  // B. Маркировка нестандартных

  it('помечает width=700 как нестандартный', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, width: '700' }, CATALOG);
    const item = result.find(p => p.label === 'Ширина');
    expect(item).toEqual({ label: 'Ширина', value: '700 мм', isNonStandard: true });
  });

  it('помечает height и bodyThickness одновременно нестандартными, глубина остаётся стандартной', () => {
    const result = buildNonStandardOrderParams(
      { ...STANDARD_CONFIG, height: '2000', bodyThickness: '0.6' },
      CATALOG,
    );
    expect(result.find(p => p.label === 'Высота').isNonStandard).toBe(true);
    expect(result.find(p => p.label === 'Толщина корпуса').isNonStandard).toBe(true);
    expect(result.find(p => p.label === 'Глубина').isNonStandard).toBe(false);
  });

  it('помечает doorThickness нестандартным при отличии от defaults', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, doorThickness: '0.7' }, CATALOG);
    expect(result.find(p => p.label === 'Толщина двери').isNonStandard).toBe(true);
  });

  it('не помечает doorThickness нестандартным когда строковое значение совпадает с числовым дефолтом из Firestore', () => {
    // Firestore возвращает bodyThickness/doorThickness как числа (doubleValue),
    // но config хранит их как строки через String(). Сравнение должно работать через Number().
    const catalogNumericDefaults = {
      ...CATALOG,
      models: {
        'ml-186': {
          ...CATALOG.models['ml-186'],
          defaultSpecs: {
            ...CATALOG.models['ml-186'].defaultSpecs,
            bodyThickness: 0.5,  // число, как из Firestore
            doorThickness: 0.5,  // число, как из Firestore
          },
        },
      },
    };
    const result = buildNonStandardOrderParams(
      { ...STANDARD_CONFIG, bodyThickness: '0.5', doorThickness: '0.5' },
      catalogNumericDefaults,
    );
    expect(result.find(p => p.label === 'Толщина корпуса').isNonStandard).toBe(false);
    expect(result.find(p => p.label === 'Толщина двери').isNonStandard).toBe(false);
  });

  it('помечает doorThickness нестандартным при числовом дефолте из Firestore и строковом изменённом значении', () => {
    const catalogNumericDefaults = {
      ...CATALOG,
      models: {
        'ml-186': {
          ...CATALOG.models['ml-186'],
          defaultSpecs: {
            ...CATALOG.models['ml-186'].defaultSpecs,
            bodyThickness: 0.5,
            doorThickness: 0.5,
          },
        },
      },
    };
    const result = buildNonStandardOrderParams(
      { ...STANDARD_CONFIG, doorThickness: '0.6' },
      catalogNumericDefaults,
    );
    expect(result.find(p => p.label === 'Толщина двери').isNonStandard).toBe(true);
  });

  it('не помечает doorThickness нестандартным когда дефолт в Firestore 0 (legacy) а config=0.5 (после clamping applySpecs)', () => {
    // Ситуация: в Firestore хранится doorThickness=0 (легаси-данные до добавления clamping).
    // applySpecs делает Math.max(0.5, 0) = 0.5, поэтому config.doorThickness='0.5'.
    // Сравнение должно клампировать defaults так же, как applySpecs: Math.max(0.5, 0)=0.5 === 0.5 → стандартный.
    const catalogZeroDefaults = {
      ...CATALOG,
      models: {
        'ml-186': {
          ...CATALOG.models['ml-186'],
          defaultSpecs: {
            ...CATALOG.models['ml-186'].defaultSpecs,
            bodyThickness: 0,
            doorThickness: 0,
          },
        },
      },
    };
    const result = buildNonStandardOrderParams(
      { ...STANDARD_CONFIG, bodyThickness: '0.5', doorThickness: '0.5' },
      catalogZeroDefaults,
    );
    expect(result.find(p => p.label === 'Толщина корпуса').isNonStandard).toBe(false);
    expect(result.find(p => p.label === 'Толщина двери').isNonStandard).toBe(false);
  });

  it('помечает doorThickness нестандартным когда дефолт в Firestore 0 (legacy) а пользователь выбрал 0.6', () => {
    // Пользователь явно выбрал 0.6, что отличается от эффективного дефолта 0.5.
    const catalogZeroDefaults = {
      ...CATALOG,
      models: {
        'ml-186': {
          ...CATALOG.models['ml-186'],
          defaultSpecs: {
            ...CATALOG.models['ml-186'].defaultSpecs,
            bodyThickness: 0,
            doorThickness: 0,
          },
        },
      },
    };
    const result = buildNonStandardOrderParams(
      { ...STANDARD_CONFIG, doorThickness: '0.6' },
      catalogZeroDefaults,
    );
    expect(result.find(p => p.label === 'Толщина двери').isNonStandard).toBe(true);
  });

  it('форматирует ventilationType=roof как Крыша и помечает нестандартным', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, ventilationType: 'roof' }, CATALOG);
    const vent = result.find(p => p.label === 'Вентиляция');
    expect(vent).toEqual({ label: 'Вентиляция', value: 'Крыша', isNonStandard: true });
  });

  it('форматирует ventilationType=roofBottom как Крыша + дно', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, ventilationType: 'roofBottom' }, CATALOG);
    expect(result.find(p => p.label === 'Вентиляция').value).toBe('Крыша + дно');
  });

  it('форматирует ventilationType=roofBottomPipe как Крыша + дно + труба', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, ventilationType: 'roofBottomPipe' }, CATALOG);
    expect(result.find(p => p.label === 'Вентиляция').value).toBe('Крыша + дно + труба');
  });

  it('форматирует ventilationType=null как Нет (стандартное)', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    const vent = result.find(p => p.label === 'Вентиляция');
    expect(vent).toEqual({ label: 'Вентиляция', value: 'Нет', isNonStandard: false });
  });

  it('помечает нестандартный замок (lockId !== key_basic)', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, lockId: 'key_code' }, CATALOG);
    const lock = result.find(p => p.label === 'Замок');
    expect(lock).toEqual({ label: 'Замок', value: 'Практик EL Code', isNonStandard: true });
  });

  it('помечает стандартный замок key_basic как isNonStandard=false', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    const lock = result.find(p => p.label === 'Замок');
    expect(lock.isNonStandard).toBe(false);
    expect(lock.value).toBe('Ключевой (Базовый)');
  });

  it('помечает выбранный bodyColor как нестандартный', () => {
    const bodyColor = { name: 'RAL 5005', color: '#003087', cat: 1 };
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, bodyColor }, CATALOG);
    const item = result.find(p => p.label === 'Цвет корпуса');
    expect(item).toEqual({ label: 'Цвет корпуса', value: 'RAL 5005', isNonStandard: true });
  });

  it('форматирует bodyColor=null как стандартный', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    const item = result.find(p => p.label === 'Цвет корпуса');
    expect(item).toEqual({ label: 'Цвет корпуса', value: 'стандартный', isNonStandard: false });
  });

  it('помечает выбранный doorColor как нестандартный', () => {
    const doorColor = { name: 'RAL 9016', color: '#FFFFFF', cat: 1 };
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, doorColor }, CATALOG);
    const item = result.find(p => p.label === 'Цвет двери');
    expect(item).toEqual({ label: 'Цвет двери', value: 'RAL 9016', isNonStandard: true });
  });

  // C. Форматирование значений

  it('габариты содержат " мм" в конце', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    expect(result.find(p => p.label === 'Ширина').value).toMatch(/ мм$/);
    expect(result.find(p => p.label === 'Высота').value).toMatch(/ мм$/);
    expect(result.find(p => p.label === 'Глубина').value).toMatch(/ мм$/);
  });

  it('толщины содержат " мм" в конце', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    expect(result.find(p => p.label === 'Толщина корпуса').value).toMatch(/ мм$/);
    expect(result.find(p => p.label === 'Толщина двери').value).toMatch(/ мм$/);
  });

  it('сохраняет порядок параметров: Серия → Модель → Ширина → ... → Цвет двери', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, CATALOG);
    const labels = result.map(p => p.label);
    expect(labels).toEqual([
      'Серия', 'Модель', 'Ширина', 'Высота', 'Глубина',
      'Толщина корпуса', 'Толщина двери',
      'Замок', 'Вентиляция',
      'Цвет корпуса', 'Цвет двери',
    ]);
  });

  // D. Крайние случаи

  it('подставляет defaults.width когда config.width пустая строка', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, width: '' }, CATALOG);
    expect(result.find(p => p.label === 'Ширина').value).toBe('600 мм');
  });

  it('возвращает "—" для серии если catalog.series пустой', () => {
    const result = buildNonStandardOrderParams(STANDARD_CONFIG, { ...CATALOG, series: [] });
    expect(result.find(p => p.label === 'Серия').value).toBe('—');
  });

  it('возвращает "—" для замка если catalog.locks[lockId] отсутствует', () => {
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, lockId: 'unknown_lock' }, CATALOG);
    expect(result.find(p => p.label === 'Замок').value).toBe('—');
  });

  it('возвращает isNonStandard=false для всех если model.defaultSpecs undefined', () => {
    const catalogNoDefaults = {
      ...CATALOG,
      models: {
        'ml-186': { ...CATALOG.models['ml-186'], defaultSpecs: undefined },
      },
    };
    const result = buildNonStandardOrderParams({ ...STANDARD_CONFIG, width: '999' }, catalogNoDefaults);
    expect(result).toHaveLength(11);
    result.forEach(item => {
      expect(item.isNonStandard, `${item.label} должен быть стандартным без defaultSpecs`).toBe(false);
    });
  });
});
