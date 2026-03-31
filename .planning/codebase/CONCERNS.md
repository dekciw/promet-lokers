# Concerns & Technical Debt

**Last Updated:** 2026-03-31
**Status:** MVP Development Phase

---

## 1. Hardcoded Data (Temporary/Placeholder)

### Critical: Must Replace Before Production

#### 1.1 Configurator Specifications (`src/components/Configurator/Configurator.jsx`)

**Lines 3–26:** `DEFAULT_SPECS`, `CHANGED_SPECS`, and `FINAL_SPECS` are completely hardcoded with example data:

```
DEFAULT_SPECS = [
  { label: 'Ширина:', value: '400 мм' },
  { label: 'Цвет:', value: 'RAL 7038' },
  ...
]
```

- **Current use:** Displays static default cabinet specifications in the "Стандартное исполнение" column
- **Should come from Firebase:** When a model is selected, Firebase must return the model's standard parameters (dimensions, lock type, ventilation, color, article number)
- **Impact on production:** Users will always see these exact hardcoded values; real configurations cannot be displayed
- **Timeline:** Must be replaced in **Этап 2 (Firebase + MobX)**

#### 1.2 Model & Series Options (`src/components/Parameters/Parameters.jsx`)

**Lines 5–21:** `SERIES_OPTIONS`, `MODEL_OPTIONS`, `THICKNESS_OPTIONS`, and `LOCK_OPTIONS` are hardcoded arrays:

```
SERIES_OPTIONS = ['Серия «ML»', 'Серия «SL»', 'Серия «Pro»']

MODEL_OPTIONS = [
  'Шкаф металлический усиленный',
  'Шкаф металлический стандартный',
  'Шкаф металлический lite',
]

LOCK_OPTIONS = [
  { name: 'Ключевой (Базовый)', price: null },
  { name: 'Замок 2', price: '+800 ₽' },
  ...
]
```

- **Current use:** Populates dropdown menus and lock selection lists
- **Should come from Firebase:** `series`, `models`, and `locks` collections in Firestore
- **Problem:** No dynamic filtering (e.g., "when series changes, update available models")
- **Price display issue:** Prices are hardcoded strings (e.g., `'+800 ₽'`); should be numbers in Firebase with formatting applied in the component
- **Timeline:** Replace in **Этап 2**

#### 1.3 Color Palette (`src/components/ColorPicker/ColorPicker.jsx`)

**Lines 4–31:** `COLORS` array with hardcoded color groups, hex values, names, and no price information:

```
const COLORS = [
  {
    group: 'Базовые',
    items: [
      { color: '#3e4c5e', name: '5002 шагрень' },
      ...
    ],
  },
  ...
]
```

- **Current use:** Displays selectable colors in two ColorPicker components (body and door)
- **Missing:** Price/surcharge for each color (mentioned in PRD section 3.1.6)
- **Should come from Firebase:** `colors` collection with fields: RAL-code, hex, name, surcharge
- **Product requirement:** Per PRD, "Цена изделия меняется в зависимости от выбранного цвета" — but surcharges are not implemented
- **Timeline:** Replace in **Этап 2**

#### 1.4 Example Configuration Values (`src/components/Configurator/Configurator.jsx`)

**Lines 19–26:** `FINAL_SPECS` shows example output with a hardcoded price:

```
FINAL_SPECS = [
  { label: 'Габариты:', value: '450 × 1850 мм' },
  { label: 'Стоимость:', value: '14 200 ₽', modifier: 'price' },
]
```

- **Current use:** Displays final configuration summary
- **Problem:** This price is not recalculated; it's static. The PRD requires dynamic price calculation in real-time.
- **Timeline:** Will be replaced by a price calculation engine in **Этап 2**

---

## 2. Missing Features & Incomplete Implementation

### High Priority (Blocking MVP)

#### 2.1 Dynamic Price Calculation

**Status:** Not implemented

**What's required (PRD 3.2.2):**
- Formula: `Base price (from Firebase) + sum of surcharges for non-standard parameters`
- Recalculate in real-time when any parameter changes
- Display prominently in the final configuration card

**Current state:**
- No price calculation logic in `Parameters.jsx` or `Configurator.jsx`
- No state management for base price or surcharges
- Price displayed in `FINAL_SPECS` is hardcoded (`'14 200 ₽'`)

**Dependencies:**
- Firebase data must include: base price for each model, surcharge amounts for locks, ventilation, colors, custom dimensions
- State management (currently `useState`, will migrate to MobX in Этап 2)

**Fragility:** High — logic depends on data types, nullable values, and correct surcharge mappings

#### 2.2 "Нестандартное исполнение" (Non-Standard Execution) Card Logic

**Status:** Not implemented (hardcoded example only)

**What's required (PRD 3.2.1):**
- Show only parameters that differ from the model's standard specification
- Never shown if nothing changed
- Example: if user doesn't change thickness, don't display it; if they select a non-default lock, do display it

**Current state:**
- The card displays hardcoded `CHANGED_SPECS` (lines 12–17), not calculated differences
- No comparison logic between user selections and Firebase defaults
- No conditional rendering based on actual changes

**Dependencies:**
- Must load standard spec from Firebase after model selection
- Must track which parameters user modified
- Must recalculate on every parameter change

**Production impact:** Critical — this card is how the factory knows what's custom vs. standard

#### 2.3 State Persistence & Validation

**Status:** Partially implemented (basic state exists, no validation)

**Issues:**
- **Dimension constraints:** PRD 3.1.3 states "При выходе за допустимый диапазон — показать ошибку, заблокировать расчёт" — but no min/max constraints are defined or validated
- **Lock surcharges:** Prices are strings in the current data; need type conversion and validation
- **No error boundaries:** If Firebase data is malformed, the app will break
- **No data caching:** Every component re-render may request data

#### 2.4 Series-to-Model Cascading

**Status:** Not implemented

**What's required (PRD 3.1.1):**
- When user selects a series, the list of available models should update
- When user switches series, current model selection must reset

**Current state:**
- `SERIES_OPTIONS` and `MODEL_OPTIONS` are independent static arrays
- No relationship or filtering logic

#### 2.5 Automatic Standard Dimension Fill

**Status:** Not implemented

**What's required (PRD 3.1.3):**
- When a model is selected, width and height fields should auto-populate with the model's standard dimensions from Firebase

**Current state:**
- Dimension fields have hardcoded defaults: `width: '450'`, `height: '1850'` (line 27–28)
- No Firebase lookup on model selection

---

### Medium Priority (Needed Before First User Test)

#### 2.6 PDF Export

**Status:** Not started

**What's required (PRD 3.3):**
- "КП для клиента" (Commercial Proposal) — PDF with logo, config, price breakdown, manager contacts
- "Бланк НЗ" (Non-Standard Order Form) — PDF with technical spec, all custom parameters, signature area

**Current state:**
- Two buttons exist in `Configurator.jsx` (lines 124–125) but they do nothing
- No PDF library integrated (TBD in PRD 5)

**Dependencies:**
- PDF library choice (react-pdf vs. alternative)
- Firebase contact data for managers
- PDF generation must handle dynamic content

#### 2.7 Keyboard Navigation & ARIA Labels

**Status:** Partially implemented

**Issues (PRD 4.4 — Accessibility):**
- ColorPicker has `aria-expanded` attribute (line 73) — good
- Other form controls lack keyboard navigation hints
- Custom buttons (thickness toggle, lock selection, ventilation) are not properly marked as radio groups

**Fragility:** Keyboard-only users and screen readers will struggle

---

## 3. Architectural Issues

### 3.1 Data Flow & State Management

**Current problem:**
- All state lives in `Parameters.jsx` (useState hooks, lines 24–32)
- `Configurator.jsx` receives no props; displays only hardcoded data
- No connection between user selections in Parameters and display in Configurator
- Parameters → Configurator data flow is broken

**Before Firebase integration:**
- Must establish clear props-based communication
- User selects parameters → state updates → Configurator receives updated props → displays new values

**After Firebase (Этап 2):**
- Migrate to MobX with `ConfigStore` (user selections) and `CatalogStore` (Firebase data)
- Connect components via `observer` HOC

**Risk:** High — without proper state flow, features are impossible to implement

### 3.2 Component Coupling

**Issue:** `ColorPicker` is tightly coupled to `Parameters`

**Current:**
- ColorPicker (lines 150, 155 in Parameters.jsx) has no independence
- Two separate instances for body and door colors, but no way to distinguish them
- Selected colors are stored as objects: `{ color: '#...', name: '...' }` — okay for now, but will break if Firebase adds more fields (e.g., `ral_code`, `surcharge`)

### 3.3 Missing Type Safety

**Status:** No TypeScript or PropTypes

**Issues:**
- No validation of props passed between components
- Data shape assumptions (e.g., lock object must have `{ name, price }`) are implicit
- Firebase data structure is undefined, so no contracts for component consumption
- When Firebase data arrives, breaking changes are likely

**Risk:** High — especially once Firebase integration begins

---

## 4. Performance Concerns

### 4.1 Real-Time Price Recalculation

**Requirement (PRD 4.1):** < 50 ms for price recalculation

**Current state:**
- No calculation exists yet
- When implemented, must avoid excessive re-renders
- With MobX, calculations should be memoized in computed properties

**Potential bottleneck:**
- If price calculation is a complex formula (e.g., multiple surcharge lookups), and it runs on every keystroke in dimension inputs, performance could degrade

### 4.2 Bundle Size

**Requirement (PRD 4.1):** < 500 KB gzip

**Current stack:** React 19 + Vite + CSS

**Planned additions that will bloat bundle:**
- MobX (~20 KB)
- PDF library (~100–200 KB depending on choice)
- Firebase SDK (~100 KB)

**Status:** Currently well under budget, but final bundle will be close to limit. Monitor after each library addition.

### 4.3 Firebase Data Fetching

**Not yet implemented, but concern:**
- No caching strategy defined
- All data must be fetched on app load (PRD 3.5 mentions "загружается каталог из Firebase")
- If Firestore queries are slow or network is poor, users see blank page

**Mitigation needed:** Loading state UI, fallback data, or background fetching

---

## 5. Security Considerations

### 5.1 Sensitive Data in localStorage

**Concern (PRD 4.3):** "Нет хранения чувствительных данных в localStorage без шифрования"

**Current state:**
- No localStorage usage yet
- When personal cabinet is added (Этап 4), must not store passwords or tokens locally
- Firebase Auth handles tokens, but must verify implementation

### 5.2 HTTPS Requirement

**PRD 4.3:** HTTPS обязателен

**Status:** Not verified in current dev setup. Must enforce before production.

### 5.3 Firebase Security Rules

**Not yet defined.**

**Must configure:**
- Firestore read rules: allow public read of catalog (series, models, colors)
- Auth rules: only authenticated users can access personal data, generate documents
- No direct write access to pricing data (prevent fraud)

---

## 6. Data Integrity & Fragile Areas

### 6.1 Lock Pricing Format

**Current (Parameters.jsx, line 16–20):**
```
LOCK_OPTIONS = [
  { name: 'Ключевой (Базовый)', price: null },
  { name: 'Замок 2', price: '+800 ₽' },
]
```

**Problems:**
- Prices are strings with currency symbol (can't do math)
- First item has `price: null` to indicate "no surcharge", others have strings
- No type consistency

**Must change to:**
```
{ name: 'Ключевой (Базовый)', surcharge: 0 },
{ name: 'Замок 2', surcharge: 800 },
```

### 6.2 Color Data Model

**Current (ColorPicker.jsx, lines 4–31):**
```
{ color: '#3e4c5e', name: '5002 шагрень' }
```

**Missing from Firebase:**
- RAL code (required in order form)
- Surcharge amount (required for price calculation)
- Whether this is a "standard" color for a given model

**Must extend to:**
```
{
  id: "color_001",
  hexColor: "#3e4c5e",
  displayName: "5002 шагрень",
  ralCode: "RAL 5002",
  surcharge: 0,
  category: "Базовые"
}
```

### 6.3 Dimensions Validation

**Current (Parameters.jsx, lines 90–109):**
```
<input type='number' value={width} onChange={e => setWidth(e.target.value)} />
```

**Problems:**
- No min/max constraints
- No validation on blur or submit
- Can enter negative or impossibly large dimensions
- PRD says to show error and block calculation, but no error state

**Must add:**
- Min/max from Firebase (model-specific constraints)
- Real-time validation feedback
- Block price calculation if invalid

### 6.4 Selector State Initialization

**Current (Parameters.jsx, lines 24–25):**
```
const [series, setSeries] = useState('');
const [model, setModel] = useState('');
```

**Problem:**
- Empty strings are used for "no selection"
- If Firebase data arrives and user hasn't made a selection, Configurator has nothing to display
- No indication that "default model" should be pre-selected

**Requirement:** When Firebase loads, should auto-select first series and first model (or wait for user choice)?

---

## 7. Browser Compatibility & Accessibility

### 7.1 Browser Support

**PRD 4.2 specifies:** Chrome 110+, Firefox 110+, Safari 16+, Edge 110+

**Not tested yet:**
- CSS Custom Properties support (all modern browsers have it)
- React 19 features (async components — not used yet)
- Responsive design on mobile

**Known issue:** 3D preview section is commented out (lines 47–71 in Configurator.jsx), so no blocker there.

### 7.2 Keyboard Navigation Gaps

**Status:** Incomplete

**Missing:**
- Color picker dropdown: can't navigate with arrow keys or Tab
- Lock selection: buttons work but no visual focus indicator
- Thickness toggle: no keyboard tab order
- Close dropdown on Escape key (ColorPicker has this, others don't)

**Recommendation:** Add keyboard handlers after initial MVP, before first user test.

---

## 8. Documentation & Knowledge Gaps

### 8.1 Data Schema Not Defined

**Blocker for Этап 2:**

The PRD mentions Firebase collections (section 3.5):
- `series` — no schema
- `models` — no schema
- `locks` — no schema
- `colors` — no schema
- `contacts` — no schema

**Must define before integration:**
- Field names, types, required/optional
- Pricing data structure
- Relationships (e.g., which models belong to which series)

### 8.2 Pricing Formula Undefined

**PRD 3.2.2 specifies:**
- `Base price + surcharges for non-standard parameters`

**Unclear:**
- Are surcharges additive or multiplicative?
- Does changing dimensions add a fixed surcharge or a formula? (PRD 8 asks this)
- If user selects 2 non-standard options, are surcharges stacked?
- Can a color have a surcharge in addition to base price?

**Status:** Open question #2 and #3 in PRD section 8

### 8.3 Manager Contact Data

**Requirement (PRD 3.3.1):** Manager contacts must load from Firebase for PDF generation

**Current state:**
- No contacts collection structure defined
- No component logic to fetch/display contacts
- No way to link logged-in user (when Auth is added) to their contact record

---

## 9. Testing & Validation

### 9.1 No Unit Tests

**Status:** No tests exist

**Critical paths to test (before production):**
- Price calculation with various surcharge combinations
- "Нестандартное исполнение" card logic (show/hide correct params)
- PDF generation with all parameter types
- Firebase data parsing (what if a field is missing?)
- Dimension validation

### 9.2 No E2E Tests

**Needed before stakeholder demo:**
- User flow: select series → select model → modify parameters → see price → export PDF
- Error scenarios: Firebase down, invalid dimensions, missing data

---

## 10. Risk Summary Table

| Risk | Severity | Probability | Mitigation | Timeline |
|------|----------|------------|-----------|----------|
| Hardcoded data will break in production | Critical | 100% | Replace with Firebase in Этап 2 | Before MVP release |
| Price calculation not implemented | Critical | 100% | Implement formula + real-time updates | Before Этап 2 demo |
| "Нестандартное исполнение" card logic missing | Critical | 100% | Implement diff logic in Этап 2 | Before Этап 2 demo |
| No type safety; Firebase data model unclear | High | 90% | Define schema before Firebase integration | Before Этап 2 dev |
| Prices stored as strings (not numbers) | High | 100% | Refactor to numeric types + formatting layer | Before Этап 2 |
| Keyboard navigation incomplete | Medium | 80% | Add keyboard handlers post-MVP | Before user testing |
| Bundle size may exceed 500 KB gzip | Medium | 60% | Monitor after adding PDF lib + Firebase | Continuous |
| No dimension validation/constraints | Medium | 95% | Add min/max checks + error UI | Before Этап 2 |
| Color surcharges not implemented | Medium | 100% | Add surcharge field to Firebase colors | Before Этап 2 |
| Series-to-model cascading not implemented | Medium | 100% | Add filtering + reset logic | Before Этап 2 |

---

## 11. Recommendations

### Immediate (Next Sprint)

1. **Define Firebase data schema** — all collections and fields
2. **Clarify pricing questions** (PRD section 8) with product/finance
3. **Implement price calculation logic** on temporary data (before Firebase)
4. **Implement "diff" logic** for non-standard execution card
5. **Add dimension validation** (min/max)

### Before MVP Release to Stakeholder

1. Integrate Firebase and replace all hardcoded data
2. Implement MobX state management
3. Complete keyboard navigation (Tab, Escape, arrow keys)
4. Add basic error boundaries
5. Conduct accessibility audit (WCAG AA)

### Before Public/Production Deployment

1. Implement PDF export (Этап 3)
2. Configure Firebase security rules
3. Add comprehensive E2E tests
4. Performance audit (bundle size, price recalc timing)
5. Add authentication (Этап 4)
6. Monitor Firestore query performance
7. Set up error logging and monitoring

---

**Last Reviewed:** 2026-03-31
**Next Review:** After Этап 2 Firebase integration
