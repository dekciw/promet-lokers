# Features Research

_Контекст: React 19 + Vite 8 + MobX (планируется) + Firebase Firestore. Стек нельзя менять._

---

## Real-Time Price Calculation

### Вывод: computed в MobX — правильный выбор для Этапа 2

На Этапе 1 (только React, без MobX) цена считается чистой функцией или `useMemo`.
На Этапе 2 (MobX + Firebase) цена делается `computed` в `ConfigStore` — это идиоматично и даёт автоматическую инвалидацию при любом изменении параметра.

**Сравнение подходов:**

| Подход | Когда использовать | Плюсы | Минусы |
|---|---|---|---|
| Чистая функция | До MobX (Этап 1, заглушки) | Нулевая зависимость | Пересчёт при каждом рендере |
| `useMemo` | До MobX, если вычисление тяжёлое | Кешируется React'ом | Лишний код, не нужен в MobX |
| MobX `computed` | Этап 2+ (основной путь) | Авто-кеш, реактивность, граф зависимостей | Требует MobX |

### Паттерн для Этапа 1 (чистая функция, временные заглушки)

Состояние поднимается в `App.jsx`, цена вычисляется функцией прямо при рендере:

```jsx
// App.jsx
function calcPrice(config, catalog) {
  if (!catalog.models[config.modelId]) return null;
  const base = catalog.models[config.modelId].basePrice; // например 12 000

  // Наценки за нестандартные параметры
  const thicknessSurcharge = config.thickness !== '0.5'
    ? catalog.thicknessSurcharges[config.thickness] ?? 0
    : 0;
  const lockSurcharge = catalog.locks[config.lockId]?.surcharge ?? 0;
  const ventSurcharge = config.ventilation ? catalog.ventSurcharge : 0;
  const colorBodySurcharge = config.bodyColor?.surcharge ?? 0;
  const colorDoorSurcharge = config.doorColor?.surcharge ?? 0;

  return base + thicknessSurcharge + lockSurcharge + ventSurcharge
    + colorBodySurcharge + colorDoorSurcharge;
}

export default function App() {
  const [config, setConfig] = useState({ modelId: '', thickness: '0.5', ... });
  const price = calcPrice(config, STUB_CATALOG); // пересчёт при рендере — ок для MVP
  return <Configurator config={config} price={price} />;
}
```

### Паттерн для Этапа 2 (MobX computed)

```js
// src/stores/ConfigStore.js
import { makeAutoObservable, computed } from 'mobx';

class ConfigStore {
  modelId = '';
  thickness = '0.5';
  lockId = 'key_basic';
  ventilation = false;
  bodyColor = null;
  doorColor = null;

  constructor(catalogStore) {
    this.catalog = catalogStore;
    makeAutoObservable(this, {
      totalPrice: computed, // явно, но makeAutoObservable подхватит автоматически
    });
  }

  // Computed пересчитывается только когда изменился один из наблюдаемых
  get totalPrice() {
    const model = this.catalog.models.get(this.modelId);
    if (!model) return null;

    const thicknessSurcharge = this.thickness !== '0.5'
      ? (this.catalog.thicknessSurcharges.get(this.thickness) ?? 0)
      : 0;
    const lockSurcharge = this.catalog.locks.get(this.lockId)?.surcharge ?? 0;
    const ventSurcharge = this.ventilation ? this.catalog.ventSurcharge : 0;
    const colorSurcharge = (this.bodyColor?.surcharge ?? 0) + (this.doorColor?.surcharge ?? 0);

    return model.basePrice + thicknessSurcharge + lockSurcharge + ventSurcharge + colorSurcharge;
  }

  setThickness(v) { this.thickness = v; }
  setLock(id) { this.lockId = id; }
  // ...
}
```

```jsx
// Configurator.jsx (с MobX observer)
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreContext';

const Configurator = observer(function Configurator() {
  const { configStore } = useStore();
  const price = configStore.totalPrice;

  return (
    <li className='final-item final-item--price'>
      <span className='final-label'>Стоимость:</span>
      <span className='final-value'>
        {price !== null ? `${price.toLocaleString('ru-RU')} ₽` : '—'}
      </span>
    </li>
  );
});
```

**Ключевое правило:** `totalPrice` — это геттер (`get`), не метод. MobX отслеживает только observable-свойства, к которым обращается геттер во время своего выполнения. Если `catalogStore` ещё загружается, возвращаем `null` — компонент покажет `—`.

---

## Diff Logic (Changed Parameters)

### Вывод: сравнение текущего состояния с defaultSpecs модели

Колонка «Нестандартное исполнение» показывает только те параметры, которые пользователь изменил относительно стандартных значений модели. Стандартные значения хранятся в Firestore вместе с моделью.

### Структура данных в Firestore

```js
// Firestore: /models/{modelId}
{
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
  }
}
```

### Функция вычисления diff

```js
// src/utils/calcDiff.js

// Конфигурация полей: что показывать и как форматировать
const SPEC_FIELDS = [
  {
    key: 'width',
    label: 'Ширина:',
    format: v => `${v} мм`,
  },
  {
    key: 'height',
    label: 'Высота:',
    format: v => `${v} мм`,
  },
  {
    key: 'thickness',
    label: 'Толщина металла:',
    format: v => `${v} мм`,
  },
  {
    key: 'lockName',   // human-readable имя, не ID
    label: 'Замок:',
    format: v => v,
  },
  {
    key: 'ventilation',
    label: 'Вентиляция:',
    format: v => (v ? 'Да' : 'Нет'),
  },
  {
    key: 'bodyColorName',
    label: 'Цвет корпуса:',
    format: v => v,
  },
  {
    key: 'doorColorName',
    label: 'Цвет двери:',
    format: v => v,
  },
];

/**
 * Возвращает массив изменённых параметров для колонки «Нестандартное исполнение».
 * @param {object} current  — текущее состояние конфигурации (плоский объект)
 * @param {object} defaults — defaultSpecs модели из Firestore
 * @returns {{ label: string, value: string }[]}
 */
export function calcDiff(current, defaults) {
  if (!defaults) return [];

  return SPEC_FIELDS.reduce((acc, field) => {
    const currentVal = current[field.key];
    const defaultVal = defaults[field.key];

    // Сравниваем значения; для числовых учитываем тип
    const isDifferent = String(currentVal) !== String(defaultVal);

    if (isDifferent && currentVal !== undefined && currentVal !== null) {
      acc.push({ label: field.label, value: field.format(currentVal) });
    }
    return acc;
  }, []);
}
```

### Использование в Configurator (MobX observer)

```jsx
import { observer } from 'mobx-react-lite';
import { calcDiff } from '../../utils/calcDiff';
import { useStore } from '../stores/StoreContext';

const Configurator = observer(function Configurator() {
  const { configStore, catalogStore } = useStore();

  // Текущее состояние (human-readable для diff)
  const current = {
    width: configStore.width,
    height: configStore.height,
    thickness: configStore.thickness,
    lockName: catalogStore.locks.get(configStore.lockId)?.name,
    ventilation: configStore.ventilation,
    bodyColorName: configStore.bodyColor?.name,
    doorColorName: configStore.doorColor?.name,
  };

  const defaults = catalogStore.models.get(configStore.modelId)?.defaultSpecs;
  const changedSpecs = calcDiff(current, defaults);

  return (
    <div className='config-col config-col--changed'>
      <span className='col-title'>Нестандартное<br />исполнение</span>
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
  );
});
```

**Важно:** сравнение через `String()` корректно для этой задачи — `'0.5' !== '0.6'`, `'true' !== 'false'`. Для числовых полей (width, height) парсить в `Number` на входе, чтобы `450 !== '450'` не давало ложный diff.

---

## PDF Document Generation

### Вывод: `@react-pdf/renderer` — лучший вариант для этого проекта

**Сравнение библиотек:**

| Библиотека | Кириллица | React-интеграция | Сложность | Рекомендация |
|---|---|---|---|---|
| `@react-pdf/renderer` | Да (embed шрифт) | Нативная (JSX) | Средняя | **Выбрать** |
| `jsPDF` | Да (embed шрифт) | Ручная сборка | Высокая | Нет |
| `html2canvas + jsPDF` | Да (через DOM) | Простая | Высокая (качество) | Нет |
| `Puppeteer/headless` | Да (системные шрифты) | Только Node.js | Требует сервер | Нет |

`@react-pdf/renderer` позволяет описывать PDF-документ как React-компонент (JSX), работает в браузере, поддерживает кириллицу через встроенные шрифты WOFF/TTF.

### Установка

```bash
npm install @react-pdf/renderer
```

### Кириллица: регистрация шрифта

Главное требование — встроить шрифт с кириллическими глифами. У проекта уже есть Roboto WOFF2 в `public/fonts/`.

```js
// src/pdf/fonts.js
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.woff2', fontWeight: 400 },
    { src: '/fonts/Roboto-Medium.woff2', fontWeight: 500 },
    { src: '/fonts/Roboto-Bold.woff2', fontWeight: 700 },
  ],
});
```

Файлы шрифтов должны быть доступны по абсолютному URL. В Vite dev-сервере `/fonts/...` резолвится из `public/fonts/`. Для production-сборки путь тот же.

### Шаблон КП (коммерческое предложение)

```jsx
// src/pdf/ProposalDocument.jsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import './fonts'; // регистрация шрифта — импортируем один раз

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: '20mm 20mm 25mm 20mm',
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
  },
  logo: { width: 120, height: 40, objectFit: 'contain' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 16 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, color: '#2c3e50' },
  table: { width: '100%' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowHeader: { backgroundColor: '#f8fafc' },
  tableCell: { flex: 1, padding: '5 8', fontSize: 9 },
  tableCellLabel: { flex: 1.5, padding: '5 8', fontSize: 9, color: '#666' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#2c3e50',
  },
  priceLabel: { fontSize: 13, fontWeight: 700 },
  priceValue: { fontSize: 16, fontWeight: 700, color: '#e74c3c' },
  footer: {
    position: 'absolute',
    bottom: '15mm',
    left: '20mm',
    right: '20mm',
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
});

export function ProposalDocument({ config, price, manager }) {
  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {/* Шапка */}
        <View style={styles.header}>
          <Image style={styles.logo} src='/img/logo.png' />
          <View>
            <Text style={{ fontSize: 8, color: '#666' }}>Коммерческое предложение</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>
              {new Date().toLocaleDateString('ru-RU')}
            </Text>
          </View>
        </View>

        {/* Заголовок */}
        <Text style={styles.title}>
          Шкаф металлический {config.seriesName} — {config.modelName}
        </Text>
        <Text style={{ fontSize: 9, color: '#666', marginBottom: 16 }}>
          Артикул: {config.article}
        </Text>

        {/* Таблица характеристик */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Технические характеристики</Text>
          <View style={styles.table}>
            {config.finalSpecs.map(({ label, value }) => (
              <View key={label} style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>{label}</Text>
                <Text style={styles.tableCell}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Итоговая цена */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Итоговая стоимость:</Text>
          <Text style={styles.priceValue}>
            {price.toLocaleString('ru-RU')} ₽
          </Text>
        </View>

        {/* Контакты менеджера */}
        {manager && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Ваш менеджер</Text>
            <Text>{manager.name}</Text>
            <Text style={{ color: '#666' }}>{manager.phone} · {manager.email}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          ООО «НПО Промет» · {manager?.phone} · Действительно 30 дней
        </Text>
      </Page>
    </Document>
  );
}
```

### Скачивание PDF по клику

```jsx
// В Configurator.jsx
import { pdf } from '@react-pdf/renderer';
import { ProposalDocument } from '../../pdf/ProposalDocument';

async function handleDownloadProposal() {
  const blob = await pdf(
    <ProposalDocument config={finalConfig} price={totalPrice} manager={managerData} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `КП_Промет_${config.article}_${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// JSX
<button className='btn btn--primary' onClick={handleDownloadProposal}>
  КП для клиента
</button>
```

**Альтернатива для превью:** использовать `<PDFViewer>` из `@react-pdf/renderer` — открывает PDF прямо в iframe внутри страницы. Для MVP скачивание через `toBlob()` проще и не требует модального окна.

---

## Firebase Data Loading

### Структура Firestore для этого проекта

```
/series/{seriesId}
  name: 'Серия «ML»'
  order: 1

/models/{modelId}
  name: 'Шкаф металлический усиленный'
  seriesId: 'ml'
  basePrice: 12000
  article: 'SHL-ML-USI'
  defaultSpecs: { width, height, thickness, lockId, ventilation, bodyColorName, doorColorName }

/locks/{lockId}
  name: 'Замок электронный'
  surcharge: 2100
  order: 4

/colors/{colorId}
  hex: '#3e4c5e'
  name: '5002 шагрень'
  group: 'Базовые'
  order: 1
  surcharge: 0

/thicknessSurcharges/{thickness}  // doc id: '0.6', '0.7'
  surcharge: 800

/settings/ventilation
  surcharge: 500

/settings/manager
  name: 'Иванов Иван'
  phone: '+7 (800) 123-45-67'
  email: 'manager@promet.ru'
```

### CatalogStore с MobX + Firestore

```js
// src/stores/CatalogStore.js
import { makeAutoObservable, runInAction } from 'mobx';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

class CatalogStore {
  series = new Map();
  models = new Map();
  locks = new Map();
  colors = [];
  thicknessSurcharges = new Map();
  ventSurcharge = 0;
  manager = null;

  loading = false;
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  async load() {
    if (this.loading) return;
    this.loading = true;
    this.error = null;

    try {
      // Параллельная загрузка независимых коллекций
      const [seriesSnap, modelsSnap, locksSnap, colorsSnap, thicknessSnap, ventDoc] =
        await Promise.all([
          getDocs(collection(db, 'series')),
          getDocs(collection(db, 'models')),
          getDocs(collection(db, 'locks')),
          getDocs(collection(db, 'colors')),
          getDocs(collection(db, 'thicknessSurcharges')),
          getDoc(doc(db, 'settings', 'ventilation')),
        ]);

      runInAction(() => {
        seriesSnap.forEach(d => this.series.set(d.id, d.data()));
        modelsSnap.forEach(d => this.models.set(d.id, d.data()));
        locksSnap.forEach(d => this.locks.set(d.id, d.data()));

        // Цвета — массив, отсортированный по полю order
        this.colors = colorsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        thicknessSnap.forEach(d =>
          this.thicknessSurcharges.set(d.id, d.data().surcharge)
        );

        if (ventDoc.exists()) this.ventSurcharge = ventDoc.data().surcharge;
        this.loading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.error = err.message ?? 'Ошибка загрузки данных';
        this.loading = false;
      });
    }
  }

  // Вспомогательный геттер: модели для выбранной серии
  get modelsBySeries() {
    return seriesId => {
      const result = [];
      this.models.forEach((model, id) => {
        if (model.seriesId === seriesId) result.push({ id, ...model });
      });
      return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    };
  }
}
```

### Инициализация Firebase

```js
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

```
# .env.local (не коммитить)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### Загрузка при старте приложения

```jsx
// App.jsx
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from './stores/StoreContext';

const App = observer(function App() {
  const { catalogStore } = useStore();

  useEffect(() => {
    catalogStore.load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (catalogStore.loading) return <div className='app-loading'>Загрузка каталога...</div>;
  if (catalogStore.error) return <div className='app-error'>Ошибка: {catalogStore.error}</div>;

  return (
    <>
      <Header />
      <div className='layout'>
        <Configurator />
        <Parameters />
      </div>
      <Footer />
    </>
  );
});
```

### Кеширование: Firestore Persistence (offline cache)

Firestore SDK имеет встроенный кеш. Для PWA и оффлайн-сценариев:

```js
// src/firebase.js
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(), // IndexedDB, работает в Chrome/Firefox/Safari
});
```

Для MVP (внутренний инструмент, всегда онлайн) `persistentLocalCache` не обязателен — стандартного in-memory кеша `getDocs()` достаточно. Каталог загружается один раз при запуске.

### Паттерн обработки ошибок

```jsx
// Компонент-индикатор состояния загрузки
function CatalogStatus({ catalogStore }) {
  if (catalogStore.loading) {
    return <span className='status-loading'>Загрузка...</span>;
  }
  if (catalogStore.error) {
    return (
      <span className='status-error'>
        Ошибка загрузки. <button onClick={() => catalogStore.load()}>Повторить</button>
      </span>
    );
  }
  return null;
}
```

---

## Dynamic ColorPicker from Firebase

### Структура данных в Firestore

```js
// /colors/{colorId}
{
  hex: '#3e4c5e',
  name: '5002 шагрень',
  group: 'Базовые',   // название группы — как в текущем коде
  order: 1,           // порядок внутри группы
  surcharge: 0,       // наценка за цвет (0 = базовый)
  available: true,    // можно скрыть без удаления
}
```

Группы (`group`) — строки: `'Базовые'`, `'Популярные'`, `'Яркие'` — соответствуют текущим константам в `ColorPicker.jsx`.

### Преобразование плоского массива в группы (в CatalogStore)

```js
// src/stores/CatalogStore.js — computed геттер
get colorGroups() {
  const groups = new Map();

  this.colors
    .filter(c => c.available !== false)
    .forEach(color => {
      if (!groups.has(color.group)) groups.set(color.group, []);
      groups.get(color.group).push(color);
    });

  // Возвращаем массив в формате, который уже ожидает ColorPicker
  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
}
```

### Обновлённый ColorPicker — принимает colors как prop

Минимальное изменение существующего компонента: убрать внутреннюю константу `COLORS`, принять `colors` через prop.

```jsx
// src/components/ColorPicker/ColorPicker.jsx
// Изменение: удалить const COLORS = [...] вверху файла
// Добавить colors в деструктуризацию props

export default function ColorPicker({ placeholder, selected, onSelect, colors = [] }) {
  // ... весь остальной код без изменений ...

  return (
    <div className={`color-picker${open ? ' color-picker--open' : ''}`} ref={ref}>
      {/* trigger — без изменений */}
      <ul className='dropdown'>
        {colors.map(group => (   // <-- было COLORS, теперь colors из props
          <Fragment key={group.group}>
            <li className='group'>{group.group}</li>
            {group.items.map(item => (
              <li
                key={item.name}
                className={`item${selected?.name === item.name ? ' item--active' : ''}`}
                onClick={() => handleSelect(item)}
              >
                <span className='item-swatch' style={{ background: item.hex ?? item.color }} />
                <span className='item-name'>{item.name}</span>
              </li>
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
```

### Передача данных из CatalogStore в ColorPicker

```jsx
// Parameters.jsx (с MobX observer)
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreContext';

const Parameters = observer(function Parameters() {
  const { catalogStore, configStore } = useStore();

  return (
    <aside className='parameters'>
      {/* ... остальные параметры ... */}

      <div className='param-group'>
        <span className='group-label'>Изменение цвета корпуса</span>
        <ColorPicker
          placeholder='Выберите цвет корпуса'
          selected={configStore.bodyColor}
          onSelect={color => configStore.setBodyColor(color)}
          colors={catalogStore.colorGroups}  // данные из Firebase
        />
      </div>

      <div className='param-group'>
        <span className='group-label'>Изменение цвета двери</span>
        <ColorPicker
          placeholder='Выберите цвет двери'
          selected={configStore.doorColor}
          onSelect={color => configStore.setDoorColor(color)}
          colors={catalogStore.colorGroups}
        />
      </div>
    </aside>
  );
});
```

### Состояние загрузки цветов

Пока `catalogStore.loading === true`, `colorGroups` вернёт пустой массив — ColorPicker покажет пустой дропдаун. Можно добавить prop `disabled` в ColorPicker и передавать `disabled={catalogStore.loading}`, чтобы заблокировать кнопку-триггер во время загрузки.

```jsx
// В trigger кнопке ColorPicker
<button
  type='button'
  className='trigger'
  aria-expanded={open}
  onClick={handleTriggerClick}
  disabled={disabled}  // новый prop
>
```

---

## Сводная таблица решений

| Фича | Библиотека / паттерн | Этап |
|---|---|---|
| Расчёт цены (временно) | Чистая функция в App.jsx | Этап 1 |
| Расчёт цены (финал) | MobX `computed` в ConfigStore | Этап 2 |
| Diff параметров | `calcDiff()` утилита, сравнение с `defaultSpecs` | Этап 1–2 |
| PDF (КП + НЗ) | `@react-pdf/renderer` + embed Roboto WOFF2 | Этап 3 |
| Firestore загрузка | `getDocs` + `Promise.all` + MobX `runInAction` | Этап 2 |
| Кириллица в PDF | Зарегистрировать Roboto через `Font.register()` | Этап 3 |
| ColorPicker из Firebase | `colorGroups` computed в CatalogStore + prop `colors` | Этап 2 |
