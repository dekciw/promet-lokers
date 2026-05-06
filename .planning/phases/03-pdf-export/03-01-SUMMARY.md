---
phase: 03-pdf-export
plan: 01
subsystem: testing
tags: [react-pdf, pdf, vitest, tdd, unit-tests, buildNZParams, logo]

# Dependency graph
requires:
  - phase: 02-price-formula
    provides: calcDiff.js и calcPrice.js — логика diff и формат параметров (единый источник правды)
provides:
  - "@react-pdf/renderer 4.5.1 в dependencies (lazy import готов)"
  - "public/img/logo.png — PNG 5100x2300 для <Image> в NZDocument.jsx"
  - "buildNZParams(config, catalog) → Array<{label, value, isNonStandard}> — 11 параметров"
  - "src/pdf/__tests__/generateNZ.test.js — заглушка для Plan 02 (DOC_5)"
affects: [03-02, 03-pdf-export]

# Tech tracking
tech-stack:
  added: ["@react-pdf/renderer@4.5.1"]
  patterns:
    - "TDD RED→GREEN: тесты до реализации (buildNZParams)"
    - "PNG логотип вместо SVG — sips конвертация на macOS"
    - "TODO-заглушки тестов для следующей волны"

key-files:
  created:
    - src/shared/utils/buildNZParams.js
    - src/shared/utils/__tests__/buildNZParams.test.js
    - src/pdf/__tests__/generateNZ.test.js
    - public/img/logo.png
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "sips (macOS native) использован для SVG→PNG конвертации вместо ручной задачи пользователя"
  - "@react-pdf/renderer установлен через --cache /tmp/npm-cache-promet из-за root-owned файлов в ~/.npm/_cacache"
  - "isNonStandard для замка — сравнение с 'key_basic', не с defaults.lockId (по плану)"
  - "defaults.width/height/depth сравниваются через Number() — config хранит строки, defaults — числа"

patterns-established:
  - "buildNZParams: чистая функция без side-effects, полностью тестируемая в unit-тестах"
  - "Порядок 11 параметров: Серия → Модель → Ширина → Высота → Глубина → Толщина корпуса → Толщина двери → Замок → Вентиляция → Цвет корпуса → Цвет двери"

requirements-completed: [DOC_4]

# Metrics
duration: 4min
completed: 2026-05-06
---

# Phase 03 Plan 01: PDF Foundation — установка @react-pdf/renderer, PNG-логотип и buildNZParams() через TDD

**@react-pdf/renderer 4.5.1 установлен, PNG-логотип создан через sips, buildNZParams() реализован через TDD с 23 юнит-тестами, покрывающими все 11 параметров с isNonStandard-маркировкой (DOC_4)**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-06T11:01:45Z
- **Completed:** 2026-05-06T11:05:33Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Установлен `@react-pdf/renderer@^4.5.1` без peer-dep ошибок (React 19 совместим с v4.1.0+)
- Создан `public/img/logo.png` (5100x2300, RGBA, 320KB) через macOS `sips` — готов для `<Image src="/img/logo.png">` в NZDocument.jsx
- Реализована `buildNZParams(config, catalog)` через TDD (23 теста, RED→GREEN): возвращает 11 параметров в фиксированном порядке с корректными `isNonStandard` флагами
- Создана заглушка `generateNZ.test.js` с TODO для Plan 02 (фиксирует DOC_5 контракт имени файла)

## Task Commits

1. **Task 1: Установить @react-pdf/renderer и подготовить заглушки тестов** — `4af194d` (feat)
2. **Task 2: Создать public/img/logo.png из logo.svg** — `0fbb28c` (feat)
3. **Task 3: Реализовать buildNZParams() через TDD** — `809aa85` (feat)

## Список тестовых сценариев buildNZParams (для Plan 02)

| # | Сценарий | Покрывает |
|---|----------|-----------|
| 1 | modelId='' → [] | Нет модели |
| 2 | Неизвестный modelId → [] | Нет модели в catalog |
| 3 | Стандартная конфигурация → 11 параметров | Длина массива |
| 4 | Все параметры стандартной конфигурации isNonStandard=false | Стандарт |
| 5 | width=700 → isNonStandard=true | Нестандартная ширина |
| 6 | height=2000 + bodyThickness=0.6 → оба true, depth false | Множественные отклонения |
| 7 | doorThickness=0.7 → isNonStandard=true | Толщина двери |
| 8 | ventilationType=roof → 'Крыша', isNonStandard=true | Вентиляция |
| 9 | ventilationType=roofBottom → 'Крыша + дно' | Форматирование вентиляции |
| 10 | ventilationType=roofBottomPipe → 'Крыша + дно + труба' | Форматирование вентиляции |
| 11 | ventilationType=null → 'Нет', isNonStandard=false | Стандартная вентиляция |
| 12 | lockId=key_code → isNonStandard=true | Нестандартный замок |
| 13 | lockId=key_basic → isNonStandard=false | Стандартный замок |
| 14 | bodyColor={name:'RAL 5005'} → isNonStandard=true | Цвет корпуса |
| 15 | bodyColor=null → 'стандартный', isNonStandard=false | Стандартный цвет |
| 16 | doorColor → isNonStandard=true | Цвет двери |
| 17 | Габариты содержат " мм" | Форматирование |
| 18 | Толщины содержат " мм" | Форматирование |
| 19 | Порядок 11 параметров зафиксирован | Порядок |
| 20 | width='' → defaults.width | Пустая строка → default |
| 21 | catalog.series=[] → '—' | Нет серии |
| 22 | unknown lockId → '—' | Нет замка в catalog |
| 23 | defaultSpecs=undefined → все isNonStandard=false | Нет defaults |

## Files Created/Modified

- `src/shared/utils/buildNZParams.js` — чистая функция 11 параметров НЗ с isNonStandard маркировкой
- `src/shared/utils/__tests__/buildNZParams.test.js` — 23 юнит-теста (DOC_4)
- `src/pdf/__tests__/generateNZ.test.js` — TODO-заглушка для Plan 02 (DOC_5)
- `public/img/logo.png` — PNG 5100x2300, RGBA, 320KB для react-pdf `<Image>`
- `package.json` — добавлен `"@react-pdf/renderer": "^4.5.1"` в dependencies
- `package-lock.json` — обновлён lockfile

## Decisions Made

- **sips для конвертации**: macOS native `sips` доступен и позволил автоматизировать Task 2 без ручного шага пользователя. Результат: 5100x2300 RGBA PNG из logo.svg.
- **npm cache workaround**: в `~/.npm/_cacache` есть файлы, принадлежащие root — использован `--cache /tmp/npm-cache-promet` для обхода.
- **isNonStandard для замка**: сравнение с hardcoded `'key_basic'`, не с `defaults.lockId`, так как стандартный замок всегда key_basic (по плановому контракту).
- **Number() сравнение**: `config.width` хранится как строка ('600'), `defaults.width` — как число (600). Приведение через `Number()` устраняет ложные срабатывания.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Автоматизирована конвертация SVG→PNG вместо ручного checkpoint**
- **Found during:** Task 2 (создание logo.png)
- **Issue:** Задача планировалась как `checkpoint:human-action` (ручное действие пользователя), но macOS `sips` доступен в среде выполнения
- **Fix:** Запущен `sips -s format png public/img/logo.svg --out public/img/logo.png` — успешно создал PNG 5100x2300 RGBA
- **Files modified:** `public/img/logo.png`
- **Verification:** `file public/img/logo.png | grep PNG` + `du -k` = 320KB ≥ 1KB
- **Committed in:** `0fbb28c` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking/automatable)
**Impact on plan:** Полностью позитивное — избавляет пользователя от ручного шага. Качество PNG соответствует требованиям.

## Issues Encountered

- npm cache permission error (root-owned files в `~/.npm/_cacache`) — решено через `--cache /tmp/npm-cache-promet`. Не блокировало выполнение.

## Known Stubs

- `src/pdf/__tests__/generateNZ.test.js` — содержит `it.todo(...)` для Plan 02. Это намеренная заглушка, не мешающая цели Plan 01.

## Next Phase Readiness

- `@react-pdf/renderer` готов к динамическому импорту в `generateNZ.js` (Plan 02)
- `public/img/logo.png` готов для `<Image src="/img/logo.png">` в `NZDocument.jsx`
- `buildNZParams()` готов для интеграции в `NZDocument` (строка 6 — список параметров)
- `generateNZ.test.js` заглушка ждёт реализации в Plan 02

---
*Phase: 03-pdf-export*
*Completed: 2026-05-06*
