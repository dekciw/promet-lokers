---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-05-06T11:14:52.736Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 6
  completed_plans: 5
---

# Project State

_GSD workflow state для Конфигуратор «Промет»_

---

## Current Phase

**Phase 3 — PDF-документы (КП + Бланк НЗ)** · `in-progress`

Plan 03-01 завершён (2026-05-06): @react-pdf/renderer установлен, logo.png создан, buildNZParams() реализован (23 теста).

Plan 03-02 завершён (2026-05-06): fonts.js (Roboto Cyrillic TTF jsDelivr), NZDocument.jsx (2 страницы), generateNZ.js (async download + getNZFilename 7 тестов DOC_5), PERF_3 соблюдён.

Next action: выполнить plan 03-03 — NZModal + кнопка в Configurator

Last session: 2026-05-06T11:14:52.733Z

---

## Phase History

| Phase | Status | Completed | Notes |
|-------|--------|-----------|-------|
| Phase 1 | ✓ complete | 2026-04-01 | Каталог Firebase, степпер, diff, анимации, все параметры |
| Phase 2 | ✓ complete | 2026-04-21 | Формула цены от экономистов, вентиляция enum, скидка, вес, срок, sync-sheets |
| Phase 3 | in-progress | — | PDF НЗ. Plan 01 завершён (2026-05-06): react-pdf, logo.png, buildNZParams() |
| Phase 4 | blocked | — | Авторизация + история конфигураций. После фокус-группы |

---

## Покрытие требований

### Must Have — 14/14 ✅

Все CONF_1–CONF_14 реализованы в Phase 1.

### Нефункциональные — Must Have (5/7)

| # | Требование | Статус |
|---|-----------|--------|
| PERF_1 | Загрузка ≤ 2 сек | ⚠️ Не измерялось |
| PERF_2 | Цена пересчитывается мгновенно | ✅ |
| SEC_1 | Firestore rules — только чтение | ✅ |
| SEC_2 | Доступ только авторизованным | ❌ Phase 4 |
| SEC_3 | API-ключ в .env | ✅ |
| REL_1 | Кроссбраузерность Chrome/Firefox/Safari/Edge | ⚠️ Не проверялось |
| REL_2 | Кнопка «Повторить» при ошибке | ✅ |

### Нефункциональные — Should Have (3/5)

| # | Требование | Статус |
|---|-----------|--------|
| PERF_3 | Бандл ≤ 250кБ, PDF lazy load | ⚠️ Phase 3 |
| MAIN_1 | Обновление каталога через Google Sheets | ✅ |
| MAIN_2 | Компоненты в отдельных папках | ✅ |
| USAB_1 | Освоение за 15 минут | ⚠️ Фокус-группа |
| USAB_2 | Явные состояния элементов | ✅ |

### Нефункциональные — Nice to Have (2/4)

| # | Требование | Статус |
|---|-----------|--------|
| PERF_4 | Кэш каталога в браузере | ✅ localStorage, TTL 24ч |
| USAB_3 | Отображение от 1280px | ✅ |
| MAIN_3 | Бюджетный лимит Google Cloud | ❌ Вручную |
| SEC_4 | Авто-завершение сессии | ❌ Phase 4 |

### Should Have — 1/7

| # | Требование | Статус |
|---|-----------|--------|
| DOC_1 | PDF «Коммерческое предложение» | ❌ Phase 3 |
| DOC_2 | Состав КП: логотип, таблица, цена, контакты, дата, срок | ❌ Phase 3 |
| DOC_3 | PDF «Бланк нестандартного заказа» | ✅ NZDocument.jsx 03-02 |
| DOC_4 | Состав НЗ: артикул, серия, модель, параметры с выделением отклонений | ✅ buildNZParams() 03-01 |
| DOC_5 | Имя файла = `{артикул}_{дата}.pdf` | ✅ getNZFilename() 03-02 |
| DOC_6 | Кнопки PDF активны только при выбранной модели | ✅ |
| AUTH_1 | Авторизация по email и паролю | ❌ Phase 4 |

### Nice to Have — 2/6

| # | Требование | Статус |
|---|-----------|--------|
| HIST_1 | Сохранение конфигурации в личном кабинете | ❌ Phase 4 |
| HIST_2 | История конфигураций с датой, моделью, ценой | ❌ Phase 4 |
| HIST_3 | Загрузка сохранённой конфигурации | ❌ Phase 4 |
| UX_1 | Анимация строк в колонке отклонений | ✅ |
| UX_2 | Фирменный стиль Промет | ✅ |
| UX_3 | Индикатор загрузки + кнопка «Повторить» | ✅ |

---

## Что реализовано (Phase 1 + Phase 2 технические + Phase 2 UX)

- Загрузка каталога из Firebase Firestore (REST API)
- Серии: ML, LS-серия
- Параметры: серия, модель, ширина, высота, глубина, толщина корпуса, толщина двери, замок, вентиляция, цвет корпуса, цвет двери
- Степпер ±50мм для габаритов с ограничениями и визуальной обратной связью (тряска, красная обводка)
- Diff-логика: нестандартное исполнение показывает только изменённые параметры
- Анимации появления / исчезновения строк (0.4s cubic-bezier)
- При выборе модели авто-подставляются все базовые значения
- Плейсхолдеры серии/модели не выбираемы повторно после выбора
- Кнопки КП/НЗ визуально заблокированы без выбранной модели
- Header: логотип Промет, декоративные города, фон #0C53B3, высота 99px
- Адаптив: ноутбук, планшет, мобильный
- API-ключ Firebase в `.env` (не в коде)
- Firestore rules: только чтение из браузера
- localStorage кэш каталога (TTL 24ч) как fallback при недоступности Firebase
- Кнопка «Повторить» при ошибке загрузки каталога
- ColorPicker: плейсхолдер «Стандартный цвет», кнопка сброса в дропдауне
- Явные hover/active/focus состояния у всех интерактивных элементов

### Phase 2 UX-улучшения v2 (2026-04-09 — 2026-04-13)

**Синхронизация данных:**

- `loadCatalog.js` переключён с opensheet.elk.sh прокси на Firebase Firestore напрямую
- Скрипт синхронизации Google Sheets → Firebase для обновления каталога

**Количество шкафов:**

- Поле «Количество шкафов» перенесено на шаг 2 (рядом с моделью)
- Фикс степпера и кнопки сброса параметров

**UX-улучшения:**

- Копирование артикула по клику (toast-уведомление или визуальный фидбек)
- Мобильная sticky-плашка с итоговой ценой и кнопками КП/НЗ
- Оранжевая обводка полей при отклонении от дефолтных значений модели
- Бейдж изменений на шаге 3 степпера (счётчик изменённых параметров)
- Цветовой квадрат в итоговой карточке конфигурации
- Улучшения CustomSelect: выпадающие списки, кнопки, поля ввода

### Phase 2 UX-улучшения (2026-04-07 — 2026-04-09)

**Анимированный степпер навигации (Parameters.jsx):**

- Библиотека `motion` v12 (`motion/react`) — AnimatePresence, motion.div, motion.path
- 3 шага: Серия → Модель → Параметры; лейблы над кружками (absolute positioning)
- Авто-переход между шагами через 350ms после выбора (seriesId → step 2, modelId → step 3)
- Слайд-анимация контента с направлением (`custom` + `variants`, `mode='popLayout'`)
- Анимированные кружки-индикаторы: `motion.div` (background/boxShadow/scale), `motion.path` (pathLength галочки)
- Пружинная прогресс-линия (`scaleX`, `transform-origin: left`)
- Кнопки шагов кликабельны для возврата назад
- `isSliding` state: `overflow: hidden` только во время анимации (450ms), затем `overflow: visible` для дропдаунов

**Взаимная блокировка дропдаунов:**

- `openSelectId` state в Parameters — только один дропдаун открыт одновременно
- CustomSelect стал контролируемым: `isOpen` / `onOpenChange` props

**Анимации (Emil Kowalski принципы):**

- Все transitions только `transform` + `opacity` (GPU-свойства)
- Enter: `ease-out`, hover только через `@media (hover: hover) and (pointer: fine)`
- Все кнопки: `scale(0.97)` или `translate(1px, 1px)` на `:active`
- CSS-переменные easing: `--ease-out`, `--ease-spring`, `--ease-in-out` добавлены в `index.css`
- `itemIn`/`itemOut` в Configurator.module.css: только opacity + translateY, без max-height
- Entrance-анимация LoginCard: `cardIn` (translateY(16px) + scale(0.98) → normal)
- Тултипы: `prefers-reduced-motion`, GPU-transform

**Кнопка «Сбросить»:**

- Uiverse-стиль: красный кружок (38px), при hover раскрывается в таблетку «Сбросить» (120px)
- Иконка: крестик X с `strokeLinecap='round'` (жирный, скруглённые концы)
- Всегда видима (красный фон), не скрыта за hover-триггером

**Тонкий скроллбар в дропдаунах:**

- `scrollbar-width: thin` + webkit custom scrollbar (8px, border-radius 4px)

**Фикс оранжевой обводки активных кнопок:**

- `.toggleBtnActive:hover`, `.lockItemActive:hover`, `.ventBtnActive:hover` — `border-color: var(--c-orange)` в hover media query

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-31 | MVP = Phase 1 + Phase 2 | Показ менеджеру + фокус-группа на полных данных |
| 2026-03-31 | Firebase getDocs (не onSnapshot) | Каталог read-once; onSnapshot × N менеджеров = quota risk |
| 2026-04-01 | Google Sheets как интерфейс для менеджеров | Менеджеры редактируют данные напрямую без доступа к Firebase |
| 2026-04-01 | Firebase Firestore как БД приложения | Быстрая загрузка без зависимости от сторонних прокси |
| 2026-04-01 | Apps Script для синхронизации GSheets → Firebase | Одноразовый импорт + ручное обновление при изменениях |
| 2026-04-01 | MobX пропущен | Для текущего MVP prop drilling приемлем |
| 2026-04-01 | Формула цены — заглушка до встречи с менеджерами | Точная формула неизвестна |
| 2026-04-03 | Доплата у замков не отображается в UI | Решение менеджера (CONF_7) |
| 2026-04-03 | localStorage TTL = 24ч | Каталог меняется редко; стабильность > свежесть |
| 2026-04-03 | Стандартный цвет = null (не выбирать) | Менеджеры не трогают цвет если нужен стандарт; сброс через дропдаун |
| 2026-04-07 | motion v12 вместо самодельных анимаций | AnimatePresence + motion.path дают production-ready анимации без ручного управления высотами |
| 2026-04-07 | mode='popLayout' в AnimatePresence | Exiting элемент становится absolute, entering сразу занимает место — высота контейнера адаптируется автоматически |
| 2026-04-07 | isSliding state (450ms) для overflow | overflow: hidden нужен только во время слайд-анимации, иначе дропдауны обрезаются |
| 2026-04-07 | Кнопка сброса — всегда красный кружок | Фокус-группа: скрытая кнопка недостаточно заметна; красный фон = деструктивное действие всегда видимо |
| 2026-04-09 | Лейблы степпера — absolute над кружком | Кнопка шириной = кружку даёт минимальный зазор между кружком и линией |
| 2026-04-13 | loadCatalog.js переключён на Firebase Firestore напрямую | Убрана зависимость от opensheet.elk.sh прокси — нестабильный сторонний сервис |
| 2026-04-13 | Количество шкафов на шаге 2 | Логичнее рядом с выбором модели, не на шаге параметров |
| 2026-04-13 | Оранжевая обводка при отклонении от дефолта | Явный визуальный сигнал что параметр нестандартный — не только в колонке diff |
| 2026-04-13 | Установлены скиллы debugging-strategies + security-auditor | Системная отладка и security-аудит перед деплоем; триггеры прописаны в CLAUDE.md |
| 2026-05-06 | sips для SVG→PNG конвертации logo | macOS native sips автоматизировал ручной шаг Task 2; PNG 5100x2300 RGBA |
| 2026-05-06 | buildNZParams: isNonStandard замка vs 'key_basic' | Стандартный замок всегда key_basic по контракту; сравнение с defaults.lockId не нужно |
| 2026-05-06 | Number() сравнение габаритов в buildNZParams | config хранит строки ('600'), defaults — числа (600); Number() устраняет ложные isNonStandard |
| 2026-05-06 | fonts.js — side-effect модуль без экспортов | Font.register один раз из generateNZ.js; вызов внутри компонента = многократная перерегистрация |
| 2026-05-06 | getUTCFullYear/Month/Date в getNZFilename | Детерминированное форматирование даты в юнит-тестах независимо от часового пояса |
| 2026-05-06 | generateNZ только через dynamic import | Initial bundle не включает @react-pdf/renderer ~500kB — PERF_3 соблюдён |

---

## Open Questions

| # | Вопрос | Статус |
|---|--------|--------|
| 1 | Толщина 0.5 мм — ставка 10% в таблице, не 0%? | ❓ Уточнить у экономистов → `docs/PRICE_FORMULA.md` §9 |
| 2 | Вентиляция от 100 шт. — ставка не заполнена | ❓ Уточнить у экономистов |
| 3 | Цвет корпуса кат. 3: от 50 шт. = 30%, от 51 шт. = 20% — верно? | ❓ Уточнить у экономистов |
| 4 | Ширина нестандартная — доплаты нет? | ❓ Подтвердить у экономистов |
| 5 | Нестандартная высота/глубина вне таблицы — всегда ПСС? | ❓ Подтвердить у экономистов |
| 6 | Лимит 2 исполнения — с 3-го всегда ПСС? | ❓ Подтвердить |
| 7 | Контакты менеджера для КП (имя, телефон, email) | ⏳ До Phase 3 |
| 8 | Логотип для PDF (png/svg, размер) | ⏳ До Phase 3 |
| 9 | Срок действия КП — фиксированный или настраиваемый? | ⏳ До Phase 3 |
| 10 | Список email сотрудников для Firebase Auth | ⏳ До Phase 4 |
| 11 | Лимит хранимых конфигураций на пользователя | ⏳ До Phase 4 |

---

## Known Issues

_Все известные проблемы закрыты._

---

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260413-ueg | Исправить focus-visible на 7 интерактивных контролах | 2026-04-13 | 87bf245 | [260413-ueg-focus-visible-7](.planning/quick/260413-ueg-focus-visible-7/) |
| 260413-uir | MotionConfig reducedMotion="user" в App.jsx — поддержка prefers-reduced-motion | 2026-04-13 | a9389d0 | [260413-uir-app-jsx-motionconfig-reducedmotion-user-](.planning/quick/260413-uir-app-jsx-motionconfig-reducedmotion-user-/) |
| 260413-umx | Переименовать 'НЗ' в 'Бланк НЗ' в мобильной sticky-плашке | 2026-04-13 | e55df66 | [260413-umx-sticky](.planning/quick/260413-umx-sticky/) |
| 260413-urw | Выровнять off-grid spacing по 4px-сетке в Configurator.module.css | 2026-04-13 | 38c02d6 | [260413-urw-off-grid-spacing-4px-configurator-module](.planning/quick/260413-urw-off-grid-spacing-4px-configurator-module/) |
| 260413-uuv | Убрать автосохранение конфигурации в localStorage (promet_config) | 2026-04-13 | a67971b | [260413-uuv-localstorage-promet-config](.planning/quick/260413-uuv-localstorage-promet-config/) |

---

## Codebase Snapshot (2026-04-09)

- **Stack:** React 19 + Vite + CSS Modules + `motion` v12
- **Data:** Google Sheets (менеджеры) → Apps Script → Firebase Firestore → `src/api/loadCatalog.js` → localStorage cache → App state
- **State:** Context API (`AppContext`) — config, catalog, setters; внутри Parameters: stepperStep, direction, isSliding, openSelectId
- **Components:** Header, Footer, Configurator, Parameters, ColorPicker, StepperInput, SlotCounter, CustomSelect (controlled)
- **Catalog:** Firebase Firestore REST API напрямую (не через opensheet.elk.sh) + localStorage fallback (TTL 24ч)
- **Security:** API-ключ в `.env`, Firestore rules — только чтение
- **Анимации:** motion/react (AnimatePresence, motion.div, motion.path), CSS keyframes для входа/выхода строк
- **Новые UX-фичи:** копирование артикула, sticky-плашка на мобильных, оранжевая обводка при изменениях, бейдж на шаге 3, количество шкафов на шаге 2

**Инструменты разработки:**

- `ui-ux-pro-max` — дизайн-решения (`.claude/skills/ui-ux-pro-max/`)
- `context7-mcp` — документация библиотек (`~/.claude/skills/context7-mcp/`)
- `debugging-strategies` — системная отладка (`~/.claude/skills/debugging-strategies/`)
- `security-auditor` — проверка безопасности перед деплоем (`~/.claude/skills/security-auditor/`)
- GSD воркфлоу: `discuss-phase → plan-phase → execute-phase → verify-work → ship`
- CLAUDE.md содержит триггеры автоматического выбора скиллов

---

*Last updated: 2026-04-21 — Phase 2 завершена: формула цены, вентиляция, скидка, sync-sheets переписан. Документация формулы: `docs/PRICE_FORMULA.md`*
