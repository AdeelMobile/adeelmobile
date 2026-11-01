# Phase 4 — Admin Dashboard

Status: IMPLEMENTED ON ISOLATED BRANCH — staging/browser/Android QA pending; NOT PASS / NOT FROZEN.

## Scope delivered
- Replaced the protected Admin dashboard placeholder with a responsive dashboard overview.
- Added read-only exact-count summary cards for users, customers, brands, models, variants, orders and verifications.
- Added explicit loading/refresh state, per-card unavailable state, aggregate warning, and last-updated timestamp.
- Kept existing Phase 3 route guard and sign-out integration; dashboard remains Admin-only.
- Kept links to the already existing user-management preview routes. No CRUD behavior is claimed.
- No financial totals, customer PII, identity documents, payment data or profit calculations are displayed.
- No database schema, data, RLS, Auth, Storage or production deployment changes.

## Data contract
Each metric uses Supabase JS `.select("id", { count: "exact", head: true })` against its existing public table. The UI displays an error state rather than reporting a failed query as zero. Counts are subject to the trusted Admin's existing RLS permissions.

## Files
- Added `Adeel-Mobile-Installments/css/admin-dashboard.css`
- Added `Adeel-Mobile-Installments/js/modules/dashboard/admin-dashboard.js`
- Added `Adeel-Mobile-Installments/docs/PHASE_4_ADMIN_DASHBOARD_PLAN.md`
- Updated `Adeel-Mobile-Installments/pages/admin/dashboard/index.html` (integration point; retains Phase 3 guard)
- Updated `Adeel-Mobile-Installments/docs/MASTER_ROADMAP.md`

## Test gates
1. Confirm branch preview deployment and URL.
2. Admin login opens dashboard; all seven metrics return counts matching database test queries.
3. Refresh updates counts and timestamp; temporary network/query failure shows Unavailable + warning, not zero.
4. Verify 320px mobile, tablet and desktop layouts; no horizontal overflow; controls have keyboard focus.
5. Standard User and signed-out visitors cannot see dashboard content or read dashboard metrics.
6. Verify links reach existing safe preview pages and sign-out returns to login.
7. Run browser and Android tests; record exact evidence and user PASS/FAIL.

## Test status
- Static review: implementation reviewed; no browser runtime executed.
- Database inventory: existing target tables and columns confirmed via read-only schema inspection.
- Live browser/Android/API tests: pending.
- Staging deployment: not confirmed.
- User acceptance: pending.
- Phase status: IN PROGRESS / NOT PASS / NOT FROZEN.

## Branch
`phase-4-admin-dashboard`, based on Phase 3 head `5919709baa39d1b394b882bfbd598ab42bd8c2ba`.
