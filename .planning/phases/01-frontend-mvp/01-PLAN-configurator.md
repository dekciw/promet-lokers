---
wave: 3
depends_on:
  - 01-PLAN-state-lift.md
files_modified:
  - src/components/Configurator/Configurator.jsx
autonomous: true
requirements:
  - CONF-01
  - CONF-02
  - CONF-03
  - CONF-04
---

# Plan 3: Configurator — Dynamic Rendering from Props

## Goal
Replace all hardcoded constants in Configurator.jsx with dynamic rendering from `config`, `price`, and `catalog` props, using `calcDiff` for the middle column.

## must_haves
- `Configurator.jsx` contains zero hardcoded spec arrays (`DEFAULT_SPECS`, `CHANGED_SPECS`, `FINAL_SPECS` removed)
- Middle column (Нестандартное исполнение) renders `calcDiff` output; shows "Нет изменений" when array is empty
- Right column price shows `12 000 ₽` format when model selected, `—` when not
- Top row shows actual series + model name from `catalog`, not hardcoded strings
- Article badge shows `model.article`, not `SAFE-IND-2024-XP-450`
- Buttons are `disabled` when no model selected

---

## Tasks

### Task 1: Replace Configurator.jsx with dynamic implementation

<read_first>
- src/components/Configurator/Configurator.jsx
- src/components/Configurator/Configurator.css
- src/utils/calcDiff.js
- src/data/stubCatalog.js
- src/App.jsx
</read_first>

<action>
Replace `src/components/Configurator/Configurator.jsx` entirely with:

```jsx
import { calcDiff } from '../../utils/calcDiff';
import './Configurator.css';

export default function Configurator({ config, price, catalog }) {
  const model = config.modelId ? catalog.models[config.modelId] : null;
  const series = model ? catalog.series.find(s => s.id === model.seriesId) : null;
  const lock = catalog.locks[config.lockId];

  // Build human-readable "current" object for calcDiff
  // width/height converted to Number to avoid false diff from '400' !== 400
  const currentForDiff = {
    width: config.width !== '' ? Number(config.width) : undefined,
    height: config.height !== '' ? Number(config.height) : undefined,
    thickness: config.thickness,
    lockName: lock?.name,
    ventilation: config.ventilation,
    bodyColorName: config.bodyColor?.name ?? undefined,
    doorColorName: config.doorColor?.name ?? undefined,
  };

  const defaults = model?.defaultSpecs ?? null;
  const changedSpecs = calcDiff(currentForDiff, defaults);

  // Left column: model's standard specs
  const defaultSpecsList = defaults
    ? [
        { label: 'Ширина:', value: `${defaults.width} мм` },
        { label: 'Высота:', value: `${defaults.height} мм` },
        { label: 'Толщина:', value: `${defaults.thickness} мм` },
        { label: 'Замок:', value: catalog.locks[defaults.lockId]?.name ?? defaults.lockId },
        { label: 'Вентиляция:', value: defaults.ventilation ? 'Да' : 'Нет' },
        { label: 'Цвет корпуса:', value: defaults.bodyColorName },
        { label: 'Цвет двери:', value: defaults.doorColorName },
      ]
    : [];

  // Right column: current user config
  const finalSpecsList = model
    ? [
        {
          label: 'Габариты:',
          value: `${config.width || defaults.width} × ${config.height || defaults.height} мм`,
        },
        { label: 'Толщина:', value: `${config.thickness} мм` },
        { label: 'Замок:', value: lock?.name ?? config.lockId },
        { label: 'Вентиляция:', value: config.ventilation ? 'Да' : 'Нет' },
        ...(config.bodyColor ? [{ label: 'Цвет корпуса:', value: config.bodyColor.name }] : []),
        ...(config.doorColor ? [{ label: 'Цвет двери:', value: config.doorColor.name }] : []),
      ]
    : [];

  const priceDisplay =
    price !== null ? `${price.toLocaleString('ru-RU')} ₽` : '—';

  const modelDisplay =
    series && model ? `${series.name} — ${model.name}` : 'Модель не выбрана';

  const articleDisplay = model?.article ?? '—';

  return (
    <main className='layout__content'>
      <div className='configurator'>
        <div className='top-row'>
          <div className='heading'>
            <h1 className='title'>Конфигурация</h1>
            <div className='model'>
              <span className='model-label'>Текущая модель:</span>
              <span className='model-value'>{modelDisplay}</span>
            </div>
          </div>

          <div className='article-badge'>
            <span className='badge-label'>Артикул</span>
            <span className='badge-code'>{articleDisplay}</span>
          </div>
        </div>

        <div className='config-grid'>
          {/* Left: Standard specs */}
          <div className='config-col config-col--default'>
            <span className='col-title'>
              Стандартное
              <br />
              исполнение
            </span>
            {defaultSpecsList.length === 0 ? (
              <p className='no-changes'>Выберите модель</p>
            ) : (
              <ul className='spec-list'>
                {defaultSpecsList.map(({ label, value }) => (
                  <li key={label} className='spec-item'>
                    <span className='spec-label'>{label}</span>
                    <span className='spec-value'>{value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Middle: Changed params only */}
          <div className='config-col config-col--changed'>
            <span className='col-title'>
              Нестандартное
              <br />
              исполнение
            </span>
            {changedSpecs.length === 0 ? (
              <p className='no-changes'>Нет изменений</p>
            ) : (
              <ul className='diff-list'>
                {changedSpecs.map(({ label, value }) => (
                  <li key={label} className='diff-item'>
                    <span className='diff-label'>{label}</span>
                    <span className='diff-value'>{value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right: Final config + price + action buttons */}
          <div className='config-col config-col--final'>
            <div className='col-top'>
              <span className='col-title'>
                Итоговая
                <br />
                конфигурация
              </span>
              <ul className='final-spec'>
                {finalSpecsList.map(({ label, value }) => (
                  <li key={label} className='final-item'>
                    <span className='final-label'>{label}</span>
                    <span className='final-value'>{value}</span>
                  </li>
                ))}
                <li className='final-item final-item--price'>
                  <span className='final-label'>Стоимость:</span>
                  <span className='final-value'>{priceDisplay}</span>
                </li>
              </ul>
            </div>

            <div className='actions'>
              <button className='btn btn--primary' disabled={!model}>
                КП для клиента
              </button>
              <button className='btn btn--secondary' disabled={!model}>
                Бланк НЗ
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

Key decisions:
- `DEFAULT_SPECS`, `CHANGED_SPECS`, `FINAL_SPECS` are removed entirely
- `currentForDiff.width` and `.height` use `Number()` to avoid false diffs from `'400' !== 400`
- Buttons disabled when `!model` — PDF functionality is Phase 3
- `no-changes` class reused for both placeholder states
</action>

<acceptance_criteria>
- `src/components/Configurator/Configurator.jsx` does NOT contain `DEFAULT_SPECS`
- `src/components/Configurator/Configurator.jsx` does NOT contain `CHANGED_SPECS`
- `src/components/Configurator/Configurator.jsx` does NOT contain `FINAL_SPECS`
- `src/components/Configurator/Configurator.jsx` does NOT contain `14 200`
- `src/components/Configurator/Configurator.jsx` does NOT contain `SAFE-IND-2024-XP-450`
- `src/components/Configurator/Configurator.jsx` contains `import { calcDiff } from '../../utils/calcDiff'`
- `src/components/Configurator/Configurator.jsx` contains `export default function Configurator({ config, price, catalog })`
- `src/components/Configurator/Configurator.jsx` contains `calcDiff(currentForDiff, defaults)`
- `src/components/Configurator/Configurator.jsx` contains `Нет изменений`
- `src/components/Configurator/Configurator.jsx` contains `price.toLocaleString('ru-RU')`
- `src/components/Configurator/Configurator.jsx` contains `disabled={!model}`
</acceptance_criteria>

---

## Verification

End-to-end manual test after `npm run dev`:

1. **Initial state:** all columns empty/placeholder; price `—`; article `—`; buttons disabled
2. **Select series** "Серия «ML»" → model dropdown filters to ML models only
3. **Select model** "Шкаф металлический усиленный":
   - Left column: width 400 мм, height 1850 мм, thickness 0.5 мм, замок Ключевой (Базовый), вентиляция Нет
   - Middle column: "Нет изменений"
   - Right column: price `12 000 ₽`; article `SHL-ML-USI`; buttons enabled
4. **Change thickness** to "0.7" → middle column shows "Толщина металла: 0.7 мм"; price → `13 500 ₽`
5. **Change width** to `450` → middle column shows "Ширина: 450 мм"; price unchanged
6. **Toggle ventilation** "Да" → middle column shows "Вентиляция: Да"; price +500
7. **Select lock** "Замок электронный" → middle column shows "Замок: Замок электронный"; price +2100
8. **Reset all** to defaults → middle column returns to "Нет изменений"
9. `npm run lint` → zero warnings or errors

Run all acceptance criteria greps to confirm.
