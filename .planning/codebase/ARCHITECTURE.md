# Architecture

## Overview

Promet is a React-based web application built with Vite that serves as a locker cabinet configuration calculator. It enables users to customize metal cabinet specifications and see pricing information in real time.

**Stack:**
- React 19.2.4
- Vite 8.0.1
- Vanilla CSS
- ESLint for code quality

## Architectural Pattern

The application follows a **component-based** architecture with a vertical slice organization. The design is driven by domain separation (Header, Footer, Configurator, Parameters) rather than technical layers (utils, hooks, services).

The application uses a **lifting state up** pattern where component state is managed locally within each functional component using React hooks (`useState`, `useRef`, `useEffect`). No global state management library (Redux, Context API) is currently implemented.

## Component Tree

```
App (src/App.jsx)
├── Header (src/components/Header/Header.jsx)
│   └── Static header with branding and account section
├── div.layout
│   ├── Configurator (src/components/Configurator/Configurator.jsx)
│   │   └── Displays cabinet specifications in three-column grid
│   │       ├── DEFAULT_SPECS (static data)
│   │       ├── CHANGED_SPECS (static data)
│   │       └── FINAL_SPECS (static data)
│   └── Parameters (src/components/Parameters/Parameters.jsx)
│       └── Sidebar with configuration controls
│           ├── Select dropdowns (Series, Model)
│           ├── Toggle buttons (Thickness)
│           ├── Number inputs (Width, Height)
│           ├── Lock selection list
│           ├── Ventilation toggle
│           └── ColorPicker × 2 (Body & Door colors)
│               └── ColorPicker (src/components/ColorPicker/ColorPicker.jsx)
│                   └── Grouped color palette with dropdown interface
└── Footer (src/components/Footer/Footer.jsx)
    └── Static footer with copyright
```

## Data Flow

### Unidirectional Flow (One-Way Binding)

1. **User Interaction** → UI Component event handler
2. **State Update** → `setState` call via hooks
3. **Re-render** → Component and children re-render
4. **Display Update** → Visual changes reflected

### State Management Per Component

**Parameters Component (src/components/Parameters/Parameters.jsx):**
- Manages local UI state:
  - `series` - selected cabinet series
  - `model` - selected cabinet model
  - `thickness` - metal thickness (0.5, 0.6, 0.7 mm)
  - `width` - cabinet width in mm
  - `height` - cabinet height in mm
  - `lockIndex` - selected lock type index
  - `ventilation` - boolean ventilation flag
  - `bodyColor` - selected body color object
  - `doorColor` - selected door color object

**ColorPicker Component (src/components/ColorPicker/ColorPicker.jsx):**
- Manages local UI state:
  - `open` - dropdown visibility toggle
- Uses `useRef` to track DOM reference for click-outside detection
- Communicates with parent via callback: `onSelect(colorObject)`

**Configurator Component:**
- No state management (static display component)

**Header, Footer:**
- No state management (presentational components)

### Data Isolation

Currently, there is **no data flow between Configurator and Parameters**. The Configurator displays static specs (DEFAULT_SPECS, CHANGED_SPECS, FINAL_SPECS), while Parameters manages configuration state independently. Integrating these would require:
1. Moving state to App component
2. Passing state down as props to both children
3. Using callbacks to update shared state

## State Management Approach

**Current:** React Hooks (useState, useRef, useEffect)
- Lightweight, no external dependencies
- State lives in components that use it
- Props drilling not yet needed (parallel siblings don't communicate)

**Future Considerations:**
- Context API if state needs to cross component boundaries
- Custom hooks for shared logic
- External store (Redux/Zustand) if complexity grows

## Entry Points

### Application Entry

**`src/main.jsx`** (Vite entry point)
```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
- Mounts React app to `#root` DOM element (from `index.html`)
- Wraps app in `<StrictMode>` for development warnings

**`src/App.jsx`** (Application root component)
- Orchestrates layout structure
- Imports and renders: Header, Configurator, Parameters, Footer
- Imports global styles (`src/index.css`)

**`index.html`** (HTML entry point)
- Provides `<div id="root"></div>` target
- References `main.jsx` as module script

### Build Entry

**`vite.config.js`**
- Configures Vite with React plugin
- Default entry: `index.html` → `src/main.jsx`

## Key Abstractions

### 1. Component Scope (src/components/)

Each component is self-contained with co-located styles:
- `ComponentName.jsx` - Logic and markup
- `ComponentName.css` - Component-specific styling

**Example:** `src/components/Parameters/Parameters.jsx` + `src/components/Parameters/Parameters.css`

### 2. Configuration Data (Constants)

Static configuration data is defined as module-level constants within components:

**ColorPicker.jsx:**
```javascript
const COLORS = [
  { group: 'Базовые', items: [...] },
  { group: 'Популярные', items: [...] },
  { group: 'Яркие', items: [...] }
]
```

**Configurator.jsx:**
```javascript
const DEFAULT_SPECS = [...]
const CHANGED_SPECS = [...]
const FINAL_SPECS = [...]
```

**Parameters.jsx:**
```javascript
const SERIES_OPTIONS = [...]
const MODEL_OPTIONS = [...]
const THICKNESS_OPTIONS = [...]
const LOCK_OPTIONS = [...]
```

### 3. Hook Patterns

**ColorPicker click-outside detection:**
```javascript
useEffect(() => {
  function handleClickOutside(e) {
    if (ref.current && !ref.current.contains(e.target)) {
      setOpen(false);
    }
  }
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);
```

Uses `useRef` to track component DOM node and `useEffect` to manage event listener lifecycle.

### 4. UI Patterns

**Toggle Groups:** Buttons with active state class
```jsx
THICKNESS_OPTIONS.map(t => (
  <button
    className={`toggle-btn${thickness === t ? ' toggle-btn--active' : ''}`}
    onClick={() => setThickness(t)}
  >
    {t}
  </button>
))
```

**Dropdown Selection:** Controlled select element
```jsx
<select value={series} onChange={e => setSeries(e.target.value)}>
  <option value='' disabled>Placeholder</option>
  {SERIES_OPTIONS.map(option => ...)}
</select>
```

**Color Swatches:** Inline styles with conditional borders
```javascript
getSwatchStyle(colorHex) {
  const border = colorHex === '#ffffff'
    ? '1px solid #e2e8f0'
    : '1px solid rgba(0,0,0,0.12)';
  return { background: colorHex, border };
}
```

## Styling Architecture

**CSS Scope:**
- Global styles: `src/index.css`
- Component-scoped: `src/components/*/ComponentName.css`
- CSS-in-JS: Minimal inline styles (color swatches in ColorPicker)

**No CSS-in-JS Library:** Pure CSS files with BEM-like naming conventions (e.g., `color-picker--open`, `item--active`)

## Naming Conventions

### Components
- PascalCase: `Header`, `Configurator`, `Parameters`, `ColorPicker`
- File structure: `ComponentName/ComponentName.jsx`

### Constants
- UPPER_SNAKE_CASE: `DEFAULT_SPECS`, `COLORS`, `SERIES_OPTIONS`

### State
- camelCase: `series`, `bodyColor`, `lockIndex`, `ventilation`

### CSS Classes
- kebab-case with BEM modifiers: `color-picker`, `color-picker--open`, `item--active`

### Event Handlers
- Verb-prefixed camelCase: `handleClickOutside`, `handleTriggerClick`, `handleSelect`

## Critical Limitations & Design Decisions

1. **No Prop Drilling** - Currently safe because Configurator and Parameters are siblings that don't communicate
2. **Static Specs** - Configurator component displays hardcoded data; changes in Parameters don't affect it
3. **No Persistence** - State is lost on page refresh
4. **No API Integration** - All data is client-side; no backend communication
5. **No Form Submission** - Parameters controls exist but don't submit to backend

## Future Evolution Path

1. **Connect Parameters to Configurator** - Move state to App, pass props
2. **Add Shared State Management** - Consider Context API or Zustand
3. **Implement Data Persistence** - localStorage or API
4. **Form Submission** - Wire buttons ("КП для клиента", "Бланк НЗ") to actions
5. **Dynamic 3D Preview** - Uncomment 3D preview block and implement Three.js integration
