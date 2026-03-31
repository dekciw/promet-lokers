# Architecture Research
## MobX + Firebase for Promet Configurator

*Researched: 2026-03-31 | Based on: React 19.2.4, Vite 8.0.1, no existing state management*

---

## Store Structure

### Overview

Two stores cover the full data lifecycle:
- **CatalogStore** — owns remote data fetched from Firestore (read-only from component perspective)
- **ConfigStore** — owns the user's current configuration session (all selections, computed price)

They are separate by responsibility. ConfigStore reads from CatalogStore (e.g., to resolve a model's base price), but CatalogStore never reads from ConfigStore.

---

### CatalogStore

Holds all reference data loaded from Firestore. Components treat it as a read-only data source.

```js
// src/stores/CatalogStore.js
import { makeAutoObservable, runInAction } from 'mobx';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

class CatalogStore {
  // --- Observable state ---
  series = [];        // [{ id, name }]
  models = {};        // { seriesId: [{ id, name, basePrice, defaultWidth, defaultHeight, defaultThickness }] }
  locks = [];         // [{ id, name, surcharge }]  surcharge=0 means base/free
  colors = [];        // [{ id, name, hex, group }]
  managerContacts = null; // { name, phone, email } — used in PDF КП

  loading = false;
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  // --- Actions ---
  async loadAll() {
    this.loading = true;
    this.error = null;
    try {
      const [seriesSnap, modelsSnap, locksSnap, colorsSnap, contactsSnap] = await Promise.all([
        getDocs(collection(db, 'series')),
        getDocs(collection(db, 'models')),
        getDocs(collection(db, 'locks')),
        getDocs(collection(db, 'colors')),
        getDocs(collection(db, 'contacts')),
      ]);
      runInAction(() => {
        this.series = seriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Group models by seriesId for O(1) lookup in dropdowns
        this.models = {};
        modelsSnap.docs.forEach(d => {
          const data = { id: d.id, ...d.data() };
          if (!this.models[data.seriesId]) this.models[data.seriesId] = [];
          this.models[data.seriesId].push(data);
        });

        this.locks = locksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.colors = colorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.managerContacts = contactsSnap.docs[0]?.data() ?? null;
        this.loading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.error = e.message;
        this.loading = false;
      });
    }
  }

  // --- Computed / derived ---
  get seriesOptions() {
    return this.series; // already plain array, used directly in <select>
  }

  modelsForSeries(seriesId) {
    return this.models[seriesId] ?? [];
  }

  get lockOptions() {
    return this.locks;
  }

  get colorGroups() {
    // Re-group flat colors array into [{ group, items }] — same shape ColorPicker already expects
    const map = {};
    this.colors.forEach(c => {
      if (!map[c.group]) map[c.group] = [];
      map[c.group].push(c);
    });
    return Object.entries(map).map(([group, items]) => ({ group, items }));
  }
}

export const catalogStore = new CatalogStore();
```

**Firestore collections implied:**
- `series` — `{ name: string }`
- `models` — `{ seriesId, name, basePrice, defaultWidth, defaultHeight, defaultThickness, article }`
- `locks` — `{ name, surcharge }` — surcharge=0 for the base lock
- `colors` — `{ name, hex, group }` — group is 'Базовые' / 'Популярные' / 'Яркие'
- `contacts` — `{ name, phone, email }` — single document

---

### ConfigStore

Owns the current user session: what the user has selected, which parameters are non-standard, and the computed total price.

```js
// src/stores/ConfigStore.js
import { makeAutoObservable, computed } from 'mobx';
import { catalogStore } from './CatalogStore';

// Standard thickness across all models per PROJECT.md
const STANDARD_THICKNESS = '0.5';

// Thickness surcharges (to be confirmed by Promet team; placeholder values)
const THICKNESS_SURCHARGE = { '0.5': 0, '0.6': 500, '0.7': 1000 };

class ConfigStore {
  // --- Observable state (mirrors current Parameters useState fields) ---
  seriesId = '';
  modelId = '';
  thickness = STANDARD_THICKNESS;
  width = 450;
  height = 1850;
  lockId = '';        // id of selected lock from CatalogStore.locks
  ventilation = false;
  bodyColor = null;   // { id, name, hex, group } | null
  doorColor = null;   // { id, name, hex, group } | null

  constructor() {
    makeAutoObservable(this);
  }

  // --- Actions ---
  setSeries(seriesId) {
    this.seriesId = seriesId;
    // Reset model when series changes
    this.modelId = '';
  }

  setModel(modelId) {
    this.modelId = modelId;
    // Auto-fill standard dimensions from catalog
    const model = this.selectedModel;
    if (model) {
      this.width = model.defaultWidth;
      this.height = model.defaultHeight;
      this.thickness = model.defaultThickness ?? STANDARD_THICKNESS;
    }
  }

  setThickness(t) { this.thickness = t; }
  setWidth(w) { this.width = Number(w); }
  setHeight(h) { this.height = Number(h); }
  setLock(lockId) { this.lockId = lockId; }
  setVentilation(v) { this.ventilation = v; }
  setBodyColor(color) { this.bodyColor = color; }
  setDoorColor(color) { this.doorColor = color; }

  reset() {
    this.seriesId = '';
    this.modelId = '';
    this.thickness = STANDARD_THICKNESS;
    this.width = 450;
    this.height = 1850;
    this.lockId = '';
    this.ventilation = false;
    this.bodyColor = null;
    this.doorColor = null;
  }

  // --- Computed: catalog lookups ---
  get selectedModel() {
    if (!this.modelId) return null;
    const models = catalogStore.modelsForSeries(this.seriesId);
    return models.find(m => m.id === this.modelId) ?? null;
  }

  get selectedLock() {
    if (!this.lockId) return catalogStore.locks[0] ?? null; // default: first lock (base)
    return catalogStore.locks.find(l => l.id === this.lockId) ?? null;
  }

  // --- Computed: what has changed from standard ---
  get changedSpecs() {
    const model = this.selectedModel;
    if (!model) return [];
    const changes = [];
    if (this.width !== model.defaultWidth)
      changes.push({ label: 'Ширина:', value: `${this.width} мм` });
    if (this.height !== model.defaultHeight)
      changes.push({ label: 'Высота:', value: `${this.height} мм` });
    if (this.thickness !== STANDARD_THICKNESS)
      changes.push({ label: 'Толщина:', value: `${this.thickness} мм` });
    if (this.ventilation)
      changes.push({ label: 'Вентиляция:', value: 'Да' });
    if (this.selectedLock?.surcharge > 0)
      changes.push({ label: 'Замок:', value: this.selectedLock.name });
    if (this.bodyColor)
      changes.push({ label: 'Цвет корпуса:', value: this.bodyColor.name });
    if (this.doorColor)
      changes.push({ label: 'Цвет двери:', value: this.doorColor.name });
    return changes;
  }

  // --- Computed: total price ---
  get totalPrice() {
    const model = this.selectedModel;
    if (!model) return 0;
    let price = model.basePrice;
    price += THICKNESS_SURCHARGE[this.thickness] ?? 0;
    price += this.selectedLock?.surcharge ?? 0;
    // Ventilation surcharge placeholder — to be confirmed by Promet team
    if (this.ventilation) price += 800;
    return price;
  }

  get totalPriceFormatted() {
    return new Intl.NumberFormat('ru-RU').format(this.totalPrice) + ' ₽';
  }
}

export const configStore = new ConfigStore();
```

---

## Component Integration

### Pattern: direct store import + observer

For this single-developer, single-page app, **direct module singleton import** is simpler than Context and avoids boilerplate. Context is valuable when you need to swap store instances in tests or have multiple isolated subtrees — neither applies here at MVP stage.

```js
// In any component:
import { observer } from 'mobx-react-lite';
import { configStore } from '../../stores/ConfigStore';
import { catalogStore } from '../../stores/CatalogStore';
```

Wrap the component with `observer()` so MobX re-renders it on observable changes.

---

### Parameters.jsx after migration

```jsx
import { observer } from 'mobx-react-lite';
import { configStore } from '../../stores/ConfigStore';
import { catalogStore } from '../../stores/CatalogStore';
import ColorPicker from '../ColorPicker/ColorPicker';
import './Parameters.css';

const Parameters = observer(function Parameters() {
  const { seriesId, modelId, thickness, width, height, ventilation, bodyColor, doorColor } = configStore;

  return (
    <aside className='parameters'>
      {/* Series dropdown — data from CatalogStore */}
      <select value={seriesId} onChange={e => configStore.setSeries(e.target.value)}>
        <option value='' disabled>Выберите серию</option>
        {catalogStore.seriesOptions.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {/* Model dropdown — filtered by selected series */}
      <select value={modelId} onChange={e => configStore.setModel(e.target.value)}>
        <option value='' disabled>Выберите модель шкафа</option>
        {catalogStore.modelsForSeries(seriesId).map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {/* Thickness, width, height, lock, ventilation — same JSX structure, replace setState with store actions */}
      {/* ColorPicker — pass catalogStore.colorGroups as prop instead of hardcoded COLORS */}
      <ColorPicker
        placeholder='Выберите цвет корпуса'
        selected={bodyColor}
        onSelect={c => configStore.setBodyColor(c)}
        colorGroups={catalogStore.colorGroups}   // ColorPicker needs this prop added
      />
    </aside>
  );
});

export default Parameters;
```

---

### Configurator.jsx after migration

```jsx
import { observer } from 'mobx-react-lite';
import { configStore } from '../../stores/ConfigStore';
import { catalogStore } from '../../stores/CatalogStore';
import './Configurator.css';

const Configurator = observer(function Configurator() {
  const model = configStore.selectedModel;

  // DEFAULT_SPECS — pulled from selected model's standard values
  const defaultSpecs = model ? [
    { label: 'Ширина:',    value: `${model.defaultWidth} мм` },
    { label: 'Высота:',    value: `${model.defaultHeight} мм` },
    { label: 'Толщина:',   value: '0.5 мм' },
    { label: 'Замок:',     value: catalogStore.locks[0]?.name ?? '—' },
    { label: 'Вентиляция:', value: 'Нет' },
  ] : [];

  // CHANGED_SPECS — from configStore.changedSpecs (computed)
  // FINAL_SPECS — assembled from current configStore values

  return (
    <main className='layout__content'>
      {/* ... existing JSX structure unchanged ... */}
      {/* Replace hardcoded CHANGED_SPECS with configStore.changedSpecs */}
      {/* Replace hardcoded price with configStore.totalPriceFormatted */}
      {/* Replace hardcoded article with model?.article */}
      {/* Replace hardcoded model name with resolved series + model names */}
    </main>
  );
});

export default Configurator;
```

---

### ColorPicker.jsx — one prop addition

ColorPicker currently has `COLORS` hardcoded inside the module. To accept catalog data, add a `colorGroups` prop with the same shape as the current constant:

```jsx
export default function ColorPicker({ placeholder, selected, onSelect, colorGroups = COLORS }) {
  // replace COLORS with colorGroups throughout
}
```

The `COLORS` constant stays as the default fallback, so nothing breaks before Firebase is wired.

---

### App.jsx — no structural changes needed

App.jsx stays as-is. No props need to be threaded through it. Both Parameters and Configurator import stores directly.

Loading state can be rendered in App or a wrapper if desired:

```jsx
import { observer } from 'mobx-react-lite';
import { catalogStore } from './stores/CatalogStore';

const App = observer(function App() {
  if (catalogStore.loading) return <div className='app-loading'>Загрузка каталога...</div>;
  if (catalogStore.error)   return <div className='app-error'>Ошибка загрузки данных</div>;
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

---

## Migration Path

Migration is incremental. The UI never breaks because existing `useState` in Parameters is replaced field-by-field, not all at once.

### Step 1 — Install packages (no code changes)
```
npm install mobx mobx-react-lite firebase
```

### Step 2 — Create Firebase service file
Create `src/services/firebase.js` (see Firebase Initialization section). No components touched yet.

### Step 3 — Create stores with hardcoded data (drop-in for current constants)
- Create `src/stores/CatalogStore.js` — `loadAll()` is stubbed; populate `series`, `models`, `locks`, `colors` with the same values currently hardcoded in components.
- Create `src/stores/ConfigStore.js` — replaces `useState` in Parameters.

At this point stores exist but no component uses them yet.

### Step 4 — Migrate Parameters.jsx to ConfigStore
- Wrap with `observer()`
- Replace each `useState` with the matching store field + action:
  - `[series, setSeries]` → `configStore.seriesId` + `configStore.setSeries`
  - `[model, setModel]` → `configStore.modelId` + `configStore.setModel`
  - `[thickness, setThickness]` → `configStore.thickness` + `configStore.setThickness`
  - `[width, setWidth]` → `configStore.width` + `configStore.setWidth`
  - `[height, setHeight]` → `configStore.height` + `configStore.setHeight`
  - `[lockIndex, setLockIndex]` → `configStore.lockId` + `configStore.setLock`
  - `[ventilation, setVentilation]` → `configStore.ventilation` + `configStore.setVentilation`
  - `[bodyColor, setBodyColor]` → `configStore.bodyColor` + `configStore.setBodyColor`
  - `[doorColor, setDoorColor]` → `configStore.doorColor` + `configStore.setDoorColor`
- Remove the `SERIES_OPTIONS`, `MODEL_OPTIONS`, `LOCK_OPTIONS` constants from the file.
- UI behavior unchanged at this step.

### Step 5 — Migrate Configurator.jsx to read from ConfigStore
- Wrap with `observer()`
- Replace `DEFAULT_SPECS`, `CHANGED_SPECS`, `FINAL_SPECS` constants with values derived from `configStore` and `catalogStore`.
- Replace hardcoded price `14 200 ₽` with `configStore.totalPriceFormatted`.
- Replace hardcoded model label with `configStore.selectedModel?.name`.
- Replace hardcoded article with `configStore.selectedModel?.article`.
- Configurator now reacts live to Parameters changes.

### Step 6 — Wire ColorPicker to catalog colors
- Add `colorGroups` prop to ColorPicker (with `COLORS` as default — no breaking change).
- Pass `catalogStore.colorGroups` from Parameters.
- Remove hardcoded `COLORS` constant from ColorPicker.jsx once Firestore data is confirmed.

### Step 7 — Connect Firebase (replace stub data with Firestore)
- Implement `CatalogStore.loadAll()` fully.
- Call it in `main.jsx` at app startup (see Firebase Initialization).
- Firestore data replaces the stub arrays in CatalogStore.
- Components need zero changes at this step.

### Step 8 — Enable model auto-fill
- `ConfigStore.setModel()` already fills `width`, `height`, `thickness` from `model.defaultWidth` etc.
- Verify the behavior in Parameters: selecting a model should populate the dimension inputs.

---

## File Structure

```
src/
├── main.jsx                      ← call catalogStore.loadAll() here
├── App.jsx                       ← wrap with observer() for loading state
├── index.css
│
├── services/
│   └── firebase.js               ← Firebase app init + db export
│
├── stores/
│   ├── CatalogStore.js           ← remote data, Firestore reads
│   └── ConfigStore.js            ← user session state, computed price
│
└── components/
    ├── Header/
    ├── Footer/
    ├── ColorPicker/
    │   ├── ColorPicker.jsx       ← add colorGroups prop
    │   └── ColorPicker.css
    ├── Configurator/
    │   ├── Configurator.jsx      ← wrap observer, read from stores
    │   └── Configurator.css
    └── Parameters/
        ├── Parameters.jsx        ← wrap observer, replace useState with store
        └── Parameters.css
```

**Rules:**
- `src/stores/` — pure JS classes, no JSX, no CSS imports. Each store is a singleton exported as a named const.
- `src/services/` — infrastructure only (Firebase SDK config). No business logic.
- No `src/contexts/` needed — stores are imported directly.
- No `src/hooks/` needed at MVP stage — add if shared derived logic grows.

---

## Firebase Initialization

### Where

`src/services/firebase.js` — initializes once, exports the `db` Firestore instance. All other files that need Firestore import `db` from here.

### Pattern

```js
// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

Config values go in `.env.local` (never committed to git):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### When to call loadAll()

Call `catalogStore.loadAll()` once at app startup, before the first render. The cleanest place is `src/main.jsx`:

```js
// src/main.jsx
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.jsx';
import { catalogStore } from './stores/CatalogStore.js';
import './index.css';

// Kick off Firestore load; App renders a loading state while this is in-flight
catalogStore.loadAll();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`App` (wrapped with `observer`) checks `catalogStore.loading` and shows a loading indicator until data arrives. This avoids empty dropdowns flickering on first render.

### Why not useEffect in App?

Calling `loadAll()` in `useEffect` would delay the fetch until after the first paint and runs twice in StrictMode (React 19 mounts → unmounts → remounts). Calling it in module scope at `main.jsx` runs exactly once, fires the network request immediately, and is simpler to reason about.

### Offline / error handling

`CatalogStore.error` is observable. App can show an error banner when it is non-null. For MVP, a simple `console.error` + visible error message is sufficient. Retry logic and Firestore offline persistence can be added in a later phase.

---

*End of research*
