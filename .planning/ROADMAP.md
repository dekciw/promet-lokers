# Roadmap

_Конфигуратор шкафов-локеров «Промет» — MVP = Этапы 1 + 2_

---

## Phase 1: Frontend MVP

**Goal:** Рабочий конфигуратор с динамической ценой и diff-логикой на временных заглушках. Готов к показу менеджеру.

**Requirements:** CONF-01, CONF-02, CONF-03, CONF-04

**Milestones:**
1. `App.jsx` — переносит state, передаёт config/price в Configurator и Parameters
2. `src/utils/calcDiff.js` — утилита diff
3. `src/data/stubCatalog.js` — временный каталог (2 серии, 3 модели, 5 замков)
4. Configurator рендерит динамические данные (не хардкод)

**Success Criteria:**
1. Все три колонки конфигуратора обновляются при изменении любого параметра в Parameters
2. Цена пересчитывается в реальном времени
3. Колонка «Нестандартное» показывает только изменённые параметры
4. При смене модели стандартные габариты подставляются автоматически
5. Нет предупреждений ESLint

---

## Phase 2: Firebase + MobX

**Goal:** Заменить заглушки на реальные данные из Firestore. Убрать prop drilling — ввести MobX.

**Requirements:** FIRE-01, FIRE-02, FIRE-03, FIRE-04, FIRE-05

**Milestones:**
1. Firebase project создан, `.env.local` настроен
2. `src/firebase.js` экспортирует `db`
3. `src/stores/CatalogStore.js` + `ConfigStore.js` + `StoreContext.jsx`
4. Parameters и Configurator подключены через `observer` + `useStore()`
5. ColorPicker принимает `colors` через prop из `catalogStore.colorGroups`
6. Security Rules задеплоены

**Success Criteria:**
1. Серии и модели загружаются из Firestore
2. Цвета в ColorPicker приходят из Firebase
3. Замки с наценками приходят из Firebase
4. Цена считается через `ConfigStore.totalPrice` (MobX computed)
5. Diff считается через `ConfigStore.changedSpecs`
6. Состояние загрузки (loading / error / retry) отображается в UI
7. Нет console.error при двойном маунте в StrictMode

---

## Phase 3: PDF Export

**Goal:** Кнопки «КП для клиента» и «Бланк НЗ» скачивают готовые PDF. Готов к фокус-группе.

**Requirements:** PDF-01, PDF-02, PDF-03, PDF-04

**Milestones:**
1. `@react-pdf/renderer` установлен, lazy import настроен
2. `public/fonts/` — Roboto TTF с кириллицей
3. `src/pdf/fonts.js` — Font.register
4. `src/pdf/ProposalDocument.jsx` — КП
5. `src/pdf/OrderDocument.jsx` — Бланк НЗ
6. Кнопки в Configurator вызывают генерацию и скачивание

**Success Criteria:**
1. PDF «КП» скачивается с корректной кириллицей
2. PDF «Бланк НЗ» скачивается с полной спецификацией
3. Initial bundle не увеличился (lazy import проверен)
4. Кнопки показывают «Генерация...» во время работы
5. Имена файлов содержат артикул и дату

---

## Phase 4: Auth + History

**Goal:** Авторизация сотрудников, история конфигураций. Выполняется после фокус-группы.

**Requirements:** AUTH-01, AUTH-02

**Milestones:**
1. Firebase Auth подключён
2. Экран входа (email + пароль)
3. `AuthStore` с `currentUser` observable
4. `Firestore /users/{uid}/configs` — сохранение и загрузка
5. UI личного кабинета (список конфигураций)

**Success Criteria:**
1. Неавторизованный пользователь видит только экран входа
2. После входа — конфигуратор доступен
3. Конфигурацию можно сохранить и загрузить из истории
4. Firestore Rules требуют auth != null

---

## Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | ○ Not started | Next: `/gsd:plan-phase 1` |
| Phase 2 | ○ Not started | Blocked by Phase 1 |
| Phase 3 | ○ Not started | After focus group |
| Phase 4 | ○ Not started | After focus group |

---

*Last updated: 2026-03-31 after requirements synthesis*
