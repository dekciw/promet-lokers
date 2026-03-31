# Code Conventions

## Code Style

### Indentation
- **Tabs** (not spaces) - Uses hard tab character for indentation throughout JSX and CSS
- Examples: `ColorPicker.jsx`, `Parameters.jsx`, `Configurator.jsx`

### Quotes
- **Single quotes** (`'`) for string literals
- Examples from `ColorPicker.jsx`:
  - `import { useState, useRef, useEffect, Fragment } from 'react';`
  - `const border = colorHex === '#ffffff' ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.12)';`
  - `className={`color-picker${open ? ' color-picker--open' : ''}`}`

### Semicolons
- **Semicolons required** at end of statements
- Applied consistently across all JS/JSX files
- Example: `const COLORS = [ ... ];`

### Trailing Commas
- Used in object and array literals
- Example from `Parameters.jsx`:
  ```jsx
  const LOCK_OPTIONS = [
    { name: 'Ключевой (Базовый)', price: null },
    { name: 'Замок 2', price: '+800 ₽' },
  ];
  ```

## Naming Conventions

### React Components
- **PascalCase** - Components are named with capital first letter
- File naming matches component name: `ColorPicker.jsx`, `Parameters.jsx`, `Configurator.jsx`
- Files are placed in component directories: `src/components/[ComponentName]/[ComponentName].jsx`
- Default exports used for main component: `export default function ColorPicker({ ... }) { ... }`

### Constants & Variables
- **camelCase** for variables: `series`, `model`, `thickness`, `selected`, `onSelect`
- **SCREAMING_SNAKE_CASE** for constants that are data lists:
  - `COLORS` - color palette groups
  - `SERIES_OPTIONS` - series dropdown options
  - `MODEL_OPTIONS` - model dropdown options
  - `THICKNESS_OPTIONS` - thickness toggle options
  - `LOCK_OPTIONS` - lock list options
  - `DEFAULT_SPECS`, `CHANGED_SPECS`, `FINAL_SPECS` - configuration specifications

### Event Handlers
- **camelCase prefixed with handle**: `handleClickOutside`, `handleTriggerClick`, `handleSelect`
- Functions describing actions that trigger state changes
- Location: Typically defined within component, referenced inline

### Helper Functions
- **camelCase**: `getSwatchStyle` - pure functions that return computed values
- Placed near where they're used in component

### Files
- **Component files**: PascalCase (e.g., `ColorPicker.jsx`)
- **Style files**: Match component name with `.css` extension (e.g., `ColorPicker.css`)
- **Directory structure**: Component folders contain both JSX and CSS files
  - `src/components/ComponentName/ComponentName.jsx`
  - `src/components/ComponentName/ComponentName.css`

## CSS Class Naming Pattern

### BEM-inspired Naming
CSS classes follow a modified BEM (Block, Element, Modifier) convention with kebab-case:

#### Block Classes
- Root component block: `.color-picker`, `.parameters`, `.header`, `.footer`, `.configurator`
- Typically matches component or feature name with hyphens

#### Element Classes (Block__Element)
- Nested elements use single hyphen connecting (not double underscore):
- Examples:
  - `.trigger-swatch` (element of trigger)
  - `.trigger-text` (element of trigger)
  - `.trigger-arrow` (element of trigger)
  - `.item-swatch` (element of item)
  - `.item-name` (element of item)
  - `.lock-name` (element of lock-item)
  - `.lock-price` (element of lock-item)
  - `.group-label` (element of param-group)
  - `.group-input` (element of param-group)

#### Modifier Classes (Block--modifier or Element--modifier)
- Modifiers use double hyphen for variant states:
- Examples:
  - `.color-picker--open` (active state of color-picker)
  - `.item--active` (active state of item)
  - `.toggle-btn--active` (active state of toggle-btn)
  - `.lock-item--active` (active state of lock-item)
  - `.vent-btn--active` (active state of vent-btn)
  - `.group-label--sm` (size variant of group-label)

### CSS Structure
- Classes are kebab-case throughout
- One root selector per component
- Cascading selectors for state changes (e.g., `.color-picker--open .dropdown`)
- Minimal nesting depth
- Example from `ColorPicker.css`:
  ```css
  .color-picker {
    position: relative;
  }

  .color-picker--open .trigger {
    border-color: var(--c-border);
  }

  .item--active {
    background: var(--c-primary-bg);
  }
  ```

## Component Patterns

### Functional Components with Hooks
All components are functional components using React Hooks:
- Location: `src/components/[ComponentName]/[ComponentName].jsx`
- Example pattern from `ColorPicker.jsx`:
  ```jsx
  import { useState, useRef, useEffect, Fragment } from 'react';
  import './ColorPicker.css';

  export default function ColorPicker({ placeholder, selected, onSelect }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      // Effect logic
    }, []);

    function handleEvent(e) {
      // Handler logic
    }

    return (
      // JSX
    );
  }
  ```

### Props & Destructuring
- Props destructured in function parameters
- Example: `ColorPicker({ placeholder, selected, onSelect })`
- Parameters.jsx passes `bodyColor` and `doorColor` state to ColorPicker via props

### State Management
- Component-level state only (no external state management)
- Uses `useState` hook for component state
- Example from Parameters.jsx:
  ```jsx
  const [series, setSeries] = useState('');
  const [model, setModel] = useState('');
  const [thickness, setThickness] = useState('0.5');
  ```

### Data Constants
- Data constants defined at module level (outside component)
- Organized as SCREAMING_SNAKE_CASE arrays/objects
- Examples:
  - Color groups in `ColorPicker.jsx`
  - Options lists in `Parameters.jsx`
  - Specification lists in `Configurator.jsx`

### Comments & Documentation
- Inline comments use `/* Comment */` syntax (block comments)
- Comments explain the "why" not the "what"
- Examples:
  - `/* Выпадающий список выбора цвета показывает цветовые группы, запоминает выбранный цвет и закрывается при клике вне компонента. */`
  - `/* Закрывает дропдаун, если пользователь кликнул за пределами компонента. */`
  - Located at component level or section level

## State Management Patterns

### Local Component State
- All state is managed within individual components using `useState`
- No global state management (Redux, Context, etc.) currently in place
- Pattern:
  ```jsx
  const [stateVar, setStateVar] = useState(initialValue);
  ```

### State Updates
- State updaters follow naming: `set[CamelCase]`
- Inline arrow functions for simple updates: `onChange={e => setState(e.target.value)}`
- Named functions for complex logic:
  ```jsx
  function handleSelect(item) {
    onSelect(item);
    setOpen(false);
  }
  ```

### Parent-Child Communication
- Data flows down via props (one-way)
- Callbacks flow up via function props (e.g., `onSelect`, `onChange`)
- Example: Parameters passes `setBodyColor` as `onSelect` prop to ColorPicker

## Import Conventions

### Import Organization
- React imports first (with named imports grouped)
- Relative imports for component/style files
- No external dependencies except React
- Example pattern from all components:
  ```jsx
  import { useState, useRef, useEffect, Fragment } from 'react';
  import './ComponentName.css';
  ```

### Import Order
1. React imports (hooks, utilities)
2. Component imports
3. Style imports (relative path with leading `./`)
4. No absolute imports used

### File Import Paths
- Relative paths: `import ColorPicker from '../ColorPicker/ColorPicker';`
- CSS files: `import './ComponentName.css';`
- No index files - direct component file imports

## ESLint Configuration

See `eslint.config.js` for the enforced linting rules:
- ES version: 2020+
- Parser features: JSX enabled
- Extends: JS recommended, React Hooks recommended, React Refresh (Vite)
- Custom rule: `varsIgnorePattern: '^[A-Z_]'` - allows unused variables starting with capital letter or underscore (for constants)

## CSS Design Tokens

Located in `src/index.css` as CSS custom properties:

### Color Variables
- `--c-bg` (background)
- `--c-white`, `--c-border`, `--c-border-light`
- `--c-text-dark`, `--c-text-mid`, `--c-text-muted`, `--c-text-faint`
- `--c-primary`, `--c-primary-bg`, `--c-primary-border`
- Specific card colors: `--card-default-bg`, `--card-changed-bg`, `--card-final-bg`
- Brand color: `--c-brand`
- Accent colors: `--c-orange`, `--c-orange-hover`, `--c-orange-active`

### Typography Variables
- `--f-main`: 'Roboto' (body text)
- `--f-display`: 'Oswald' (headings)
- `--f-mono`: 'Liberation Mono' (code)

### Spacing & Radius
- Radii: `--r-sm` (8px), `--r-md` (12px), `--r-lg` (16px), `--r-full` (9999px)

### Shadow Variables
- Multiple shadow levels: `--s-xs`, `--s-md`, `--s-lg`, `--s-xl`
- Primary shadows: `--s-primary`, `--s-primary-btn`
