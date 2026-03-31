# Technology Stack — Промет

## Languages

- **JavaScript (ES2020+)** — All application logic
- **JSX** — React component templates
- **CSS3** — Styling with CSS Custom Properties (CSS variables)
- **HTML5** — Document structure in `index.html`

## Runtime & Package Manager

- **Node.js** — JavaScript runtime (implied by npm scripts)
- **npm** — Package manager (using `package-lock.json`)

## Frameworks & Core Libraries

### Frontend Framework
- **React 19.2.4** — UI component library for building interactive user interfaces
  - Located in: `src/` with entry point `src/main.jsx`
  - Mounted to: `<div id="root">` in `index.html`

### DOM Rendering
- **React DOM 19.2.4** — Mounts React components to the DOM via `createRoot()`

## Build Tooling

### Primary Build Tool
- **Vite 8.0.1** (`vite.config.js`)
  - Plugin: `@vitejs/plugin-react` (6.0.1) — Fast Refresh for React development
  - Dev server: `npm run dev`
  - Production build: `npm run build`
  - Output directory: `dist/` (included in `.gitignore`)
  - Preview mode: `npm run preview`

## Code Quality & Linting

### ESLint (9.39.4)
- **Configuration file:** `eslint.config.js`
- **Rules applied:**
  - JavaScript recommended rules via `@eslint/js`
  - React Hooks best practices via `eslint-plugin-react-hooks` (7.0.1)
  - React Fast Refresh rules via `eslint-plugin-react-refresh` (0.5.2)
  - Custom rule: `no-unused-vars` with pattern ignore for uppercase/underscore variables
- **ECMAScript target:** 2020+
- **JSX support enabled:** Yes
- **Browser globals:** Enabled via `globals` package (17.4.0)
- **Run command:** `npm run lint`
- **Ignored paths:** `dist/`

### Type Definitions
- **@types/react** (19.2.14) — TypeScript type definitions for React
- **@types/react-dom** (19.2.3) — TypeScript type definitions for React DOM

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Project metadata, dependencies, npm scripts |
| `package-lock.json` | Locked dependency versions for reproducible installs |
| `vite.config.js` | Vite build configuration with React plugin |
| `eslint.config.js` | ESLint rules and parser configuration |
| `index.html` | HTML entry point; references fonts CSS, favicon, React app mount |
| `.gitignore` | Excludes: `node_modules/`, `dist/`, `.claude/`, build artifacts |

## CSS Architecture

### Global Styles
- **`src/index.css`** — CSS Custom Properties (design system) and global base styles
  - Color palette (background, text, primary, accent colors)
  - Font families (`Roboto`, `Oswald`, `Inter`)
  - Border radius scale
  - Shadow tokens
  - Card component theme variables (default, changed, final states)

### Component Styles
- **Modular CSS files** — One `.css` file per React component (co-located)
  - `src/components/Header/Header.css`
  - `src/components/Configurator/Configurator.css`
  - `src/components/Parameters/Parameters.css`
  - `src/components/ColorPicker/ColorPicker.css`
  - `src/components/Footer/Footer.css`
  - `src/App.css`

### Web Fonts
- **Location:** `public/fonts/fonts.css`
- **Fonts included:**
  - **Roboto** (weights: 400, 500, 700) — Cyrillic + Latin variants
  - **Oswald** (weights: 400, 500, 600, 700) — Display font
  - **Inter** (weights: 400, 500, 600, 700, 800, 900) — Fallback font
- **Font format:** WOFF2 (modern, compressed)
- **Font display strategy:** `font-display: swap` — Visible text immediately

## Asset Management

### Static Assets
- **Public directory:** `public/`
  - `fonts/` — Web font files (WOFF2)
  - `img/` — SVG icons and favicon (`favicon.ico`)

### Asset references
- Font CSS linked in `index.html` as `<link rel="stylesheet">`
- SVG icons referenced in components via `<img src="/img/...">`
- Favicon referenced in `index.html` as `<link rel="icon">`

## Development Workflow

### Scripts
```json
{
  "dev": "vite",                 // Start dev server with HMR
  "build": "vite build",         // Production build
  "lint": "eslint .",            // Run ESLint on all files
  "preview": "vite preview"      // Preview production build locally
}
```

### Entry Points
- **Client:** `index.html` → `src/main.jsx` → `src/App.jsx`
- **React mounting:** `createRoot(document.getElementById('root'))`

## Dependencies Summary

### Production Dependencies (2)
- react@^19.2.4
- react-dom@^19.2.4

### Dev Dependencies (8)
- @eslint/js@^9.39.4
- @types/react@^19.2.14
- @types/react-dom@^19.2.3
- @vitejs/plugin-react@^6.0.1
- eslint@^9.39.4
- eslint-plugin-react-hooks@^7.0.1
- eslint-plugin-react-refresh@^0.5.2
- globals@^17.4.0
- vite@^8.0.1

### Total Package Count
- **Direct dependencies:** 2 (React libraries)
- **Dev dependencies:** 8 (tooling, linting, type defs)
- **Zero external UI frameworks** — All components built from scratch

## Styling Approach

- **No CSS-in-JS libraries** — Pure CSS modules co-located with components
- **Design tokens** — CSS Custom Properties (`:root` variables in `index.css`)
- **Layout system** — CSS Flexbox for responsive design
- **Box model:** `border-box` applied globally

## Browser Compatibility

- **Target:** Modern browsers supporting ES2020
- **ECMAScript features:** Arrow functions, destructuring, template literals, async/await
- **JSX:** Transpiled by Vite + React plugin
- **CSS features:** Custom Properties, Flexbox, `font-display: swap`

## Build Output

- **Output directory:** `dist/`
- **Index file:** `dist/index.html`
- **Asset handling:** Vite automatically optimizes and hashes assets in production
