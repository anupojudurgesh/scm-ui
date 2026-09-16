# Telecom SCM Web Portal

Enterprise-grade Single-Page Application (SPA) for Telecom Supply Chain Management (SCM), providing unified administration across user provisioning, channel dealer onboarding & hierarchies, multi-tier commission structures, product tariff catalogs, Mobile Number Portability (MNP) routing, subscriber number series ranges, and franchise balance approvals.

Built for high-density Network Operations Console (NOC) environments with strict cryptographic two-factor OTP authorization on all administrative mutations.

---

## Key Highlights & Architecture

- **Architecture**: 4-tier layered architecture (UI Presentation Layer &rarr; Hook Layer &rarr; Service / API Layer &rarr; HTTP Client Layer).
- **Security & Authorization**: Dynamic RBAC driven by a 33-permission bitmask dictionary, guarded via declarative `<PermissionGuard>` components.
- **Cryptographic 2FA**: Universal OTP state machine (`useOtpFlow`) enforcing mobile number SMS verification (`operation: 10069`) across 20+ distinct operational topics before executing backend state changes.
- **Design System**: High-density NOC console archetype using self-hosted `@fontsource/manrope` (headings) and `@fontsource/inter` (body & telemetry), Tailwind CSS v4, Base UI primitives, and line-bar tab navigation.
- **State Management**: TanStack Query v5 for server-side cache synchronization, deduplication, and invalidation; Zustand v5 for lightweight, atomic client-side session and modal state.

For detailed technical specifications, refer to [docs/architecture.md](docs/architecture.md) and [docs/decisions.md](docs/decisions.md).

---

## Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables and custom design tokens
- **Component Primitives**: [@base-ui/react](https://base-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: Self-hosted [@fontsource/manrope](https://fontsource.org/fonts/manrope) & [@fontsource/inter](https://fontsource.org/fonts/inter)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Server State**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Client State**: [Zustand v5](https://zustand-demo.pmnd.rs/)
- **Unit & Component Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [jsdom](https://github.com/jsdom/jsdom)
- **End-to-End Testing**: [Playwright](https://playwright.dev/)

---

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [npm](https://www.npmjs.com/) (v10 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/example/scm-ui.git
cd scm-ui
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to create your local `.env.local` file:
```bash
cp .env.example .env.local
```

Configure `VITE_API_BASE_URL` to point to your SCM API Gateway instance:
```env
# .env.local
VITE_API_BASE_URL=https://ui.example.com
```

> **Note**: The frontend communicates with a single API host hosting all path-prefixed microservice domains (`/scm-auth-api/`, `/scm-dealer-api/`, `/scm-plans-api/`, `/scm-db-api/`, `/scm-wallet-api/`, `/scm-report-api/`).

---

## Development Server

To launch the local Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

The portal will be accessible at:
```
http://localhost:5173
```

> In local development mode (`import.meta.env.DEV`), a mock administrator session (`admin_dev` with all 33 permissions enabled) is automatically bootstrapped. This logic is strictly stripped from production builds.

---

## Testing

### Automated Unit & Component Tests
Run the complete Vitest test suite (28 test suites, 174 tests covering Zod schemas, Zustand stores, UI components, cascading selectors, and OTP mutation workflows):
```bash
npm test
```

To run tests in interactive watch mode during development:
```bash
npm run test:watch
```

### End-to-End (E2E) Tests
Run the Playwright end-to-end browser test suite:
```bash
npm run test:e2e
```

---

## Production Build

To compile TypeScript types and build optimized production assets:
```bash
npm run build
```

To preview the built production bundle locally:
```bash
npm run preview
```

The compiled output will be generated in the `dist/` directory, ready for containerization (e.g. Nginx, Docker) or CDN hosting.

---

## AI Tools Used

- **Google Antigravity**: Utilized as the primary agentic AI pair programming assistant for architectural design, schema drafting, full-stack component generation, unit test creation, and multi-file refactoring.
- **Why**: Antigravity was selected due to its **free tier access**, advanced multi-file autonomous execution, native tool integration for terminal/browser validation, and deep contextual reasoning across large legacy API contracts (such as the 97KB Postman collection).

---

## Known Limitations & Assumptions

1. **Dashboard KPIs & Recent Activity Feed**:
   - The Postman collection (`SCM_APIs.postman_collection.json`) currently exposes individual transactional and CRUD routes, but lacks aggregated operational telemetry endpoints (e.g., `GET /scm-db-api/dashboard/summary` or audit trail logs).
   - The metrics and activity feed in `src/api/dashboard.api.ts` are populated with representative mock data structures using TanStack Query, clearly marked with `TODO: Replace with backend aggregate endpoint` and accompanied by a visible limitation indicator in the UI.
2. **User & Dealer Paginated Directory Endpoints**:
   - The backend contract includes specific user and dealer lookups (e.g. `getUserwithHrmsIdandUsername`, `fetchDealer` by MSISDN) rather than dedicated server-side paginated listing routes (`/users`, `/dealers`).
   - The directory views (`UserListPage`, `DealerListPage`) currently query in-memory collections with full client-side filtering, searching, and pagination, structured for seamless replacement once server-side pagination endpoints are deployed.
3. **OTP E2E Testing Strategy**:
   - Production OTP generation sends one-time SMS verification codes to live telecom mobile numbers.
   - For automated test pipelines (Vitest and Playwright), OTP verification is tested through mocked API handlers (simulating code `123456` or resolved promises) to verify that UI mutations are strictly prevented prior to verification without depending on physical SMS delivery.
4. **Scope & Future Modules**:
   - The core operational domains—Users, Dealers, Commissions (Prepaid FRC/OTF, Postpaid, Landline), Franchise Add Balance, Product Plans, Denominations, MNP Routing, and Number Series—are fully implemented, typed, and tested.
   - Advanced enterprise reporting and export feeds (`/scm-report-api/`) remain scheduled for a subsequent integration milestone once data warehouse schemas are finalized.
