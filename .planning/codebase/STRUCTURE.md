# Structure

## Directory Tree

```
Promet/
├── .planning/
│   └── codebase/
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
├── src/
│   ├── components/
│   │   ├── ColorPicker/
│   │   │   ├── ColorPicker.jsx
│   │   │   └── ColorPicker.css
│   │   ├── Configurator/
│   │   │   ├── Configurator.jsx
│   │   │   └── Configurator.css
│   │   ├── Footer/
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.css
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.css
│   │   └── Parameters/
│   │       ├── Parameters.jsx
│   │       └── Parameters.css
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/
│   └── img/
│       ├── logo.svg
│       ├── account.svg
│       ├── arrow-down.svg
│       ├── zoom.svg
│       └── refresh.svg
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## Directory Descriptions

### `src/` - Application Source Code

All production JavaScript and CSS files. Entry point is `src/main.jsx`.

### `src/components/` - React Components

Organized by feature/domain. Each component is a self-contained module with logic (`.jsx`) and styles (`.css`).

**Component Directories:**

#### `src/components/ColorPicker/`
**Purpose:** Reusable color selection dropdown component
- **ColorPicker.jsx** - Color picker dropdown with grouped palette
  - Manages `open` state for dropdown visibility
  - Uses `useRef` for DOM reference tracking
  - Uses `useEffect` for click-outside detection
  - Exports grouped color data (COLORS constant)
  - Accepts props: `placeholder`, `selected`, `onSelect`
  - Returns single-select color object: `{ color: '#...', name: 'RAL ...' }`
- **ColorPicker.css** - Dropdown styling, color swatches, active states

#### `src/components/Configurator/`
**Purpose:** Displays cabinet specifications in three-column layout
- **Configurator.jsx** - Static specification display
  - Defines three static spec arrays:
    - `DEFAULT_SPECS` - Standard cabinet configuration
    - `CHANGED_SPECS` - Custom modifications
    - `FINAL_SPECS` - Resulting configuration with price
  - No state management (presentational)
  - Includes commented-out 3D preview section (future)
  - Maps spec arrays to list items
- **Configurator.css** - Three-column grid layout, spec lists, action buttons

#### `src/components/Footer/`
**Purpose:** Application footer with copyright information
- **Footer.jsx** - Static footer element
  - Displays copyright: "© 1991 – 2026 ООО «НПО Промет»"
  - No state, no interaction
- **Footer.css** - Footer styling

#### `src/components/Header/`
**Purpose:** Application header with branding
- **Header.jsx** - Header with logo and account section
  - Left section: Logo + brand name "safe.ru" + tagline
  - Right section: Account icon + "Личный кабинет" link
  - No state, no interaction
- **Header.css** - Header layout and branding styles

#### `src/components/Parameters/`
**Purpose:** Configuration control panel (sidebar)
- **Parameters.jsx** - Main configuration interface
  - Manages 8 state variables:
    - `series` - Selected cabinet series
    - `model` - Selected cabinet model
    - `thickness` - Metal thickness (0.5/0.6/0.7 mm)
    - `width` - Cabinet width (mm)
    - `height` - Cabinet height (mm)
    - `lockIndex` - Selected lock type
    - `ventilation` - Ventilation enabled (boolean)
    - `bodyColor` - Body color selection
    - `doorColor` - Door color selection
  - Defines 4 configuration constants:
    - `SERIES_OPTIONS` - Series list
    - `MODEL_OPTIONS` - Model list
    - `THICKNESS_OPTIONS` - Thickness choices
    - `LOCK_OPTIONS` - Lock types with prices
  - Imports ColorPicker child component
  - Uses form controls: selects, toggles, inputs, buttons
- **Parameters.css** - Sidebar layout, form controls, toggle styling

### `src/` Root Files

#### `App.jsx`
**Purpose:** Root application component and layout orchestrator
- Renders page structure:
  ```jsx
  <>
    <Header />
    <div className="layout">
      <Configurator />
      <Parameters />
    </div>
    <Footer />
  </>
  ```
- Imports global styles `index.css`
- No state management

#### `main.jsx`
**Purpose:** Vite entry point
- Creates React root
- Mounts App to `#root` DOM element
- Wraps with React.StrictMode

#### `index.css`
**Purpose:** Global application styles
- CSS variables (if any)
- Reset/normalize styles
- Layout base styles

#### `App.css`
**Purpose:** App-level component styles
- `.layout` grid/flex container styles
- Page-level layout rules

### `public/` - Static Assets

#### `public/img/`
**Contents:**
- `logo.svg` - Promet company logo
- `account.svg` - Account icon
- `arrow-down.svg` - Dropdown indicator (reused in select + ColorPicker)
- `zoom.svg` - 3D preview zoom button (unused, for future)
- `refresh.svg` - 3D preview refresh button (unused, for future)

All SVGs are referenced by path: `/img/filename.svg`

### Root Configuration Files

#### `package.json`
- Project metadata: `name: "promet"`, `version: "0.0.0"`
- Dependencies:
  - `react@^19.2.4`
  - `react-dom@^19.2.4`
- Dev dependencies: Vite, ESLint, React plugins, TypeScript types
- Scripts:
  - `npm run dev` - Start dev server
  - `npm run build` - Build for production
  - `npm run lint` - Run ESLint
  - `npm run preview` - Preview production build

#### `vite.config.js`
- Vite configuration with React plugin
- Default entry: `index.html`

#### `eslint.config.js`
- ESLint configuration with React hooks plugin

#### `index.html`
- HTML entry point
- Provides `<div id="root"></div>` mount point
- Imports `src/main.jsx` as ES module

## Naming Conventions

### Components

**File Structure:** `ComponentName/ComponentName.jsx`

Examples:
- `src/components/Header/Header.jsx`
- `src/components/ColorPicker/ColorPicker.jsx`
- `src/components/Parameters/Parameters.jsx`

**Naming Rules:**
- PascalCase for component names (matches filename)
- Each component is default export
- Co-located CSS file: `ComponentName.css`

### Constants

**Scope:** Module-level (defined outside components)

**Naming:** UPPER_SNAKE_CASE

Examples:
- `COLORS` (ColorPicker.jsx)
- `DEFAULT_SPECS`, `CHANGED_SPECS`, `FINAL_SPECS` (Configurator.jsx)
- `SERIES_OPTIONS`, `MODEL_OPTIONS`, `THICKNESS_OPTIONS`, `LOCK_OPTIONS` (Parameters.jsx)

**Pattern:** Typically arrays of objects with consistent shape

### State Variables

**Naming:** camelCase

Examples:
- `series`, `model` - String selections
- `thickness` - String enum value
- `width`, `height` - String number inputs
- `lockIndex` - Number (array index)
- `ventilation` - Boolean
- `bodyColor`, `doorColor` - Object or null

**Pattern:** `[state, setState] = useState(initialValue)`

### Event Handlers

**Naming:** `handle[EventName]` (camelCase with "handle" prefix)

Examples:
- `handleClickOutside()` - Click outside element
- `handleTriggerClick(e)` - Click dropdown trigger
- `handleSelect(item)` - Select color item

**Pattern:** Usually passed to element event attributes or addEventListener

### CSS Classes

**Naming:** kebab-case with optional BEM-style modifiers

Examples:
- `.color-picker` - Component block
- `.color-picker--open` - Modifier (open state)
- `.item--active` - Modifier (selected item)
- `.trigger` - Child element
- `.toggle-btn--active` - Element with modifier

**Pattern:** Block-level class + optional `--modifier`

### Props

**Naming:** camelCase

Examples from ColorPicker:
- `placeholder` - String placeholder text
- `selected` - Current selection (object)
- `onSelect` - Callback function

## File Organization Principles

### 1. Component Locality
- Logic and styles co-located
- Each component in own directory
- Imports keep paths clear

### 2. Feature-Based Structure
- Components grouped by business domain (Header, Footer, Configurator, Parameters)
- Not grouped by technical type (no `utils/`, `hooks/`, `types/`)

### 3. Naming Consistency
- Component names match file names
- Constants in UPPER_SNAKE_CASE
- CSS classes in kebab-case
- Clear prefixes for functions (`handle*`, `get*`)

### 4. Asset Co-location
- Related CSS files next to components
- Global styles in `src/` root

## Dependency Graph

```
index.html
└── src/main.jsx
    └── src/App.jsx
        ├── src/components/Header/Header.jsx
        │   └── src/components/Header/Header.css
        ├── src/components/Configurator/Configurator.jsx
        │   └── src/components/Configurator/Configurator.css
        ├── src/components/Parameters/Parameters.jsx
        │   ├── src/components/Parameters/Parameters.css
        │   └── src/components/ColorPicker/ColorPicker.jsx
        │       └── src/components/ColorPicker/ColorPicker.css
        └── src/components/Footer/Footer.jsx
            └── src/components/Footer/Footer.css
```

## Assets Reference Map

**Images used:**

| Asset | Location | Used By | Purpose |
|-------|----------|---------|---------|
| `logo.svg` | `/img/logo.svg` | Header | Company logo |
| `account.svg` | `/img/account.svg` | Header | Account icon |
| `arrow-down.svg` | `/img/arrow-down.svg` | Parameters, ColorPicker | Dropdown chevron |
| `zoom.svg` | `/img/zoom.svg` | Configurator (commented) | 3D zoom button |
| `refresh.svg` | `/img/refresh.svg` | Configurator (commented) | 3D refresh button |

## Current Limitations

1. **No Shared Hooks** - No custom React hooks yet (all logic in components)
2. **No Utils Directory** - No shared utility functions extracted
3. **No Config Files** - Constants hardcoded in components (not in env files)
4. **No Testing** - No test files in directory structure
5. **No Type Definitions** - No TypeScript or JSDoc types currently
