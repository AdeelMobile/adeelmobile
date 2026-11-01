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
| 2 | Real login, logout, session restore, password reset | IN PROGRESS on isolated branch `phase-2-auth`; user has not completed live credential/session tests; NOT PASS / NOT FROZEN |
| 3 | Admin/user roles and protected routes | IN PROGRESS on isolated branch `phase-3-roles`; planning and read-only security audit committed; implementation and approvals pending |
| 4 | Working admin dashboard and summary data | Locked |
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

### Phase 1 — Foundation site (current)
Already in GitHub: project structure, root entry, safe login-preview page (no credential fields), admin HTML pages, design tokens, shared CSS/UI helpers, dashboard drawer/navigation, QA documents. The preview intentionally does not request credentials; secure authentication belongs to Phase 2.
**Live test:** Open staging URL on Android and desktop. Check root, login and built admin pages; test available links, mobile drawer, refresh/back, scrolling, portrait/wide layouts and horizontal overflow. Unbuilt destinations must be clearly labelled unavailable.
**Security gate:** Chrome reported a Google Safe Browsing phishing warning on the production `pages.dev` domain. The preview credential fields and unused handler have been removed. Do not ask visitors to bypass the warning. Confirm the new deployment, recheck Google Safe Browsing, and request Google's review if still flagged. **Current evidence:** User tested the new `adeelmobile-admin.pages.dev` root, dashboard, create-user and all-users routes on Android. All displayed the safe preview; vertical scrolling worked; no horizontal overflow; text was readable (font-size preference deferred to final UI Control Panel). The older `adeelmobile-installments.pages.dev` Search Console review is still pending. **Gate:** Phase 1 remains BLOCKED / NOT PASS / NOT FROZEN until Google resolves the old domain's warning.

### Phase 2 — Authentication
Initial code foundation is in progress on isolated branch `phase-2-auth`. Existing database inspection found `public.users.login_username` and `public.users.auth_user_id`; no schema/data changes have been made. The existing login convention maps a username to `username@adeelmobile.app`. The agreed account-password policy is minimum 8 characters for new/reset passwords; existing users are not blocked client-side. The synthetic email alias is not a deliverable email address, so the password recovery channel still needs a safe agreed design (admin-assisted reset is the known workflow concept). Login UI and session helpers are committed, but user live tests and recovery are still pending. Phase 2 remains IN PROGRESS / NOT PASS / NOT FROZEN.
**Live test:** Valid test login, wrong-password rejection, session after refresh, logout, password reset completion on Android and desktop. Must use real Supabase Auth, not a mock. Confirm configuration first; frontend only gets public anon/publishable key.

### Phase 3 — Roles and protection
**Live test:** Test admin and standard accounts; verify permitted menus/actions; paste restricted URL; attempt unauthorized data access; verify backend denies it. Isolated branch `phase-3-roles` starts from Phase 2 branch commit `f64f5c71865c85307b4b82d98f8186a7b9d74495`. Read-only audit found no explicit role column and found `private.is_admin()` currently treats an authenticated identity with no matching `public.users` row as Admin; this must be replaced with an explicit trusted Admin allow-list before authorization is accepted. Broad public policies on `verifications` and `user_brand_incentives`, plus RLS gaps on `colors` and `download_history`, also require review. No Supabase changes have been applied. See `docs/PHASE_3_ROLES_PLAN.md`. Any RLS/schema/function/grant change requires separate approval.

### Phase 4 — Admin dashboard
**Live test:** Admin opens dashboard; summary cards match known test values; refresh, empty/error states and navigation work; standard user is blocked.

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
GitHub is source of truth. Staging is not production. Ask before Cloudflare/domain setup or deployment unless already authorized. No production release without approval. No Supabase schema/data/Storage/RLS changes or migrations without separate approval. If a future phase appears to need a frozen file, stop and design a new module/interface rather than editing it.
