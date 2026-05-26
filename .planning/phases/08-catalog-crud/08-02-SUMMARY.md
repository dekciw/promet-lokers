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
  - 08-03 (if any: photo upload, drag-drop sort — consumers of AdminPage)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - createPortal + AnimatePresence for modal overlay (proven NonStandardOrderModal pattern)
    - react-hook-form useForm with valueAsNumber for all numeric fields (Firestore type safety)
    - article field read-only/disabled in edit mode (prevents ghost-entries)
    - duplicate article guard before addModel (client-side validation)
    - useMemo for filtered+sorted visibleModels (performance with ~100 models)

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

key-decisions:
  - "article field read-only/disabled in edit mode — prevents ghost-entries (Open Question #1 from RESEARCH.md)"
  - "valueAsNumber on all numeric fields — Firestore saves numbers not strings (Pitfall #4)"
  - "duplicate article guard in handleAdd — client-side check before calling addModel (Pitfall #5)"
  - "role=alertdialog for DeleteConfirmModal, role=dialog for CatalogEditModal — correct ARIA semantics"
  - "isDeleting managed by parent (AdminPage) not DeleteConfirmModal — single source of truth"

# Metrics
duration: ~4min
completed: 2026-05-26
status: checkpoint-pending (Task 4: human-verify in browser)
---

# Phase 08 Plan 02: Admin UI — CatalogEditModal + DeleteConfirmModal + AdminPage Summary

**Full CRUD UI for catalog admin: CatalogEditModal (14-field add/edit form), DeleteConfirmModal (alertdialog), AdminPage rewritten with filter/search/cards grid + notification feedback — build clean, 74/74 tests passing. Awaiting human verification in browser (Task 4).**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-26T15:11:20Z
- **Completed (Tasks 1-3):** 2026-05-26T15:15:28Z
- **Tasks:** 3 of 4 completed (Task 4 = human-verify checkpoint)
- **Files created/modified:** 8

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

## Task Commits

Each task committed atomically:

1. **Task 1: CatalogEditModal** - `60d2f5b` — `feat(08-02): add CatalogEditModal component with 14 fields and validation`
2. **Task 2: DeleteConfirmModal** - `5453d2f` — `feat(08-02): add DeleteConfirmModal alertdialog component`
3. **Task 3: AdminPage rewrite** - `8980691` — `feat(08-02): wire AdminPage with catalog list, filter, search, CRUD modals`

## Files Created/Modified

- `src/shared/components/CatalogEditModal/CatalogEditModal.jsx` — new, 190 lines
- `src/shared/components/CatalogEditModal/CatalogEditModal.module.css` — new, 163 lines
- `src/shared/components/CatalogEditModal/index.js` — new, re-export
- `src/shared/components/DeleteConfirmModal/DeleteConfirmModal.jsx` — new, 80 lines
- `src/shared/components/DeleteConfirmModal/DeleteConfirmModal.module.css` — new, 77 lines
- `src/shared/components/DeleteConfirmModal/index.js` — new, re-export
- `src/pages/AdminPage/AdminPage.jsx` — rewritten (placeholder → CRUD screen), 200+ lines
- `src/pages/AdminPage/AdminPage.module.css` — extended with toolbar/grid/card/state classes

## Decisions Made

- `article` read-only/disabled in edit mode — prevents ghost-entries (RESEARCH.md Open Question #1)
- `valueAsNumber` on all numeric inputs — ensures Firestore receives `number` type, not `string` (Pitfall #4)
- Duplicate article checked in AdminPage `handleAdd` before calling `addModel` — client-side guard (Pitfall #5)
- `role="alertdialog"` for DeleteConfirmModal, `role="dialog"` for CatalogEditModal — semantically correct
- `isDeleting` state owned by AdminPage, passed down as prop — single source of truth for loading UI

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all 8 fields/paths connect to live `useCatalogAdmin` hook which reads/writes Firestore.

## Checkpoint Status

**Task 4 is a `checkpoint:human-verify` — awaiting manual browser verification.**

Human verification required:
- CATALOG-01: model cards grid loads from Firestore
- CATALOG-02: ML/LS/All filter tabs work
- CATALOG-03: search by name (case-insensitive)
- CATALOG-04/05/06: edit modal pre-fills, saves to Firestore as numbers
- CATALOG-07: add with duplicate article guard
- CATALOG-08: delete with confirmation dialog
- Cache invalidation: /configurator sees fresh data after admin edits
- Accessibility quick check: focus rings, ESC, touch targets

---
*Phase: 08-catalog-crud*
*Status: checkpoint-pending*
*Completed (Tasks 1-3): 2026-05-26*
