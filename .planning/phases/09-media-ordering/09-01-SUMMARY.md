---
phase: 09-media-ordering
plan: "01"
subsystem: shared/lib + shared/hooks
tags: [cloudinary, canvas-api, dnd-kit, tdd, firestore]
dependency_graph:
  requires: [08-02]
  provides: [cloudinaryUpload, useImageUpload, reorderModels]
  affects: [09-02, useCatalogAdmin]
tech_stack:
  added:
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/utilities@3.2.2"
  patterns:
    - Canvas API resize (no npm lib)
    - Cloudinary unsigned upload via FormData fetch
    - vi.stubEnv + vi.resetModules for module-load-time env testing
    - read-splice-write Firestore pattern (Phase 8 preserved)
key_files:
  created:
    - src/shared/lib/cloudinaryUpload.js
    - src/shared/lib/__tests__/cloudinaryUpload.test.js
    - src/shared/hooks/useImageUpload.js
    - src/shared/hooks/__tests__/useImageUpload.test.js
  modified:
    - src/shared/hooks/useCatalogAdmin.js
    - src/shared/hooks/__tests__/useCatalogAdmin.test.js
    - package.json
    - package-lock.json
    - .env.example
decisions:
  - "vi.stubEnv + vi.resetModules + dynamic import() for testing module-load-time env vars (CLOUD_NAME read at top-level const)"
  - "URL.createObjectURL/revokeObjectURL defined as global stubs in test file header — jsdom doesn't implement them"
  - "FormData.get('file') returns File (extends Blob) in jsdom — tested with toBeInstanceOf(Blob) + size check instead of reference equality"
  - "Test 6 idempotent reorder: removed .resolves.not.toThrow() wrapper — was preventing setDoc assertion from running after act()"
metrics:
  duration_seconds: 409
  completed_date: "2026-05-26"
  tasks_completed: 4
  tests_added: 25
  files_created: 4
  files_modified: 5
---

# Phase 09 Plan 01: Foundation — Cloudinary + Canvas resize + @dnd-kit + reorderModels Summary

**One-liner:** Canvas resize + Cloudinary unsigned upload pure functions wrapped in useImageUpload hook; reorderModels added to useCatalogAdmin with read-merge-write pattern protecting filtered subsets; @dnd-kit packages installed.

---

## What Was Built

### Task 1: @dnd-kit + .env.example
- Installed `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`
- Added `VITE_CLOUDINARY_CLOUD_NAME=` and `VITE_CLOUDINARY_UPLOAD_PRESET=` to `.env.example`
- All 74 pre-existing tests remained green

### Task 2: cloudinaryUpload.js (TDD RED → GREEN)
**Exports:** `resizeImageToHeight(file, targetHeight=1520)` + `uploadToCloudinary(blob)`

- `resizeImageToHeight`: loads File into `Image`, draws onto `canvas` at proportional dimensions, returns PNG Blob via `canvas.toBlob()`
- `URL.revokeObjectURL` called in BOTH `onload` and `onerror` paths (memory leak guard)
- `uploadToCloudinary`: POST FormData to `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, returns `data.secure_url`
- Zero Firebase Storage imports (Spark plan blocks Storage)

**Tests (9 total):**
- Resize math (800x400 → 1520h = 3040w canvas)
- Default arg (targetHeight=1520)
- Memory leak guard (createObjectURL×1, revokeObjectURL×1)
- Error path: img.onerror → "Image load failed"
- toBlob null guard → "Canvas toBlob"
- Happy path upload → secure_url
- FormData shape (URL + file + upload_preset)
- Network error 400 → throws "Cloudinary upload failed: 400"
- Env var injection via vi.stubEnv

### Task 3: useImageUpload.js (TDD RED → GREEN)
**Export:** `useImageUpload({ saveModel })` → `{ uploadPhoto, isUploading, uploadError }`

- `uploadPhoto(file, currentModel)` calls resize → upload → saveModel in order
- `setUploadError(null)` cleared at start of each call (retry semantics)
- Error from any stage sets `uploadError`, isUploading resets to false
- All original model fields preserved via `{ ...currentModel, photoUrl }`
- `uploadPhoto` wrapped in `useCallback([saveModel])`

**Tests (9 total):** default state, call order, isUploading toggle, return value, resize error, cloudinary error, saveModel error, error clear on retry, field preservation (14 fields + photoUrl)

### Task 4: reorderModels in useCatalogAdmin (TDD RED → GREEN)
**Addition to return object:** `reorderModels(reorderedArr: Model[]) → Promise<void>`

- Reassigns `sortOrder: i + 1` sequentially per new array position
- Reads FULL Firestore array before writing (prevents Pitfall #4: filtered-view data loss)
- Merges updated sortOrders back via `current.map(m => withNewOrder.find(...) ?? m)`
- `writeModels()` call (existing helper) handles `setDoc({merge:true})` + localStorage cache invalidation

**Tests (7 total):** sortOrder reassignment, local state update, invisible model preservation (5 models, 3 reordered), localStorage clear, merge:true check, idempotency, missing sortOrder field handling

---

## Exported Contracts for 09-02

```javascript
// src/shared/lib/cloudinaryUpload.js
export function resizeImageToHeight(file: File|Blob, targetHeight?: number = 1520): Promise<Blob>
export async function uploadToCloudinary(blob: Blob): Promise<string> // returns secure_url

// src/shared/hooks/useImageUpload.js
export function useImageUpload({ saveModel }): {
  uploadPhoto: (file: File|Blob, currentModel: object) => Promise<string>,
  isUploading: boolean,
  uploadError: string | null,
}

// src/shared/hooks/useCatalogAdmin.js (extended)
export function useCatalogAdmin(): {
  models, isLoading, error, loadModels,
  saveModel, addModel, deleteModel,
  reorderModels: (reorderedArr: Model[]) => Promise<void>,  // NEW
}
```

---

## Test Coverage Summary

| File | Tests | Status |
|------|-------|--------|
| cloudinaryUpload.test.js | 9 | green |
| useImageUpload.test.js | 9 | green |
| useCatalogAdmin.test.js | 17 (10 existing + 7 new) | green |
| **Total new tests** | **25** | |
| **Full suite** | **99** | all green |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jsdom lacks URL.createObjectURL/revokeObjectURL**
- **Found during:** Task 2 GREEN run
- **Issue:** `vi.spyOn(URL, 'createObjectURL')` throws "createObjectURL does not exist" — jsdom doesn't implement the Web API
- **Fix:** Added global stubs at test file top: `URL.createObjectURL = vi.fn(() => 'blob:fake')` and `URL.revokeObjectURL = vi.fn()`, guarded with `if (!URL.createObjectURL)`
- **Files modified:** `src/shared/lib/__tests__/cloudinaryUpload.test.js`

**2. [Rule 1 - Bug] FormData.get('file') returns File not Blob in jsdom**
- **Found during:** Task 2 GREEN run (Test 7)
- **Issue:** When a `Blob` is appended to `FormData`, jsdom wraps it as `File` — reference equality check `expect(capturedBody.get('file')).toBe(blob)` failed
- **Fix:** Changed assertion to `toBeInstanceOf(Blob)` + `.size` comparison (File extends Blob, so instanceof check is valid)
- **Files modified:** `src/shared/lib/__tests__/cloudinaryUpload.test.js`

**3. [Rule 1 - Bug] Test 6 setDoc assertion unreachable after .resolves.not.toThrow()**
- **Found during:** Task 4 GREEN run
- **Issue:** `await expect(act(async() => {...})).resolves.not.toThrow()` followed by `expect(setDoc).toHaveBeenCalled()` — the setDoc assertion was evaluated before the async act resolved
- **Fix:** Replaced with straightforward `await act(async () => { ... })` + separate expect line
- **Files modified:** `src/shared/hooks/__tests__/useCatalogAdmin.test.js`

---

## Context7 Notes

**React 19 useCallback:** The `[saveModel]` dependency in `useImageUpload` is correct per React docs — `uploadPhoto` captures `saveModel` from props and must update when `saveModel` changes identity. Callers should wrap their `saveModel` prop in `useCallback` at the call site to avoid unnecessary `uploadPhoto` re-creation.

**Firestore setDoc merge:true:** Confirmed by Firebase docs — `setDoc(ref, data, { merge: true })` merges the provided data with the existing document, preserving fields not mentioned. This is the established Phase 8 pattern and is used in `writeModels()` — `reorderModels` does not duplicate the setDoc call.

---

## Known Stubs

None — this plan is pure logic (no UI rendering, no data display to wire up). All async contracts are fully implemented and tested.

---

## Self-Check: PASSED
