---
phase: 08-catalog-crud
plan: 01
subsystem: database
tags: [firebase, firestore, react-hooks, vitest, tdd, crud]

# Dependency graph
requires:
  - phase: 07-foundation
    provides: Firebase Auth + ProtectedRoute + AdminPage placeholder
provides:
  - export const db = getFirestore(app) in firebase.js
  - useCatalogAdmin hook with models state + loadModels/saveModel/addModel/deleteModel
  - 10 unit tests covering CATALOG-01/06/07/08 with mocked firebase/firestore
affects:
  - 08-02 (AdminPage UI — consumes useCatalogAdmin)
  - 09-drag-drop (will extend useCatalogAdmin sortOrder)

# Tech tracking
tech-stack:
  added: [firebase/firestore SDK (getDoc, setDoc, doc, getFirestore)]
  patterns:
    - TDD Red-Green: failing test file committed before implementation
    - read-splice-write for Firestore array updates (no arrayUnion/arrayRemove for objects)
    - setDoc with merge:true instead of updateDoc for document resilience
    - localStorage cache invalidation after every admin mutation

key-files:
  created:
    - src/shared/hooks/useCatalogAdmin.js
    - src/shared/hooks/__tests__/useCatalogAdmin.test.js
  modified:
    - src/shared/lib/firebase.js

key-decisions:
  - "Named hook useCatalogAdmin (not useCatalog) to avoid collision with existing regular-user hook"
  - "setDoc with merge:true instead of updateDoc — resilient if catalog/main document gets recreated"
  - "CACHE_KEY constant mirrors loadCatalog.js — removeItem after every mutation so configurator sees fresh data"
  - "ref stabilized via useMemo inside hook — prevents new DocumentReference on each render"

patterns-established:
  - "Pattern: read-splice-write for Firestore array CRUD (getDoc → mutate local array → setDoc)"
  - "Pattern: localStorage cache invalidation wraps every Firestore write (try/catch — private mode safe)"
  - "Pattern: vi.mock('firebase/firestore') + vi.mock('../../lib/firebase') for hook unit tests"

requirements-completed: [CATALOG-01, CATALOG-06, CATALOG-07, CATALOG-08]

# Metrics
duration: 2min
completed: 2026-05-26
---

# Phase 08 Plan 01: Firestore DB Export + useCatalogAdmin CRUD Hook Summary

**Firestore SDK wired into firebase.js (db export) and useCatalogAdmin hook implemented with full read/save/add/delete + localStorage cache invalidation, backed by 10 passing unit tests (TDD red-green)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-26T15:06:41Z
- **Completed:** 2026-05-26T15:08:38Z
- **Tasks:** 2 (TDD: 1 RED + 1 GREEN)
- **Files modified:** 3

## Accomplishments
- Added `export const db = getFirestore(app)` to firebase.js alongside existing auth/storage exports
- Created useCatalogAdmin hook with models state + 4 CRUD operations (load/save/add/delete)
- 10 unit tests with vi.mock('firebase/firestore') covering all 4 operations and localStorage cache invalidation
- Full test suite 74/74 passing, Vite build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Failing tests for useCatalogAdmin** - `9bc8bbb` (test)
2. **Task 2: GREEN — firebase.js db export + useCatalogAdmin implementation** - `08d0f42` (feat)

**Plan metadata:** (docs commit below)

_Note: TDD tasks have two commits — test (RED) then feat (GREEN)_

## Files Created/Modified
- `src/shared/lib/firebase.js` — added `import { getFirestore }` and `export const db = getFirestore(app)`
- `src/shared/hooks/useCatalogAdmin.js` — new hook: models/isLoading/error state + loadModels/saveModel/addModel/deleteModel
- `src/shared/hooks/__tests__/useCatalogAdmin.test.js` — 10 unit tests with mocked Firestore SDK

## Decisions Made
- Named hook `useCatalogAdmin` (not `useCatalog`) — avoids collision with existing regular-user hook
- `setDoc` with `{ merge: true }` instead of `updateDoc` — resilient if document gets recreated (Pitfall #2 from RESEARCH.md)
- `CACHE_KEY = 'promet_catalog_v1'` constant in hook + `localStorage.removeItem(CACHE_KEY)` after every write — ensures configurator (regular user) sees fresh data after admin edits
- `ref` stabilized via `useMemo(() => doc(db, 'catalog', 'main'), [])` — prevents new DocumentReference creation on every render (Pitfall #7 from RESEARCH.md)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — implementation followed RESEARCH.md patterns exactly. All 10 tests passed on first run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useCatalogAdmin` is ready to be consumed by AdminPage (08-02)
- Contract: `{ models, isLoading, error, loadModels, saveModel, addModel, deleteModel }`
- `saveModel(model)` — finds by `model.article`, replaces via read-splice-write, setDoc merge:true
- `addModel(model)` — appends with `sortOrder = max + 1`, setDoc merge:true
- `deleteModel(article)` — filters out by article, setDoc merge:true
- All mutations auto-invalidate localStorage cache 'promet_catalog_v1'

---
*Phase: 08-catalog-crud*
*Completed: 2026-05-26*
