---
phase: 11-users-history
plan: "01"
subsystem: auth
tags: [firebase, firestore, react-hooks, users, secondary-app-pattern]

# Dependency graph
requires:
  - phase: 07-foundation
    provides: Firebase Auth + Firestore initialized in src/shared/lib/firebase.js
  - phase: 08-catalog-crud
    provides: useCatalogAdmin hook pattern (useState/useCallback/useEffect structure)
provides:
  - useUsersAdmin hook with loadUsers/createUser/disableUser
  - firebaseConfig exported from src/shared/lib/firebase.js for secondary app pattern
  - Unit tests USERS-01..04 (6 tests, all passing)
affects:
  - 11-02 (useHistory hook — needs firebaseConfig indirectly)
  - 11-03 (UsersTab UI — imports useUsersAdmin)
  - 11-04 (LoginScreen gate — uses firebaseConfig via db/auth)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Secondary Firebase App pattern for user creation without signing out admin
    - uid override pattern in Firestore doc mapping: { ...d.data(), uid: d.id } (doc ID takes priority over data field)

key-files:
  created:
    - src/shared/hooks/useUsersAdmin.js
    - src/shared/hooks/__tests__/useUsersAdmin.test.js
  modified:
    - src/shared/lib/firebase.js (firebaseConfig now exported)

key-decisions:
  - "firebaseConfig exported via simple const → export const change (no duplication of env vars)"
  - "Spread order in doc mapping: { ...d.data(), uid: d.id } so doc ID always wins over any uid field in data"
  - "Secondary app name uses Date.now() suffix for uniqueness — avoids Firebase App name collision pitfall"
  - "deleteApp in finally block wraps both signOut and deleteApp in try/catch to tolerate partial failures"
  - "createUser adds new user to local state via optimistic update (setUsers prev => [...prev, newUser]) — no re-fetch needed"

patterns-established:
  - "Secondary Firebase App pattern: initializeApp(firebaseConfig, unique-name) → getAuth → createUser → finally: signOut + deleteApp"
  - "Firestore doc mapping: { ...d.data(), uid: d.id } — uid always from document ID"

requirements-completed: [USERS-01, USERS-02, USERS-03, USERS-04]

# Metrics
duration: 2min
completed: 2026-05-27
---

# Phase 11 Plan 01: useUsersAdmin Hook Summary

**Secondary Firebase App pattern for admin user creation + Firestore users collection hook with loadUsers/createUser/disableUser, firebaseConfig exported**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-27T04:42:16Z
- **Completed:** 2026-05-27T04:44:30Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments
- Exported `firebaseConfig` from `firebase.js` — required for downstream secondary app usage
- Implemented `useUsersAdmin` hook covering all 4 requirements (USERS-01..04) at hook level without UI
- 6 unit tests cover: load-on-mount, load error, secondary app create flow, finally cleanup, disableUser optimistic update, list refresh after create
- Full test suite: 112 tests passing, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: RED phase — firebaseConfig export + failing tests** - `6ed6a81` (test)
2. **Task 2: GREEN phase — useUsersAdmin implementation** - `7346bea` (feat)

## Files Created/Modified
- `src/shared/lib/firebase.js` — Added `export` keyword to `firebaseConfig` declaration
- `src/shared/hooks/useUsersAdmin.js` — New hook: loadUsers, createUser (secondary app), disableUser (soft-delete)
- `src/shared/hooks/__tests__/useUsersAdmin.test.js` — 6 unit tests covering USERS-01..04

## Decisions Made
- **Spread order in doc mapping**: `{ ...d.data(), uid: d.id }` — the mock's `data()` included `uid: undefined`, which would override `d.id` if uid is first. Putting `uid: d.id` last ensures doc ID always wins.
- **Secondary app name uniqueness**: `secondary-${Date.now()}` rather than a static name — avoids "Firebase App already exists" error on rapid repeated calls or if a previous call failed before `deleteApp`.
- **Optimistic local update in createUser**: Appends new user to `users` state directly without re-fetching — consistent with `useCatalogAdmin` pattern and saves a Firestore read.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed uid mapping order in loadUsers**
- **Found during:** Task 2 (GREEN phase — first test run)
- **Issue:** Initial impl used `{ uid: d.id, ...d.data() }` — the mock returns `{ ...u, uid: undefined }` from `data()`, so spreading data after sets uid to undefined
- **Fix:** Changed to `{ ...d.data(), uid: d.id }` — doc ID always wins, matches Firestore semantics
- **Files modified:** src/shared/hooks/useUsersAdmin.js
- **Verification:** All 6 tests pass including USERS-01 which checks uid values
- **Committed in:** 7346bea (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Minor bug in spread order; required 1 extra test run. No scope creep.

## Issues Encountered
- Initial test run showed 2 failures (USERS-01 and USERS-03) due to uid field being overridden by `undefined` from mock data — fixed by reversing spread order in loadUsers mapper.

## Known Stubs
None — hook is fully implemented with real Firebase calls. UI comes in Plan 11-03.

## Known Limitations
- `createUser` does not delete the Firebase Auth account if the subsequent Firestore `setDoc` fails. No Admin SDK available (Spark plan). Admin must manually clean up orphaned Auth accounts if this rare case occurs.
- `disableUser` only sets `status: 'disabled'` in Firestore; it does NOT revoke the user's Firebase Auth token. The login gate (Plan 11-04) will prevent future logins, but an already-authenticated user stays signed in until their session expires.

## Next Phase Readiness
- `useUsersAdmin` is fully testable and ready for UI integration in Plan 11-03
- `firebaseConfig` is exported — ready for any plan needing secondary app or config reference
- USERS-01..04 covered at hook level; UI-level coverage arrives in Plan 11-03 (UsersTab component)

---
*Phase: 11-users-history*
*Completed: 2026-05-27*
