# Stack Research

> Scope: Firebase + MobX + PDF generation for the Promet locker configurator.
> Base: React 19 + Vite 8, single developer, internal Russian-language tool.
> Knowledge cutoff: August 2025. Versions reflect latest stable at that date.

---

## Recommended Stack

| Package | Version | Purpose | Rationale |
|---|---|---|---|
| `firebase` | ^11.x | Firestore client + Auth | Modular SDK, tree-shakeable, no legacy `compat` layer needed |
| `mobx` | ^6.13.x | Reactive state core | Stable API, no class decorators required, works with React 19 |
| `mobx-react-lite` | ^3.4.x | MobX ↔ React binding | Hooks-only, zero overhead vs full `mobx-react`, perfect for functional components |
| `@react-pdf/renderer` | ^4.x | PDF generation | Component-based, Cyrillic-capable via custom fonts, no DOM dependency |
| `react` | ^19.2.4 | UI (already installed) | — |
| `vite` | ^8.0.1 | Build (already installed) | — |

---

## Firebase Integration

### SDK Choice: Firebase JS SDK v11 (Modular)

Use the **modular SDK** (`firebase@11`), not the `compat` namespace (`firebase/compat/*`).

- **Why v11 modular:** Every import is tree-shakeable. A Vite 8 build only bundles the Firestore functions actually called. The `compat` layer wraps the modular API, adds ~30 KB, and exists only for migration — never start a new project on it.
- **Why not `firebase-admin`:** That is a Node.js server SDK. This app has no server; everything runs in the browser.
- **Why not REST API directly:** The SDK handles real-time listeners, offline caching, retry logic, and auth token refresh automatically.

### Initialization pattern

```js
// src/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
}

export const app = initializeApp(firebaseConfig)
export const db  = getFirestore(app)
```

All secrets in `.env.local` (Vite exposes `VITE_*` vars at build time; this is fine for a client-side Firebase app because Firebase Security Rules enforce access control, not secret API keys).

### Key Firestore APIs to use

| API | Import | When to use |
|---|---|---|
| `getDocs(query)` | `firebase/firestore` | One-time reads (catalog load at startup) |
| `onSnapshot(query, cb)` | `firebase/firestore` | Real-time listeners (not needed for MVP catalog) |
| `doc(db, 'col', 'id')` | `firebase/firestore` | Read a single document |
| `collection(db, 'col')` | `firebase/firestore` | Reference a collection |
| `query(ref, where(...))` | `firebase/firestore` | Filter queries |
| `enableIndexedDbPersistence` | `firebase/firestore` | Offline cache — skip for MVP |

### Recommended Firestore data shape

```
/series/{seriesId}          — { name, description }
/models/{modelId}           — { seriesId, name, basePrice, defaultDims: {H,W,D} }
/locks/{lockId}             — { name, surcharge }
/colors/{colorId}           — { name, hex, ral, surcharge, group }
/contacts/{branchId}        — { managerName, phone, email }
```

### Fetching pattern (used in MobX store)

```js
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

async function fetchCollection(collectionName) {
  const snap = await getDocs(collection(db, collectionName))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
```

---

## MobX with React 19

### Setup

```
npm install mobx mobx-react-lite
```

No Babel decorator plugins, no `experimentalDecorators` in tsconfig. Use `makeAutoObservable` — it is the idiomatic MobX 6 approach for new code.

### makeAutoObservable vs decorators

| Approach | Recommended? | Notes |
|---|---|---|
| `makeAutoObservable(this)` in constructor | **Yes** | Works without any build config changes; class fields auto-classified |
| `@observable` / `@action` decorators | No for new code | Requires `experimentalDecorators: true`; TC39 decorators proposal is still evolving; unnecessary complexity |
| `makeObservable(this, { field: observable })` | Only if explicit control needed | Verbose; use when `makeAutoObservable` misclassifies something |

### React 19 compatibility note

`mobx-react-lite` v3.4+ is fully compatible with React 19. It wraps components with `observer()` using `useSyncExternalStore` internally (since v3.1), which is the React-blessed subscription pattern. There are no concurrent-mode issues.

Do **not** use `mobx-react` (the full package) — it includes class component support and `Provider`/`inject` which are legacy patterns. `mobx-react-lite` is the subset for functional components.

### Store architecture for Promet

```js
// src/stores/CatalogStore.js
import { makeAutoObservable, runInAction } from 'mobx'
import { fetchCollection } from '../firebase/helpers'

class CatalogStore {
  series  = []
  models  = []
  locks   = []
  colors  = []
  loading = false
  error   = null

  constructor() {
    makeAutoObservable(this)
  }

  async loadAll() {
    this.loading = true
    try {
      const [series, models, locks, colors] = await Promise.all([
        fetchCollection('series'),
        fetchCollection('models'),
        fetchCollection('locks'),
        fetchCollection('colors'),
      ])
      runInAction(() => {
        this.series  = series
        this.models  = models
        this.locks   = locks
        this.colors  = colors
        this.loading = false
      })
    } catch (e) {
      runInAction(() => {
        this.error   = e.message
        this.loading = false
      })
    }
  }
}

export const catalogStore = new CatalogStore()
```

```js
// src/stores/ConfigStore.js
import { makeAutoObservable, computed } from 'mobx'
import { catalogStore } from './CatalogStore'

class ConfigStore {
  selectedSeriesId = null
  selectedModelId  = null
  selectedLockId   = null
  selectedBodyColorId = null
  selectedDoorColorId = null
  metalThickness   = 0.5
  ventilation      = false
  customDims       = { H: null, W: null, D: null }

  constructor() {
    makeAutoObservable(this)
  }

  get selectedModel() {
    return catalogStore.models.find(m => m.id === this.selectedModelId) ?? null
  }

  get isNonStandard() {
    const m = this.selectedModel
    if (!m) return false
    return (
      this.metalThickness !== 0.5 ||
      this.ventilation ||
      (this.customDims.H && this.customDims.H !== m.defaultDims.H) ||
      (this.customDims.W && this.customDims.W !== m.defaultDims.W) ||
      (this.customDims.D && this.customDims.D !== m.defaultDims.D)
    )
  }

  get totalPrice() {
    const m = this.selectedModel
    if (!m) return 0
    const lock   = catalogStore.locks.find(l => l.id === this.selectedLockId)
    const body   = catalogStore.colors.find(c => c.id === this.selectedBodyColorId)
    const door   = catalogStore.colors.find(c => c.id === this.selectedDoorColorId)
    const thicknessMap = { 0.5: 0, 0.6: 800, 0.7: 1600 }
    return (
      m.basePrice +
      (lock?.surcharge  ?? 0) +
      (body?.surcharge  ?? 0) +
      (door?.surcharge  ?? 0) +
      (this.ventilation ? 500 : 0) +
      (thicknessMap[this.metalThickness] ?? 0)
    )
  }

  setModel(modelId) {
    this.selectedModelId = modelId
    const m = this.selectedModel
    if (m) this.customDims = { ...m.defaultDims }
  }
}

export const configStore = new ConfigStore()
```

### Connecting stores to components

```js
// src/stores/index.js — single import point
export { catalogStore } from './CatalogStore'
export { configStore }  from './ConfigStore'
```

```jsx
// In any component:
import { observer } from 'mobx-react-lite'
import { configStore } from '../stores'

const PriceDisplay = observer(() => (
  <div className="price">{configStore.totalPrice.toLocaleString('ru-RU')} ₽</div>
))
```

`runInAction` is **mandatory** when mutating observable state after an `await` — MobX requires all observable mutations to happen inside an action, and an `await` exits the action context.

---

## PDF Generation

### Comparison table

| Library | Approach | Cyrillic | Custom fonts | React component API | Bundle size | Verdict |
|---|---|---|---|---|---|---|
| `@react-pdf/renderer` | Custom PDF renderer, no DOM | **Yes** (with TTF font) | Yes, `Font.register()` | Yes — JSX layout | ~450 KB gzip | **Winner** |
| `jsPDF` | Imperative canvas/text API | Partial (needs AFM font) | Yes, but complex setup | No — code-driven | ~250 KB gzip | Runner-up for simple cases |
| `react-pdf` (Mozilla pdf.js wrapper) | **Viewer only** — renders existing PDFs | N/A | N/A | Yes | ~1 MB | Wrong tool — displays PDFs, does not generate them |
| `pdfmake` | JSON document definition | Yes (with vfs fonts) | Yes, but vfs base64 bloat | No | ~500 KB + fonts | Viable but more complex than @react-pdf/renderer |
| `html2canvas` + `jsPDF` | Screenshot DOM to image | Yes (renders as image, not text) | N/A | N/A | Large | Avoid — output is a rasterized image, not searchable/copy-able text |

### Winner: `@react-pdf/renderer` v4

**Why it wins for Promet:**

1. **Component-based layout** — the КП and НЗ documents have predictable, repeatable structure (header, table, signature blocks). Defining them as React components with `<Document>`, `<Page>`, `<View>`, `<Text>` is natural and maintainable.
2. **Cyrillic works correctly** — font registration is first-class. Register a TTF with Cyrillic range and all Russian text renders as real text (copy-pasteable, searchable), not a rasterized image.
3. **No DOM dependency** — generates a PDF Blob directly in the browser. `PDFDownloadLink` renders a native `<a download>` button with zero server round-trips.
4. **Consistent output** — unlike html2canvas, the output is vector PDF, not a screenshot. Tables align correctly regardless of viewport size.

### Cyrillic font setup (critical)

`@react-pdf/renderer` ships with the Helvetica family only, which does not cover Cyrillic. You must register a TTF that includes Cyrillic glyphs.

**Recommended free fonts with full Cyrillic coverage:**
- **PT Sans** — widely used in Russian government and business documents, familiar to the target audience
- **Inter** — modern, excellent Cyrillic, Google Fonts
- **Roboto** — ubiquitous, reliable Cyrillic

```js
// src/pdf/fonts.js
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'PTSans',
  fonts: [
    { src: '/fonts/PTSans-Regular.ttf',      fontWeight: 'normal' },
    { src: '/fonts/PTSans-Bold.ttf',         fontWeight: 'bold' },
    { src: '/fonts/PTSans-Italic.ttf',       fontStyle: 'italic' },
    { src: '/fonts/PTSans-BoldItalic.ttf',   fontWeight: 'bold', fontStyle: 'italic' },
  ],
})
```

Font files go in `/public/fonts/` (served as static assets by Vite). Import `fonts.js` once at app startup (e.g., in `main.jsx`) before any PDF component renders.

### Usage pattern

```jsx
// src/pdf/ProposalDocument.jsx
import { Document, Page, View, Text, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import '../pdf/fonts'  // side-effect import — registers fonts

const styles = StyleSheet.create({
  page:    { fontFamily: 'PTSans', padding: 40, fontSize: 11 },
  heading: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  row:     { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc', padding: 4 },
})

export const ProposalDocument = ({ config }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Коммерческое предложение</Text>
      {/* ... */}
    </Page>
  </Document>
)

// In the UI component:
<PDFDownloadLink document={<ProposalDocument config={configStore} />} fileName="КП_Промет.pdf">
  {({ loading }) => loading ? 'Формирование...' : 'Скачать КП'}
</PDFDownloadLink>
```

### Version note

`@react-pdf/renderer` v4 (released 2024) adds React 18/19 support and improves the FlexBox layout engine. Use v4, not v3.

---

## Connecting Firebase Data to MobX Stores

### The pattern: async action → runInAction

The single most important rule: **never mutate observables outside an action**. After `await`, you are no longer inside the original action scope — wrap the mutation in `runInAction()`.

```js
// CORRECT
async loadModels() {
  const data = await fetchCollection('models')
  runInAction(() => { this.models = data })
}

// WRONG — MobX will warn in strict mode, may behave unexpectedly
async loadModels() {
  const data = await fetchCollection('models')
  this.models = data  // outside action after await
}
```

### When to load

Load the catalog once at app startup in `App.jsx`:

```jsx
import { useEffect } from 'react'
import { catalogStore } from './stores'

function App() {
  useEffect(() => {
    catalogStore.loadAll()
  }, [])
  // ...
}
```

This avoids redundant Firestore reads. For a catalog that changes rarely (prices, models), a single `getDocs` on startup is correct. `onSnapshot` (real-time) is only needed if multiple users edit the same data concurrently — not the case here.

### Dependency between stores

`ConfigStore` reads from `catalogStore` in computed getters (e.g., `selectedModel`, `totalPrice`). MobX tracks these cross-store dependencies automatically — no manual wiring needed. Both stores are singletons exported from `src/stores/index.js`.

### Error and loading states

Always expose `loading` and `error` observables on the store. Components can react to them without prop drilling:

```jsx
const Parameters = observer(() => {
  if (catalogStore.loading) return <div>Загрузка каталога...</div>
  if (catalogStore.error)   return <div>Ошибка: {catalogStore.error}</div>
  // render controls
})
```

---

## What NOT to Use

| Package / Approach | Reason to Reject |
|---|---|
| `firebase/compat` namespace | Legacy compatibility shim. 20-30 KB extra, deprecated API surface. Never use for new projects. |
| `mobx-react` (full package) | Includes `Provider`, `inject`, and class component support — all legacy. `mobx-react-lite` is the subset for functional/hooks React. |
| MobX decorator syntax (`@observable`, `@action`) | Requires `experimentalDecorators: true` in build config, ties you to legacy decorator spec. `makeAutoObservable` is simpler and equally powerful. |
| `react-pdf` (pdfjs-dist wrapper) | This is a **PDF viewer**, not a generator. Confusingly named. It renders existing PDF files — it cannot create them. |
| `html2canvas` + `jsPDF` (DOM screenshot approach) | Output is a rasterized image embedded in PDF — not real text. Text is not searchable, not copy-pasteable, and font rendering depends on browser viewport. Produces large files. Cyrillic may render incorrectly depending on system fonts. |
| `pdfmake` | Viable alternative but uses a JSON document definition language, not JSX. For a React codebase, maintaining a parallel document DSL adds cognitive load. Fonts require base64 encoding into a virtual file system (`vfs_fonts`), which bloats the bundle. |
| Redux + Redux Thunk | Overkill for this app's scale. The project spec explicitly calls for MobX. Redux boilerplate (actions, reducers, selectors) is unnecessary when MobX computed properties and actions cover the same ground with less code. |
| Firebase Realtime Database | Older Firebase product, NoSQL with a different query model. Firestore has better querying, compound indices, and is the recommended default for new Firebase projects. |
| `useContext` + `useReducer` as state replacement | Sufficient for Этап 1 (static UI), but breaks down when catalog data from Firebase needs to be shared across deeply nested components without prop drilling. MobX stores avoid context re-render cascades. |

---

*Research compiled: 2026-03-31. Based on library documentation and ecosystem state through August 2025.*
