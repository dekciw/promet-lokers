# Pitfalls Research

> Stack: React 19 + Vite 8 + MobX + Firebase (Firestore + Auth) + @react-pdf/renderer
> Project: Promet internal configurator — internal users only, Russian locale, Cyrillic text
> Last updated: 2026-03-31

---

## Firebase Gotchas

### 1. Security Rules default to locked — app breaks silently on first deploy
- Fresh Firestore databases ship in **locked mode** (all reads/writes denied).
- In development you often run with permissive test rules, forget to tighten them, and ship. Or you do the opposite: you tighten them and the app breaks with vague `permission-denied` errors in production.
- **Mitigation:** Treat rules as code. Store `firestore.rules` in version control from day one. Use `firebase emulators:start` locally so rules are tested against real data shapes before deploy.

### 2. Reads multiply faster than expected — quota exhaustion
- Every `onSnapshot` listener fires on **every document change**, not just the fields your UI cares about. With 10 managers simultaneously open on the same catalog collection, a single write to any catalog document triggers 10 reads.
- Free tier: 50 000 reads/day. Paid: $0.06 per 100 000 reads.
- **Mitigation for this project:** Catalog data (series, models, locks, colors) is mostly static. Load it **once** with `getDocs` (not `onSnapshot`), cache in MobX store, and refresh only on explicit user action or app restart. Reserve real-time listeners only for mutable shared state (e.g., saved configurations in Этап 4).

### 3. `onSnapshot` listeners leak if not unsubscribed
- Calling `onSnapshot` returns an unsubscribe function. If you call it inside a `useEffect` without returning it, the listener fires forever — including after the component unmounts — causing state mutations on dead components and memory leaks.
- **Mitigation:**
  ```js
  useEffect(() => {
    const unsub = onSnapshot(ref, handler);
    return () => unsub(); // MUST return cleanup
  }, []);
  ```
  In MobX stores, call the unsubscribe in a `dispose()` method and call `dispose()` from the component's cleanup or a root-level teardown.

### 4. Offline persistence is IndexedDB — double-read billing on reconnect
- Enabling offline persistence (`enableIndexedDbPersistence`) caches documents locally. On reconnect, Firestore syncs: it re-reads any documents changed during the offline period. These count as billed reads.
- Persistence also increases initial bundle size and adds ~200 ms to first cold start on low-end devices.
- **Mitigation for this project:** Internal tool used in office Wi-Fi — offline persistence is probably unnecessary overhead. Skip it unless managers explicitly need offline access. If enabled, limit it to the catalog collection only.

### 5. Subcollection structure vs flat documents — query limitations
- Firestore cannot query across subcollections without a collection-group query (`collectionGroup()`). A naive schema like `series/{id}/models/{id}/locks/{id}` means fetching a full product requires 3 separate async calls, multiplying latency and reads.
- **Mitigation:** For a catalog with ~50–200 items total, a flat structure works better:
  - `/catalog/series` — array of series objects
  - `/catalog/models` — array of model objects with `seriesId` field
  - `/catalog/locks`, `/catalog/colors` — flat documents or small collections
  - Load entire small collections once; filter client-side in MobX.

### 6. Document size limit: 1 MiB
- A single Firestore document cannot exceed 1 MiB. Color swatches with base64-encoded preview images can easily hit this.
- **Mitigation:** Store color hex values and names only in Firestore. Keep any swatch images in Firebase Storage or as inline CSS. Never embed binary data in Firestore documents.

### 7. Firestore SDK v9+ modular API vs compat — bundle size
- The Firebase JS SDK v9+ ships as a **modular (tree-shakeable)** API. Using the old compat layer (`firebase/compat/*`) pulls in the full SDK (~150 kB gzipped) even if you only use Firestore.
- **Mitigation:** Use only modular imports:
  ```js
  import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
  ```
  With tree-shaking via Vite, Firestore-only usage adds ~30–40 kB gzipped to the bundle.

### 8. Cold start latency on first `getDoc`/`getDocs`
- The first Firestore call after app load can take 300–800 ms due to SDK initialization + TLS handshake. Users see a flash of empty/loading state.
- **Mitigation:** Initialize the Firebase app and Firestore instance eagerly at module load time (outside React, in `firebase.js`), not lazily inside a component. Start fetching catalog data as early as possible — ideally before any user interaction is required.

### 9. Rules simulator in Console vs real behavior mismatch
- The Firebase Console rules simulator does not simulate all edge cases correctly (e.g., `request.auth` token fields, `get()` calls inside rules). Rules that pass the simulator may still fail in the real app.
- **Mitigation:** Always test rules with the **Firebase Emulator Suite** (`firebase emulators:start`), not just the Console simulator.

---

## MobX + React 19 Issues

### 1. Component must be wrapped with `observer` — forgetting it is the #1 bug
- A React component that reads observable values but is **not wrapped in `observer()`** will never re-render when those values change. It silently shows stale data with no error or warning.
- **Mitigation:** Wrap every component that reads from a MobX store in `observer()`. There is no automatic detection — establish a code review rule. With the file structure `ComponentName/ComponentName.jsx`, add a linter rule or a comment header pattern.
  ```jsx
  import { observer } from 'mobx-react-lite';
  const Parameters = observer(function Parameters({ store }) { ... });
  ```

### 2. `mobx-react-lite` vs `mobx-react` — pick the right package
- `mobx-react-lite` supports only function components (hooks-based). `mobx-react` supports both class and function components but adds weight.
- **Mitigation:** This project uses function components throughout. Use `mobx-react-lite` exclusively. Do not mix both packages — it causes duplicate `observer` HOC contexts.

### 3. React 19 Strict Mode double-invocation — store side effects fire twice
- React 19 Strict Mode (enabled by default in `<React.StrictMode>`) mounts components **twice** in development to detect side effects. If a MobX store fires a Firebase `getDocs` call inside a `useEffect`, it fires twice in dev, wasting reads and potentially creating duplicate state.
- **Mitigation:** Initialize MobX stores **outside** React at module level — not inside `useEffect`. Pass store instances via context or props. Fetching in a store's constructor or `initialize()` method called once at app start is safe.
  ```js
  // stores/CatalogStore.js — initialize outside React tree
  class CatalogStore {
    constructor() { makeAutoObservable(this); this.load(); }
    async load() { /* getDocs once */ }
  }
  export const catalogStore = new CatalogStore(); // module singleton
  ```

### 4. Stale closures in reactions and `autorun`
- If a `reaction()` or `autorun()` captures a non-observable variable (e.g., a prop value or a local variable at the time of creation), it will read the stale value forever — MobX only tracks observable access, not closures.
- **Mitigation:** Inside `autorun`/`reaction` callbacks, always read values from the observable store directly (via `this.someField` or the store reference), not from closed-over variables.

### 5. `makeAutoObservable` and class inheritance — incompatible
- `makeAutoObservable` does not work with class inheritance. If you later try to extend a store class that uses `makeAutoObservable`, MobX throws an error.
- **Mitigation:** Use composition over inheritance for stores. Two separate stores (`CatalogStore`, `ConfigStore`) that reference each other if needed are cleaner than a base class hierarchy.

### 6. Actions must wrap all state mutations — `observable` writes outside actions in strict mode
- When MobX is configured with `configure({ enforceActions: 'always' })`, any observable mutation outside an action throws. Without this setting, mutations from async code (e.g., inside `await getDocs(...)`) can trigger many intermediate re-renders.
- **Mitigation:** Always wrap state mutations in `action()` or mark methods with `@action` / include them in `makeAutoObservable`. For async flows, use `runInAction()` at the end of an async function:
  ```js
  async load() {
    const snap = await getDocs(collection(db, 'catalog'));
    runInAction(() => {
      this.models = snap.docs.map(d => d.data());
      this.loaded = true;
    });
  }
  ```

### 7. `computed` values re-compute when any dependency changes — avoid expensive computations
- A `computed` that does complex array filtering/mapping re-runs on every observable change it depends on. For the price calculation (base price + surcharges), this is fine. But if `computed` accidentally accesses a very large observable array, it can cause sluggishness.
- **Mitigation:** Keep `computed` values focused. The `totalPrice` computed should only depend on `selectedModel`, `selectedLock`, `metalThickness`, `ventilation`, `bodyColor`, `doorColor` — not on the entire catalog array.

### 8. Passing store values as primitives breaks reactivity
- If you destructure an observable before passing to a child component, the child receives a plain value, not a live observable reference. `observer()` on the child cannot track it.
  ```jsx
  // WRONG — price is a plain number snapshot
  const { price } = configStore;
  <PriceDisplay price={price} />

  // CORRECT — pass the store or access inside observer
  <PriceDisplay store={configStore} />
  // or access store.price directly inside observer(PriceDisplay)
  ```
- **Mitigation:** Either pass the full store reference or access observable values **inside** `observer`-wrapped components. Never destructure observables at the call site outside an observer boundary.

### 9. React 19 `use()` hook and Suspense — not compatible with MobX observables
- React 19 introduces `use(promise)` for Suspense-based data fetching. MobX observables are not Promises — mixing `use()` with MobX store loading state is unnecessary and confusing.
- **Mitigation:** Use MobX `loadingState` observable flags (`isLoading`, `isError`, `isLoaded`) for async state. Do not use React Suspense with MobX stores. Simple boolean flags render a loading spinner without Suspense complexity.

---

## PDF Generation Issues

### 1. `@react-pdf/renderer` adds ~300–400 kB gzipped to the bundle
- The library bundles a full PDF layout engine and font subsetting tooling. Even with tree-shaking, the baseline cost is large.
- **Mitigation:** Load it **lazily** — only when the user clicks "Download PDF". Use dynamic import + React.lazy or a manual `import()` call:
  ```js
  async function generatePDF() {
    const { pdf } = await import('@react-pdf/renderer');
    const { KPDocument } = await import('./documents/KPDocument');
    const blob = await pdf(<KPDocument data={configStore.summary} />).toBlob();
    // trigger download
  }
  ```
  This keeps the initial bundle lean and only pays the cost when needed.

### 2. Cyrillic fonts are NOT included in @react-pdf/renderer by default
- The library ships with Helvetica (Latin only). Cyrillic characters render as empty squares (tofu) unless you register a font that includes Cyrillic glyphs.
- **This is the single most common failure point for Russian-language PDF projects.**
- **Mitigation:** Register a font that covers Cyrillic before rendering:
  ```js
  import { Font } from '@react-pdf/renderer';

  Font.register({
    family: 'PTSans',
    fonts: [
      { src: '/fonts/PTSans-Regular.ttf', fontWeight: 'normal' },
      { src: '/fonts/PTSans-Bold.ttf',    fontWeight: 'bold' },
      { src: '/fonts/PTSans-Italic.ttf',  fontStyle: 'italic' },
    ],
  });
  ```
  Then use `fontFamily: 'PTSans'` in all `<Text>` styles.
  - Good free Cyrillic fonts: **PT Sans** (Google Fonts / PTFonts.ru), **PT Serif**, **Roboto** (has Cyrillic subset), **Open Sans**.
  - Place `.ttf` files in `public/fonts/` so Vite serves them as static assets (accessible by absolute URL).
  - **Register fonts once** at the module level (outside components), not inside render functions — repeated registration causes memory leaks.

### 3. Font subsetting — TTF file size vs load time
- Full TTF font files (PT Sans Regular) can be 200–400 kB each. Loading 3–4 font weights for PDF generation can take 800–1500 ms on a slow connection.
- **Mitigation:** Use the `subset` property if your renderer version supports it. Alternatively, use **woff2** is not supported — stick to TTF/OTF. Pre-load fonts at app startup (background fetch) so they are cached by the time the user clicks "Download".

### 4. `@react-pdf/renderer` does not use the browser's layout engine
- It implements its own Yoga-based flexbox layout. CSS Grid, `position: absolute` with percentage values, and multi-column layouts behave differently from browser CSS.
- **Mitigation:** Design PDF layouts using only flexbox (`display: 'flex'`, `flexDirection`, `justifyContent`). Keep layouts simple: header, two-column table, footer. Test each layout change by generating an actual PDF — the visual output cannot be previewed accurately in JSX alone.

### 5. Memory issues with large documents / many images
- Generating a PDF with many embedded images (company logos, product photos) can spike memory to 200–400 MB in the browser tab. On 32-bit browsers or memory-constrained devices this causes tab crashes.
- **Mitigation for this project:** The КП and НЗ documents are text-heavy (specifications, tables, prices). Limit embedded images to one small company logo (~20 kB). Avoid embedding product photos. Use vector SVG for logos if possible — `@react-pdf/renderer` supports inline SVG via `<Svg>`, adding no weight.

### 6. `pdf().toBlob()` is asynchronous and can freeze the UI thread
- PDF rendering runs on the main thread in `@react-pdf/renderer`. A complex 3-page document can block the main thread for 200–500 ms, causing visible UI stutter.
- **Mitigation:** Show a loading indicator before calling `pdf().toBlob()`. For this project's simple 1–2 page documents, the freeze is acceptable. If documents grow, consider rendering in a Web Worker (requires experimental setup — probably not worth it for this MVP).

### 7. `Font.register` with relative paths fails in production builds
- When fonts are referenced with relative paths (`./fonts/PTSans.ttf`), the path resolves relative to the bundle chunk, which after Vite's hashing is unpredictable.
- **Mitigation:** Always use absolute paths via Vite's `import.meta.env.BASE_URL` or simply place fonts in `public/` and reference them as `/fonts/PTSans-Regular.ttf` (absolute from root). This works in all environments.

### 8. `@react-pdf/renderer` v3.x breaking changes from v2.x
- v3 changed the `Font.register` API signature, dropped support for some style shorthand properties, and changed how `<Link>` works.
- **Mitigation:** Pin a specific minor version in `package.json` (e.g., `"@react-pdf/renderer": "^3.4.0"`) and do not auto-update without testing. Check the changelog when upgrading.

---

## Vite Compatibility

### 1. Vite 8 uses Rolldown (Rust-based bundler) — some plugins incompatible
- Vite 8 replaced Rollup with **Rolldown** as the default bundler for production builds. Most plugins that worked with Rollup's JavaScript API may have issues because Rolldown's plugin API is not 100% compatible.
- **Mitigation:** Use only plugins that explicitly declare Vite 8 / Rolldown compatibility. For this project's stack: `@vitejs/plugin-react` v6+ is Vite 8-compatible. Firebase SDK (modular) has no Vite plugin — it's just ESM and works fine.

### 2. Firebase SDK modular imports and tree-shaking with Rolldown
- Firebase SDK v9+ is fully ESM and tree-shakeable. Rolldown handles tree-shaking differently from Rollup (more aggressive). Some Firebase sub-paths that were previously included implicitly may be dropped.
- **Mitigation:** Always import from specific Firebase sub-packages, never from the root:
  ```js
  // CORRECT
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';

  // WRONG — imports entire SDK
  import firebase from 'firebase';
  ```
  If you get runtime errors about missing Firebase modules in production but not dev, add the affected paths to `optimizeDeps.include` or `build.commonjsOptions`.

### 3. MobX and Vite HMR — store state is lost on hot reload
- When Vite HMR replaces a module that contains a MobX store singleton, the old store instance is discarded and a new one is created — losing all current state (selected model, configuration in progress).
- **Mitigation:** Accept this as a dev-only inconvenience. Alternatively, preserve store state in `sessionStorage` and rehydrate on creation — but this adds complexity not worth the effort for an MVP. For development comfort, just re-select the model after a hot reload.

### 4. `@react-pdf/renderer` and Vite 8 — `__dirname` / Node.js globals
- Some older versions of `@react-pdf/renderer` (and its dependency `pdfkit`) use Node.js globals like `__dirname`, `process.env`, `Buffer`, and `stream`. In Vite's browser build, these are either undefined or polyfilled imperfectly.
- **Mitigation:**
  - Use `@react-pdf/renderer` v3.3+ which ships browser-native builds without Node.js deps.
  - Add to `vite.config.js` if needed:
    ```js
    export default defineConfig({
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      },
    });
    ```
  - If you see "Buffer is not defined" errors, add `npm install vite-plugin-node-polyfills` and register it — but check if the issue appears in v3.3+ first before adding polyfills.

### 5. Vite 8 CSS handling — `@import` in CSS files vs Vite's preprocessor
- Vite 8 processes CSS natively via Lightning CSS. Component-scoped CSS files (`Component.css`) work fine. However, `@import` order within the same scope can produce different results compared to earlier Vite versions if global and component CSS overlap.
- **Mitigation:** This project uses CSS custom properties on `:root` (design system). Ensure global variables are imported before component CSS. Vite processes CSS in entry-point import order — import `index.css` (design tokens) before any component imports in `main.jsx`.

### 6. `optimizeDeps` pre-bundling — Firebase and large packages
- Vite pre-bundles dependencies with esbuild for faster dev server startup. Firebase SDK is large and pre-bundling it can take 5–10 seconds on first cold start. Subsequent starts use the cache.
- **Mitigation:** Add Firebase packages to `optimizeDeps.include` to force pre-bundling on install (not lazily on first request):
  ```js
  // vite.config.js
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
  }
  ```

### 7. ESM-only packages and `"type": "module"` in package.json
- The project already has `"type": "module"` in `package.json`. This is correct for Vite. However, any dependency that uses CommonJS `require()` internally may cause issues.
- Firebase SDK v9+, MobX 6+, and `@react-pdf/renderer` v3+ are all ESM-compatible. No issues expected — but watch for older transitive dependencies.

---

## Security Considerations

### 1. The fundamental rule: never trust the client
- All business logic in Firestore security rules must assume the client is adversarial. Since this is an internal tool, the threat model is "rogue employee" or "compromised browser session", not an external attacker — but the principle still applies.

### 2. Baseline rules pattern for an internal app (Firebase Auth required)
- Gate all reads and writes behind `request.auth != null`. No unauthenticated access:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {

      // Catalog — read by any authenticated user, write only by admin
      match /catalog/{document=**} {
        allow read: if request.auth != null;
        allow write: if false; // or: request.auth.token.admin == true
      }

      // Saved configurations (Этап 4) — user can only access their own
      match /configurations/{configId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == resource.data.uid;
        allow create: if request.auth != null
                      && request.resource.data.uid == request.auth.uid;
      }
    }
  }
  ```

### 3. Для Этапа 2 (без авторизации): временные правила с ограниченным сроком
- If Firebase Auth is not yet implemented but Firestore is already needed (Этап 2 before Этап 4), use read-only rules for catalog, fully closed for writes:
  ```
  match /catalog/{document=**} {
    allow read: if true;   // catalog is public-readable (internal network access is assumed)
    allow write: if false; // no writes from client
  }
  ```
  **Important:** This exposes catalog data to anyone with the Firebase project config. For an internal tool, restrict this further by Firebase App Check (attestation) or by deploying only on internal network/VPN.

### 4. Field-level validation in rules prevents malformed data
- If clients can write configurations, validate required fields and value ranges in rules:
  ```
  allow create: if request.resource.data.keys().hasAll(['uid', 'modelId', 'price', 'createdAt'])
                && request.resource.data.price is number
                && request.resource.data.price > 0;
  ```
  This prevents bad data from entering Firestore even if the frontend validation is bypassed.

### 5. Firebase App Check for internal tools
- Firebase App Check (reCAPTCHA Enterprise or Device Check) ensures only your actual app — not a curl command or a scraped config — can talk to Firestore.
- For an internal app on known devices (office computers), **reCAPTCHA Enterprise** is the recommended attestation provider.
- **Mitigation:** App Check is not required for MVP, but is a low-effort addition in Этап 4 that eliminates the "exposed Firebase config" concern entirely.

### 6. Firebase API key exposure — not a secret, but rules are your real lock
- The Firebase project config (`apiKey`, `projectId`, etc.) is **intentionally public** — it is used to identify your project, not to authenticate users. The real access control is Firestore security rules + Auth.
- **Mitigation:** Do not put the Firebase config in `.env` thinking it hides it (it doesn't — it ends up in the JS bundle). Instead, ensure your security rules are tight. Store config in `.env` only to make environment switching (dev/staging/prod) easier, not for security.

### 7. Admin-only catalog writes — use Firebase Admin SDK, not client-side rules
- Catalog data (series, models, prices) should only be writable by an administrator. Two approaches:
  - **Option A (simple for MVP):** Set rules to `allow write: if false` for catalog. Update data manually via Firebase Console or a small admin script using the Firebase Admin SDK (Node.js, run locally).
  - **Option B (if needed later):** Custom claims — set `admin: true` claim on admin user via Admin SDK, check `request.auth.token.admin == true` in rules.
  - For this project, Option A is sufficient — the Промет team will provide catalog data from Excel, imported via a one-time script.

### 8. Firestore rules do not protect against cost abuse (DDoS via reads)
- An authenticated user can run a loop that reads millions of documents, driving up your Firebase bill. Security rules cannot block this because the reads are "legitimate".
- **Mitigation:** For internal apps with known users, this is a low-risk theoretical concern. Monitor Firebase Usage dashboard. Set **Firebase Spend Limits / Budget Alerts** in Google Cloud Console to get notified if daily spend exceeds a threshold (e.g., $5/day for an app expecting ~$0.10/day).

---

## Quick Reference: Critical Checklist for This Project

| Risk | Severity | Action |
|------|----------|--------|
| Firestore rules too permissive | HIGH | Lock to `request.auth != null` from day one |
| `observer()` missing on component | HIGH | Wrap every store-reading component |
| Cyrillic font not registered | HIGH | Register TTF with Cyrillic before first PDF render |
| `onSnapshot` not unsubscribed | MEDIUM | Return unsub from `useEffect`; use `dispose()` in stores |
| `runInAction` missing after `await` | MEDIUM | All async state mutations inside `runInAction()` |
| Catalog loaded with `onSnapshot` | MEDIUM | Use `getDocs` once for static catalog data |
| PDF bundle loaded eagerly | LOW | Dynamic import on user action |
| Firebase config in `.env` for "security" | LOW | Understand rules are the real lock, not the key |
| Font TTF path relative in prod build | MEDIUM | Use absolute path from `public/fonts/` |
| MobX store init inside useEffect | MEDIUM | Create stores as module singletons outside React |
