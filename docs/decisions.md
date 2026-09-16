# Architecture Decision Records (ADRs)

This document records the architectural decisions, trade-offs, and technical rationale established during the design and construction of the Telecom Supply Chain Management (SCM) Web Portal.

---

## ADR-001: Single API Host with Path-Prefix Domain Routing

**Status:** Accepted  
**Date:** Initial Architecture Setup

### Context
The original project brief described five separate microservice domains (`scm-user-api`, `scm-db-api`, `scm-plans-api`, `scm-dealer-api`, `scmfmis-reports-api`), implying each domain might be hosted on its own independent origin or hostname with separate environment variables.

### Finding
Auditing the authoritative Postman collection (`SCM_APIs.postman_collection.json`) confirmed that all endpoints are served through a single unified API Gateway host (`ui.example.com`) using distinctive URL path prefixes per domain. Additionally, a sixth unlisted domain—Wallet & Franchise Replenishment (`/scm-wallet-api/` / `/scm-stock-api/`)—was identified as an active operational domain.

### Decision
- `src/api/client.ts` reads a single base URL from `VITE_API_BASE_URL`.
- Domain-specific API client services (`user.api.ts`, `dealer.api.ts`, `commission.api.ts`, `plan.api.ts`, `wallet.api.ts`, `masterdata.api.ts`) encapsulate their respective path prefixes rather than maintaining redundant base URL constants.

### Rationale & Consequences
- Avoids proliferation of unnecessary environment variables (`VITE_USER_API_URL`, `VITE_DEALER_API_URL`, etc.).
- Reflects the verified backend gateway contract rather than unverified assumptions.
- Allows seamless switching across development, staging, and production environments via a single environment variable.

---

## ADR-002: State Management Partitioning — TanStack Query for Server State, Zustand for Client State

**Status:** Accepted  
**Date:** Initial Architecture Setup

### Context
Telecom management operations involve two fundamentally different types of state:
1. **Server State**: Remote database records (user profiles, dealer KYC, commission slabs, tariff vouchers, number ranges) that are asynchronous, shared across multiple users, require caching/deduplication, and can become stale.
2. **Client State**: Ephemeral UI and session states (logged-in user identity, active permission bitmasks, modal open/close states, and OTP verification flow machines) that are strictly local, synchronous, and client-owned.

Using a monolithic state store (such as standard Redux) would introduce significant boilerplate (actions, reducers, thunks, manual normalized entity adapters) for remote queries while complicating optimistic updates and cache invalidation.

### Decision
- **Server State & Data Fetching**: Adopted **TanStack Query v5**. All API read queries (`useQuery`) and write operations (`useMutation`) are managed through TanStack Query hooks, leveraging automatic request deduplication, cache garbage collection, and declarative cache invalidation (`queryClient.invalidateQueries`).
- **Client Session & Modal State**: Adopted **Zustand v5**. Created dedicated micro-stores:
  - `authStore`: holds the authenticated operator session, user metadata, and the 33-permission flag dictionary.
  - `otpStore`: manages the OTP challenge state machine, countdown timers, and active topic contexts.

### Rationale & Consequences
- **Minimal Boilerplate**: Zustand stores are under 1kB, require zero Context Providers wrapping the component tree, and allow atomic selector subscriptions to prevent unnecessary component re-renders.
- **Out-of-React Access**: Zustand's `.getState()` can be inspected imperatively inside route guards, interceptors, and non-React utility functions.
- **Cache Correctness**: TanStack Query separates cached network snapshots from UI state, ensuring automatic background re-fetching and eliminating manual cache management bugs.

---

## ADR-003: Dashboard KPIs & Telemetry Activity Feed Stubbing

**Status:** Accepted  
**Date:** Feature Sprint 1

### Context
The operations dashboard requires high-density executive metrics (Total Users, Active Dealers, Active Plans, Configured Commissions, Pending Approvals) and an audit trail of recent administrative actions.

### Finding
Auditing `SCM_APIs.postman_collection.json` revealed that the backend currently exposes transactional and CRUD endpoints, but lacks aggregated telemetry routes (e.g. `GET /scm-db-api/dashboard/summary`) or audit trail log endpoints.

### Decision
- Created `src/api/dashboard.api.ts` with typed TanStack Query service methods (`getKpis`, `getRecentActivities`).
- Stubbed with representative production data structures and marked clearly with `TODO: replace with real endpoint once provisioned by backend`.
- Added an explicit, visible limitation disclosure note in the UI and README.

### Rationale & Consequences
- Decouples UI development from backend deployment timelines.
- Ensures all TanStack Query reactivity, loading skeletons, error boundaries, and refresh mechanisms are fully implemented and testable today, ready for instant drop-in when backend aggregate endpoints land.

---

## ADR-004: Typography System — Self-Hosted Manrope & Inter

**Status:** Accepted  
**Date:** Design Foundation

### Context
Telecom administrative operations handle dense numerical data, currency values, phone numbers, and complex tabular matrices. Generic system fonts or arbitrary third-party web font CDNs introduce external network failure risks, layout shifts, and inconsistent font metrics.

### Decision
- Installed `@fontsource/manrope` (weights 500, 600, 700, 800) for structural headings and `@fontsource/inter` (weights 400, 500, 600, 700) for body, form fields, and telemetry metrics.
- Configured Tailwind CSS v4 `@theme` with `--font-heading: 'Manrope'` and `--font-sans: 'Inter'`.
- Applied `font-family: var(--font-sans)` globally to `body` and eliminated arbitrary `font-mono` usages from data tables and telemetry cards to ensure a clean, cohesive editorial aesthetic.

### Rationale & Consequences
- Self-hosting via `@fontsource` packages eliminates third-party CDN requests (preventing render-blocking and privacy issues).
- Guarantees identical font rendering and bounding box metrics across local development, automated headless test environments (Vitest/jsdom/Playwright), and production deployments.

---

## ADR-005: Network Operations Console (NOC) UI Archetype & Restrained Motion

**Status:** Accepted  
**Date:** Design System Refinement

### Context
Initial prototypes exhibited generic marketing SaaS tropes (oversized rounded cards, pastel icon backgrounds on every statistic, bouncing button animations, and playful hover effects). In mission-critical telecom tooling, visual noise, unnecessary motion, and low information density hinder operator efficiency and situational awareness.

### Decision
- **High-Density NOC Archetype**:
  - Replaced repetitive card grids with structured operational hierarchy: an urgent Pending Actions hero indicator, a consolidated telemetry strip with hairline dividers (`divide-x divide-slate-100`), and clean secondary catalog bars.
  - Standardized on concise sentence-case typography, crisp 1px borders (`border-slate-200`), and accessible color accents (emerald for active/connected, amber for pending/warnings, rose for destructive/errors).
- **Restrained Motion**:
  - Standardized interactive transitions on `duration-150 ease-out` (150ms).
  - Strictly reserved hover styles for interactive elements (NavLinks, buttons, clickable table rows); static telemetry cards and status badges remain inert on hover.
  - Eliminated playful `active:translate-y-px` button bounces in favor of crisp, functional color shade transitions (`transition-colors`).

### Rationale & Consequences
- Delivers the gravitas, clarity, and information density expected in telecom Network Operations Centers (similar to Grafana and Datadog).
- Reinforces the mental model that hover implies actionability.

---

## ADR-006: Navigation & Console Shell Architecture (Header Telemetry & Categorized Sidebar)

**Status:** Accepted  
**Date:** UI Shell Refinement (Consolidated from Header/Sidebar Iterations)

### Context
The application shell required intuitive navigation across expanding telecom domains while maintaining situational awareness of API connectivity, system status, and active authentication operations without excessive visual clutter.

### Decision
- **Categorized Information Architecture**:
  - Grouped navigation into three structured sections with sentence-case headers: **Operations** (Dashboard, Pending Actions), **Management** (Users, Dealers, Commissions), and **Configuration** (Plans & Numbers, System Registry).
  - Compacted the sidebar width to `w-52` (208px) with `px-2.5 py-1.5` row density to maximize main content workspace.
  - Automatically hides section headers if all child routes are inaccessible under the user's active permissions.
- **Consolidated Header Telemetry**:
  - Unified fragmented connection status badges into a single compact indicator: `API Connected • scm-db-primary` with an emerald status dot.
  - Replaced false breadcrumbs with clear page-level headers.
- **Dynamic System Status Panel**:
  - Sidebar dynamically displays live `Pending actions` count queried via TanStack Query.
  - An active OTP Verification Session card is rendered **only** when `otpStore.status !== 'idle'`, providing ambient awareness during sensitive multi-step administrative workflows without visual pollution during normal operation.

### Rationale & Consequences
- Maximizes screen real estate for data-heavy administrative tables and forms.
- Replaces static decorative pills with live, actionable system telemetry.

---

## ADR-007: Development-Only Mock Authentication Bootstrap

**Status:** Accepted  
**Date:** Security & Developer Experience

### Context
The portal enforces granular permission guards across all operational views, but a live OAuth/SSO login service was not available during feature construction. Developers and reviewers require immediate access to all views without manual session injection.

### Decision
- Implemented `src/app/mockAuth.ts` defining a sample system administrator (`admin_dev`, `System Administrator`) granted all 33 permission flags (`= 1`).
- Initialized via `bootstrapDevAuth()` in `src/main.tsx`, strictly conditioned on `if (import.meta.env.DEV)` and `!useAuthStore.getState().user`.
- Does not overwrite custom or existing authenticated sessions.
- In production builds (`npm run build`), `import.meta.env.DEV` statically evaluates to `false`, causing the bootstrap code to be completely tree-shaken and eliminated by the bundler.

### Rationale & Consequences
- Enables friction-free local development of permission-gated features.
- Zero risk of mock credentials leaking into production production bundles.

---

## ADR-008: Core Reusable Component Library (DataTable, SearchToolbar, FormSection, LoadingState)

**Status:** Accepted  
**Date:** Component Architecture

### Context
Multiple functional domains (Users, Dealers, Commissions, Plans, Number Series, MNP) share common operational patterns: tabular search/filter strips, paginated grids, long multi-field forms, and asynchronous loading states. Implementing these ad-hoc across features would lead to code duplication, divergent styling, and inconsistent debouncing behavior.

### Decision
Built a standardized foundational component set in `src/components/`:
1. **`DataTable<T>`** (`src/components/tables/DataTable.tsx`): Polymorphic generic table supporting custom column cell renderers, sorting indicators, empty state illustrations, and an integrated error state with a 1-click **"Try Again"** retry handler calling `refetch()`.
2. **`SearchToolbar`** (`src/components/tables/SearchToolbar.tsx`): Debounced search strip with a 300ms timer, hotkey listeners (Enter to commit, Escape to clear), dedicated Reset button, and an open `children` slot for domain-specific dropdown filters.
3. **`FormSection`** (`src/components/forms/FormSection.tsx`): Semantic card container grouping complex form fields into logical sections with Manrope typography, optional action slot, and consistent spacing.
4. **`LoadingState`** (`src/components/feedback/LoadingState.tsx`): Accessible (`role="status"`, `aria-live="polite"`) centered spinner with customizable operational messages and size variants.
5. **`ConfirmationDialog`** (`src/components/feedback/ConfirmationDialog.tsx`): Two-step verification dialog supporting destructive styling (`destructive={true}`) for permanent operations (deletions, MPIN resets).

### Rationale & Consequences
- Enforces uniform accessibility, debouncing, and styling patterns across all feature modules.
- Dramatically accelerates the creation of new management views.

---

## ADR-009: User Management Architecture & Cascading Geographic Topology

**Status:** Accepted  
**Date:** Feature Sprint 2

### Context
User administration requires capturing credentials, personal identity, and geographic jurisdiction across a three-tier hierarchy (Zone &rarr; Circle &rarr; Secondary Switching Area / SSA). Adding or modifying an operator is a high-privilege administrative action granting access to telecommunication infrastructure.

### Decision
- **Schema & Validation (`src/schemas/user.schema.ts`)**: Built with React Hook Form + Zod enforcing strict validation (Indian 10-digit mobile `^[6-9]\d{9}$`, age verification >= 18 years, high-entropy password).
- **Cascading Geography**: Implemented `ZoneSelector`, `CircleSelector`, and `SSASelector`. Selecting a parent Zone dynamically resets child Circle/SSA fields and triggers TanStack Query to fetch child circles via `/scm-db-api/masterdata-db-api/circlesByZone`.
- **Granular 33-Permission Bitmask Matrix**: Grouped all 33 permission keys from the Postman collection into 6 operational categories with bulk quick-actions ("Grant All", "Clear All", "Select Category").
- **OTP Verification & Directory**:
  - Provisioning an account validates locally, triggers `OTPVerificationModal` with topic `Usercreation`, and executes `createUser` only upon verified OTP token.
  - `UserDetailPage` provides independent OTP-gated actions for editing profile (`Modifyuseredit`), updating status (`Modifyuserstatus`), and modifying permission bitmasks (`Modifyuserpermission`).
  - `UserListPage` wraps the directory under `<PermissionGuard permission="userPermissions">` and synchronizes search/filter states to URL search parameters.

### Rationale & Consequences
- Completely eliminates unverified operator account provisioning.
- Deep-linking support via URL search parameters improves administrative workflow productivity.

---

## ADR-010: Commission Configuration & Search Directory with Multi-Tab Line UI

**Status:** Accepted  
**Date:** Feature Sprint 3

### Context
Commission management governs financial payout formulas, TDS withholdings, and distributor tiers across three distinct telecom business lines: Prepaid (FRC & OTF), Postpaid, and Landline. Write operations in each line represent high-risk financial configurations requiring distinct audit trails and separate OTP topics.

### Decision
- **Multi-Tab Line UI**:
  - Implemented modern line-bar tab styling (`TabsList variant="line"` and active indicator underline) across configuration and search interfaces.
  - Divided configuration into Prepaid FRC/OTF, Postpaid, and Landline tabs.
- **Dedicated Topic-per-Action OTP Security**:
  - Prepaid FRC &rarr; `topic: 'PrepaidFrc'` &rarr; `saveCommissionConfig`
  - Prepaid OTF &rarr; `topic: 'PrepaidOtf'` &rarr; `saveMultipleCommissionConfig`
  - Postpaid &rarr; `topic: 'Postpaid'` &rarr; `postpaidCommissionConfig`
  - Landline &rarr; `topic: 'Landline'` &rarr; `landlineCommissionConfig`
  - Modification &rarr; `Modify_PrepaidFRC`, `Modify_PrepaidOTF`, `Modify_Postpaid`, `Modify_Landline`
  - Deletion &rarr; Safe two-step `ConfirmationDialog` with destructive styling.
- **Franchise Balance Approvals (`FranchiseAddBalancePage.tsx`)**:
  - Dual-topic protection: `FranchiseAddbalanceApprove` for approving balance additions and `FranchiseAddbalanceReject` for declining requests.
- **Permission Guard**: All commission views are secured behind `<PermissionGuard permission="commissionPermissions">`.

### Rationale & Consequences
- Prevents misconfiguration across distinct financial business lines.
- Enforces cryptographic accountability on every financial balance and commission change.

---

## ADR-011: Dealer Management — Multipart/FormData Onboarding & 5-Topic OTP Governance

**Status:** Accepted  
**Date:** Feature Sprint 4

### Context
Channel partner dealers (Franchises, Sub-Franchises, Retailers) require onboarding with KYC identification documents, hierarchy tracking (`srcMsisdn` &rarr; `destMsisdn`), credential resets, and lifecycle status changes.

### Finding
The backend `POST /scm-dealer-api/dealerManagement/createDealer` route does not accept JSON. It strictly requires `multipart/form-data` containing:
1. A `'dealer'` field containing the serialized JSON string blob of metadata.
2. A `'certificate'` field containing the binary KYC certificate file.

### Decision
- **Multipart HTTP Support**: Updated `src/api/client.ts` to detect `options?.body instanceof FormData`. When true, it omits the default `'Content-Type': 'application/json'` header, allowing the browser to set `multipart/form-data; boundary=...`.
- **Multipart Onboarding (`CreateDealerForm.tsx`)**: Accepts PDF/image uploads up to 5MB, serializes metadata to the `'dealer'` blob, and gates submission behind `topic: 'Dealercreation'`.
- **Dedicated OTP Topic Matrix**:
  - Onboard Dealer: `topic: 'Dealercreation'`
  - Edit Profile: `topic: 'Modifydealer'`
  - Status Change: `topic: 'DealerStatus'` (with `ConfirmationDialog`)
  - Reset MPIN: `topic: 'DealerMpinreset'` (with destructive confirmation warning)
  - Hierarchy Change: `topic: 'DealerHierarchyChange'`
- **Permission Guard**: Secured under `<PermissionGuard permission="dealerPermissions">`.

### Rationale & Consequences
- Conforms precisely to legacy backend multipart contract requirements without disrupting standard JSON endpoints.
- Prevents unauthorized partner status changes, hierarchy re-assignments, or credential resets.

---

## ADR-012: Product Plans, Denominations, MNP Routing, and Number Series Architecture

**Status:** Accepted  
**Date:** Feature Sprint 5

### Context
Commercial catalog offerings, prepaid recharge denominations, Mobile Number Portability (MNP) routing tables, and Intelligent Network (IN) subscriber number series ranges are tightly related telecom network configuration domains. Each manages live network provisioning rules and requires strict OTP governance with exact topic strings matching legacy gateway specifications.

### Decision
- **Shared Sub-Navigation (`PlansNavigation.tsx`)**:
  - Implemented an accessible line-bar navigation bar linking `/plans`, `/plans/denominations`, `/plans/mnp`, and `/plans/number-series` with active blue indicator bars (`#2563EB`).
- **Exact OTP Topics per Backend Contract**:
  - Add Plan: `topic: 'Addplan'`
  - Modify Plan: `topic: 'ModifyPlan'`
  - Save Denomination: `topic: 'Denominationconfiguration'`
  - Add MNP: `topic: 'ADD MNP'` (exact uppercase with space matching Postman collection)
  - Modify MNP: `topic: 'ModifyMnp'`
  - Delete MNP: `topic: 'DeleteMnp'` (with `ConfirmationDialog`)
  - Add Number Series: `topic: 'AddnumberSeries'`
  - Edit Number Series: `topic: 'ModfifynumberSeries'` (exact Postman collection spelling with 'f')
  - Purge Number Series: `topic: 'DeleteNumberseries'` (with `ConfirmationDialog`)
- **Permission Guard**: All four views are secured behind `<PermissionGuard permission="plansNumberpermissions">`.

### Rationale & Consequences
- Unifies four related telecom network configuration domains under an ergonomic tabbed workspace.
- Guarantees complete adherence to backend contract quirks (such as legacy typos in topic names) without breaking operational workflows.