---
plan: 01-02-state-lift
status: complete
---

## Summary

State поднят в App.jsx. Parameters работает только через props. calcPrice вычисляет цену в реальном времени.

## Files Modified
- src/App.jsx — весь конфигурационный state, calcPrice, handleModelChange, передача props
- src/components/Parameters/Parameters.jsx — убран useState, принимает config+catalog+setters

## Key Decisions
- handleModelChange автозаполняет width/height из defaultSpecs при смене модели
- price = null когда модель не выбрана (Configurator отображает "—")
- catalog передаётся и в Configurator, и в Parameters как проп
