---
phase: 08-catalog-crud
plan: 02
subsystem: ui
tags: [react, react-hook-form, firestore, admin-panel, modal, crud, accessibility]

# Dependency graph
requires:
  - phase: 08-01
    provides: useCatalogAdmin hook with models/loadModels/saveModel/addModel/deleteModel
  - phase: 07-foundation
    provides: Firebase Auth + ProtectedRoute + AdminPage placeholder
provides:
  - CatalogEditModal component (add/edit 14 fields, valueAsNumber, article read-only in edit)
  - DeleteConfirmModal component (alertdialog confirmation)
  - AdminPage CRUD screen (filter/search/add/edit/delete with Notification feedback)
affects:
  - Phase 09 (photo upload, drag-drop sort — consumers of AdminPage)
  - Phase 10 (price coefficients tab — will be added to AdminPage)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - createPortal + AnimatePresence for modal overlay (proven NonStandardOrderModal pattern)
    - react-hook-form useForm with valueAsNumber for all numeric fields (Firestore type safety)
    - article field read-only/disabled in edit mode (prevents ghost-entries)
    - duplicate article guard before addModel (client-side validation)
    - useMemo for filtered+sorted visibleModels (performance with ~100 models)
    - rawToArray/arrayToRaw converters in useCatalogAdmin for Firestore object-format models field

key-files:
  created:
    - src/shared/components/CatalogEditModal/CatalogEditModal.jsx
    - src/shared/components/CatalogEditModal/CatalogEditModal.module.css
    - src/shared/components/CatalogEditModal/index.js
    - src/shared/components/DeleteConfirmModal/DeleteConfirmModal.jsx
    - src/shared/components/DeleteConfirmModal/DeleteConfirmModal.module.css
    - src/shared/components/DeleteConfirmModal/index.js
  modified:
    - src/pages/AdminPage/AdminPage.jsx
    - src/pages/AdminPage/AdminPage.module.css
    - src/shared/hooks/useCatalogAdmin.js
    - src/shared/hooks/__tests__/useCatalogAdmin.test.js

key-decisions:
  - "article field read-only/disabled in edit mode — prevents ghost-entries (Open Question #1 from RESEARCH.md)"
  - "valueAsNumber on all numeric fields — Firestore saves numbers not strings (Pitfall #4)"
  - "duplicate article guard in handleAdd — client-side check before calling addModel (Pitfall #5)"
  - "role=alertdialog for DeleteConfirmModal, role=dialog for CatalogEditModal — correct ARIA semantics"
  - "isDeleting managed by parent (AdminPage) not DeleteConfirmModal — single source of truth"
  - "Firestore stores models field as object {articleKey: modelData}, not array — rawToArray/arrayToRaw converters added to useCatalogAdmin"

requirements-completed: [CATALOG-01, CATALOG-02, CATALOG-03, CATALOG-04, CATALOG-05, CATALOG-06, CATALOG-07, CATALOG-08]

# Metrics
duration: ~60min (including human verification and bug fix)
completed: 2026-05-26
---

# Phase 08 Plan 02: Admin UI — CatalogEditModal + DeleteConfirmModal + AdminPage Summary

**Full CRUD UI for catalog admin: CatalogEditModal (14-field add/edit form), DeleteConfirmModal (alertdialog), AdminPage rewritten with filter/search/cards grid + notification feedback — verified in browser by admin user (all 25+ checklist items passed).**

## Performance

- **Duration:** ~60 min (tasks 1-3: ~4 min; human verify + bug fix: ~56 min)
- **Started:** 2026-05-26T15:11:20Z
- **Completed:** 2026-05-26
- **Tasks:** 4 of 4 completed
- **Files created/modified:** 10

## Accomplishments

### Task 1: CatalogEditModal
- Universal add/edit modal for catalog model entries
- 14 fields with proper validation: name, article, series (select), sortOrder, basePrice, height, width, depth, bodyThickness (select), doorThickness (select), lockCount, doorCount, weight, cpBezNDS
- `valueAsNumber: true` on all 11 numeric fields — Firestore receives numbers, not strings
- `article` field rendered as `readOnly/disabled` in edit mode (prevents ghost-entries, RESEARCH.md Open Question #1)
- `useEffect(() => { if (isOpen) reset(model ?? EMPTY_MODEL); })` — guard on isOpen prevents form reset loop (Pitfall #3)
- Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, ESC handler, `aria-live="polite"` on error messages
- Touch targets ≥ 44px for buttons, inputs, selects; CSS camelCase classes only

### Task 2: DeleteConfirmModal
- Minimal confirmation alertdialog — no useForm, just two callbacks
- `role="alertdialog"` (correct ARIA for destructive confirmations)
- `isDeleting` prop from parent disables both buttons + shows "Удаление…" text
- ESC and overlay-click cancel (when not deleting)
- Red danger button, touch targets ≥ 44px

### Task 3: AdminPage rewrite
- Placeholder replaced with full CRUD screen
- Toolbar: search input + filter tabs (Все/ML/LS with role=tablist/tab) + "+ Добавить" button
- `visibleModels = useMemo(...)` — filtered by activeSeries, searched by name (case-insensitive), sorted by sortOrder
- Model cards grid: `auto-fill minmax(280px, 1fr)`, hover effect, Редактировать/Удалить buttons
- Loading/Error/Empty states with retry buttons
- Add flow: `models.some(m => m.article === data.article)` guard before `addModel` (Pitfall #5)
- Edit flow: `setEditTarget(model)` → CatalogEditModal `mode="edit"` → `saveModel`
- Delete flow: `setDeleteTarget(model)` → DeleteConfirmModal → `deleteModel`
- All 3 operations wrapped in try/catch → Notification feedback (ok/error)
- Header preserved as-is from placeholder

### Task 4: Human verification (browser)
- All 25+ checklist items passed: catalog loads, filter/search work, edit/add/delete confirmed
- Bug discovered and fixed: `models.filter is not a function` — Firestore stores `models` as object `{articleKey: modelData}`, not array
- Fix applied in `useCatalogAdmin.js`: `rawToArray` converter for reads, `arrayToRaw` for writes
- Tests updated to match Firestore object format (`da9029a`)
- Human approved after fix

## Task Commits

Each task committed atomically:

1. **Task 1: CatalogEditModal** - `60d2f5b` — `feat(08-02): add CatalogEditModal component with 14 fields and validation`
2. **Task 2: DeleteConfirmModal** - `5453d2f` — `feat(08-02): add DeleteConfirmModal alertdialog component`
3. **Task 3: AdminPage rewrite** - `8980691` — `feat(08-02): wire AdminPage with catalog list, filter, search, CRUD modals`
4. **Checkpoint state** - `718c7ac` — `docs(08-02): checkpoint state — Tasks 1-3 complete, awaiting human-verify`
5. **Task 4: Bug fix** - `da9029a` — `fix(08): handle Firestore models as object {key:model}, not array`

## Files Created/Modified

- `src/shared/components/CatalogEditModal/CatalogEditModal.jsx` — new, 190 lines
- `src/shared/components/CatalogEditModal/CatalogEditModal.module.css` — new, 163 lines
- `src/shared/components/CatalogEditModal/index.js` — new, re-export
- `src/shared/components/DeleteConfirmModal/DeleteConfirmModal.jsx` — new, 80 lines
- `src/shared/components/DeleteConfirmModal/DeleteConfirmModal.module.css` — new, 77 lines
- `src/shared/components/DeleteConfirmModal/index.js` — new, re-export
- `src/pages/AdminPage/AdminPage.jsx` — rewritten (placeholder → CRUD screen), 200+ lines
- `src/pages/AdminPage/AdminPage.module.css` — extended with toolbar/grid/card/state classes
- `src/shared/hooks/useCatalogAdmin.js` — bug fix: rawToArray/arrayToRaw converters for Firestore object format
- `src/shared/hooks/__tests__/useCatalogAdmin.test.js` — updated to match Firestore object format

## Decisions Made

- `article` read-only/disabled in edit mode — prevents ghost-entries (RESEARCH.md Open Question #1)
- `valueAsNumber` on all numeric inputs — ensures Firestore receives `number` type, not `string` (Pitfall #4)
- Duplicate article checked in AdminPage `handleAdd` before calling `addModel` — client-side guard (Pitfall #5)
- `role="alertdialog"` for DeleteConfirmModal, `role="dialog"` for CatalogEditModal — semantically correct
- `isDeleting` state owned by AdminPage, passed down as prop — single source of truth for loading UI
- Firestore `models` field is an object `{articleKey: modelData}`, not an array — `rawToArray`/`arrayToRaw` converters added to `useCatalogAdmin` to bridge the gap between internal array state and Firestore storage format

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `models.filter is not a function` — Firestore models stored as object, not array**
- **Found during:** Task 4 (human browser verification)
- **Issue:** `useCatalogAdmin.js` assumed Firestore `models` field is an array. Real Firestore document stores it as `{articleKey: modelData}` object. This caused `TypeError: models.filter is not a function` on `/admin` page load.
- **Fix:** Added `rawToArray(raw)` converter (Object.entries → mapped array) for reads, and `arrayToRaw(arr)` (array → keyed object by `article`) for writes in `useCatalogAdmin.js`. All internal state remains as `Model[]` array — only the Firestore serialization layer changed.
- **Files modified:** `src/shared/hooks/useCatalogAdmin.js`, `src/shared/hooks/__tests__/useCatalogAdmin.test.js`
- **Verification:** Human verified in browser — catalog loads correctly, all CRUD operations work
- **Committed in:** `da9029a`

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for basic functionality. No scope creep — only the data format conversion layer changed.

## Known Stubs

None — all fields/paths connect to live `useCatalogAdmin` hook which reads/writes Firestore.

## Issues Encountered

- Firestore data format mismatch: `models` field stored as `{articleKey: modelData}` object, not as an array. Discovered during human browser verification (Task 4). Fixed externally and committed as `da9029a`.

## User Setup Required

None — no external service configuration required beyond what Phase 7 already established.

## Next Phase Readiness

- AdminPage CRUD screen is complete and verified — Phase 9 (Media & Ordering) can add photo upload input and drag-drop reorder to this same AdminPage
- `CatalogEditModal` has 14 fields wired; Phase 9 can add `photoUrl` field to the modal
- `useCatalogAdmin` hook is stable; `rawToArray`/`arrayToRaw` handles the Firestore format correctly

## Self-Check: PASSED

All task commits verified in git log:
- `60d2f5b` — CatalogEditModal
- `5453d2f` — DeleteConfirmModal
- `8980691` — AdminPage rewrite
- `718c7ac` — checkpoint state
- `da9029a` — bug fix (Firestore object format)

All created files exist on disk.

---
*Phase: 08-catalog-crud*
*Completed: 2026-05-26*
