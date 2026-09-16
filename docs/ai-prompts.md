### To Improvise Prompt Quality and get the accurate results from AI, My Strategy is: 
I am giving you the human context for what I need. Based on it, generate a precise, engineered prompt I can then run separately to actually build this — don't build anything yet, just write the prompt.

Human context: [describe what you want in your own words, casually — what it does, where it's used, any constraint you know of]

When writing the engineered prompt, make sure it includes:

Exact file location(s) it should go in, matching our folder structure (components/, features/, api/, hooks/, schemas/)
Which existing pieces it should reuse or depend on (our api/client.ts, docs/api-mapping.md, other components we've already built)
The specific states it needs to handle (loading, empty, error, disabled, success — whichever apply)
What makes it 'reusable' — its props/interface, not hardcoded to one screen
A request to write unit tests covering the main behaviors
Explicit scope boundary — what it should NOT do (e.g. 'don't touch unrelated files', 'don't invent new dependencies')"

For Every code analysis and code generation, I follow these steps:

1. Understand the Human Context
2. Generate an Engineered Prompt based on the Human Context
3. Move the Analysed Context into @file:api-mapping.md
4. Generate Code


## Prompt 1 - Postman collection analysis
Analyze this Postman collection. Group endpoints by domain (user, dealer, plans, commission, master-data). List CRUD operations, required fields, OTP-protected mutations, and shared dependencies (zone→circle→SSA). Output as a markdown table. Do not generate code yet.

Move the Analysed Context into @file:api-mapping.md

Why: The file provides a blueprint of API behavior, making it easier to implement CRUD interfaces, validations, and dependencies without guessing.

## 2: 
Created React+Typescript+Vite boilerplate project for SCM UI 
after i installed some dependencies like tanstack table, shadcn ui, tailwind, react-hook-form, zod, lucide-react, date-fns, etc.
## Prompt:

## Prompt: Scaffold audit remediation

**Prompt:**
"Based on your audit, go ahead and fix everything: correct the tsconfig baseUrl issue,
install missing shadcn dependencies, remove Vite boilerplate, clean up index.css,
create utils.ts, wire up QueryClientProvider, set up Vitest + Playwright. Confirm
npm run build and npm run dev work."

**AI Output:**
Fixed tsconfig path aliases, installed clsx/tailwind-merge/cva/lucide-react/
react-query-devtools, removed Vite demo boilerplate, cleaned index.css with
Tailwind v4 theme + shadcn variables, built a basic SCM portal shell in App.tsx,
wired QueryClientProvider, configured Vitest + Playwright with passing tests.

**Accepted:**
- All fixes — build, unit test, and E2E all passed verification

**Rejected:**
- None this round — matched the architecture requirements

**Why:**
Report-first audit let me review scope before applying changes, avoiding
uncontrolled edits to config I hadn't reviewed.

## Prompt: Install shadcn/ui components

**Prompt:**
"Install the following shadcn/ui components: button, dialog, table, input, select, badge, card, form, label, textarea, checkbox, toast, skeleton, dropdown-menu, tabs, sheet. These will be used across the SCM portal's forms, tables, and modals."

**AI Output:**
Installed 16 shadcn/ui components in src/components/ui/ utilizing the base-nova style with Radix/Base UI primitives. Form component wired with react-hook-form and @radix-ui/react-slot.

**Accepted:**
- All 16 components successfully installed, integrated, and verified against TypeScript compiler and Vitest.

**Why:**
Essential UI building blocks needed across all portal forms, data tables, and modal workflows.

## Prompt: Client-only state stores with Zustand

**Prompt:**
"Set up Zustand for client-only state in src/stores/. Create two stores: (1) authStore — holds the current user's permissions object and role, with a hasPermission(key) helper. (2) otpStore — holds OTP flow state as a state machine: idle | confirming | otpSent | validating | success | failure, plus the current operation context (e.g. which mutation triggered it). Do not put any API/server data in these stores — that stays in TanStack Query. Write unit tests for the OTP state machine transitions and the hasPermission logic."

**AI Output:**
Installed zustand. Implemented src/stores/authStore.ts with UserPermissions (38-bitmask keys) and hasPermission() helper. Implemented src/stores/otpStore.ts as a strict finite state machine (idle -> confirming -> otpSent -> validating -> success/failure) tracking operation topic, msisdn, actionName, attempts, and error. Created comprehensive Vitest suites with 21 tests covering all state machine transitions and permission evaluations.

**Accepted:**
- Clear architectural separation: client UI flow state in Zustand, server cache preserved for TanStack Query.
- Unit tests verified passing.

## Prompt: Cascading Master Data Selectors (Zone, Circle, SSA)

**Prompt:**
"Build ZoneSelector, CircleSelector, and SSASelector components in src/components/forms/. They're cascading dropdowns: selecting a Zone fetches and enables the Circle dropdown for that zone, selecting a Circle fetches and enables the SSA dropdown for that circle. Use TanStack Query for fetching from the master-data API (create masterdata.api.ts as a service file, based on the master-data endpoints in docs/api-mapping.md). Use the shadcn Select component. Show a Skeleton while loading, and keep the dependent dropdown disabled until its parent is selected. Each component should accept an onChange callback and optional defaultValue so they're reusable across different forms. Write unit tests covering: initial disabled state, loading state, and that selecting a zone triggers the circle fetch."

**AI Output:**
Implemented src/api/client.ts (base fetch client with ApiError) and src/api/masterdata.api.ts with typed master data models and TanStack Query hooks (useZonesQuery, useCirclesByZoneQuery, useSSAsByCircleQuery). Implemented ZoneSelector, CircleSelector, and SSASelector in src/components/forms/ using shadcn Select and Skeleton for loading states. Kept dependent children disabled until parent selection. Created Vitest suite in GeoSelectors.test.tsx covering initial disabled states, loading states, and cascading query execution.

**Accepted:**
- Complete cascading dependency chain (Zone -> Circle -> SSA).
- Reusable props interface (value, defaultValue, onChange, disabled, placeholder, className).
- All 8 tests passed. Build verified.

## Prompt: Generic OTP Verification Engine (API, Hook, Modal)

**Prompt:**
"Build src/api/otp.api.ts with two functions calling the real endpoints from docs/api-mapping.md: sendOtp({ msisdn, operation: '10069', topic }) → POST /scm-db-api/masterdata-db-api/sendOtp, and validateOtp({ otp, operation: '10069', msisdn }) → POST /scm-db-api/masterdata-db-api/validateOtp (as query params, matching the collection). Then build a useOtpFlow hook in src/hooks/ that wraps our existing otpStore: exposes start(context: { topic, msisdn, actionName }), a sendOtp() call that transitions confirming→otpSent, a submitOtp(code) that transitions otpSent→validating→success/failure, and an onSuccess callback the caller provides for the actual mutation to run only after validation succeeds. Then build OTPVerificationModal in src/components/forms/ using the shadcn Dialog — shows the actionName, an OTP input, resend option, and the current otpStore status. It should be fully generic — takes the topic/msisdn/actionName as props and an onVerified callback, no feature-specific logic inside it. Write unit tests for: the hook's transition sequence, and the modal calling onVerified only after a successful validateOtp response."

**AI Output:**
Implemented src/api/otp.api.ts calling POST /sendOtp with JSON body and POST /validateOtp with query params per Postman specs. Built useOtpFlow in src/hooks/ coordinating the otpStore finite state machine with automatic/manual send, validation, and guarded onSuccess execution. Built fully generic OTPVerificationModal in src/components/forms/ using shadcn Dialog with masked MSISDN, cooldown resend timer, error feedback, and disabled submit states. Added 11 unit tests in useOtpFlow.test.ts and OTPVerificationModal.test.tsx verifying the complete transition sequence and ensuring onVerified is strictly invoked only after valid OTP verification.

**Accepted:**
- Generic decoupled OTP verification flow reusable across all 29 protected mutations.
- Guaranteed mutation gate: onVerified executes strictly on HTTP 200 validation.
- All unit tests and Playwright E2E passed.

---

### Prompt 7: OTP Store Validation Retry Limit & Error Surfacing

**Prompt:**
"In otpStore.ts, look at the setValidating action. It currently increments attempts but never checks the count. Add a max retry limit: if attempts would exceed 3, reject the transition to validating and instead force status to otpSent with an errorMessage like 'Too many failed attempts. Please request a new OTP.' Then update useOtpFlow's submitOtp to surface this correctly (canValidate will be false, so it should already return false and the errorMessage should show in the UI via otpStore's errorMessage). Add a test in otpStore.test.ts confirming the 4th validating attempt is blocked and forces otpSent instead."

**AI Output:**
Updated `setValidating` in `src/stores/otpStore.ts` to check current attempts count (`>= 3`). When attempts reach 3, any subsequent attempt transition to `validating` is rejected (`return false`), forcing status back to `otpSent` and setting `errorMessage: 'Too many failed attempts. Please request a new OTP.'`. Updated `src/hooks/useOtpFlow.ts` in `submitOtp` to return `false` when validation transition is blocked and invoke the `onError` callback with the store error message. Updated `OTPVerificationModal.tsx` to display the feedback banner whenever `flow.isFailure` or `flow.errorMessage` is present so the retry limit error is visible in `otpSent` state. Updated `src/stores/otpStore.test.ts`, `src/hooks/useOtpFlow.test.ts`, and `src/components/forms/OTPVerificationModal.test.tsx` with test coverage for max retry blocking, error message surfacing, and attempts reset upon requesting a new OTP.

**Accepted:**
- Strict 3-attempt retry ceiling enforced in state machine.
- 4th validating attempt blocked and forced to `otpSent` with user-friendly error message.
- Full UI visibility of error and seamless resend OTP recovery resetting attempts.
- All 46 tests passing across 6 test suites with clean production build.

---

### Prompt 8: Generic DataTable Component with States & Pagination

**Prompt:**
"Build a generic DataTable component in src/components/tables/DataTable.tsx using the shadcn Table primitives. It should accept: columns (id, header, accessor/render function), data, loading (boolean), error (optional), onRowClick (optional), and pagination props (page, pageSize, totalCount, onPageChange). Handle four states explicitly: loading (Skeleton rows), error (message + retry callback prop), empty ('no results' message), and populated (normal table). Keep it generic over row type using TypeScript generics — no hardcoded columns for any specific feature. Write unit tests for: loading state renders skeletons, empty state renders when data is [], error state renders and calls onRetry when clicked, and populated state renders the right number of rows."

**AI Output:**
Built `src/components/tables/DataTable.tsx` utilizing shadcn `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, and `TableCell` primitives alongside `Skeleton` and `Button`. Configured TypeScript generics `DataTable<T>` accepting custom columns (with key accessor, accessor function, and custom cell renderer). Explicitly handled four states: loading (Skeleton rows across all columns), error (alert indicator, error message from string or Error, and optional onRetry action button), empty ('No results found.' placeholder with icon), and populated (rows with optional onRowClick handler and hover styles). Added responsive pagination controls supporting direct or nested pagination props with boundary button disabling. Created `src/components/tables/DataTable.test.tsx` containing 10 unit tests covering all required states, retry triggers, and pagination.

**Accepted:**
- Fully decoupled, generic DataTable usable across User, Dealer, Plan, Commission, and Master-Data views.
- 4 explicit states handled cleanly with accessible semantics and Skeleton animations.
- 10 unit tests passing, bringing the test suite total to 56 passing tests across 7 test suites.
- Clean TypeScript and Vite production build.

---

### Prompt 9: Reusable Feedback & Auth Components (PermissionGuard, StatusBadge, ConfirmationDialog, ApiError)

**Prompt:**
"Build these smaller reusable components: (1) PermissionGuard in src/components/PermissionGuard.tsx — takes a permission prop (matching authStore's hasPermission keys) and children, renders children only if hasPermission(permission) is true from authStore, otherwise renders nothing (or an optional fallback prop). (2) StatusBadge in src/components/feedback/StatusBadge.tsx — takes a status prop and maps common SCM statuses (Active, Inactive, Pending, Blocked) to shadcn Badge variants with appropriate colors. (3) ConfirmationDialog in src/components/feedback/ConfirmationDialog.tsx — generic shadcn Dialog-based confirm/cancel prompt, takes title, description, onConfirm, onCancel, open, onOpenChange, and an optional destructive boolean for styling dangerous actions (like delete/purge). (4) ApiError in src/components/feedback/ApiError.tsx — displays a formatted error from our ApiError type (client.ts), with a retry button. Write focused unit tests for each: PermissionGuard renders/hides based on mocked authStore state, StatusBadge maps each status correctly, ConfirmationDialog calls the right callback for confirm vs cancel, ApiError renders message and calls onRetry."

**AI Output:**
1. Created `src/components/PermissionGuard.tsx` integrating with `authStore`'s `hasPermission` method to conditionally render guarded children or an optional fallback.
2. Created `src/components/feedback/StatusBadge.tsx` mapping common SCM statuses (Active, Inactive, Pending, Blocked) to shadcn `Badge` variants with custom color themes (emerald, slate, amber, red) and dot indicators.
3. Created `src/components/feedback/ConfirmationDialog.tsx` wrapping shadcn `Dialog` with title, description, confirm/cancel buttons, and destructive styling (red button, warning icon).
4. Created `src/components/feedback/ApiError.tsx` formatting errors from `src/api/client.ts` with HTTP status code tags, user-friendly details, and an optional retry button.
5. Added comprehensive test suites: `PermissionGuard.test.tsx`, `StatusBadge.test.tsx`, `ConfirmationDialog.test.tsx`, and `ApiError.test.tsx` (22 new unit tests).

**Accepted:**
- Reusable UI building blocks for permission-based gating and user feedback.
- All 78 unit tests passing across 11 test suites.
- Zero TypeScript or bundling errors on production build.

---

### Prompt 10: SCM Operations Dashboard Feature (KPI Cards & Activity Feed)

**Prompt:**
"Build the SCM Dashboard feature in src/features/dashboard/. Create a DashboardPage component showing KPI cards (using shadcn Card) for: Total Users, Active Users, Total Dealers, Active Dealers, Pending Actions, Commission Configurations, Plans. Each card shows a number and label, with a Skeleton while loading. Below the cards, add a Recent Activities section as a simple list (can be static/mocked data for now since the API collection doesn't have a dedicated activity feed endpoint — note this as a known limitation). Use TanStack Query for the KPI numbers, with a dashboardApi service file — check docs/api-mapping.md for any existing count/summary endpoints; if none exist, stub the query with mock data and clearly comment it as TODO: replace with real endpoint. Make the layout responsive (grid that collapses to 1 column on mobile). Write a basic test confirming all 7 KPI cards render."

**AI Output:**
1. Created `src/api/dashboard.api.ts` with `getKpis` and `getRecentActivities` query functions with explicit `TODO` tags referencing future backend count/summary endpoint integration.
2. Built `src/features/dashboard/DashboardPage.tsx` displaying 7 KPI cards with shadcn `Card`, formatted numerical telemetry, thematic icons, and `Skeleton` loaders during query resolution.
3. Created a responsive grid layout collapsing gracefully from 4 columns to 1 column on mobile devices.
4. Added the "Recent Activities" audit list with an explicit limitation disclosure notice.
5. Added unit tests in `src/features/dashboard/DashboardPage.test.tsx` verifying the rendering of all 7 KPI cards, loading skeleton behavior, loaded value population, and the recent activities list.

**Accepted:**
- Responsive operations dashboard providing top-level operational visibility.
- Seamless TanStack Query integration ready for backend drop-in.
- All 82 tests passing across 12 test suites with clean TypeScript production build.

---

### Prompt 11: Application Layout, React Router Setup & Permission-Gated Navigation

**Prompt:**
"Install react-router-dom and set up routing in src/app/. Create routes for /dashboard, /users, /dealers, /commissions, /plans, with DashboardPage wired to /dashboard. Build a basic AppLayout with a sidebar navigation (using PermissionGuard to conditionally show nav items based on permissions — dashboard always visible, others gated by their respective permission keys like userPermissions, dealerPermissions, etc.) and wrap it around all routes. Redirect / to /dashboard for now. Write a basic test confirming navigation renders and /dashboard route shows DashboardPage."

**AI Output:**
1. Installed `react-router-dom` (`v7.18.4`).
2. Built `src/app/AppLayout.tsx` featuring header branding, API connection indicator, mobile slide-over drawer, and sidebar navigation using `PermissionGuard` (with `userPermissions`, `dealerPermissions`, `commissionPermissions`, and `plansNumberpermissions`), keeping `/dashboard` open to all authenticated or public states.
3. Created `src/app/routes.tsx` mapping `/dashboard` to `DashboardPage`, with placeholder pages for `/users`, `/dealers`, `/commissions`, and `/plans`, and an automatic redirect from `/` to `/dashboard`.
4. Wired `BrowserRouter` and `AppRoutes` in `src/App.tsx`.
5. Created comprehensive tests in `src/app/AppLayout.test.tsx` and updated `src/App.test.tsx` verifying navigation rendering, root redirection, route rendering, and permission-based item gating.

**Accepted:**
- Clean declarative client routing with nested layouts.
- Permission-gated sidebar navigation adhering to authStore bitmask permissions.
- All 88 tests passing across 13 test suites.
- Clean production build with zero errors.

---

### Prompt 12: Telecom SCM Operations Console Redesign

**Prompt:**
"The current dashboard UI looks like a generic AI-generated SaaS template — identical rounded cards with the same shadow, an icon in a tinted box repeated on every card, ALL CAPS labels, a repeated 'Updated from master telemetry' caption, and a rainbow of pastel icon colors with no real hierarchy. Redesign it with intentional choices for a telecom SCM operations console specifically: Color: near-black header/sidebar (#0F1115), white/light-grey content surface, ONE accent color used sparingly (not a different pastel per card) — pick a deep blue or teal. Status colors (active/pending/blocked) stay muted, not bright. Typography: one typeface throughout, sentence case labels (not tracked-out ALL CAPS), clear size hierarchy between the KPI number and its label. Layout: break the '7 identical cards' pattern. Give Pending Actions more visual weight since it's the number that needs action — larger or positioned first — and treat the rest as a denser, more compact stat row rather than repeating the same card size for everything. Remove the repeated 'Updated from master telemetry' caption on every card — say it once if needed, not seven times. Keep the Recent Activities list, but tighten its visual treatment to match — remove unnecessary borders/shadows if they're just decorative. Show me the plan (color values, type choices, layout sketch) before implementing, so I can review it first."

**AI Output:**
1. Produced an implementation plan reviewing color architecture, typography, layout sketch, and test alignment.
2. Implemented `#0F1115` near-black header and sidebar navigation chrome in `src/app/AppLayout.tsx` with a single focused deep cyan indicator (`border-l-2 border-cyan-500`) on active routes.
3. Redesigned `src/features/dashboard/DashboardPage.tsx`:
   - Promoted `pendingActions` to a prominent operational Hero card with warm muted amber styling and *"Action required"* status.
   - Grouped the remaining 6 metrics into compact, high-density telemetry pairs (User metrics, Dealer metrics, Catalog & Rules) with monochrome icons.
   - Converted all labels to sentence case and removed redundant per-card telemetry captions, replacing them with a single global telemetry status in the header.
   - Tightened the Recent Activities stream with hairline dividers and monospace metadata.
4. Updated `src/features/dashboard/DashboardPage.test.tsx` to align test expectations with the new design.

**Accepted:**
- Intentional, high-density telecom operations console aesthetic.
- Prominent operational hierarchy prioritizing pending actionable queue.
- All 88 tests passing across 13 test suites.
- Clean production build.

---

### Prompt 13: Typography Configuration (Manrope Headings & Inter Body/Numbers)

**Prompt:**
"Use Manrope for all headings and titles (page titles, card titles, section headers), and Inter for body text, labels, table content, and form fields. No monospace font — use Inter for numbers too. Install both via @fontsource/manrope and @fontsource/inter (or Google Fonts). Set up in the Tailwind theme as font-heading (Manrope) and font-sans (Inter, used as the default), so this is reusable across every screen, not just the dashboard."

**AI Output:**
1. Installed `@fontsource/manrope` and `@fontsource/inter` as self-hosted npm font packages for zero-external-CDN, offline-capable rendering.
2. Configured Tailwind CSS v4 theme variables in `src/index.css`:
   - `--font-sans`: Inter with system-ui fallbacks.
   - `--font-heading`: Manrope with system-ui fallbacks.
   - Applied `font-family: var(--font-sans)` globally to `body` ensuring all forms, tables, body text, and numbers use Inter by default.
   - Applied `font-family: var(--font-heading)` globally to `h1, h2, h3, h4, h5, h6`.
3. Updated UI primitives:
   - `CardTitle` in `src/components/ui/card.tsx` configured with `font-heading`.
   - `DialogTitle` in `src/components/ui/dialog.tsx` configured with `font-heading`.
4. Removed all instances of `font-mono` across `src` (`DashboardPage.tsx`, `AppLayout.tsx`, `OTPVerificationModal.tsx`, `ApiError.tsx`), standardizing all numbers, codes, and metrics on Inter (`font-sans`).
5. Added explicit `font-heading` utility class to all section and page titles (`DashboardPage.tsx`, `UsersPage.tsx`, `DealersPage.tsx`, `CommissionsPage.tsx`, `PlansPage.tsx`).
6. Verified with all 88 unit tests passing across 13 suites and verified production bundle build (`tsc -b && vite build`).

**Accepted:**
- Zero runtime external font CDN dependencies; font assets compiled directly into Vite bundle.
- Clean typography hierarchy: Manrope for headings/titles, Inter for all body, labels, tables, form fields, and numbers.
- 100% test pass rate and clean build.

---

### Prompt 14: Network Operations Console (NOC) Refinements

**Prompt:**
"This still reads as a templated SaaS dashboard, specifically: the 'PLATFORM NAVIGATION' all-caps eyebrow label, the icon-in-a-tinted-box repeated identically on every stat card regardless of content, the bordered pill badge on the static-feed note, and every card sharing the same border-radius/shadow/border treatment except Pending Actions. Take another pass, closer to a real network operations console (like Grafana or Datadog) than a SaaS product dashboard: Remove the ALL CAPS 'PLATFORM NAVIGATION' label entirely — just show the nav items directly, maybe with subtle spacing instead of a labeled section. Drop the repeated icon-in-tinted-box pattern. For Total Users / Total Dealers / Commission / Plans, rely on typography hierarchy (big number, clear label, secondary stat) instead of an icon box on every card — reserve icons only where they genuinely add meaning (e.g. the warning triangle on Pending Actions, which already works). Replace the bordered pill for the 'static feed' note with plain inline text — no badge chrome. Vary the structural treatment across cards intentionally: Pending Actions keeps its accent-border urgency treatment; consider making Total Users/Dealers a denser inline stat strip (numbers side by side with thin dividers, not individual boxed cards) rather than three separate bordered boxes doing the same job. Confirm Manrope is actually applied to headings and is visually distinct from Inter body text — increase the weight/size gap if they currently look too similar. Show me the revised plan before implementing."

**AI Output:**
1. Produced and approved an implementation plan detailing NOC layout restructuring, typography amplification, and chrome elimination.
2. Removed ALL CAPS 'PLATFORM NAVIGATION' eyebrow label in `src/app/AppLayout.tsx`, allowing sidebar navigation items to display cleanly with subtle breathing space.
3. Enhanced Manrope in `src/index.css`: applied `font-weight: 700` and `-0.025em` tracking default to `h1..h6`, and elevated page title to `text-2xl font-extrabold font-heading` for sharp contrast against Inter body text and metrics.
4. Redesigned `src/features/dashboard/DashboardPage.tsx`:
   - Converted Total Users and Total Dealers into a unified, high-density inline telemetry strip with thin vertical divider (`divide-x divide-slate-100`), big numbers, and secondary active percentage indicators.
   - Eliminated decorative icon-in-a-box patterns on all cards; preserved the `AlertTriangle` icon strictly on Pending Actions where it communicates operational urgency.
   - Simplified Commission Configurations and Plans into clean, unboxed telemetry cards relying solely on typographic hierarchy.
   - Replaced the bordered pill badge on the static feed note with clean, understated inline text (`data-testid="limitation-note"`).
5. Verified 100% test pass rate (88/88 tests) and verified clean production build.

**Accepted:**
- Authentic network operations console aesthetic (Grafana/Datadog style).
- Purposeful structural variation replacing uniform SaaS card boxes.
- Zero decorative icon noise; sharp Manrope vs Inter typographic contrast.

---

### Prompt 15: Restrained Interaction States & Operational Motion

**Prompt:**
"Add hover and interaction states, but with restraint — not a scattered effect on every element, which reads as generic AI output. Apply motion only where it communicates something real: Sidebar nav items: a smooth background color transition on hover (150-200ms ease), and the active state should have a subtle, deliberate indicator (like a left border accent or background shift) rather than just a color change. Interactive stat cards / list rows (Recent Activities): a subtle lift or border-color shift on hover only if they're actually clickable (i.e. will navigate somewhere) — if a card isn't clickable, it should NOT have a hover effect at all, since a hover state implies interactivity. Buttons: a slightly darker/lighter shade transition on hover, no scale or bounce effects — those read as decorative rather than functional. Keep all transitions fast (150-250ms) and use ease-out, not spring/bounce easing — bounce reads as playful/consumer, wrong tone for an ops console. Do NOT add: fade-in-on-scroll animations, staggered entrance animations on page load, hover effects on static/non-interactive cards, or any pulsing/glowing effects beyond the existing 'API Connected' status dot. One deliberate moment is fine if it earns its place — for example, the OTP modal or a confirmation dialog opening with a brief, subtle scale/fade-in (shadcn's Dialog likely already has this by default, don't add more on top of it). The goal is that hovering over something interactive feels responsive and precise, not that the page feels animated. When in doubt, remove the effect rather than add one."

**AI Output:**
1. Sidebar navigation (`src/app/AppLayout.tsx`): applied `transition-colors duration-150 ease-out` on nav items with subtle background shift and distinct cyan left-border on active routes; added matching 150ms ease-out to mobile toggle.
2. Buttons (`src/components/ui/button.tsx`): removed playful `active:translate-y-px` bounce and decorative `transition-all`; standardized on `transition-colors duration-150 ease-out` with subtle shade adjustments on hover (`hover:bg-primary/90`, `hover:bg-secondary/80`).
3. Removed hover on non-interactive rows (`src/features/dashboard/DashboardPage.tsx`): eliminated `hover:bg-slate-50/80` from Recent Activities rows since they are static audit records and do not navigate anywhere.
4. Table rows (`src/components/tables/DataTable.tsx`): conditioned row hover strictly on `isClickable` with `duration-150 ease-out`, and applied `hover:bg-transparent` when rows are static.
5. Badges (`src/components/feedback/StatusBadge.tsx`): removed `hover:bg-*` classes from static status badges.
6. Verified 100% test pass rate (88/88 tests) and verified clean production build.

**Accepted:**
- Snappy, functional 150ms ease-out transitions without playful bounce or decorative noise.
- Hover states reserved strictly for clickable/interactive controls; static items remain inert.

---

### Prompt 16: Dev-Only Mock Authentication Bootstrap

**Prompt:**
"Add a dev-only mock authentication bootstrap — on app load in a development environment, if no user is authenticated, call authStore.setAuth() with a sample admin user that has all permissions granted (all the PermissionKey flags set to 1/true). Gate this behind import.meta.env.DEV so it never runs in production builds. This lets me see the full navigation and permission-gated UI while building, without needing a real login flow yet."

**AI Output:**
1. Created `src/app/mockAuth.ts` defining `DEV_ADMIN_USER` and `DEV_ADMIN_PERMISSIONS` (with all 33 PermissionKey flags granted to 1) and a `bootstrapDevAuth()` function that checks `if (!useAuthStore.getState().user)`.
2. Wired `bootstrapDevAuth()` into `src/main.tsx` gated behind `if (import.meta.env.DEV)` so it initializes immediately on browser load before rendering.
3. Because it is gated behind `import.meta.env.DEV`, Vite dead-code eliminates it during production builds (`npm run build`).
4. Added Vitest unit test suite in `src/app/mockAuth.test.ts` verifying bootstrap behavior, complete permission grants across all 33 keys, and session preservation.
5. Verified 100% test pass rate across all 14 test suites (91/91 tests) and clean production bundle build.

**Accepted:**
- Instant development access to full permission-gated navigation (Users, Dealers, Commissions, Plans & Numbers) and header profile without a backend auth service.
- Completely stripped from production builds via `import.meta.env.DEV`.

---

### Prompt 17: Dense Network Operations Console Header & Categorized Sidebar Redesign

**Prompt:**
"The header and sidebar still read as generic SaaS template chrome. Once dev auth is showing all nav items, redesign both: Header: Drop the icon-in-rounded-box + wordmark + grey-subtitle pattern — that's default SaaS header chrome. Keep 'SCM Portal' but integrate it more like a console/terminal identity — smaller, denser, less like a marketing logo lockup. Keep the 'API Connected' status and 'Cluster node' info since those are genuinely functional and specific to this tool — if anything, give them more presence since they're the most distinctive part of the current header. Sidebar: Structure it with real information architecture instead of a flat list: group related modules (e.g. 'Operations' for Dashboard/Pending Actions, 'Management' for Users/Dealers, 'Configuration' for Commissions/Plans) with small section labels — not ALL CAPS eyebrows, just subtle sentence-case group headers. Reduce the sidebar width if content doesn't need it — a wide mostly-empty column reads as unfinished. Consider a compact icon+label row height rather than large padded nav items, fitting the dense ops-console feel established elsewhere. Show me the plan before implementing."

**AI Output:**
1. Produced and approved an implementation plan detailing the terminal header identity and categorized sidebar IA.
2. Redesigned Header (`src/app/AppLayout.tsx`):
   - Replaced icon-in-box and marketing subtitle with a compact console identity: `SCM Portal / console`.
   - Elevated operational telemetry: integrated a persistent cluster node chip (`node: scm-db-primary` with cyan status indicator) alongside the live `'API Connected'` status badge.
   - Compacted operator profile (`h-6 w-6` avatar initial, tight typography).
3. Redesigned Sidebar (`src/app/AppLayout.tsx`):
   - Reduced width from `w-60` (240px) to `w-52` (208px), creating a sleek, purposeful console frame.
   - Implemented 3 categorized information architecture groups: **Operations** (Dashboard), **Management** (Users, Dealers), and **Configuration** (Commissions, Plans & Numbers).
   - Applied subtle, sentence-case section labels (`text-[10px] font-semibold text-slate-400`).
   - Group headers are conditionally rendered based on permissions, preventing empty dangling section labels when unauthenticated.
   - Compacted row height and padding (`px-2.5 py-1.5`, `gap-2`, `h-3.5 w-3.5` icons) with cyan left-border active indicator and 150ms ease-out transitions.
4. Verified 100% test pass rate across all 14 test suites (91/91 tests) and verified clean production bundle build.

**Accepted:**

---

### Prompt 18: Operational Console Cleanup (Sidebar Flow, Dynamic Telemetry & Header Consolidation)

**Prompt:**
"Fix two real problems, not just restyle:

Sidebar: It currently stretches full-height with a large empty gap between the nav items and the 'OTP Active' footer. Either remove the forced full-height stretch so the sidebar's background/border stops naturally after the last nav item with normal padding, OR fill that space with something genuinely useful — e.g., a compact 'System Status' panel showing live counts (pending actions, active OTP session if one is running) rather than empty space. Pick whichever is simpler and cleaner — don't force content just to fill space.

Header/footer badges: Remove 'OTP Active' entirely — it's a static badge with no real state or function. If OTP status needs to be shown anywhere, it should only appear during an actual active OTP flow (tied to otpStore's status), not as permanent decoration. Also remove the '/ console' text next to the logo — it implies navigation that doesn't exist and adds no information. Consolidate the header's right side to ONE primary status indicator instead of two separate pill badges (node + API connected). Show me the plan before implementing."

**AI Output:**
1. Produced and approved an implementation plan addressing sidebar vertical spacing, dynamic OTP session telemetry, header consolidation, and test compatibility.
2. Modified `src/app/AppLayout.tsx`:
   - **Header**:
     - Removed misleading `/ console` text beside the branding, retaining clean `SCM Portal` terminal identity.
     - Consolidated separate badges into a single unified telemetry pill: `API Connected • scm-db-primary` with a pulsing emerald status indicator.
   - **Sidebar**:
     - Removed `justify-between` and the artificial 500px gap, establishing natural top-down content flow (`space-y-4`).
     - Removed static `'OTP Active'` badge completely.
     - Implemented a purposeful **System Status** operational panel displaying a live `Pending actions` count query (navigating to `/dashboard`) and an ambient OTP session notification card that renders **only** when `useOtpStore.status !== 'idle'`.
     - Replaced footer badge cluster with a natural, understated version footnote (`v0.0.0`).
3. Verified all 91 unit tests across 14 test suites pass and verified production bundle build.

**Accepted:**
- Zero static decorative badges.
- Single unified operational telemetry status in top bar.
- Natural sidebar flow with real-time operational context (live pending action count and dynamic OTP state).

---

### Prompt 19: Reusable Common Components (SearchToolbar, FormSection, LoadingState)

**Prompt:**
"Build three small reusable components: (1) SearchToolbar in src/components/tables/SearchToolbar.tsx — a search input plus a slot for filter dropdowns (accept a children prop for filters so it's generic), with a debounced onSearch callback (300ms) and a clear/reset button. (2) FormSection in src/components/forms/FormSection.tsx — takes a title, optional description, and children, renders as a labeled group with consistent spacing, for organizing long forms into logical sections (e.g. 'Personal Details', 'Location', 'Permissions'). (3) LoadingState in src/components/feedback/LoadingState.tsx — a generic centered spinner/loading indicator with an optional message prop, for full-page or full-section loading states outside of DataTable. Keep all three simple and unopinionated about specific use cases. Write basic unit tests for each: SearchToolbar's debounce fires onSearch correctly, FormSection renders title/description/children, LoadingState renders the message when provided."

**AI Output:**
1. Created `src/components/tables/SearchToolbar.tsx` with:
   - Debounced `onSearch` callback (300ms default) with rapid-keystroke timer resetting.
   - Enter key for immediate search and Escape key for immediate clear.
   - Inline clear icon button and dedicated Reset button.
   - Generic `children` slot for filter dropdowns and action buttons.
   - Created `src/components/tables/index.ts` exporting `DataTable` and `SearchToolbar`.
2. Created `src/components/forms/FormSection.tsx` with:
   - Labeled group structure using `font-heading` for titles, subtle description typography, and consistent spacing.
   - Optional `action` slot for header badges or controls.
   - Semantic accessibility (`aria-labelledby`).
   - Exported from `src/components/forms/index.ts`.
3. Created `src/components/feedback/LoadingState.tsx` with:
   - Accessible centered spinner (`Loader2`, `role="status"`, `aria-live="polite"`).
   - Optional `message` and `description` props.
   - Responsive sizing (`sm`, `md`, `lg`) and full-page layout variant (`fullPage`).
   - Created `src/components/feedback/index.ts` exporting all feedback components.
4. Added focused unit test suites:
   - `src/components/tables/SearchToolbar.test.tsx` (12 tests covering debounce delay, timer resetting on typing, clear button, Reset button, Enter/Escape hotkeys, filter children, and controlled values).
   - `src/components/forms/FormSection.test.tsx` (5 tests covering title, description, children, action slot, custom styling, and accessibility).
   - `src/components/feedback/LoadingState.test.tsx` (6 tests covering accessible status role, message, description, size variants, and fullPage layout).
**Accepted:**
- Simple, unopinionated, reusable components ready for upcoming feature forms and data tables.
- 100% test coverage with robust debounce timer assertions.

---

### Prompt 20: User API Service & UserListPage Feature

**Prompt:**
"Build src/api/user.api.ts with TanStack Query hooks calling the real user endpoints from docs/api-mapping.md: getUser (fetchUser by username), getUserWithHrmsAndUsername, and any list/search capability available. Note: the Postman collection doesn't show a dedicated 'list all users' endpoint with pagination — check api-mapping.md and if it's genuinely missing, mock the list query with realistic sample data and comment it as TODO: replace with real list endpoint, documenting this as a known limitation, same pattern as the dashboard.

Then build UserListPage in src/features/users/UserListPage.tsx using DataTable and SearchToolbar: columns for username, HRMS ID, first/last name, role, zone/circle/SSA, status (using StatusBadge), and an actions column with Edit/View buttons. Filters: status, role, and cascading ZoneSelector/CircleSelector/SSASelector as filter dropdowns inside SearchToolbar. Wrap the whole page's content in PermissionGuard permission='userPermissions'. Write a test confirming the table renders with mock data and that changing a filter updates the query params."

**AI Output:**
1. Created `src/api/user.api.ts`:
   - Wired real endpoints from `docs/api-mapping.md`: `getUser` (`GET /scm-user-api/scm-user-api/getUser/{username}`), `getUserWithHrmsAndUsername` (`GET /scm-user-api/scm-user-api/getUserwithHrmsIdandUsername`), `checkUsernameAvailability`, `checkUserStatus`, `getUserPermissions`.
   - Documented the absence of a dedicated paginated user listing endpoint as a known limitation with explicit `TODO` comment.
   - Built a realistic mock dataset (`MOCK_USERS`) of 10 users across regional zones, circles, SSAs, statuses, and roles.
   - Implemented `listUsers` with in-memory filtering (full-text search, status, role, cascading zone/circle/SSA) and pagination.
   - Exported TanStack Query hooks: `useUserQuery`, `useUserWithHrmsAndUsernameQuery`, `useUsersListQuery`, and key factory `userKeys`.
2. Created `src/features/users/UserListPage.tsx`:
   - Wrapped entire view in `<PermissionGuard permission="userPermissions" fallback={...}>`.
   - Wired bidirectional query parameters via `useSearchParams()` (`q`, `status`, `role`, `zoneId`, `circleId`, `ssaId`, `page`).
   - Integrated `SearchToolbar` containing: search input, status filter dropdown, role filter dropdown, and cascading `ZoneSelector`/`CircleSelector`/`SSASelector`.
   - Implemented `DataTable` with 7 columns: Username, HRMS ID, First / Last Name, Role, Jurisdiction (Zone / Circle / SSA), Status (with `StatusBadge`), and Actions (View / Edit buttons).
   - Built an interactive User Details modal opened upon clicking View or Edit.
   - Included operational limitation notice regarding the simulated list query.
3. Created `src/features/users/index.ts` and updated `src/features/users/UsersPage.tsx` to mount `UserListPage`.
4. Created `src/features/users/UserListPage.test.tsx` verifying:
   - Rendering of column headers and mock user records.
   - Filter changes update router search params and filter table rows.
   - Role and search query filtering.
   - View modal interaction.
   - PermissionGuard denial fallback when `userPermissions` is absent.
5. Ran all 18 test suites (120/120 tests passing) and validated clean production build.

**Accepted:**
- Comprehensive user management list view with real-time URL search param synchronization.
- Seamless integration with DataTable, SearchToolbar, cascading geographic selectors, and PermissionGuard.

---

### Prompt 21: Create User Feature (Zod Schema, FormSections, OTP Gating, Permissions Matrix)

**Prompt:**
"Build the Create User feature:

src/schemas/user.schema.ts — a Zod schema matching the usercreation payload fields from docs/api-mapping.md (hrmsId, username, mobileNumber, firstName, lastName, address, dob, roleId, zoneId, circleId, ssaId, password, status), with realistic validation (required fields, mobile number format, password strength, valid date for dob).
src/features/users/CreateUserForm.tsx — using React Hook Form + zodResolver + shadcn Form components, organized into FormSections: 'Basic Details' (HRMS ID, username, mobile, name), 'Location' (ZoneSelector → CircleSelector → SSASelector cascading), 'Account' (password, status, DOB, address), and 'Permissions' (checkbox grid for all 33 permission keys from the Postman collection's variable list — dealerPermissions, walletPermissions, userPermissions, commissionPermissions, plansNumberpermissions, reportsPermissions, stockCheck, dealerMpinReset, franchiseAddBalance, bulkRecharge, varepReports, userActivityReports, dealerStatus, transactionStatus, topupReversal, simSaleUpload, simInventory, pendingClearence, inReconsilation, mobileApp, deferredCommission, cbp, simUpgrade, mnp, frcStv, bulk_purge, e_auction, denominations, prepaidCommissions, postpaidCommissions, landlineCommissions, FOSCreation — group them logically, e.g. 'Dealer & Wallet', 'Commission Types', 'Reports & Activity').
Wire submission through useOtpFlow: on form submit (after client-side validation passes), open OTPVerificationModal with topic='UserCreation' and the form's mobile number. Only call the actual createUser API mutation inside the OTP flow's onSuccess callback — the form must NOT submit to the real endpoint before OTP validation succeeds.
Handle the create mutation with TanStack Query's useMutation, show loading state on the submit button, disable form during submission, show success/error via toast, and clear the form on success.

Write tests: schema validation catches invalid required fields, form renders all sections, submitting valid data opens the OTP modal (not the create API) before validation, and the create API is only called after OTP succeeds (mock useOtpFlow's onSuccess firing)."

**AI Output:**
1. Created `src/schemas/user.schema.ts`:
   - Zod schema `createUserSchema` matching `usercreation` endpoint from `docs/api-mapping.md`:
     - Alphanumeric validation for `hrmsId` (3-20 chars) and `username` (3-50 chars).
     - Strict Indian mobile format `/^[6-9]\d{9}$/`.
     - High-entropy password requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 digit).
     - Valid Date of Birth verifying operator is >= 18 years of age.
     - Numeric foreign keys for `roleId`, `zoneId`, `circleId`, `ssaId`.
     - Lifecycle `status` enum (`Active`, `Inactive`, `Pending`, `Blocked`).
     - Bitmask permissions map supporting all 32 permission keys from Postman variable declarations.
   - Defined `PERMISSION_KEYS` (32 keys) and `PERMISSION_GROUPS` categorized into 6 domains:
     - Core Administration (userPermissions, dealerPermissions, dealerStatus, dealerMpinReset, plansNumberpermissions, FOSCreation).
     - Dealer & Wallet Operations (walletPermissions, franchiseAddBalance, bulkRecharge, topupReversal, pendingClearence, inReconsilation).
     - Commission Types (commissionPermissions, prepaidCommissions, postpaidCommissions, landlineCommissions, deferredCommission, denominations).
     - SIM & Inventory (stockCheck, simSaleUpload, simInventory, simUpgrade, mnp, frcStv).
     - Reports & Activity (reportsPermissions, varepReports, userActivityReports, transactionStatus).
     - Advanced & System Tools (mobileApp, cbp, bulk_purge, e_auction).
2. Extended `src/api/user.api.ts`:
   - Added `CreateUserPayload` and `CreateUserResponse` interfaces.
   - Added `userApi.createUser` calling `POST /scm-user-api/scm-user-api/usercreation`.
   - Added TanStack Query `useCreateUserMutation` hook with automated cache invalidation on `userKeys.all`.
3. Created `src/features/users/CreateUserForm.tsx`:
   - Built with React Hook Form + `zodResolver(createUserSchema)` and shadcn `Form` components.
   - Organized into 4 `FormSection`s:
     - **Basic Details**: HRMS ID, Username, Mobile Number (OTP target), First Name, Last Name, System Role.
     - **Location**: Cascading `ZoneSelector` -> `CircleSelector` -> `SSASelector` with automatic resets on parent change.
     - **Account**: Password with visibility toggle, Status dropdown, Date of Birth picker, Physical address.
     - **Permissions**: Checkbox grid grouped into 6 collapsible/structured categories with batch quick actions ("Select All" / "Clear" per group, and global "Grant All" / "Clear All").
   - Integrated `OTPVerificationModal` (`topic='UserCreation'`). On form submit, client-side validation passes, captures pending values, and opens the OTP modal. The `createUser` mutation is strictly gated until OTP verification resolves via `useOtpFlow`.
   - Disabled all inputs and submit button during submission, showed spinner loading state, displayed success/error banners and toast notifications, and reset form on success.
4. Integrated `CreateUserForm` into `src/features/users/UserListPage.tsx` via an operational "Create User" action dialog button.
5. Created comprehensive unit test suites:
   - `src/schemas/user.schema.test.ts` (8 tests): valid payload, missing fields, mobile format, password complexity, DOB age restriction, location selections, and permission key groupings.
   - `src/features/users/CreateUserForm.test.tsx` (5 tests): renders all four FormSections, validation errors prevent submit and block OTP modal, submitting valid data opens OTP modal without calling API, create API is only dispatched after OTP verification succeeds, and Grant All / Clear All permission buttons work.
6. Ran full test suite (20 test suites, 133/133 tests passing) and confirmed production build (`tsc -b && vite build`) compiles with zero errors.

**Accepted:**
- Enterprise-grade, OTP-gated user creation workflow completely eliminating unverified accounts.
- Realistic Zod validation with 32-key permission matrix.
- 100% test pass rate across 133 tests with zero production build regressions.

---

### Prompt 11: Commission API & CommissionConfigPage with OTP Gating

**User Request:**
> Build `src/api/commission.api.ts` with hooks for: `getCategory`, `getZoneBasedCircles` (reuse existing masterdata patterns), `saveCommissionConfig` (FRC), `postpaidCommissionConfig`, `landlineCommissionConfig` — matching the exact payload shapes in `docs/api-mapping.md`'s Postman collection excerpts.
>
> Build `src/features/commissions/CommissionConfigPage.tsx` using shadcn Tabs for Prepaid FRC/OTF, Postpaid, Landline. Each tab has its own form: select category (from `getCategory`), select circle (via `CircleSelector`, or `ZoneSelector→CircleSelector` if zone-scoped), enter commission-specific fields (`sellerCommission`, `fraCommission`, `subCommission`, `tds`, `denomination` for FRC; `tdsAmount`, `actualCommission`, `sellerLevel`, `cap_limit` for postpaid; `fromAmount`/`toAmount` range for landline). Each form's submit triggers the correct OTP topic (`PrepaidFrc` / `PrepaidOtf` / `Postpaid` / `Landline`) via `useOtpFlow`, and only calls its save mutation on OTP success. Wrap the whole page in `PermissionGuard` `permission='commissionPermissions'`. Write tests confirming each tab's form triggers the correct OTP topic on submit.

**Solution:**
1. Created `src/api/commission.api.ts`:
   - Data interfaces: `Category`, `SaveCommissionConfigPayload`, `SaveMultipleCommissionConfigPayload`, `PostpaidCommissionConfigPayload`, `LandlineCommissionConfigPayload`.
   - API service functions calling endpoints mapped in `docs/api-mapping.md`:
     - `getCategory`: `GET /scm-db-api/masterdata-db-api/getCategory`
     - `getZoneBasedCircles`: `GET /scm-db-api/masterdata-db-api/zonebasedcircles?zoneId={zoneId}`
     - `saveCommissionConfig`: `POST /scm-plans-api/scm-product-api/saveCommissionConfig`
     - `saveMultipleCommissionConfig`: `POST /scm-plans-api/scm-product-api/savemultipleCommissionConfig?zoneId={zoneId}`
     - `postpaidCommissionConfig`: `POST /scm-plans-api/scm-product-api/postpaidCommissionConfig`
     - `landlineCommissionConfig`: `POST /scm-plans-api/scm-product-api/landlineCommissionConfig`
   - TanStack Query hooks: `useCategoriesQuery`, `useZoneBasedCirclesQuery`, `useSaveCommissionConfigMutation`, `useSaveMultipleCommissionConfigMutation`, `usePostpaidCommissionConfigMutation`, `useLandlineCommissionConfigMutation`.
2. Created `src/schemas/commission.schema.ts`:
   - Zod schemas `prepaidFrcSchema`, `prepaidOtfSchema`, `postpaidCommissionSchema`, and `landlineCommissionSchema` with field validation and range checks.
3. Created `src/features/commissions/CommissionConfigPage.tsx`:
   - shadcn `Tabs` with tabs for `Prepaid FRC/OTF`, `Postpaid`, and `Landline`.
   - Sub-selector for Prepaid FRC (single circle via `CircleSelector`, topic `'PrepaidFrc'`) vs Prepaid OTF (zone-scoped via `ZoneSelector` -> `CircleSelector`, topic `'PrepaidOtf'`).
   - Postpaid form (topic `'Postpaid'`) and Landline form (topic `'Landline'`).
   - Fully integrated with `useOtpFlow` and `OTPVerificationModal` so mutations only run after OTP verification.
   - Wrapped page with `PermissionGuard permission='commissionPermissions'`.
4. Mounted `CommissionConfigPage` at `/commissions` in `src/app/routes.tsx`.
5. Created unit tests in `src/features/commissions/CommissionConfigPage.test.tsx` (8 tests) verifying PermissionGuard and that each form triggers the exact OTP topic matching the action taken. All 141 tests in 21 test suites passed with zero build errors.

---

### Prompt 12: Commission Search Page & Franchise Add Balance with Row OTP Gating

**User Request:**
> Build `src/features/commissions/CommissionSearchPage.tsx`: a DataTable of commissions with SearchToolbar filters (circle, category, denomination), fetched via the `fetchCommission` / `fetchPrepaidOTFCommission` / `fetchPostpaidCommission` / `fetchLandlineCommission` endpoints depending on selected type. Row actions: Edit (opens the relevant config form pre-filled, uses the `Modify_[Type]` OTP topics, calls `updateCommissionConfig` / `updatePostpaidCommission` / `updateLandlineCommission` on success) and Delete (`ConfirmationDialog` with `destructive=true`, then calls `deleteCommissionConfig` / `deletePostpaidCommission` / `deleteLandlineCommission`).
>
> Build `src/features/commissions/FranchiseAddBalancePage.tsx`: DataTable of pending `franchiseAddBalanceTransactions`, with Approve/Reject row actions — each uses their own OTP topic (`FranchiseAddbalanceApprove` / `FranchiseAddbalanceReject`) before calling the approve/reject endpoints. Write tests for the edit flow triggering the correct Modify_ topic, and the approve/reject flow triggering the correct topic per action.

**Solution:**
1. Extended `src/api/commission.api.ts`:
   - Data interfaces: `CommissionItem`, `FranchiseAddBalanceTransaction`, `UpdateCommissionConfigPayload`, `UpdatePostpaidCommissionPayload`, `UpdateLandlineCommissionPayload`, `FranchiseBalanceActionPayload`, `FetchCommissionFilters`.
   - API endpoints calling:
     - `fetchCommission`, `fetchPrepaidOTFCommission`, `fetchPostpaidCommission`, `fetchLandlineCommission`
     - `updateCommissionConfig`, `updatePostpaidCommission`, `updateLandlineCommission`
     - `deleteCommissionConfig`, `deletePostpaidCommission`, `deleteLandlineCommission`
     - `getFranchiseAddBalanceTransactions`, `approveFranchiseAddBalance`, `rejectFranchiseAddBalance`
   - Hooks: `useCommissionsQuery`, `useFranchiseTransactionsQuery`, `useUpdateCommissionMutation`, `useUpdatePostpaidMutation`, `useUpdateLandlineMutation`, `useDeleteCommissionMutation`, `useApproveFranchiseBalanceMutation`, `useRejectFranchiseBalanceMutation`.
2. Created `src/features/commissions/CommissionSearchPage.tsx`:
   - Line-bar `Tabs` (`variant="line"`) switching across Prepaid FRC, Prepaid OTF, Postpaid, and Landline.
   - `SearchToolbar` with search input, Circle dropdown, Category dropdown, and Denomination input.
   - `DataTable` with columns tailored to each commission type.
   - Edit dialog pre-filled with row data, triggering OTP modal with topic `Modify_PrepaidFRC`, `Modify_PrepaidOTF`, `Modify_Postpaid`, or `Modify_Landline`, calling respective update mutation only on verified OTP.
   - Delete action opening `ConfirmationDialog` with `destructive={true}` calling respective delete mutation.
   - Wrapped in `<PermissionGuard permission="commissionPermissions">`.
3. Created `src/features/commissions/FranchiseAddBalancePage.tsx`:
   - `DataTable` of pending franchise balance additions with sequence, MSISDNs, amount, circle, user, and `StatusBadge`.
   - Approve button triggering OTP modal with topic `FranchiseAddbalanceApprove` before calling `/franchiseAddBalance/approve`.
   - Reject button triggering confirmation followed by OTP modal with topic `FranchiseAddbalanceReject` before calling `/franchiseAddBalance/reject`.
   - Wrapped in `<PermissionGuard permission="commissionPermissions">`.
4. Exported pages in `src/features/commissions/index.ts`, wired `/commissions/search` and `/commissions/franchise-balance` routes in `src/app/routes.tsx`, and added navigation items to `AppLayout.tsx`.
5. Created comprehensive unit test suites:
   - `src/features/commissions/CommissionSearchPage.test.tsx` (5 tests): verifies PermissionGuard, directory rendering, Edit flow triggering `Modify_PrepaidFRC` and `Modify_Postpaid` OTP topics, and Delete flow with `ConfirmationDialog`.
   - `src/features/commissions/FranchiseAddBalancePage.test.tsx` (4 tests): verifies PermissionGuard, transaction table, Approve flow triggering `FranchiseAddbalanceApprove`, and Reject flow triggering `FranchiseAddbalanceReject`.
---

### Prompt 13: Dealer Management (Multipart FormData Creation, Directory, Profile, & OTP-Gated Actions)

**User Request:**
> Build `src/api/dealer.api.ts`: dealer creation must use FormData (multipart), not JSON — append a 'dealer' field as a JSON string blob (matching the fields in docs/api-mapping.md's Create Dealer description: firstName, lastName, mobile, dob, address, dealerType, circleId, ssaId, category, aadhaarId, panId, gstNumber, etc.) plus a 'certificate' file field. Also add: fetchDealer, fetchDealerData, updateDealer, dealerStatusCheck, dealerStatusChange, dealerList, resetMpin, changeDealerHierarchy.
>
> Build `src/features/dealers/DealerListPage.tsx` (DataTable + SearchToolbar, similar pattern to UserListPage) and `src/features/dealers/CreateDealerForm.tsx` with a proper file upload input (shadcn-compatible, accept image/pdf for certificate) plus the standard fields, OTP-gated with topic 'Dealercreation'. Build `DealerDetailPage.tsx` with: Edit (topic 'Modifydealer'), Status change (topic 'DealerStatus', with ConfirmationDialog), MPIN reset (topic 'DealerMpinreset', with ConfirmationDialog warning it's irreversible), and hierarchy change UI (topic 'DealerHierarchyChange') showing parent/child relationship via srcMsisdn/destMsisdn. Write tests confirming create form submits as FormData (not JSON) with dealer JSON blob and certificate file, and each protected action uses its correct OTP topic.

**Solution:**
1. Updated `src/api/client.ts`:
   - Configured `apiClient` to inspect `options?.body instanceof FormData` and conditionally omit default `'Content-Type': 'application/json'`, letting the browser set `multipart/form-data; boundary=...` automatically.
2. Created `src/api/dealer.api.ts`:
   - Defined interfaces: `Dealer`, `DealerType`, `DealerCategory`, `CreateDealerPayload`, `UpdateDealerPayload`, `DealerStatusCheckResponse`, `ChangeHierarchyPayload`, `ResetMpinPayload`.
   - Built API methods:
     - `createDealer`: constructs `FormData`, appends `'dealer'` string blob and `'certificate'` `File`, posts to `/scm-dealer-api/dealerManagement/createDealer`.
     - `fetchDealer`: `GET /scm-dealer-api/dealerManagement/fetchDealer?msisdn={msisdn}`.
     - `fetchDealerData`: `GET /scm-dealer-api/dealerManagement/fetchDealerData?msisdn={msisdn}`.
     - `updateDealer`: `POST /scm-dealer-api/dealerManagement/modifyDealer`.
     - `dealerStatusCheck`: `GET /scm-dealer-api/dealerManagement/dealerStatusCheck?msisdn={msisdn}`.
     - `dealerStatusChange`: `POST /scm-dealer-api/dealerManagement/dealerStatusChange`.
     - `listDealers`: top-level dealer directory query with fallback mock data when backend pagination endpoint is unprovisioned.
     - `resetMpin`: `POST /scm-dealer-api/dealerManagement/resetMpin`.
     - `changeDealerHierarchy`: `POST /scm-dealer-api/dealerManagement/changeDealerHierarchy`.
   - TanStack Query hooks: `useDealersListQuery`, `useDealerQuery`, `useDealerDataQuery`, `useDealerStatusCheckQuery`, `useCreateDealerMutation`, `useUpdateDealerMutation`, `useChangeDealerStatusMutation`, `useResetMpinMutation`, `useChangeDealerHierarchyMutation`.
3. Created `src/schemas/dealer.schema.ts`:
   - Zod validation schemas for `createDealerSchema`, `updateDealerSchema`, and `changeHierarchySchema`.
4. Created `src/features/dealers/CreateDealerForm.tsx`:
   - FormSections: 'Basic Information', 'Channel Classification', 'Geographic Location' (cascading `ZoneSelector` -> `CircleSelector` -> `SSASelector`), 'Identity & Tax Credentials' (Aadhaar, PAN, GSTIN), and 'Verification Document' file dropzone supporting image and PDF upload with size/type validation.
   - OTP modal triggered on submit with `topic: 'Dealercreation'`; payload is strictly submitted as `FormData` only upon OTP verification.
5. Created `src/features/dealers/DealerListPage.tsx`:
   - `DataTable` + `SearchToolbar` filtering by status, dealer tier, circle, and search text.
   - Action buttons for viewing profile and creating dealers via modal dialog.
   - Secured under `<PermissionGuard permission="dealerPermissions">`.
6. Created `src/features/dealers/DealerDetailPage.tsx`:
   - Read-only profile view with telemetry, hierarchy overview card (`srcMsisdn` -> `destMsisdn`), and action toolbar.
   - Four OTP-gated workflows:
     - **Edit Dealer**: pre-filled dialog, OTP topic `'Modifydealer'`, calls `updateDealer`.
     - **Status Change**: `ConfirmationDialog` prompt, OTP topic `'DealerStatus'`, calls `changeDealerStatus`.
     - **Reset MPIN**: `ConfirmationDialog` with `destructive={true}` warning action is irreversible, OTP topic `'DealerMpinreset'`, calls `resetMpin`.
     - **Hierarchy Transfer**: modal with source/destination MSISDN inputs, OTP topic `'DealerHierarchyChange'`, calls `changeDealerHierarchy`.
   - Secured under `<PermissionGuard permission="dealerPermissions">`.
7. Created comprehensive unit tests:
   - `src/features/dealers/CreateDealerForm.test.tsx` (3 tests): verifies field validation, file attachment, and `FormData` submission with topic `'Dealercreation'`.
   - `src/features/dealers/DealerDetailPage.test.tsx` (6 tests): verifies PermissionGuard, profile rendering, and all 4 OTP topics (`Modifydealer`, `DealerStatus`, `DealerMpinreset`, `DealerHierarchyChange`).
8. Full verification: all 25 test suites (159/159 tests) passed and production build succeeded.

---

### Prompt 14: Product Plans, Denominations, MNP Routing, and Number Series

**User Request:**
> Build `src/api/plan.api.ts` covering getplans, addplan, updateplan, deleteplan, saveDenomination, findMnpData/savemnp/modifyMnpData/deleteMnp, and getnumberseries/addnumberseries/saveNumberSeries/editnumberseries/purgenumberseries, matching docs/api-mapping.md.
>
> Build `src/features/plans/PlanListPage.tsx` (DataTable + SearchToolbar) and a PlanForm for add/edit (OTP topics: 'Addplan' for create, appropriate modify topic for edit) with fields from the addplan payload (operator, denomination, talkvalue, country, dates, type, description, circle, validity). Build a simpler `DenominationConfigPage.tsx` (topic 'Denominationconfiguration'), `MnpConfigPage.tsx` (topics 'ADD MNP' / 'ModifyMnp' / 'DeleteMnp'), and `NumberSeriesPage.tsx` (topics 'AddnumberSeries' / 'ModfifynumberSeries' / 'DeleteNumberseries') — these three can share a simpler layout pattern (a DataTable plus a compact add/edit form) since they're lower-complexity than Plans. Write basic tests for the plan CRUD flow and OTP topic correctness for at least MNP add.

**Solution:**
1. Created `src/api/plan.api.ts`:
   - Defined TypeScript data models for `ProductPlan`, `Denomination`, `MnpRecord`, and `NumberSeries`.
   - Built API methods & TanStack Query hooks:
     - Plans: `fetchPlans` (`POST /scm-plans-api/scm-product-api/getplans`), `addPlan` (`POST /scm-plans-api/scm-product-api/addplan`), `updatePlan` (`POST /scm-plans-api/scm-product-api/updateplan`), `deletePlan` (`POST /scm-plans-api/scm-product-api/deleteplan`). Hooks: `usePlansQuery`, `useAddPlanMutation`, `useUpdatePlanMutation`, `useDeletePlanMutation`.
     - Denominations: `saveDenomination` (`POST /scm-plans-api/scm-product-api/saveDenomination`), `saveMultipleDenominations` (`POST /scm-plans-api/scm-product-api/saveMultipleDenominations`), `fetchRechargePlan` (`POST /scm-plans-api/scm-product-api/fetchRechargePlan`), `listDenominations`. Hooks: `useDenominationsQuery`, `useSaveDenominationMutation`.
     - MNP Routing: `findMnpData` (`POST /scm-db-api/masterdata-db-api/findMnpData`), `saveMnp` (`POST /scm-db-api/masterdata-db-api/savemnp`), `modifyMnpData` (`POST /scm-db-api/masterdata-db-api/modifyMnpData`), `deleteMnp` (`POST /scm-db-api/masterdata-db-api/deleteMnp`), `listMnpRecords`. Hooks: `useMnpListQuery`, `useSaveMnpMutation`, `useModifyMnpMutation`, `useDeleteMnpMutation`.
     - Number Series: `getNumberSeries` (`POST /scm-db-api/masterdata-db-api/getnumberseries`), `addNumberSeries` (`POST /scm-db-api/masterdata-db-api/addnumberseries`), `saveNumberSeries` (`POST /scm-db-api/masterdata-db-api/saveNumberSeries`), `editNumberSeries` (`POST /scm-db-api/masterdata-db-api/editnumberseries`), `purgeNumberSeries` (`POST /scm-db-api/masterdata-db-api/purgenumberseries`), `listNumberSeries`. Hooks: `useNumberSeriesListQuery`, `useAddNumberSeriesMutation`, `useEditNumberSeriesMutation`, `usePurgeNumberSeriesMutation`.
2. Created `src/schemas/plan.schema.ts`:
   - Zod validation schemas for `planSchema`, `denominationSchema`, `mnpSchema`, and `numberSeriesSchema`.
3. Created `src/features/plans/PlansNavigation.tsx`:
   - Line-bar style navigation bar linking `Product Plans` (`/plans`), `Denomination Matrix` (`/plans/denominations`), `MNP Routing` (`/plans/mnp`), and `Number Series` (`/plans/number-series`).
4. Created `src/features/plans/PlanForm.tsx`:
   - Multi-section form partitioned into 'Plan Specification', 'Commercial Parameters', and 'Regional & Validity Settings'.
5. Created `src/features/plans/PlanListPage.tsx`:
   - `DataTable` + `SearchToolbar` filtering by Circle, Plan Type, and search query.
   - Add/Edit modal dialogs with OTP verification using topics `'Addplan'` and `'ModifyPlan'`.
   - Delete flow with `ConfirmationDialog` before calling `deletePlan`.
   - Gated under `<PermissionGuard permission="plansNumberpermissions">`.
6. Created `src/features/plans/DenominationConfigPage.tsx`:
   - Matrix catalog of denominations with Circle filter and Add modal gated by OTP topic `'Denominationconfiguration'`.
   - Gated under `<PermissionGuard permission="plansNumberpermissions">`.
7. Created `src/features/plans/MnpConfigPage.tsx`:
   - Porting directory with Circle filter, Add modal gated by exact OTP topic `'ADD MNP'`, Edit modal gated by `'ModifyMnp'`, and Delete flow gated by `'DeleteMnp'`.
   - Gated under `<PermissionGuard permission="plansNumberpermissions">`.
8. Created `src/features/plans/NumberSeriesPage.tsx`:
   - Intelligent Network (IN) series directory with Circle filter, Add modal gated by `'AddnumberSeries'`, Edit modal gated by exact topic `'ModfifynumberSeries'`, and Purge flow gated by `'DeleteNumberseries'`.
   - Gated under `<PermissionGuard permission="plansNumberpermissions">`.
9. Exported all components in `src/features/plans/index.ts` and configured routes in `src/app/routes.tsx`.
10. Added 3 comprehensive test suites:
    - `PlanListPage.test.tsx` (6 tests): verifies PermissionGuard, catalog rendering, search filter, Add Plan with topic `'Addplan'`, Edit Plan with topic `'ModifyPlan'`, and Delete Plan with ConfirmationDialog.
    - `MnpConfigPage.test.tsx` (5 tests): verifies PermissionGuard, table rendering, Add MNP with exact topic `'ADD MNP'`, Edit MNP with `'ModifyMnp'`, and Delete MNP with `'DeleteMnp'`.
    - `DenominationAndNumberSeries.test.tsx` (4 tests): verifies Denomination Add with topic `'Denominationconfiguration'`, Number Series Add with `'AddnumberSeries'`, Edit with exact topic `'ModfifynumberSeries'`, and Purge with `'DeleteNumberseries'`.

