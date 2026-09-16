# SCM Portal Architecture Documentation

This document describes the architectural principles, data flow, component hierarchies, state management boundaries, security model, and testing strategies governing the Telecom Supply Chain Management (SCM) Web Portal.

---

## 1. Component Architecture

The application adopts a strict 4-tier layered architecture enforcing unidirectional data flow and clean separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│               UI Presentation Layer                    │
│   (Page Views, Forms, Dialogs, Primitives, Tables)     │
└──────────────────────────┬─────────────────────────────┘
                           │ uses
┌──────────────────────────▼─────────────────────────────┐
│                 Hook Layer (Hooks)                     │
│    (TanStack Query Hooks, useOtpFlow, Custom Hooks)    │
└──────────────────────────┬─────────────────────────────┘
                           │ calls
┌──────────────────────────▼─────────────────────────────┐
│                 Service / API Layer                    │
│    (userApi, dealerApi, commissionApi, planApi, ...)   │
└──────────────────────────┬─────────────────────────────┘
                           │ executes
┌──────────────────────────▼─────────────────────────────┐
│                 HTTP Client Layer                      │
│      (apiClient with JSON & Multipart FormData)        │
└────────────────────────────────────────────────────────┘
```

### Layer Responsibilities
1. **UI Presentation Layer (`src/features/*`, `src/components/*`)**:
   - Consumes domain models and view-model states.
   - Contains zero direct network fetches (`fetch`, `axios`).
   - Uses declarative event handlers to invoke hook mutations and queries.
2. **Hook Layer (`src/api/*.api.ts`, `src/hooks/*`)**:
   - Encapsulates TanStack Query hooks (`useQuery`, `useMutation`).
   - Manages query keys, cache invalidation, and background synchronization.
   - Encapsulates reactive UI state machines (e.g., `useOtpFlow`).
3. **Service / API Layer (`src/api/*`)**:
   - Pure TypeScript async functions mapping directly to backend endpoints.
   - Performs URL serialization, query parameter formatting, and request payload validation.
4. **HTTP Client Layer (`src/api/client.ts`)**:
   - Centralized `fetch` wrapper handling base URL resolution, HTTP error status code translation, and content-type negotiation (JSON vs. Multipart `FormData`).

### Core Reusable Component Library

| Component | Location | Responsibility & Design Characteristics |
|---|---|---|
| **`DataTable`** | `src/components/tables/DataTable.tsx` | Polymorphic generic table (`DataTable<T>`) supporting custom column cells, server/client pagination, sorting indicators, empty state illustrations, and integrated error retries. |
| **`SearchToolbar`** | `src/components/tables/SearchToolbar.tsx` | Search filter strip with 300ms debounced text input, custom filter slot (`children`), and dynamic Clear/Reset filters button. |
| **`FormSection`** | `src/components/forms/FormSection.tsx` | Section container grouping long forms into logical cards with title, description, and optional header action slot. |
| **`LoadingState`** | `src/components/feedback/LoadingState.tsx` | Centered loading spinner with custom operational message for standalone containers. |
| **`StatusBadge`** | `src/components/feedback/StatusBadge.tsx` | Normalized status indicator supporting telecom statuses (`Active`, `Inactive`, `Pending`, `Blocked`, `Ported In`, etc.) with accessible WCAG color contrasts. |
| **`ConfirmationDialog`** | `src/components/feedback/ConfirmationDialog.tsx` | Modal dialog for dangerous or two-step actions supporting destructive action styling (`destructive={true}`). |
| **`OTPVerificationModal`** | `src/components/forms/OTPVerificationModal.tsx` | Universal modal dialog capturing 6-digit OTP codes with countdown timer, resend throttle, and topic context display. |
| **`ZoneSelector`** | `src/components/forms/ZoneSelector.tsx` | Master data dropdown querying zones from `/scm-db-api/masterdata-db-api/zones`. |
| **`CircleSelector`** | `src/components/forms/CircleSelector.tsx` | Dependent dropdown cascading from a selected `zoneId` via `/scm-db-api/masterdata-db-api/circlesByZone`. |
| **`SSASelector`** | `src/components/forms/SSASelector.tsx` | Dependent Secondary Switching Area dropdown cascading from a selected `circleId`. |
| **`Tabs` Primitives** | `src/components/ui/tabs.tsx` | Accessible line-bar and pill tab navigation built on `@base-ui/react/tabs` with active indicator underline. |

---

## 2. API Architecture

The frontend communicates with a unified API gateway hosting six path-prefixed backend domains under a single host (configured via `VITE_API_BASE_URL`):

```
                       ┌──────────────────────────────────────────────┐
                       │             SCM API Gateway                  │
                       │           (VITE_API_BASE_URL)                │
                       └──────────────────────┬───────────────────────┘
                                              │
     ┌──────────────────┬─────────────────────┼─────────────────────┬──────────────────┐
     ▼                  ▼                     ▼                     ▼                  ▼
/scm-auth-api/     /scm-dealer-api/     /scm-plans-api/       /scm-db-api/       /scm-wallet-api/
 Authentication     Dealer Network        Tariff Plans &       Master Data &       Balance Moves &
 & User Provision   & Hierarchy           Commissions          MNP Records         Transactions
```

### Confirmed Domains & Path Prefixes

1. **Authentication & User Management (`/scm-auth-api/`)**:
   - `POST /usercreation`: Provision new telecom operator and supervisor users.
   - `POST /fetchUser`: Retrieve user profile by username.
   - `POST /fetchUserWithHrmsAndUsername`: Lookup by HRMS ID and username.
   - `POST /modifyUser`: Update user personal and location details.
   - `POST /modifyPermissions`: Update administrative permission bitmasks.
   - `POST /modifyUserStatus`: Transition user account lifecycle (Active / Inactive).
2. **Dealer Management (`/scm-dealer-api/dealerManagement/`)**:
   - `POST /createDealer`: Multipart `FormData` onboarding attaching JSON metadata and verification certificate file.
   - `GET /fetchDealer`: Single dealer lookup by mobile number (`msisdn`).
   - `GET /fetchDealerData`: Comprehensive KYC and transaction history.
   - `POST /modifyDealer`: Update KYC and contact parameters.
   - `GET /dealerStatusCheck`: Verify dealer status.
   - `POST /dealerStatusChange`: Activate, suspend, or terminate channel partner accounts.
   - `POST /resetMpin`: Issue new mobile personal identification numbers.
   - `POST /changeDealerHierarchy`: Reassign distribution tree nodes (`srcMsisdn` -> `destMsisdn`).
3. **Product Plans & Commissions (`/scm-plans-api/scm-product-api/`)**:
   - `POST /getplans`: Fetch commercial product catalog.
   - `POST /addplan`: Create new tariff voucher offering.
   - `PUT /updateplan/:sno`: Update existing product offering.
   - `DELETE /deleteplan/:sno`: Remove tariff voucher.
   - `POST /saveCommissionConfig`: Create Prepaid First Recharge Coupon (FRC) slab.
   - `POST /saveMultipleCommissionConfig`: Configure Prepaid Over-The-Air (OTF) zone slabs.
   - `POST /postpaidCommissionConfig`: Configure postpaid commission rates and TDS.
   - `POST /landlineCommissionConfig`: Configure wireline commission slabs.
   - `POST /saveDenomination`: Save denomination vouchers and bucket settings.
4. **Master Data & Database Registry (`/scm-db-api/masterdata-db-api/`)**:
   - `/zones`, `/circlesByZone`, `/ssasByCircle`: Geographic telecom topology hierarchy.
   - `/category`: Dealer trade categories and commission groups.
   - `/findMnpData`, `/savemnp`, `/modifyMnpData`, `/deleteMnp`: Mobile Number Portability porting routing rules.
   - `/getnumberseries`, `/addnumberseries`, `/saveNumberSeries`, `/editnumberseries`, `/purgenumberseries`: Intelligent Network (IN) subscriber number series ranges.
5. **Wallet & Financial Transfers (`/scm-wallet-api/`)**:
   - `/franchiseAddBalance/getTransactions`: Retrieve pending distributor replenishment requests.
   - `/franchiseAddBalance/approve`: Execute distributor wallet balance additions.
   - `/franchiseAddBalance/reject`: Reject balance replenishment requests.
6. **Reporting & Telemetry (`/scm-report-api/`)**:
   - Master data transaction logs, daily reconciliation reports, and audit feeds.

---

## 3. State Management

The application separates state into **Server State** (cache of backend records) and **Client State** (transient session, auth, and UI interaction states):

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│            Server State              │     │             Client State             │
│        (TanStack Query v5)           │     │            (Zustand v5)              │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Plan Catalog & Slabs               │     │ • Active User Session & Tokens       │
│ • User Directory & Hierarchy         │     │ • 33 Functional Permissions          │
│ • Geographic Topology (Zones/Circles)│     │ • Modal Visibility States            │
│ • Telemetry KPIs & Activity Logs     │     │ • OTP Flow State Machine             │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

### Architectural Reasoning (From Decisions ADR)
1. **TanStack Query for Server State**:
   - Automatic background deduplication, cache invalidation upon mutation success (`queryClient.invalidateQueries`), and window focus re-fetching.
   - Eliminates complex Redux reducers and manual normalized stores for server records.
2. **Zustand for Client State**:
   - Unopinionated, lightweight store (< 1kB) without React context provider boilerplate.
   - Allows synchronous, imperative store inspection (`useAuthStore.getState()`, `useOtpStore.getState()`) within utility functions, route guards, and outside React components.
   - Enables atomic subscriber hooks preventing unnecessary re-renders across the component tree.

---

## 4. Error Handling Architecture

Error handling is implemented across three coordinated tiers:

```
┌──────────────────────────────────────┐
│       1. Network & HTTP Layer        │
│          apiClient -> ApiError       │
└──────────────────┬───────────────────┘
                   │ propagates
┌──────────────────▼───────────────────┐
│        2. Service & Form Layer       │
│    Zod Validation & Mutation Try/Catch│
└──────────────────┬───────────────────┘
                   │ presents
┌──────────────────▼───────────────────┐
│       3. UI Presentation Layer       │
│  ApiError Alert, Inline Form Errors, │
│      DataTable Error State, Toast    │
└──────────────────────────────────────┘
```

1. **HTTP Normalization (`ApiError`)**:
   - Defined in [client.ts](file:///d:/scm-ui/src/api/client.ts).
   - Captures status code, status text, and response JSON / text payload into a standardized Error subclass.
2. **Form Validation Error Trapping**:
   - React Hook Form + Zod resolvers trap field validation constraints before any network or OTP trigger is initiated.
   - Clear, accessible inline field error labels (`text-rose-600`) directly beneath affected inputs.
3. **Table & Query Error Boundaries**:
   - `DataTable` handles query failure gracefully with an error illustration, informative description, and a 1-click **"Try Again"** retry handler calling `refetch()`.
4. **Toast Feedback**:
   - High-priority transient operational feedback via `@base-ui/react/toast` (`toast.add?.({ title, description, type: 'error' | 'success' })`).

---

## 5. Authentication & Authorization

Authentication and role-based access control (RBAC) are enforced through a combination of Zustand store state and declarative UI gates:

```
                         ┌────────────────────────┐
                         │      User Session      │
                         │     (authStore.ts)     │
                         └───────────┬────────────┘
                                     │ reads
                         ┌───────────▼────────────┐
                         │   33 Permission Flags  │
                         │ (0 = denied, 1 = allow)│
                         └───────────┬────────────┘
                                     │ evaluated by
                         ┌───────────▼────────────┐
                         │   <PermissionGuard>    │
                         └─────┬────────────┬─────┘
                               │            │
             Has Permission    │            │ Lacks Permission
                               ▼            ▼
                     [ Render Feature ]   [ Render Access Restricted ]
```

### Permission Evaluation Matrix
The backend provides a bitmask dictionary of 33 permission flags. The `authStore` normalizes permissions:
```ts
hasPermission: (key: string) => {
  const perm = state.permissions[key];
  return perm === 1 || perm === true || perm === '1';
}
```

### Declarative Route & Feature Protection
All operational pages and sensitive actions are wrapped in the `<PermissionGuard>` component:
```tsx
<PermissionGuard permission="plansNumberpermissions">
  <PlanListPage />
</PermissionGuard>
```
If permission is absent, `<PermissionGuard>` blocks page rendering and displays an **"Access Restricted"** screen indicating the required permission key without leaking sensitive data or actions.

---

## 6. Cryptographic OTP Verification Workflow

All critical state mutations across the platform are protected by two-factor authorization utilizing the `useOtpFlow` finite state machine and the universal telecom gateway operation code (`10069`).

### OTP State Machine Lifecycle
```
[ Idle ] ──► (Action Triggered) ──► [ Requesting OTP (POST /generateOtp) ]
                                                   │
     ┌─────────────────────────────────────────────┘
     ▼
[ OTP Modal Open ] ──► (Submit Code) ──► [ Validating (POST /validateOtp) ]
                                                   │
     ┌─────────────────────────────────────────────┴─────────────────┐
     ▼ (Failure)                                                     ▼ (Success)
[ Error / Retry ]                                            [ Execute Mutation ]
                                                                     │
                                                                     ▼
                                                              [ Idle / Reset ]
```

### Confirmed OTP Topics Matrix

| Operation Category | Action | Exact Topic String | Gateway Operation | Backend Execution Endpoint |
|---|---|---|---|---|
| **Users** | User Creation | `Usercreation` | `10069` | `POST /scm-auth-api/usercreation` |
| **Users** | Edit User Profile | `Modifyuseredit` | `10069` | `POST /scm-auth-api/modifyUser` |
| **Users** | Change User Status | `Modifyuserstatus` | `10069` | `POST /scm-auth-api/modifyUserStatus` |
| **Users** | Modify Permissions | `Modifyuserpermission` | `10069` | `POST /scm-auth-api/modifyPermissions` |
| **Dealers** | Dealer Onboarding | `Dealercreation` | `10069` | `POST /scm-dealer-api/dealerManagement/createDealer` |
| **Dealers** | Edit Dealer Information | `Modifydealer` | `10069` | `POST /scm-dealer-api/dealerManagement/modifyDealer` |
| **Dealers** | Change Dealer Status | `DealerStatus` | `10069` | `POST /scm-dealer-api/dealerManagement/dealerStatusChange` |
| **Dealers** | Reset MPIN | `DealerMpinreset` | `10069` | `POST /scm-dealer-api/dealerManagement/resetMpin` |
| **Dealers** | Change Hierarchy | `DealerHierarchyChange` | `10069` | `POST /scm-dealer-api/dealerManagement/changeDealerHierarchy` |
| **Commissions** | Prepaid FRC Slabs | `PrepaidFrc` | `10069` | `POST /scm-plans-api/scm-product-api/saveCommissionConfig` |
| **Commissions** | Prepaid OTF Slabs | `PrepaidOtf` | `10069` | `POST /scm-plans-api/scm-product-api/saveMultipleCommissionConfig` |
| **Commissions** | Postpaid Slabs | `Postpaid` | `10069` | `POST /scm-plans-api/scm-product-api/postpaidCommissionConfig` |
| **Commissions** | Landline Slabs | `Landline` | `10069` | `POST /scm-plans-api/scm-product-api/landlineCommissionConfig` |
| **Commissions** | Modify Prepaid FRC | `Modify_PrepaidFRC` | `10069` | `POST /scm-plans-api/scm-product-api/updateCommissionConfig` |
| **Commissions** | Modify Prepaid OTF | `Modify_PrepaidOTF` | `10069` | `POST /scm-plans-api/scm-product-api/updateCommissionConfig` |
| **Commissions** | Modify Postpaid | `Modify_Postpaid` | `10069` | `POST /scm-plans-api/scm-product-api/updatePostpaidCommission` |
| **Commissions** | Modify Landline | `Modify_Landline` | `10069` | `POST /scm-plans-api/scm-product-api/updateLandlineCommission` |
| **Commissions** | Approve Franchise Balance | `FranchiseAddbalanceApprove` | `10069` | `POST /scm-wallet-api/franchiseAddBalance/approve` |
| **Commissions** | Reject Franchise Balance | `FranchiseAddbalanceReject` | `10069` | `POST /scm-wallet-api/franchiseAddBalance/reject` |
| **Plans** | Add Product Plan | `Addplan` | `10069` | `POST /scm-plans-api/scm-product-api/addplan` |
| **Plans** | Modify Product Plan | `ModifyPlan` | `10069` | `PUT /scm-plans-api/scm-product-api/updateplan/:sno` |
| **Plans** | Configure Denomination | `Denominationconfiguration` | `10069` | `POST /scm-plans-api/scm-product-api/saveDenomination` |
| **Plans** | Add MNP Routing Rule | `ADD MNP` | `10069` | `POST /scm-db-api/masterdata-db-api/savemnp` |
| **Plans** | Modify MNP Rule | `ModifyMnp` | `10069` | `POST /scm-db-api/masterdata-db-api/modifyMnpData` |
| **Plans** | Delete MNP Rule | `DeleteMnp` | `10069` | `POST /scm-db-api/masterdata-db-api/deleteMnp` |
| **Plans** | Add Number Series | `AddnumberSeries` | `10069` | `POST /scm-db-api/masterdata-db-api/addnumberseries` |
| **Plans** | Modify Number Series | `ModfifynumberSeries` | `10069` | `PUT /scm-db-api/masterdata-db-api/editnumberseries` |
| **Plans** | Purge Number Series | `DeleteNumberseries` | `10069` | `DELETE /scm-db-api/masterdata-db-api/purgenumberseries` |

---

## 7. Testing Strategy

The portal adheres to a pyramid testing structure ensuring fast feedback and comprehensive edge case coverage:

```
                  ┌─────────────────┐
                  │   E2E Tests     │  (Critical path smoke testing)
                  └────────┬────────┘
                           │
             ┌─────────────┴─────────────┐
             │     Integration Tests     │  (OTP flow, multi-step forms)
             └─────────────┬─────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │        Unit & Component Tests       │  (Zod schemas, stores, UI primitives)
        └─────────────────────────────────────┘
```

### Coverage Statistics
- **Total Test Files**: 28 test suites.
- **Total Tests**: 174 automated test cases.
- **Pass Rate**: 100% passing.
- **Testing Tools**: Vitest v5, React Testing Library, jsdom.

### What Is Covered
1. **Zod Validation Schemas**: Field validation, format regex checks (mobile numbers, PAN, GSTIN, Aadhaar), date range logic, positive integer constraints.
2. **State Management**: `authStore` permission checking, login/logout transitions; `otpStore` status transitions, countdown timing, context persistence.
3. **Component Behavior**:
   - `DataTable`: sorting, pagination, empty states, loading skeletons.
   - `SearchToolbar`: 300ms debounce firing, clear button reactivity.
   - `PermissionGuard`: restriction rendering when bitmask flag is `0`.
   - `ConfirmationDialog`: destructive styling, open/close callbacks.
4. **End-to-End OTP Flows**: Mocked API interactions verifying that:
   - Clicking Submit opens `OTPVerificationModal` with the exact required topic.
   - Backend mutations are strictly prevented from executing prior to OTP entry.
   - Verifying valid OTP triggers the corresponding backend API method with correct arguments.

### Known Testing Limitations & Gaps
- **Live Gateway Integration**: Endpoints depend on live telecom SMS gateways for OTP generation. In automated Vitest and local developer runs, mock OTP validation (`123456`) and client-side simulation are utilized.
- **Aggregate Reporting Feeds**: Postman collection lacks dedicated pagination endpoints for `/users/list` and `/dealers/list`; high-volume performance testing will require real aggregate telemetry endpoints once backend services are provisioned.
