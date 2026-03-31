# Project State

_GSD workflow state for Конфигуратор «Промет»_

---

## Current Phase

**Phase 1 — Frontend MVP** · `not_started`

Next action: `/gsd:plan-phase 1`

---

## Phase History

| Phase | Status | Completed | Notes |
|-------|--------|-----------|-------|
| Phase 1 | not_started | — | — |
| Phase 2 | blocked | — | Blocked by Phase 1 |
| Phase 3 | blocked | — | After focus group |
| Phase 4 | blocked | — | After focus group |

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-31 | MVP = Phase 1 + Phase 2 | Show manager + focus group on full data, then PDF in Phase 3 |
| 2026-03-31 | Firebase getDocs (not onSnapshot) for catalog | Catalog is read-once; onSnapshot × N managers = quota risk |
| 2026-03-31 | MobX module-level singletons | React 19 StrictMode double-mount causes duplicate Firebase calls with component-level stores |
| 2026-03-31 | @react-pdf/renderer v3.3+ | v3.3 ships browser-native build; older versions reference Node globals |
| 2026-03-31 | Lazy import for PDF library | +300-400 kB gzip; only needed on button click |
| 2026-03-31 | Modular Firebase SDK (not compat) | 35 kB vs 150 kB gzip |
| 2026-03-31 | Roboto TTF in public/fonts | Required for Cyrillic in @react-pdf/renderer |
| 2026-03-31 | calcDiff as standalone util | Testable in isolation; used in both Phase 1 (stub) and Phase 2 (MobX computed) |

---

## Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Финальные данные: цены, артикулы, наценки из Excel | Команда Промет | Open |
| 2 | Список сотрудников для Firebase Auth (email list) | Менеджер Промет | Phase 4 |
| 3 | Контакты менеджера для КП (имя, телефон, email) | Менеджер Промет | Phase 3 |
| 4 | Логотип для PDF (png/svg, размер) | Менеджер Промет | Phase 3 |

---

## Codebase Snapshot (2026-03-31)

- **Stack:** React 19.2.4 + Vite 8.0.1 + Vanilla CSS
- **Components:** Header, Footer, Configurator, Parameters, ColorPicker — в `src/components/Name/`
- **State:** Вся конфигурация в Parameters.jsx (не поднята в App)
- **Data:** Временные константы в компонентах (SERIES_OPTIONS, MODEL_OPTIONS, LOCK_OPTIONS, COLORS)
- **Configurator:** Хардкод (DEFAULT_SPECS, CHANGED_SPECS, FINAL_SPECS), цена = 14 200 ₽
- **Not connected:** Parameters и Configurator не связаны через props

---

## Research Summary

| File | Lines | Key Finding |
|------|-------|-------------|
| `.planning/research/STACK.md` | — | Firebase modular SDK v9+ + MobX 6+ + react-pdf v3.3+ |
| `.planning/research/ARCHITECTURE.md` | — | MobX store структура: CatalogStore + ConfigStore + StoreContext |
| `.planning/research/FEATURES.md` | 797 | calcPrice формула, calcDiff утилита, ProposalDocument JSX, CatalogStore.load() |
| `.planning/research/PITFALLS.md` | 339 | getDocs not onSnapshot, runInAction after await, lazy PDF import, Cyrillic font |

---

*Last updated: 2026-03-31 · Phase 1 not started*
