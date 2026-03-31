# Requirements

_Конфигуратор металлических шкафов-локеров «Промет» — MVP = Этапы 1 + 2_

---

## Этап 1 — Frontend MVP (без Firebase)

### CONF-01 · Поднять состояние в App

**Описание:** Переместить все useState из Parameters в App.jsx. Передать config вниз в Parameters (через props), передать config + price вниз в Configurator.

**Принятие:**
- Parameters не хранит своё state, принимает всё через props + колбэки
- Configurator получает объект config и число price
- App.jsx — единственный владелец конфигурационного состояния

**Источник:** PROJECT.md Active Этап 1 / ARCHITECTURE.md Data Isolation

---

### CONF-02 · Динамический расчёт цены (заглушки)

**Описание:** Функция `calcPrice(config, catalog)` в App.jsx считает цену по формуле: базовая цена модели + наценки (толщина, замок, вентиляция, цвет корпуса, цвет двери). Данные — временные константы `STUB_CATALOG`.

**Принятие:**
- Цена пересчитывается при каждом изменении любого параметра
- Если модель не выбрана — цена отображается как `—`
- В `STUB_CATALOG` есть минимум 2 серии, 3 модели, 5 замков, 3 варианта толщины

**Формула:**
```
price = model.basePrice
      + (thickness !== '0.5' ? thicknessSurcharges[thickness] : 0)
      + lock.surcharge
      + (ventilation ? ventSurcharge : 0)
      + (bodyColor?.surcharge ?? 0)
      + (doorColor?.surcharge ?? 0)
```

**Источник:** PROJECT.md Этап 1 / FEATURES.md Real-Time Price Calculation

---

### CONF-03 · Логика колонки «Нестандартное исполнение»

**Описание:** Колонка «Нестандартное исполнение» в Configurator показывает только те параметры, которые отличаются от стандартных значений выбранной модели. Если изменений нет — показывает сообщение «Нет изменений».

**Принятие:**
- Функция `calcDiff(current, defaults)` в `src/utils/calcDiff.js`
- Сравнение через строгое равенство после `String()` (числа парсятся в `Number` на входе)
- Поля для сравнения: width, height, thickness, lockName, ventilation, bodyColorName, doorColorName
- `defaultSpecs` модели хранятся в `STUB_CATALOG` вместе с моделью

**Источник:** PROJECT.md Этап 1 / FEATURES.md Diff Logic

---

### CONF-04 · Автозаполнение стандартных габаритов при выборе модели

**Описание:** При выборе модели поля Width и Height автоматически заполняются стандартными значениями из `defaultSpecs` выбранной модели. Пользователь может изменить их вручную.

**Принятие:**
- Смена модели → width и height сбрасываются в `defaultSpecs.width` и `defaultSpecs.height`
- Если модель снята (пустой select) → width и height сбрасываются в `0` или пустую строку

**Источник:** PROJECT.md Этап 2 (перенесено в Этап 1 как часть CONF-01)

---

## Этап 2 — Firebase + MobX

### FIRE-01 · Инициализация Firebase

**Описание:** Создать `src/firebase.js` с инициализацией Firebase App и Firestore. Конфигурация через `VITE_FIREBASE_*` переменные в `.env.local`. Использовать модульный SDK (`firebase/firestore`, не `firebase/compat`).

**Принятие:**
- `src/firebase.js` экспортирует `db`
- `.env.local` в `.gitignore`
- Bundle Firebase: `firebase/app` + `firebase/firestore` ≈ 35 kB gzip (не legacy compat ≈ 150 kB)

**Источник:** FEATURES.md Firebase Data Loading / PITFALLS.md Vite + Firebase

---

### FIRE-02 · Структура Firestore и начальное наполнение

**Описание:** Создать коллекции в Firestore и наполнить тестовыми данными для разработки. Структура соответствует контрактам `CatalogStore`.

**Коллекции:**
```
/series/{id}            — { name, order }
/models/{id}            — { name, seriesId, basePrice, article, defaultSpecs, order }
/locks/{id}             — { name, surcharge, order }
/colors/{id}            — { hex, name, group, order, surcharge, available }
/thicknessSurcharges/{thickness}  — { surcharge }   // id: "0.6", "0.7"
/settings/ventilation   — { surcharge }
/settings/manager       — { name, phone, email }
```

**Принятие:**
- Минимум 2 серии, 3 модели, 5 замков, 11 цветов (покрывают текущий COLORS в ColorPicker.jsx)
- Security Rules: `allow read: if true; allow write: if false`

**Источник:** FEATURES.md / PROJECT.md Этап 2

---

### FIRE-03 · CatalogStore (MobX + Firestore)

**Описание:** `src/stores/CatalogStore.js` — MobX store для загрузки и хранения каталога из Firestore. Параллельная загрузка через `Promise.all`. Computed геттер `colorGroups` для ColorPicker.

**Принятие:**
- `load()` выполняет `getDocs` (не `onSnapshot`) для series, models, locks, colors, thicknessSurcharges, settings
- `runInAction()` оборачивает все мутации после `await`
- `loading` и `error` observable — компоненты показывают индикатор / кнопку «Повторить»
- `colorGroups` computed возвращает массив `[{ group, items[] }]` в формате ColorPicker

**Источник:** FEATURES.md CatalogStore / PITFALLS.md MobX + React 19

---

### FIRE-04 · ConfigStore (MobX)

**Описание:** `src/stores/ConfigStore.js` — MobX store для текущей конфигурации пользователя. Computed `totalPrice` и `changedSpecs` (diff от defaultSpecs).

**Принятие:**
- Observable: seriesId, modelId, thickness, width, height, lockId, ventilation, bodyColor, doorColor
- `totalPrice` — computed, реализует формулу из CONF-02
- `changedSpecs` — computed, реализует логику из CONF-03
- Actions для каждого поля: `setModel(id)` автозаполняет width/height из `catalogStore`

**Источник:** FEATURES.md / PROJECT.md Этап 2

---

### FIRE-05 · Подключение компонентов к MobX

**Описание:** Обернуть Parameters и Configurator в `observer()`. Подключить к stores через Context. App.jsx создаёт store-инстансы (модульные синглтоны) и запускает `catalogStore.load()` в `useEffect`.

**Принятие:**
- `src/stores/StoreContext.jsx` — создаёт Context и хук `useStore()`
- Все компоненты с MobX-зависимостями обёрнуты в `observer(function Name() {...})`
- ColorPicker принимает `colors` через prop (убрать внутренний `COLORS`)
- App.jsx: stores — модульные синглтоны, не создаются внутри компонента

**Источник:** PITFALLS.md MobX + React 19 / FEATURES.md Dynamic ColorPicker

---

## Этап 3 — PDF-экспорт

### PDF-01 · Установка и настройка @react-pdf/renderer

**Описание:** Установить `@react-pdf/renderer` v3.3+. Зарегистрировать шрифт Roboto (Regular, Medium, Bold) через `Font.register()`. Шрифты лежат в `public/fonts/` как TTF/WOFF2 с кириллическими глифами.

**Принятие:**
- `src/pdf/fonts.js` — регистрация шрифта (импортируется один раз)
- Кириллица отображается корректно в сгенерированном PDF
- `@react-pdf/renderer` импортируется лениво (dynamic import) — не увеличивает initial bundle

**Источник:** FEATURES.md PDF Document Generation / PITFALLS.md PDF Generation

---

### PDF-02 · Компонент ProposalDocument (КП)

**Описание:** `src/pdf/ProposalDocument.jsx` — JSX-компонент для PDF «Коммерческое предложение». Включает: шапку с логотипом, заголовок, таблицу характеристик, итоговую цену, контакты менеджера, дату, срок действия.

**Принятие:**
- Размер страницы A4, поля 20 мм
- Шрифт Roboto, кириллица читается
- Цена выделена крупно (16pt, жирный)
- Контакты менеджера — из `catalogStore.manager`
- Дата генерации — текущая дата

**Источник:** FEATURES.md ProposalDocument / PROJECT.md Этап 3

---

### PDF-03 · Компонент OrderDocument (Бланк НЗ)

**Описание:** `src/pdf/OrderDocument.jsx` — PDF «Бланк нестандартного заказа» для завода. Включает: все параметры конфигурации, артикул, серию/модель, технические отклонения от стандарта.

**Принятие:**
- Чёткая таблица параметров с разделением: стандарт vs. нестандарт
- Все обязательные поля для завода присутствуют
- Артикул и серия/модель выделены в шапке

**Источник:** PROJECT.md Этап 3

---

### PDF-04 · Кнопки скачивания PDF

**Описание:** Кнопки «КП для клиента» и «Бланк НЗ» в Configurator вызывают генерацию и скачивание соответствующих PDF через `pdf().toBlob()` + `URL.createObjectURL()`.

**Принятие:**
- Кнопки активны только если модель выбрана
- Имя файла: `КП_Промет_{article}_{YYYYMMDD}.pdf` / `НЗ_Промет_{article}_{YYYYMMDD}.pdf`
- Во время генерации кнопка показывает состояние загрузки (disabled + текст «Генерация...»)

**Источник:** FEATURES.md Download PDF / PROJECT.md Этап 3

---

## Этап 4 — Личный кабинет

### AUTH-01 · Firebase Authentication

**Описание:** Подключить Firebase Auth. Email/password аутентификация. Только для сотрудников Промет (регистрацию закрыть или ограничить через Firebase Admin / email-домен).

**Принятие:**
- Неавторизованный пользователь видит экран входа
- После входа — конфигуратор доступен
- Firestore Rules: `allow read, write: if request.auth != null`

**Источник:** PROJECT.md Этап 4

---

### AUTH-02 · История конфигураций

**Описание:** Сохранение конфигураций в Firestore `/users/{uid}/configs/{configId}`. Список сохранённых конфигураций в личном кабинете. Загрузка конфигурации из истории.

**Принятие:**
- Кнопка «Сохранить конфигурацию» в Configurator
- Список конфигураций с датой, серией, моделью и ценой
- Клик на конфигурацию → загружает её в конфигуратор

**Источник:** PROJECT.md Этап 4

---

## Нефункциональные требования

### NFR-01 · Безопасность Firestore

- Security Rules в Firestore запрещают запись из клиента (только чтение каталога)
- После добавления Auth — все операции требуют `request.auth != null`
- Firebase API key может быть публичным — секрет хранится в Firebase Rules, не в коде
- Установить бюджетный алерт в Google Cloud ($5–10) против runaway reads

### NFR-02 · Производительность

- Initial bundle ≤ 250 kB gzip (без PDF библиотеки)
- `@react-pdf/renderer` загружается лениво только при клике на кнопку PDF
- Firebase SDK: только модульные импорты (не compat)
- Catalog load time ≤ 2 сек на среднем офисном интернете

### NFR-03 · Совместимость браузеров

- Chrome, Firefox, Safari, Edge 110+
- Без IE / устаревших браузеров
- `persistentLocalCache` (Firestore offline) — опционально, не блокирует MVP

---

*Last updated: 2026-03-31 after research synthesis*
