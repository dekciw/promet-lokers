---
wave: 1
depends_on: []
files_modified:
  - src/data/stubCatalog.js
  - src/utils/calcDiff.js
autonomous: true
requirements:
  - CONF-02
  - CONF-03
---

# Plan 1: Data Layer — Stub Catalog + calcDiff Utility

## Goal
Create the pure-logic data layer: a stub catalog with all required entities and a standalone calcDiff utility, with no UI dependencies.

## must_haves
- `src/data/stubCatalog.js` exports `STUB_CATALOG` with at least 2 series, 3 models, 5 locks
- `src/utils/calcDiff.js` exports `calcDiff(current, defaults)` returning `[{ label, value }]` array
- Standard thickness `'0.5'` has no surcharge entry (it is the zero-cost baseline)
- Every model in `STUB_CATALOG.models` has a `defaultSpecs` object containing: `width`, `height`, `thickness`, `lockId`, `ventilation`, `bodyColorName`, `doorColorName`

---

## Tasks

### Task 1: Create stubCatalog.js

<read_first>
- src/components/Parameters/Parameters.jsx
- src/components/ColorPicker/ColorPicker.jsx
</read_first>

<action>
Create `src/data/stubCatalog.js` with this exact content:

```js
export const STUB_CATALOG = {
  series: [
    { id: 'ml', name: 'Серия «ML»' },
    { id: 'sl', name: 'Серия «SL»' },
  ],

  models: {
    'ml-usi': {
      name: 'Шкаф металлический усиленный',
      seriesId: 'ml',
      basePrice: 12000,
      article: 'SHL-ML-USI',
      defaultSpecs: {
        width: 400,
        height: 1850,
        thickness: '0.5',
        lockId: 'key_basic',
        ventilation: false,
        bodyColorName: 'RAL 7038',
        doorColorName: 'RAL 7038',
      },
    },
    'ml-std': {
      name: 'Шкаф металлический стандартный',
      seriesId: 'ml',
      basePrice: 9500,
      article: 'SHL-ML-STD',
      defaultSpecs: {
        width: 400,
        height: 1800,
        thickness: '0.5',
        lockId: 'key_basic',
        ventilation: false,
        bodyColorName: 'RAL 7038',
        doorColorName: 'RAL 7038',
      },
    },
    'sl-lite': {
      name: 'Шкаф металлический lite',
      seriesId: 'sl',
      basePrice: 7200,
      article: 'SHL-SL-LITE',
      defaultSpecs: {
        width: 300,
        height: 1800,
        thickness: '0.5',
        lockId: 'key_basic',
        ventilation: false,
        bodyColorName: 'RAL 7038',
        doorColorName: 'RAL 7038',
      },
    },
  },

  locks: {
    'key_basic': { name: 'Ключевой (Базовый)', surcharge: 0 },
    'lock_2':    { name: 'Замок навесной', surcharge: 800 },
    'lock_3':    { name: 'Замок кодовый', surcharge: 1200 },
    'lock_4':    { name: 'Замок сувальдный', surcharge: 1500 },
    'lock_5':    { name: 'Замок электронный', surcharge: 2100 },
  },

  thicknessSurcharges: {
    '0.6': 800,
    '0.7': 1500,
  },

  ventSurcharge: 500,
};
```

Named export (not default) so it can be imported by name in Phase 2.
</action>

<acceptance_criteria>
- `src/data/stubCatalog.js` contains `export const STUB_CATALOG`
- `src/data/stubCatalog.js` contains `'ml'` and `'sl'` series ids
- `src/data/stubCatalog.js` contains model keys `'ml-usi'`, `'ml-std'`, `'sl-lite'`
- `src/data/stubCatalog.js` contains lock key `'key_basic'` with `surcharge: 0`
- `src/data/stubCatalog.js` contains 5 lock entries
- `src/data/stubCatalog.js` contains `thicknessSurcharges:` with keys `'0.6'` and `'0.7'` but NOT `'0.5'`
- `src/data/stubCatalog.js` contains `ventSurcharge: 500`
- Every model entry contains `defaultSpecs` with keys `width`, `height`, `thickness`, `lockId`, `ventilation`, `bodyColorName`, `doorColorName`
</acceptance_criteria>

---

### Task 2: Create calcDiff utility

<read_first>
- src/data/stubCatalog.js
</read_first>

<action>
Create `src/utils/calcDiff.js` with this exact content:

```js
const SPEC_FIELDS = [
  { key: 'width',         label: 'Ширина:',          format: v => `${v} мм` },
  { key: 'height',        label: 'Высота:',          format: v => `${v} мм` },
  { key: 'thickness',     label: 'Толщина металла:',  format: v => `${v} мм` },
  { key: 'lockName',      label: 'Замок:',            format: v => v },
  { key: 'ventilation',   label: 'Вентиляция:',       format: v => (v ? 'Да' : 'Нет') },
  { key: 'bodyColorName', label: 'Цвет корпуса:',     format: v => v },
  { key: 'doorColorName', label: 'Цвет двери:',       format: v => v },
];

/**
 * Returns array of changed parameters for the "Нестандартное исполнение" column.
 * @param {object} current  - flat object with current config (human-readable names, numbers parsed)
 * @param {object} defaults - model.defaultSpecs from STUB_CATALOG
 * @returns {{ label: string, value: string }[]}
 */
export function calcDiff(current, defaults) {
  if (!defaults) return [];

  return SPEC_FIELDS.reduce((acc, field) => {
    const currentVal = current[field.key];
    const defaultVal = defaults[field.key];

    const isDifferent = String(currentVal) !== String(defaultVal);

    if (isDifferent && currentVal !== undefined && currentVal !== null) {
      acc.push({ label: field.label, value: field.format(currentVal) });
    }
    return acc;
  }, []);
}
```

Notes:
- Use `lockName` (human-readable), not `lockId` — caller must resolve the name before calling
- `String()` coercion handles `false` vs `'false'` correctly for ventilation
- Returns empty array (not null) when `defaults` is falsy
</action>

<acceptance_criteria>
- `src/utils/calcDiff.js` contains `export function calcDiff`
- `src/utils/calcDiff.js` contains `if (!defaults) return []`
- `src/utils/calcDiff.js` contains `String(currentVal) !== String(defaultVal)`
- `src/utils/calcDiff.js` contains `SPEC_FIELDS` array with 7 entries
- `src/utils/calcDiff.js` contains `{ key: 'lockName'` (not `lockId`)
- `src/utils/calcDiff.js` contains `{ key: 'bodyColorName'` and `{ key: 'doorColorName'`
</acceptance_criteria>

---

## Verification

Import in browser console after `npm run dev`:
```js
// Open browser console, then:
// calcDiff with 3 changed fields should return 3 items
```

Or verify via grep that both files exist with correct exports:
- `grep "export const STUB_CATALOG" src/data/stubCatalog.js` — should match
- `grep "export function calcDiff" src/utils/calcDiff.js` — should match

Run `npm run lint` — zero warnings in both new files.
