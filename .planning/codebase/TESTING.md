# Testing Documentation

## Current Testing Status

**No automated tests exist** in this project.

The project currently has no testing framework configured and no test files. This is a critical gap for code quality assurance.

## Test Infrastructure

### Missing Testing Framework
- **No test runner**: Jest, Vitest, or similar is NOT configured
- **No testing library**: React Testing Library or similar is NOT installed
- **No test files**: No `.test.jsx`, `.test.js`, `.spec.jsx`, or `.spec.js` files found in the project
- **No test utilities**: No custom test setup files or helpers

### Project Dependencies
Review of `package.json`:
- Testing dependencies are completely absent
- No `jest`, `vitest`, `@testing-library/react`, or `@testing-library/dom` packages
- Only development dependencies for linting: `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Build tooling: Vite for development and production builds

## Current Code Quality Tools

### ESLint (Configured)
Located in `eslint.config.js`:
- **Linting rules** are enforced via ESLint with React plugins
- **Not a substitute for tests** - linting catches syntax/style issues, not logic errors
- Runs via: `npm run lint` command

### What's NOT Being Tested

The following components and features have zero automated test coverage:

#### Components
1. **ColorPicker** (`src/components/ColorPicker/ColorPicker.jsx`)
   - Color selection dropdown functionality
   - Click-outside handling to close dropdown
   - State management of `open` state
   - Selected color persistence
   - Dropdown animation and positioning

2. **Parameters** (`src/components/Parameters/Parameters.jsx`)
   - Series/model/thickness selection
   - Dimension input changes (width/height)
   - Lock options selection
   - Ventilation toggle
   - Color picker integration for body and door colors
   - All state updates and callbacks

3. **Configurator** (`src/components/Configurator/Configurator.jsx`)
   - Display of default/changed/final specifications
   - Configuration grid layout
   - Button functionality (КП для клиента, Бланк НЗ)
   - Model and article badge display

4. **Header** (`src/components/Header/Header.jsx`)
   - Logo and site name rendering
   - Tagline display
   - Account section rendering

5. **Footer** (`src/components/Footer/Footer.jsx`)
   - Copyright text display
   - Footer styling

#### Features
- User interactions (clicks, selections, text input)
- State management and updates
- Props passing between components
- Callback functions and event handling
- Conditional rendering
- List rendering with `.map()`
- Form inputs and validation (none currently)
- CSS class toggling based on state
- Accessibility attributes

#### Integration Points
- Parent-child component communication
- Data flow through Parameters → Configurator
- ColorPicker integration with Parameters
- Layout and responsive behavior

## What Should Be Tested

### Unit Tests Needed (per component)

#### ColorPicker.jsx
- Component renders with props (`placeholder`, `selected`, `onSelect`)
- Dropdown opens/closes on trigger button click
- Click outside dropdown closes it
- Color selection calls `onSelect` callback with correct item
- Dropdown closes after color selection
- Swatch color styles computed correctly with `getSwatchStyle`
- Active state styling applied to selected item
- Arrow rotation animation on open state

#### Parameters.jsx
- All state variables initialize with correct default values
- Series/model/thickness select elements update state on change
- Width/height number inputs update state on change
- Lock options list shows all options and highlights active
- Ventilation toggle buttons work correctly
- ColorPicker components receive correct props and handle selections
- State updates flow correctly from child to parent

#### Configurator.jsx
- Component renders without props
- Specification lists display correctly
- Final configuration shows calculated values
- Action buttons render (КП для клиента, Бланк НЗ)
- Model display shows current series and model
- Article badge displays correctly

#### Header.jsx
- Component renders logo, site name, and tagline
- Account section displays with correct text
- Images render with correct alt text

#### Footer.jsx
- Copyright text renders with correct year
- Footer styling applies

### Integration Tests Needed
- Parameter selection updates flow from Parameters to Configurator
- ColorPicker selection updates Parameters state
- Multiple parameters can be changed in sequence
- State persists across component re-renders
- Parent-child prop passing works correctly

### End-to-End Tests Needed
- Complete user workflow: select series → select model → adjust thickness → change dimensions → select lock → choose colors → verify final config displays correctly
- Navigation and basic page functionality

## Recommended Testing Setup

### Framework Choice
Recommend **Vitest** (modern, fast, Vite-native):
- Since project already uses Vite as build tool
- Faster than Jest for this React project
- Excellent ESM support
- Works with React Testing Library

### Dependencies to Add
```json
{
  "devDependencies": {
    "vitest": "^latest",
    "@testing-library/react": "^latest",
    "@testing-library/dom": "^latest",
    "@testing-library/user-event": "^latest",
    "jsdom": "^latest",
    "@vitest/ui": "^latest"
  }
}
```

### Configuration Files Needed
1. `vitest.config.js` - Vitest configuration
2. `src/test/setup.js` - Test environment setup
3. `vitest.workspace.js` (optional) - Multiple test environments

### Test File Structure
Create test files alongside components:
```
src/
  components/
    ColorPicker/
      ColorPicker.jsx
      ColorPicker.css
      ColorPicker.test.jsx          ← NEW
    Parameters/
      Parameters.jsx
      Parameters.css
      Parameters.test.jsx           ← NEW
    Configurator/
      Configurator.jsx
      Configurator.css
      Configurator.test.jsx         ← NEW
    Header/
      Header.jsx
      Header.css
      Header.test.jsx               ← NEW
    Footer/
      Footer.jsx
      Footer.css
      Footer.test.jsx               ← NEW
```

### Testing Best Practices for This Project
1. Test user interactions, not implementation details
2. Use `@testing-library/react` for component testing
3. Mock data constants (COLORS, OPTIONS lists) to avoid brittleness
4. Test accessibility: labels, ARIA attributes, keyboard navigation
5. Test component integration (Parameters + ColorPicker together)
6. Keep tests organized by feature area
7. Aim for 80%+ code coverage for critical paths

### Suggested npm Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Risk Areas Without Tests

Due to lack of automated tests, these areas are at higher risk:
1. **State management bugs** - Missed edge cases in useState/setState logic
2. **Event handler issues** - Click handlers, callbacks not firing correctly
3. **Props validation** - Missing or incorrect props passed to children
4. **Regression risks** - Changes to one component could break another without detection
5. **Accessibility bugs** - ARIA attributes and keyboard navigation not verified
6. **CSS regressions** - Style changes affecting multiple components undetected
7. **Logic errors** - Conditional rendering, complex calculations (like in ColorPicker's outside-click detection)

## Testing Coverage Goals

For this project, suggest targeting:
- **Critical paths**: 100% coverage (ColorPicker dropdown logic, Parameters state management)
- **Components**: 80%+ coverage
- **Overall**: 70%+ coverage initially, improve over time
