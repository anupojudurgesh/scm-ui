## Decision: Single API host, path-prefix-based domain routing

**Context:** Original architecture assumed 5 separate API hosts
(scm-user-api, scm-db-api, scm-plans-api, scm-dealer-api,
scmfmis-reports-api) based on the JD's wording.

**Finding:** The actual Postman collection uses ONE host
(ui.example.com) with different path prefixes per domain — plus
a 6th domain (wallet, /scm-stock-api/) not mentioned in the
original brief.

**Decision:** api/client.ts uses a single base URL from
VITE_API_BASE_URL. Domain-specific service files (user.api.ts,
dealer.api.ts, etc.) each hardcode their own path prefix rather
than a separate base URL constant per domain.

**Why:** Verified against source contract instead of assuming the
JD's wording was literal. Avoids building 5 environment variables
and a more complex client config for a distinction that doesn't
exist in practice.

**Follow-up:** Added walletApi service for the previously-unlisted
Wallet Management domain, since it's a real part of the API surface.

---

## Decision: Dashboard KPIs & Recent Activity Feed Stubbing

**Context:** The portal architecture requires an executive dashboard displaying operational metrics across Users, Dealers, Plans, and Commission configurations, plus an audit trail of recent administrative actions.

**Finding:** Auditing `SCM_APIs.postman_collection.json` and `docs/api-mapping.md` revealed that the backend currently exposes transactional and CRUD endpoints, but lacks dedicated aggregated telemetry (e.g. `GET /scm-db-api/dashboard/summary`) or audit trail/activity log routes.

**Decision:** Created `src/api/dashboard.api.ts` with typed TanStack Query service methods (`getKpis`, `getRecentActivities`). Stubbed with representative production data structures and marked clearly with `TODO: replace with real endpoint once provisioned by backend`. Added a visible limitation disclosure badge in the UI.

**Why:** Decouples UI architecture from backend timeline while ensuring full TanStack Query reactivity, loading skeletons, and error handling are wired properly and ready for instant drop-in when backend endpoints land.

---

## Decision: Typography Architecture (Self-hosted Manrope & Inter)

**Context:** The operations console requires a cohesive, authoritative typography system suitable for dense telecom administrative data, avoiding generic AI-template fonts and mixed monospace numbers.

**Decision:** 
- Installed `@fontsource/manrope` (500, 600, 700, 800) and `@fontsource/inter` (400, 500, 600, 700) as self-hosted npm packages bundled into Vite's production assets.
- Configured Tailwind v4 `@theme` with `--font-heading: 'Manrope'` and `--font-sans: 'Inter'`.
- Applied `font-family: var(--font-sans)` globally to `body` so body copy, table content, labels, form fields, and numbers all use Inter.
- Applied `font-family: var(--font-heading)` to all headings (`h1` through `h6`), `CardTitle`, and `DialogTitle`.
- Explicitly eliminated all `font-mono` usages across the application so numbers and telemetry are rendered cleanly in Inter.

**Why:** Self-hosting via `@fontsource` eliminates external network dependencies (no third-party Google Fonts CDN blocking rendering), ensures rapid First Contentful Paint (FCP), and guarantees consistent cross-environment font metrics in both production and test suites. Avoiding monospace numbers provides a sleek, cohesive editorial look for telecom telemetry.

---

## Decision: Network Operations Console (NOC) UI Archetype

**Context:** Initial dashboard designs drifted toward generic SaaS web app tropes (uniform rounded cards, icons in pastel boxes on every stat, pill badges, and uppercase section labels) which reduced information density and obscured operational urgency.

**Decision:**
- Replaced the repetitive 7-card layout with purposeful structural hierarchy:
  1. **Operational Focal Hero**: Pending Actions with an urgent amber border, actionable status indicator, and prominent number.
  2. **Unified Dense Telemetry Strip**: Grouped Total Users and Total Dealers into a single consolidated console surface with hairline vertical dividers (`divide-x divide-slate-100`).
  3. **Secondary Config/Catalog Bars**: Clean inline presentation for Commission and Plans without decorative icon boxes.
- Removed the uppercase 'PLATFORM NAVIGATION' sidebar eyebrow, letting navigation items speak for themselves with subtle breathing space.
- Replaced bordered pill badge chrome on limitation notes with understated inline metadata.
- Amplified Manrope's visual contrast with `font-bold` (700) and `font-extrabold` (800) alongside `-0.025em` tracking for headings against Inter body metrics.

**Why:** Matches the design language of enterprise NOC tools (Datadog, Grafana) where high-density telemetry, clear operational prioritization, and low decorative noise are essential for mission-critical operations.

---

## Decision: Restrained Interaction States & Operational Motion

**Context:** Generic web animations (pulsing elements, playful button bounce/shifts, entrance fade-ins, and indiscriminate hover states on static cards) detract from the utility and gravitas of an enterprise operations console.

**Decision:**
- Standardized all interactive transitions on `duration-150 ease-out` (150ms).
- Removed playful `active:translate-y-px` button bounces and decorative `transition-all` in favor of crisp, functional color shade transitions (`transition-colors`).
- Strictly reserved hover states for interactive/clickable controls (e.g. NavLinks, buttons, clickable table rows).
- Completely eliminated hover effects from static items: telemetry cards, Recent Activities list rows, and status badges remain inert on hover.
- Kept dialog entrance/exit animations brief and subtle (100ms fade/scale) without stacking additional decorative effects.

**Why:** Reinforces the mental model that hover implies actionability. In mission-critical telecom tooling, visual feedback must be immediate, precise, and purposeful.

---

## Decision: Dev-Only Mock Authentication Bootstrap

**Context:** The portal employs permission-gated navigation and role-based UI surfaces, but a production login flow is not yet wired to a live backend auth service. Developers need to see and test the full application UI during feature implementation.

**Decision:**
- Created `src/app/mockAuth.ts` defining a sample administrator user (`admin_dev`, `System Administrator`) and full permissions granting all 33 `PermissionKey` flags (`= 1`).
- Initialized via `bootstrapDevAuth()` in `src/main.tsx`, checking `if (import.meta.env.DEV)` and `!useAuthStore.getState().user`.
- Does not overwrite custom or existing authenticated sessions.
- In production builds (`npm run build`), `import.meta.env.DEV` evaluates to `false` and the bootstrap logic is tree-shaken and dead-code eliminated from the bundle.

**Why:** Enables unblocked local development of all permission-gated views (Users, Dealers, Commissions, Plans & Numbers) with zero friction and zero security leakage into production artifacts.

---

## Decision: Console Header Identity & Categorized Sidebar IA

**Context:** The application header and sidebar still felt like a generic marketing SaaS template (rounded app icons, subtitle tags, flat list navigation, and an excessively wide 240px sidebar column).

**Decision:**
- Replaced marketing logo chrome in the header with a compact console identity.
- Narrowed the sidebar from `w-60` (240px) to `w-52` (208px) to reduce empty negative space and match high-density console tools (Grafana, Datadog).
- Restructured navigation into 3 categorized information architecture sections with subtle sentence-case section headers: **Operations**, **Management**, and **Configuration**.
- Conditionally hid section headers if child items are permission-gated to prevent orphaned headers.
- Compacted row height and padding to `px-2.5 py-1.5` with `h-3.5 w-3.5` icons.

**Why:** Maximizes content real-estate, delivers an authoritative enterprise console feel, and improves cognitive organization across telecom management domains.

---

## Decision: Header Status Consolidation & Dynamic Sidebar Telemetry

**Context:** The sidebar had a forced full-height stretch (`justify-between`) causing an unnatural ~500px gap above a static `'OTP Active'` badge that had no connection to actual OTP verification state. The header displayed multiple fragmented status badges (node and API connection) alongside misleading `'/ console'` text that implied navigation affordances that did not exist.

**Decision:**
- **Consolidated Header Telemetry:** Unified connection status and database node cluster telemetry into a single, compact pill: `API Connected • scm-db-primary` with a single pulsating emerald dot, reducing visual clutter. Removed the false `'/ console'` breadcrumb.
- **Natural Sidebar Content Flow:** Replaced `justify-between` with natural vertical stacking (`space-y-4`), letting navigation and system telemetry flow sequentially from top to bottom.
- **Removed Static Badges:** Completely eliminated the decorative `'OTP Active'` pill.
- **Operational System Status Panel:** Added a high-utility telemetry block in the sidebar featuring:
  1. Real-time `Pending actions` count queried via TanStack Query from `dashboardApi.getKpis`, acting as a direct click-through to `/dashboard`.
  2. Dynamic OTP Verification Session card that is strictly rendered when `otpStore.status !== 'idle'`, providing ambient awareness during critical admin flows (e.g., MPIN reset, balance clearance) with zero visual pollution during normal operation.
  3. Understated version footnote (`v0.0.0`) in place of badge chrome.

**Why:** Eliminates misleading UI cues and static decorative clutter in favor of live, actionable operational telemetry that reflects real system and authentication state.

---

## Decision: Reusable Common Components (SearchToolbar, FormSection, LoadingState)

**Context:** Upcoming modules (User management, Dealer onboarding, Commission tables, Plans catalog) require consistent patterns for table searching/filtering, multi-field form grouping, and asynchronous loading states outside of data tables.

**Decision:**
- **SearchToolbar (`src/components/tables/SearchToolbar.tsx`):** Implemented an unopinionated toolbar combining a search input, 300ms debounce timer (resettable on rapid typing), keyboard hotkeys (Enter for immediate dispatch, Escape to clear), inline clear and dedicated Reset buttons, and a generic `children` slot for filter dropdowns.
- **FormSection (`src/components/forms/FormSection.tsx`):** Standardized long-form layout into logical sections using semantic `<section aria-labelledby=...>`, `font-heading` for section titles, subtle description typography, optional header action slot, and consistent vertical spacing (`space-y-3.5`).
- **LoadingState (`src/components/feedback/LoadingState.tsx`):** Created an accessible (`role="status"`, `aria-live="polite"`, `sr-only` fallback), centered spinner component supporting customizable messages, secondary descriptions, size variants (`sm`, `md`, `lg`), and full-page layout modes.

**Why:** Prevents duplicate debouncing, spacing, and loading logic across feature pages while adhering to the ops console design system and accessibility standards.
