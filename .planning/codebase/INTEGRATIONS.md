# External Integrations — Промет

## Current Status: No Active Integrations

This is a **frontend-only configurator application** currently operating without external dependencies or API integrations. All functionality is client-side only.

---

## Current Capabilities (Client-Side Only)

### Data Handling
- **All data is in-memory:** Hard-coded configuration arrays in React components
  - Lock types, prices, and specifications are defined directly in components
  - Color picker options are not fetched from external sources
  - No persistent storage (no database, cache, or session state)

### Components with Static Data
- **`src/components/Configurator/Configurator.jsx`**
  - Default specifications (width, height, thickness, lock type, ventilation, color)
  - Changed/custom specifications
  - Final configuration display with pricing

- **`src/components/Parameters/Parameters.jsx`**
  - Series selection options: `['Серия «ML»', 'Серия «SL»', 'Серия «Pro»']`
  - Model options (3 cabinet types)
  - Thickness options (0.5, 0.6, 0.7 mm)
  - Lock types with pricing tiers (+0 ₽, +800 ₽, +1200 ₽, etc.)
  - All form state managed via React `useState()`

### Form State (No Backend Sync)
- User selections exist only in React component state
- No persistence between page reloads
- No submission to a backend service

---

## Planned/Potential Integrations

Based on application purpose and README features, these integrations are likely planned but **not yet implemented:**

### 1. Backend API (Estimated)
**Purpose:** Product catalog, pricing calculations, document generation

**Expected endpoints (not yet created):**
- `POST /api/quote` — Generate commercial proposal (КП для клиента)
- `POST /api/work-order` — Generate work order (Бланк НЗ)
- `GET /api/catalog/series` — Fetch available cabinet series
- `GET /api/catalog/colors` — Fetch RAL color options
- `GET /api/pricing` — Fetch or calculate pricing based on custom specs

**Status:** ❌ Not implemented
- No fetch/axios calls in codebase
- No API configuration files
- No environment variables for API URLs

### 2. Document Generation Service (Estimated)
**Purpose:** Create PDF outputs for commercial proposal and work order

**Candidates:**
- **PDFKit** / **Puppeteer** (backend-only)
- **jsPDF** / **html2pdf** (client-side)
- **Third-party service** (e.g., AWS Lambda, Firebase Functions)

**Current status:** ❌ Buttons exist but non-functional
- Button UI in `Configurator.jsx`: `<button className='btn btn--primary'>КП для клиента</button>`
- No onClick handlers implemented
- No document generation library installed

### 3. Product Database (Estimated)
**Purpose:** Manage cabinet series, models, specifications, pricing

**Data to be stored:**
- Cabinet series (ML, SL, Pro) with base prices
- Model variants and base specifications
- Lock type pricing tiers
- RAL color catalog
- Ventilation and thickness upgrade costs

**Current status:** ❌ No database
- All product data is hard-coded in React components
- No database client (MySQL, PostgreSQL, MongoDB) installed

### 4. Authentication (Low Priority)
**Current status:** ❌ Not needed
- No user accounts in README
- No login system mentioned
- Public-facing tool for customers

**If future features require it:**
- User accounts for saving configurations
- Admin panel for managing product catalog
- Could use: Firebase Auth, Auth0, or custom JWT

### 5. Email Service (Possible)
**Purpose:** Send generated proposals/work orders to customers

**Candidates:**
- SendGrid
- AWS SES
- Mailgun
- Backend SMTP relay

**Current status:** ❌ Not implemented
- No email configuration in codebase

---

## Asset Serving

### Current Setup
- **Static assets served from:** `public/` directory
- **Font serving:** Via `public/fonts/fonts.css` (file reference, not API)
- **Image assets:** SVG icons in `public/img/` (static)

### Deployment Considerations
- No CDN configuration
- All assets must be bundled/served with app distribution

---

## Security & Data Privacy

### Current Risk Profile
**Low** — Frontend-only, no data transmission
- No authentication needed
- No sensitive data collection
- No API keys or credentials required
- No user tracking

### If Backend Integrations Are Added
**Recommended security measures:**
- CORS configuration for API
- API key authentication
- Rate limiting on quote generation endpoints
- HTTPS only

---

## No External Service Dependencies

The following are **NOT used:**
- Analytics (no Google Analytics, Mixpanel, etc.)
- Error tracking (no Sentry, Rollbar, etc.)
- Feature flags (no LaunchDarkly, etc.)
- CRM integration
- Webhook receivers
- Message queues (no Redis, RabbitMQ, etc.)
- CDN (assets served locally)

---

## Next Steps for Backend Integration

When backend services are added, implement:

1. **API Client wrapper** — `src/api/client.js` or `src/services/api.js`
2. **Environment configuration** — `.env.local` for API base URL
3. **Error handling** — Network error recovery, retry logic
4. **Loading states** — UI feedback during API calls
5. **Type safety** — JSDoc or TypeScript for API response types

### Example Structure (Not Yet Implemented)
```
src/
├── api/
│   ├── client.js          // Fetch wrapper with interceptors
│   ├── quotes.js          // Quote/proposal endpoints
│   └── products.js        // Catalog endpoints
└── hooks/
    ├── useQuote.js        // Custom hook for quote generation
    └── useCatalog.js      // Custom hook for product data
```

---

## Configuration Files (Not Present)

The following files are **not yet created:**
- `.env` / `.env.local` — API URLs, feature flags
- `.env.example` — Template for environment variables
- `src/config.js` — Centralized configuration

---

## Summary

| Integration Type | Status | Location |
|---|---|---|
| Backend API | ❌ Planned | Not yet created |
| Document generation | ❌ UI exists, no logic | Buttons in `Configurator.jsx` |
| Product database | ❌ Hard-coded | `Parameters.jsx`, `Configurator.jsx` |
| Authentication | ❌ Not needed | N/A |
| Email service | ❌ Not planned | N/A |
| Analytics | ❌ Not implemented | N/A |
| Error tracking | ❌ Not implemented | N/A |
| External UI components | ✅ None (custom built) | All components from scratch |

**Next priority:** Implement backend API to replace hard-coded product data and support quote generation.
