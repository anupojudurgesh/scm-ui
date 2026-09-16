<h1 align="center">SCM Web Portal</h1>

<p align="center">
  <strong>Enterprise-grade Telecom Supply Chain Management — built for speed, security, and scale.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React 19" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
  &nbsp;
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square" alt="Vite" />
  &nbsp;
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS" />
  &nbsp;
  <img src="https://img.shields.io/badge/Tests-181_passing-22C55E?style=flat-square" alt="Tests" />
</p>

---

## Overview

The **SCM Web Portal** is a production-ready Single-Page Application designed for telecom operators to manage their entire supply chain from a single, unified interface. It replaces fragmented back-office tooling with a high-density **Network Operations Console (NOC)** that gives administrators, circle managers, and franchise operators a coherent, real-time view of operations.

Every administrative action — from dealer onboarding to commission configuration — is protected by a **cryptographic two-factor OTP gate**, ensuring no backend state change can occur without explicit, SMS-verified user authorization.

---

## Feature Domains

| Domain | What It Covers |
|---|---|
| **Users** | Provision, search, and manage operator users; RBAC via 33-permission bitmask |
| **Dealers** | Full lifecycle — onboarding (with document upload), hierarchy, status, and MPIN control |
| **Commissions** | Configure Prepaid FRC, Prepaid OTF, Postpaid, and Landline commission slabs per circle/category/denomination |
| **Franchise Balance** | Approve or reject franchise top-up requests with a full approval trail |
| **Product Plans** | Add and manage tariff plans with operator, circle, validity, and denomination metadata |
| **Denominations** | Configure denomination slabs per circle and category |
| **MNP Routing** | Configure and maintain Mobile Number Portability routing rules |
| **Number Series** | Manage subscriber number series ranges and purge stale blocks |
| **Dashboard** | Operational KPI snapshot for at-a-glance network health |

---

## Architecture

The application enforces a strict **4-tier layered architecture** — separating concerns cleanly so every layer is independently testable and swappable.

```
┌──────────────────────────────────────────────────────────────────┐
│  UI Layer          React pages, forms, dialogs, data tables      │
│                    (src/features/, src/components/)              │
├──────────────────────────────────────────────────────────────────┤
│  Hook Layer        Custom hooks: data fetching, OTP state        │
│                    machine, permission guards                    │
│                    (src/hooks/, src/stores/)                     │
├──────────────────────────────────────────────────────────────────┤
│  Service Layer     Typed API function wrappers, Zod-parsed       │
│                    responses, FormData construction              │
│                    (src/api/)                                    │
├──────────────────────────────────────────────────────────────────┤
│  HTTP Client       Axios instance with auth interceptors,        │
│                    token injection, and error normalization      │
│                    (src/lib/apiClient.ts)                        │
└──────────────────────────────────────────────────────────────────┘
```

### Security & OTP Workflow

Every mutation is gated by the `useOtpFlow` state machine:

1. User initiates an action (Create, Edit, Delete, Approve, etc.)
2. An OTP is sent to the operator's registered mobile via `operation: 10069`
3. User enters the 6-digit code — the **OTP topic is unique per operation** (e.g., `Dealercreation`, `DealerStatus`, `Modify_Prepaid_FRC`)
4. Only on successful verification is the backend mutation executed

This means even if an attacker bypasses the UI, no state change reaches the backend without verified authorization.

### Authorization

Dynamic RBAC is driven by a **33-permission bitmask dictionary** returned at login. Every restricted UI surface is wrapped in a declarative `<PermissionGuard permission="...">` component — unauthorized users see nothing, not even an error.

### State Management

| Concern | Tool | Reasoning |
|---|---|---|
| **Server state** — API data, loading, caching | TanStack Query v5 | Declarative fetching, background refetch, cache invalidation |
| **Client state** — auth session, OTP modal | Zustand v5 | Minimal, atomic, synchronous — zero boilerplate |

> Full rationale in [docs/decisions.md](docs/decisions.md).

---

## Technology Stack

| Category | Library | Version |
|---|---|---|
| Framework | React | 19 |
| Language | TypeScript | ~6.0 |
| Build Tool | Vite | 8 |
| Styling | Tailwind CSS | 4 |
| Component Primitives | Base UI (`@base-ui/react`) | 1.8 |
| Icons | Lucide React | 1.46 |
| Typography | Manrope (headings) + Inter (body) | via @fontsource |
| Forms & Validation | React Hook Form + Zod | 7 + 4 |
| Server State | TanStack Query | 5 |
| Client State | Zustand | 5 |
| Routing | React Router DOM | 7 |
| Unit/Component Tests | Vitest + React Testing Library + jsdom | 5 + 16 + 29 |
| End-to-End Tests | Playwright | 1.63 |

---

## Getting Started

### Prerequisites

- **Node.js** v20 or higher → [nodejs.org](https://nodejs.org/)
- **npm** v10 or higher (bundled with Node.js)

### 1. Clone

```bash
git clone https://github.com/example/scm-ui.git
cd scm-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and set your API Gateway URL:

```env
# .env.local
VITE_API_BASE_URL=https://your-api-gateway.example.com
```

The frontend communicates with a **single API host** using path-prefixed microservice domains:

| Path Prefix | Domain |
|---|---|
| `/scm-auth-api/` | Authentication & user management |
| `/scm-dealer-api/` | Dealer lifecycle |
| `/scm-plans-api/` | Tariff plans, MNP, number series |
| `/scm-db-api/` | Commission configuration |
| `/scm-wallet-api/` | Franchise balance operations |
| `/scm-report-api/` | Reporting _(scheduled milestone)_ |

---

## Running the App

### Development

```bash
npm run dev
```

Opens at **http://localhost:5173** with Hot Module Replacement.

> **Dev shortcut**: An `admin_dev` session with all 33 permissions is auto-bootstrapped in development so you can explore every screen without a real backend. This code is **entirely stripped** from production builds via `import.meta.env.DEV`.

### Production Build

```bash
# Build
npm run build

# Preview built output locally
npm run preview
```

Output is written to `dist/` — deployable to any static host, Nginx, Docker container, or CDN.

---

## Testing

### Unit & Component Tests

Covers Zod schemas, Zustand stores, UI components, cascading selectors, OTP state flows, and API mutation topic correctness across **181 tests in 28 suites**.

```bash
# Run full suite (CI mode)
npm test

# Interactive watch mode
npm run test:watch
```

### End-to-End Tests

```bash
npm run test:e2e
```

Playwright drives a real Chromium browser against the running application.

> **OTP in CI**: Production OTP delivers real SMS messages to telecom numbers. E2E tests use mocked handlers (resolving to code `123456`) to verify the OTP gate is enforced without requiring a carrier in CI pipelines.

---

## Project Structure

```
scm-ui/
├── src/
│   ├── api/               # Typed API service functions — one file per domain
│   ├── app/               # App shell: router, AppLayout, auth bootstrap
│   ├── components/
│   │   ├── data/          # DataTable, SearchToolbar, pagination
│   │   ├── feedback/      # Loading/error states, OTP dialog, confirmation dialog
│   │   └── ui/            # Design system primitives (Button, Input, Select…)
│   ├── features/
│   │   ├── auth/          # LoginPage, session management
│   │   ├── dashboard/     # KPI cards, animated counters
│   │   ├── users/         # UserListPage, CreateUserForm, UserDetailPage
│   │   ├── dealers/       # DealerListPage, CreateDealerForm, DealerDetailPage
│   │   ├── commissions/   # CommissionSearchPage, FranchiseAddBalancePage
│   │   └── plans/         # PlanListPage, DenominationConfigPage, MnpConfigPage, NumberSeriesPage
│   ├── hooks/             # useOtpFlow, usePermissions, domain-specific data hooks
│   ├── lib/               # apiClient (Axios instance), utilities, cn helper
│   ├── stores/            # authStore, otpStore (Zustand atoms)
│   └── types/             # Shared TypeScript interfaces and domain enums
├── docs/
│   ├── api-mapping.md     # Full endpoint reference from the Postman collection
│   ├── architecture.md    # Architectural deep-dive
│   ├── decisions.md       # Architecture Decision Records (ADRs)
│   └── prompts.md         # Engineering task and AI prompt history
├── e2e/                   # Playwright end-to-end specs
├── .env.example           # Environment variable template
└── vite.config.ts
```

---

## Documentation

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Full architecture: layers, OTP flow, state management, testing strategy |
| [docs/decisions.md](docs/decisions.md) | ADRs — why each major technical choice was made |
| [docs/api-mapping.md](docs/api-mapping.md) | Complete endpoint reference derived from the Postman collection |
| [docs/prompts.md](docs/prompts.md) | Engineering task history and AI prompt log |

---

## Known Limitations

### 1. Dashboard Metrics — Mocked Data
The API collection exposes transactional CRUD routes but no aggregated telemetry endpoints (e.g., a `/dashboard/summary` route). Dashboard KPIs use representative mock structures, clearly marked `TODO: Replace with backend aggregate endpoint` and flagged visually in the UI.

### 2. List Pages — Client-Side Pagination
The backend contract exposes targeted lookups (fetch dealer by MSISDN, user by HR ID) rather than generic paginated listing routes. List pages use client-side filtering and pagination today, structured for drop-in replacement once server-side pagination endpoints are live.

### 3. OTP in Automated Tests — Mocked Verification
Production OTP is SMS-delivered to live telecom numbers. Test suites mock the verification step to enforce OTP gating without requiring a real carrier in CI.

### 4. Reporting Module — Scheduled
All core operational domains are implemented and tested. The `/scm-report-api/` reporting module is a subsequent milestone pending backend data warehouse schema finalization.

---

## AI Tools Used

**[Google Antigravity](https://antigravity.dev)** was the primary agentic AI pair-programming assistant throughout this project.

**Why Antigravity?**

- **Free tier access** made it the practical choice for an AI-accelerated build cycle.
- **Multi-file autonomous execution** — plans, writes, and refactors across dozens of files in a single session without losing architectural context.
- **Native tool integration** — runs terminal commands, validates builds, checks test counts, and inspects the browser in-context, so it verifies its own output rather than just generating text.
- **Deep API reasoning** — parsed and mapped a 97 KB Postman collection (`SCM_APIs.postman_collection.json`) into a structured `docs/api-mapping.md` reference, which became the source of truth for all 6 API domain implementations.

---

<p align="center">Built with React · TypeScript · Vite · Tailwind CSS</p>
