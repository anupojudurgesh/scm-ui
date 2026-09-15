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

