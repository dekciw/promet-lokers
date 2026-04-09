# Promet Configurator — правила для Claude

## Context7 — обязательно

Перед написанием любого кода, использующего библиотеку или фреймворк, — всегда обращаться к Context7 MCP за актуальной документацией.

**Стек проекта** (использовать Context7 для всего перечисленного):
- React 19 + Vite
- CSS Modules
- Firebase / Firestore REST API
- react-hook-form

**Когда использовать Context7:**
- Перед написанием хуков React (useEffect, useLayoutEffect, useRef и др.)
- Перед работой с Firebase / Firestore
- Перед работой с react-hook-form
- При добавлении новых зависимостей

## UI/UX Pro Max — обязательно для UI-задач

Скилл установлен в `.claude/skills/ui-ux-pro-max/`. Использовать при любой работе с интерфейсом.

**Когда использовать:**
- При создании или изменении компонентов (кнопки, карточки, формы, модалки)
- При выборе цветов, отступов, типографики
- При проверке доступности (accessibility)
- При работе с анимациями и переходами
- При code review UI-кода (`/gsd:ui-review`)
- При планировании UI-фаз (`/gsd:ui-phase`)

**Что содержит скилл:**
- 67 UI-стилей (glassmorphism, minimalism, brutalism и др.)
- 96 цветовых палитр
- 57 пар шрифтов
- 99 UX-правил по приоритетам (accessibility, touch targets, performance)
- Поддержка React + CSS Modules (стек проекта)

**Приоритеты UX-правил:**
1. Accessibility — контраст 4.5:1, focus-states, aria-labels
2. Touch targets — минимум 44×44px для кнопок
3. Performance — prefers-reduced-motion, lazy loading
4. Layout & Responsive — mobile-first

## Стиль кода

- Компоненты — `export default function`
- CSS классы — только camelCase (без дефисов)
- Стейт поднят в App.jsx, логика вынесена в хуки (`src/hooks/`)
