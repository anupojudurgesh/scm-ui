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

---

## Decision: User API Service & UserListPage Architecture

**Context:** The Postman collection contains individual user endpoints (`getUser/{username}`, `getUserwithHrmsIdandUsername`, `fetchusername`, `userStatusCheck`, `getUserPermissionwithHrmsIdandUsername`), but lacks a dedicated paginated user listing API (`/users`). The UI needs a scalable, filterable User Directory supporting full-text search, status and role filtering, and cascading geographic scoping (Zone -> Circle -> SSA).

**Decision:**
- **User API Service (`src/api/user.api.ts`):** Wired real endpoints for individual lookups while providing a simulated list query (`listUsers`) over realistic sample data (`MOCK_USERS`) with in-memory filtering and pagination. Documented as a known limitation with `TODO` markers for backend alignment.
- **Permission-Gated View:** Wrapped the entire `UserListPage` inside `PermissionGuard` evaluating `userPermissions`, displaying a clear "Access Restricted" alert if the user lacks the permission bitmask flag.
- **Bidirectional URL Query Sync:** Bound all filter states (`q`, `status`, `role`, `zoneId`, `circleId`, `ssaId`, `page`) directly to `react-router-dom`'s `useSearchParams`, enabling deep-linking, browser history navigation, and refresh persistence.
- **Cascading Filter Integration:** Integrated `SearchToolbar` containing status and role dropdowns alongside the cascading `ZoneSelector`, `CircleSelector`, and `SSASelector` components.

**Why:** Ensures full usability and testability of the user management domain today while maintaining clean decoupling for when backend engineers deploy the real paginated listing endpoint.

---

## Decision: OTP-Gated User Creation & 32-Key Bitmask Permissions Matrix

**Context:** Creating an operational SCM user account requires capturing legal, jurisdictional, credential, and granular capability assignments. Because adding an operator is a high-privilege administrative action that grants backend access across telecom domains, it must be protected against accidental or unauthorized submission.

**Decision:**
- **Zod Schema (`src/schemas/user.schema.ts`):** Defined `createUserSchema` matching `usercreation` API requirements from `docs/api-mapping.md`:
  - `hrmsId`: alphanumeric code (3–20 chars).
  - `username`: alphanumeric with dots/dashes/underscores (3–50 chars).
  - `mobileNumber`: strictly validated Indian 10-digit mobile (`^[6-9]\d{9}$`), acting as the primary SMS OTP target.
  - `password`: high-entropy policy (min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit).
  - `dob`: date validation enforcing minimum operator age of 18 years.
  - `roleId`, `zoneId`, `circleId`, `ssaId`: numeric foreign keys ensuring complete regional jurisdiction assignment.
  - `permissions`: flexible boolean map covering all 32 permission keys from Postman variable declarations.
- **Cascading Geographical Scope:** Organized into logical `FormSection`s ('Basic Details', 'Location', 'Account', 'Permissions'). When a user selects a Zone, child Circle and SSA dropdowns automatically reset and dynamically load children via TanStack Query.
- **OTP-Gated Submission Flow (`useOtpFlow` + `OTPVerificationModal`):**
  - Submitting the form runs client-side Zod validation only.
  - Upon passing client-side validation, the form **never** calls `userApi.createUser` immediately. Instead, it captures the form values in temporary pending state and opens `OTPVerificationModal` with topic `UserCreation` and the operator's mobile number.
  - The actual mutation (`useCreateUserMutation`) is **strictly deferred** until the `onSuccess` callback of `useOtpFlow` fires.
  - On successful creation, the form displays a success banner, triggers an optional `onSuccess` callback, and resets cleanly.
- **32-Key Bitmask Permissions Matrix:** Grouped all 32 Postman collection permission keys into 6 operational categories ('Core Administration', 'Dealer & Wallet Operations', 'Commission Types', 'SIM & Inventory', 'Reports & Activity', 'Advanced & System Tools'). Provided batch toggle quick actions ("Select All" / "Clear" per category, and global "Grant All" / "Clear All").

**Why:** Completely prevents unverified user account provisioning in production. The two-phase submission pattern (Client Validation -> OTP Challenge -> Backend Mutation) guarantees zero rogue accounts can be created without cryptographic MSISDN verification.

---

## Decision: Multi-Tab Commission Configuration Architecture with Dedicated OTP Topics

**Context:** The Commission Configuration domain manages financial payouts, tariff formulas, TDS withholdings, and tier structures across three distinct business lines: Prepaid (FRC & OTF), Postpaid, and Landline. Write operations in each business line are high-risk financial configurations requiring distinct audit trails and separate OTP topics (`PrepaidFrc`, `PrepaidOtf`, `Postpaid`, `Landline`).

**Decision:**
- **Dedicated Commission API Layer (`src/api/commission.api.ts`):** Mapped exact payload contracts from Postman excerpts for `getCategory`, `getZoneBasedCircles`, `saveCommissionConfig` (FRC), `saveMultipleCommissionConfig` (OTF), `postpaidCommissionConfig`, and `landlineCommissionConfig` with typed TanStack Query hooks.
- **Multi-Tab Architecture with shadcn Tabs (`src/features/commissions/CommissionConfigPage.tsx`):**
  - Divided configuration into main tabs: `Prepaid FRC/OTF`, `Postpaid`, and `Landline`.
  - Inside `Prepaid FRC/OTF`, provided sub-tab switching between FRC (Single Circle via `CircleSelector`) and OTF (Zone-scoped via `ZoneSelector` -> `CircleSelector`).
- **Dedicated OTP Topics per Action:**
  - Prepaid FRC -> `topic: 'PrepaidFrc'` -> calls `saveCommissionConfig`.
  - Prepaid OTF -> `topic: 'PrepaidOtf'` -> calls `saveMultipleCommissionConfig`.
  - Postpaid -> `topic: 'Postpaid'` -> calls `postpaidCommissionConfig`.
  - Landline -> `topic: 'Landline'` -> calls `landlineCommissionConfig`.
- **Pre-Submission Validation & Deferred Execution:** Form submission validates via Zod schemas (`src/schemas/commission.schema.ts`), enters pending state, and opens `OTPVerificationModal`. Mutations are strictly prevented from running until OTP verification succeeds.
- **Permission Guard:** The entire page is secured behind `<PermissionGuard permission="commissionPermissions">`.

**Why:** Enforces cryptographic 2-step verification tailored to each financial line while delivering a unified, ergonomic tabbed interface for telecom operators.

---

## Decision: Commission Search Directory with Line-Bar Tabs, `Modify_[Type]` OTP Topics, and Destructive ConfirmationDialog

**Context:** Operators need to search, inspect, modify, and delete commission slab configurations across services (Prepaid FRC, Prepaid OTF, Postpaid, Landline). Modifying live financial parameters requires specific audit trails and per-service OTP verification topics (`Modify_PrepaidFRC`, `Modify_PrepaidOTF`, `Modify_Postpaid`, `Modify_Landline`), while deletion is permanent and requires explicit confirmation.

**Decision:**
- **Search & Filter Surface (`src/features/commissions/CommissionSearchPage.tsx`):**
  - Modern line-bar tabs (`TabsList variant="line"`) for instant switching between `Prepaid FRC`, `Prepaid OTF`, `Postpaid`, and `Landline`.
  - Filter toolbar with `SearchToolbar` providing debounced text search, Circle selector dropdown (`useAllCirclesQuery`), Category selector dropdown (`useCategoriesQuery`), and Denomination input.
  - Polymorphic `DataTable` columns that automatically adapt column definitions to the active tariff structure (e.g., sellerCommission/fraCommission/TDS for FRC vs actualCommission/capLimit/sellerLevel for Postpaid vs fromAmount-toAmount range for Landline).
- **OTP-Gated Modification Flow:**
  - Row action "Edit" opens a pre-filled configuration dialog tailored to that slab type.
  - Submitting edit changes strictly does **not** call update mutations directly.
  - Opens `OTPVerificationModal` with exact topic mapping:
    - Prepaid FRC -> `topic: 'Modify_PrepaidFRC'` -> calls `updateCommissionConfig`.
    - Prepaid OTF -> `topic: 'Modify_PrepaidOTF'` -> calls `updateCommissionConfig`.
    - Postpaid -> `topic: 'Modify_Postpaid'` -> calls `updatePostpaidCommission`.
    - Landline -> `topic: 'Modify_Landline'` -> calls `updateLandlineCommission`.
  - Mutation only executes upon verified OTP callback.
- **Safe Destructive Deletion:**
  - Row action "Delete" triggers `ConfirmationDialog` with `destructive={true}`.
  - On user confirmation, calls `deleteCommissionConfig`, `deletePostpaidCommission`, or `deleteLandlineCommission` depending on active type.
- **Permission Guard:** Secured under `<PermissionGuard permission="commissionPermissions">`.

**Why:** Protects live commission tariffs from unintended modification while providing operators with an agile, consolidated management directory.

---

## Decision: Franchise Add Balance Approvals with Dual OTP Topics

**Context:** Franchisees request balance replenishment transfers into their distribution wallets. Authorizing or declining financial balance additions impacts telecom ledger balances and requires individual operator authorization with distinct OTP topics (`FranchiseAddbalanceApprove` and `FranchiseAddbalanceReject`).

**Decision:**
- **Directory Surface (`src/features/commissions/FranchiseAddBalancePage.tsx`):**
  - Displays pending `franchiseAddBalanceTransactions` fetched via `getFranchiseAddBalanceTransactions` with Circle filtering and debounced search.
  - Columns show Sequence ID, Source & Destination MSISDNs, formatted currency amount (`₹`), circle, requester, creation timestamp, and `StatusBadge`.
- **Dedicated Dual OTP Protection:**
  - **Approve Action:** Row action "Approve" triggers `OTPVerificationModal` with `topic: 'FranchiseAddbalanceApprove'`. Only upon verification is `approveFranchiseAddBalance({ fabSeqList: [seq], actionUser })` executed.
  - **Reject Action:** Row action "Reject" first prompts a confirmation modal to prevent accidental clicks, then triggers `OTPVerificationModal` with `topic: 'FranchiseAddbalanceReject'`. Only upon verification is `rejectFranchiseAddBalance({ fabSeqList: [seq], actionUser })` executed.
- **Permission Guard:** Gated with `<PermissionGuard permission="commissionPermissions">`.

**Why:** Enforces cryptographic 2-factor accountability on every single franchise wallet balance change, meeting telecom compliance and financial security mandates.

---

## Decision: Dealer Management Domain — Multipart/FormData Onboarding, Hierarchy Tracking, and 5-Topic OTP Governance

**Context:** The telecom channel dealer network (Franchises, Sub-Franchises, Retailers) requires administrative management: onboarding new partner entities with KYC identity documents (GST, PAN, Aadhaar, Certificate upload), inspecting parent/child hierarchy mappings (`srcMsisdn` -> `destMsisdn`), updating KYC details, activating/suspending accounts, resetting MPINs, and restructuring distribution chains. Because these operations affect downstream cash flows and channel incentives, every state mutation requires cryptographic OTP verification with dedicated topics.

**Finding:**
1. **Multipart Payload Requirement**: In `docs/api-mapping.md`, the backend `POST /scm-dealer-api/dealerManagement/createDealer` route does not accept JSON. Instead, it requires `multipart/form-data` with:
   - A `'dealer'` field containing the serialized JSON string blob of metadata.
   - A `'certificate'` field containing the binary document/image file (`File`).
2. **Dedicated OTP Topic Matrix**:
   - Create Dealer: `Dealercreation`
   - Modify Dealer Info: `Modifydealer`
   - Status Transition: `DealerStatus`
   - Reset Dealer MPIN: `DealerMpinreset`
   - Hierarchy Transfer: `DealerHierarchyChange`

**Decision:**
- **Flexible HTTP Client (`src/api/client.ts`):**
  - Updated `apiClient` to check `options?.body instanceof FormData`. If true, it omits the default `'Content-Type': 'application/json'` header so that the browser automatically generates `multipart/form-data; boundary=...`.
- **Multipart Dealer Creation (`src/api/dealer.api.ts` & `src/features/dealers/CreateDealerForm.tsx`):**
  - Built `CreateDealerForm` with structured `FormSection` blocks, cascading `ZoneSelector` -> `CircleSelector` -> `SSASelector`, and a file upload dropzone accepting PDF and images up to 5MB.
  - On validation pass, triggers `OTPVerificationModal` with `topic: 'Dealercreation'`.
  - On verified OTP, packages metadata into a JSON string blob on key `'dealer'`, appends the uploaded file to key `'certificate'`, and sends via `createDealerMutation`.
- **Dealer Directory & Profile (`src/features/dealers/`):**
  - `DealerListPage.tsx`: `DataTable` with `SearchToolbar` filtering by Circle, Dealer Tier, Status, and search query.
  - `DealerDetailPage.tsx`: Read-only telemetry and profile cards, including an interactive distribution tree showing current hierarchy (`srcMsisdn` -> `destMsisdn`).
- **OTP-Gated Account Management:**
  - **Edit Dealer**: Dialog pre-filled with existing dealer attributes, verified via `Modifydealer`, executes `updateDealer`.
  - **Status Change**: Action trigger with `ConfirmationDialog`, verified via `DealerStatus`, executes `changeDealerStatus`.
  - **MPIN Reset**: Irreversible warning via `ConfirmationDialog (destructive=true)`, verified via `DealerMpinreset`, executes `resetMpin`.
  - **Hierarchy Change**: Reassignment modal mapping Source -> Destination MSISDN, verified via `DealerHierarchyChange`, executes `changeDealerHierarchy`.
- **Security & Permissions**:
  - Both `DealerListPage` and `DealerDetailPage` are gated under `<PermissionGuard permission="dealerPermissions">`.

**Why:** Satisfies backend multipart requirements without breaking existing JSON endpoints, enforces telecom compliance on channel entity lifecycle actions, and prevents accidental credential resets or unauthorized hierarchy modifications.

---

## Decision: Product Plans, Denominations, MNP Routing, and Number Series Architecture

**Context:** The telecom SCM platform manages commercial catalog offerings, prepaid top-up denominations, Mobile Number Portability (MNP) routing registers, and Intelligent Network (IN) subscriber number series ranges. Each module manages critical network configuration or billing rules and requires strict OTP governance with distinct topic names matching legacy gateway requirements.

**Finding & Topic Matrix:**
1. **Product Plans** (`/scm-plans-api/scm-product-api/`):
   - Add Plan: `topic: 'Addplan'` -> `POST /addplan`
   - Update Plan: `topic: 'ModifyPlan'` -> `POST /updateplan`
   - Delete Plan: Permanent deletion guarded by `ConfirmationDialog` -> `POST /deleteplan`
2. **Denominations** (`/scm-plans-api/scm-product-api/`):
   - Save Denomination: `topic: 'Denominationconfiguration'` -> `POST /saveDenomination`
3. **MNP Routing** (`/scm-db-api/masterdata-db-api/`):
   - Add MNP: `topic: 'ADD MNP'` (exact uppercase with space matching Postman collection) -> `POST /savemnp`
   - Modify MNP: `topic: 'ModifyMnp'` -> `POST /modifyMnpData`
   - Delete MNP: `ConfirmationDialog` then `topic: 'DeleteMnp'` -> `POST /deleteMnp`
4. **Number Series** (`/scm-db-api/masterdata-db-api/`):
   - Add Series: `topic: 'AddnumberSeries'` -> `POST /addnumberseries`
   - Edit Series: `topic: 'ModfifynumberSeries'` (exact Postman collection spelling with 'f') -> `POST /editnumberseries`
   - Purge Series: `ConfirmationDialog` then `topic: 'DeleteNumberseries'` -> `POST /purgenumberseries`

**Decision:**
- **Shared Sub-Navigation (`src/features/plans/PlansNavigation.tsx`):**
  - Designed an accessible line-bar navigation bar (`PlansNavigation`) linking all 4 modules (`/plans`, `/plans/denominations`, `/plans/mnp`, `/plans/number-series`) with active route indicators, icon cues, and subtle transition styling.
- **Unified Permission Guard:**
  - All four pages (`PlanListPage`, `DenominationConfigPage`, `MnpConfigPage`, `NumberSeriesPage`) are secured under `<PermissionGuard permission="plansNumberpermissions">`.
- **Reusable Form Architectures:**
  - `PlanForm.tsx`: partitioned into structured `FormSection` blocks ('Plan Specification', 'Commercial Parameters', 'Regional & Validity Settings') with Zod schema validation (`src/schemas/plan.schema.ts`).
  - Dialog-based workflows with SearchToolbar filters, pagination, and `DataTable` rendering for all four domains.
- **Universal OTP Safety:**
  - OTP verification modal is raised before any mutation request is issued. All operations submit the user's mobile number (`operation: '10069'`) and execute mutations only upon cryptographically verified OTP tokens.

**Why:** Unifies four related telecom network configuration domains under a consistent line-bar UI while rigorously conforming to backend routing endpoints, payload schemas, and precise legacy OTP topics.