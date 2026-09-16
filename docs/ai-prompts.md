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



