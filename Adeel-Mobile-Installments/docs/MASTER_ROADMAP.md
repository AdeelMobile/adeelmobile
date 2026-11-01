# Master Roadmap — Locked Live-Testable Phases

## Mandatory workflow
**Build → staging deploy → user tests the working feature → fix issues → PASS → freeze phase → next phase.**

A phase is not complete when code is merely committed. It must be available on a staging URL and its feature must be usable by the user.

## Rules
- Work only inside `Adeel-Mobile-Installments/`. Do not touch the legacy project.
- Each phase delivers a working vertical slice, not disconnected code or placeholder-only screens.
- At phase end, provide staging URL/version, exact steps, expected results, and a QA report. Wait for the user's test result.
- After PASS, freeze all files owned by that phase. Later phases must not edit, rename, delete, or refactor them.
- Add future features in new modules using planned interfaces. Keep a phase-to-file ownership list and check every diff against frozen files.
- If a defect is found in a frozen phase, stop and ask before a narrowly scoped hotfix. Redeploy and repeat that phase's tests after an approved fix.
- Use dummy data and test accounts. Never use real customer ID/payment data in staging.
- Production deployment requires explicit approval. Supabase schema/data/Storage/RLS changes and migrations also require separate approval.
- Never expose service-role keys, store plaintext passwords, trust client-supplied roles, or call mock login secure.
- Report static, staging, browser, Android, and backend tests separately. Never claim a test that was not performed.

## Phase plan and live deliverables

| Phase | Working feature to test live | Status |
|---|---|---|
| 1 | Foundation site: safe entry page, admin shell, navigation, responsive behavior | Android route/scroll checks PASS; Google review pending — BLOCKED / NOT FROZEN |
| 2 | Real login, logout, session restore, password reset | IN PROGRESS — live credential/session tests pending; NOT PASS / NOT FROZEN |
| 3 | Admin/user roles and protected routes | Backend role/RLS simulations pass; preview/browser/Android/API live QA pending — IN PROGRESS / NOT PASS / NOT FROZEN |
| 4 | Working admin dashboard and read-only summary data | IMPLEMENTED on `phase-4-admin-dashboard`; staging/browser/Android QA pending — IN PROGRESS / NOT PASS / NOT FROZEN |
| 5 | User management: list/create/view/edit/search/status | Locked |
| 6 | Customer records and verification review | Locked |
| 7 | Brands, categories, products and catalog management | Locked |
| 8 | Approved installment plans and calculator | Locked; financial rules required |
| 9 | Orders and installment schedules | Locked |
| 10 | Payment entry, receipts and balances | Locked |
| 11 | Wallet and profit ledger | Locked; profit rules required |
| 12 | Referral links and validated attribution | Locked |
| 13 | Customer website and product/inquiry journey | Locked |
| 14 | User portal and private self-service | Locked |
| 15 | Reports, exports, audit logs, manual WhatsApp, settings/content | Locked |
| 16 | Full regression, security/accessibility/performance and release decision | Locked |

## Phase test gates

### Phase 1 — Foundation
Android root/dashboard/create-user/all-users route and scrolling checks were reported by the user as working. The old `adeelmobile-installments.pages.dev` Google Search Console review remains pending. Phase 1 is BLOCKED / NOT PASS / NOT FROZEN until the warning is resolved.

### Phase 2 — Authentication
Real Supabase Auth login, wrong-password rejection, session restore, logout and password recovery remain untested by the user. Existing username alias login and Admin email bridge are implemented on their isolated branches. Phase 2 remains IN PROGRESS / NOT PASS / NOT FROZEN.

### Phase 3 — Roles and protection
Trusted private Admin allow-list, Admin/User/none resolver, protected route guards and reviewed RLS/grant migrations are committed on `phase-3-roles`. Database-side role simulations passed. Real Android/desktop login, direct URL and direct REST/API tests remain pending. Phase 3 remains IN PROGRESS / NOT PASS / NOT FROZEN.

### Phase 4 — Admin dashboard
Implemented on `phase-4-admin-dashboard`. The dashboard reads exact counts from existing `users`, `customers`, `brands`, `models`, `variants`, `orders` and `verifications` tables. It is read-only, has refresh/error/last-updated states, and uses the Phase 3 Admin route guard. No database schema or data was changed. See `docs/PHASE_4_ADMIN_DASHBOARD_PLAN.md`.
**Live test:** Admin opens dashboard; summary cards match known test values; refresh, empty/error states and navigation work; standard user and signed-out visitors are blocked. Preview deployment and browser/Android tests are pending.

### Phase 5 — User management
**Live test:** Create, search, view, edit and change status of a test user; test validation, duplicate handling and refresh persistence.

### Phase 6 — Customers and verification
**Live test:** Create/edit dummy customer; submit and review dummy verification; approve/reject; verify private test document is inaccessible to unauthorized account. No real ID documents.

### Phase 7 — Catalog
**Live test:** Add/edit/archive dummy brand, category and product; test image upload/error, search/filter/sort and mobile catalog.

### Phase 8 — Installment plans
Before coding, confirm plan terms, advance, markup, fees, rounding, due dates, late fees and eligibility. **Live test:** Compare sample calculations to independently agreed expected values; test boundaries, invalid values and dates. Never guess financial formulas.

### Phase 9 — Orders
**Live test:** Create/view test order; check schedule dates and amounts; test approved cancel/change flow, persistence and duplicate prevention.

### Phase 10 — Payments
**Live test:** Record test advance/installment; receipt and balance reconcile; duplicate payment is prevented; permissions and approved correction flow work.

### Phase 11 — Wallet/profit
Confirm formula, qualifying event, reversal and payout rules. No profit before actual qualifying advance receipt. **Live test:** Verify no early credit, correct qualifying entry, reversal handling and reconciled totals.

### Phase 12 — Referrals
**Live test:** Create/copy test link; open separate session; complete test flow; verify referrer; tamper with client values; test duplicate/expired links.

### Phase 13 — Customer website
**Live test:** Complete home/catalog/search/filter/product/inquiry journey on phone and desktop; prices/plans match admin; empty/error states and validation work.

### Phase 14 — User portal
**Live test:** User sees own profile/orders/payments/referrals only; attempt another user's URL/data; verify denial; check totals, mobile navigation and session expiry.

### Phase 15 — Operations
**Live test:** Report totals/filters/exports match test data; activity log shows actor/time/action; WhatsApp opens a prefilled message for manual review/send only; settings/content preview and persist.

### Phase 16 — Final acceptance
**Live test:** Full login-to-order/payment/report workflow; role and private-file checks; Android/desktop accessibility/responsive/performance checks; critical defects closed. PWA/APK decision with user. Do not claim APK unless built and tested. Production only after approval.

## Required phase close-out
Record scope; files created/changed; frozen-file list; commit SHA; staging URL/version; exact steps and expected results; user's PASS/FAIL; separate static/browser/Android/backend evidence; defects and approvals; gate PASS/FAIL/BLOCKED. Next phase stays locked until PASS.

## Safeguards
GitHub is source of truth. Staging is not production. Ask before Cloudflare/domain setup or deployment unless already authorized. No production release without approval. No Supabase schema/data/Storage/RLS changes or migrations without separate approval. If a future phase appears to need a frozen file, stop and design a new module/interface.
