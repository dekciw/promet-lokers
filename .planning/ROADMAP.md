# Roadmap

_Конфигуратор шкафов-локеров «Промет» — MVP = Этапы 1 + 2_

---

## Phase 1 — Frontend MVP (React only, без Firebase)

**Цель:** Рабочий конфигуратор с динамической ценой и diff-логикой на временных заглушках. Готов к показу менеджеру.

**Реквизиты:**
- CONF-01 · Поднять состояние в App (поднять useState, Props drilling)
- CONF-02 · Динамический расчёт цены (STUB_CATALOG + calcPrice)
- CONF-03 · Логика «Нестандартное исполнение» (calcDiff + defaultSpecs)
- CONF-04 · Автозаполнение габаритов при выборе модели

**Milestones:**
1. `App.jsx` — переносит state, передаёт config/price в Configurator и Parameters
2. `src/utils/calcDiff.js` — утилита diff
3. `src/data/stubCatalog.js` — временный каталог (2 серии, 3 модели, 5 замков)
4. Configurator рендерит динамические данные (не хардкод)

**Definition of Done:**
- [ ] Все три колонки конфигуратора обновляются при изменении любого параметра в Parameters
- [ ] Цена пересчитывается в реальном времени
- [ ] Колонка «Нестандартное» показывает только изменённые параметры
- [ ] При смене модели стандартные габариты подставляются автоматически
- [ ] Нет предупреждений ESLint

---

## Phase 2 — Firebase + MobX

**Цель:** Заменить заглушки на реальные данные из Firestore. Убрать prop drilling — ввести MobX.

**Реквизиты:**
- FIRE-01 · Инициализация Firebase (модульный SDK)
- FIRE-02 · Структура Firestore и начальное наполнение
- FIRE-03 · CatalogStore (загрузка каталога)
- FIRE-04 · ConfigStore (конфигурация + totalPrice computed + changedSpecs computed)
- FIRE-05 · Подключение компонентов к MobX (observer + Context)

**Milestones:**
1. Firebase project создан, `.env.local` настроен
2. `src/firebase.js` экспортирует `db`
3. `src/stores/CatalogStore.js` + `ConfigStore.js` + `StoreContext.jsx`
4. Parameters и Configurator подключены через `observer` + `useStore()`
5. ColorPicker принимает `colors` через prop из `catalogStore.colorGroups`
6. Security Rules задеплоены

**Definition of Done:**
- [ ] Серии и модели загружаются из Firestore
- [ ] Цвета в ColorPicker приходят из Firebase
- [ ] Замки с наценками приходят из Firebase
- [ ] Цена считается через `ConfigStore.totalPrice` (MobX computed)
- [ ] Diff считается через `ConfigStore.changedSpecs`
- [ ] Состояние загрузки (loading / error / retry) отображается в UI
- [ ] Нет console.error при двойном маунте в StrictMode

---

## Phase 3 — PDF-экспорт

**Цель:** Кнопки «КП для клиента» и «Бланк НЗ» скачивают готовые PDF. Готов к фокус-группе.

**Реквизиты:**
- PDF-01 · @react-pdf/renderer + Roboto + кириллица
- PDF-02 · ProposalDocument (КП)
- PDF-03 · OrderDocument (Бланк НЗ)
- PDF-04 · Кнопки скачивания

**Milestones:**
1. `@react-pdf/renderer` установлен, lazy import настроен
2. `public/fonts/` — Roboto TTF с кириллицей
3. `src/pdf/fonts.js` — Font.register
4. `src/pdf/ProposalDocument.jsx` — КП
5. `src/pdf/OrderDocument.jsx` — Бланк НЗ
6. Кнопки в Configurator вызывают генерацию и скачивание

**Definition of Done:**
- [ ] PDF «КП» скачивается с корректной кириллицей
- [ ] PDF «Бланк НЗ» скачивается с полной спецификацией
- [ ] Initial bundle не увеличился (lazy import проверен)
- [ ] Кнопки показывают «Генерация...» во время работы
- [ ] Имена файлов содержат артикул и дату

---

## Phase 4 — Личный кабинет

**Цель:** Авторизация сотрудников, история конфигураций. Выполняется после фокус-группы.

**Реквизиты:**
- AUTH-01 · Firebase Authentication (email/password)
- AUTH-02 · История конфигураций в Firestore

**Milestones:**
1. Firebase Auth подключён
2. Экран входа (email + пароль)
3. `AuthStore` с `currentUser` observable
4. `Firestore /users/{uid}/configs` — сохранение и загрузка
5. UI личного кабинета (список конфигураций)

**Definition of Done:**
- [ ] Неавторизованный пользователь видит только экран входа
- [ ] После входа — конфигуратор доступен
- [ ] Конфигурацию можно сохранить и загрузить из истории
- [ ] Firestore Rules требуют auth != null

---

## Текущий статус

| Phase | Статус | Заметки |
|-------|--------|---------|
| Phase 1 | 🔲 Не начат | Следующий шаг → `/gsd:plan-phase 1` |
| Phase 2 | 🔲 Не начат | Блокирован Phase 1 |
| Phase 3 | 🔲 Не начат | Выполняется после фокус-группы |
| Phase 4 | 🔲 Не начат | Выполняется после фокус-группы |

---

*Last updated: 2026-03-31 after requirements synthesis*
