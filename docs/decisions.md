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