In this project


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

