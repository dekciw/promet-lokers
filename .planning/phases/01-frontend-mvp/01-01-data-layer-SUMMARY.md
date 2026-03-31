---
plan: 01-01-data-layer
status: complete
---

## Summary

Создан data layer: STUB_CATALOG с 2 сериями, 3 моделями, 5 замками и calcDiff утилита.

## Files Created
- src/data/stubCatalog.js — каталог-заглушка (серии, модели, замки, наценки)
- src/utils/calcDiff.js — утилита сравнения конфигурации со стандартом

## Key Decisions
- lockName (не lockId) используется в calcDiff — caller должен передать читаемое имя
- thicknessSurcharges не содержит '0.5' — стандарт без наценки
- calcDiff возвращает [] при отсутствии defaults (не null)
