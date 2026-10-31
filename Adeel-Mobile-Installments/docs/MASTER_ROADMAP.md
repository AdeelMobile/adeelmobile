# Adeel Mobile Installments — Locked, Live-Testable Phase Roadmap

## Non-negotiable development rules

1. Work only inside `Adeel-Mobile-Installments/`. Never touch the unrelated legacy project.
2. **One phase = one independently testable, working software increment.** Do not finish a phase with only disconnected code, mock screens, or unfinished dependencies.
3. At the end of EVERY phase, deploy that exact build to the agreed test/staging URL and test the actual feature in a browser and on the user's Android phone before starting the next phase.
4. A phase is not PASS until its live tests pass. GitHub/static checks alone are not enough.
5. **After a phase is accepted as PASS, freeze it.** Do not edit, rename, delete, restyle, or refactor any file belonging to a previously passed phase.
6. Every later phase must be additive: add new files/modules, new routes/pages, or compatible backend objects only. Integrate through extension points/contracts prepared in advance. Do not rewrite a passed phase to make the next phase work.
7. If a new phase appears to require changing a frozen file, STOP. Do not silently change it. First design an additive adapter/extension. If that is genuinely impossible, explain the conflict and ask the user for explicit permission before any exception. The old phase remains frozen by default.
8. If a defect is found in the current phase before PASS, fix it within that current phase and repeat its tests. Do not move the defect into a later phase.
9. Keep a tagged/recorded Git commit for every accepted phase. Deploy and test the exact commit, not uncommitted or later mixed work.
10. Use a dedicated staging/test environment and test data. Never mix test records with real customer/financial records.
11. No production deployment, custom-domain connection, Supabase schema/data/Storage/RLS changes, or paid service activation without the user's explicit approval.
12. Never use fake authentication, plaintext passwords, client-trusted roles, or unapproved financial calculations. Clearly label any temporary mock data as test-only.

## What every phase must deliver

Each phase must include:
- A clearly defined user-visible feature that can be opened and exercised on its own.
- All files and dependencies needed for that feature.
- Loading, empty, validation, success, and error states where relevant.
- A short acceptance checklist written before implementation.
- A staging deployment of the phase's exact commit.
- A live browser test and Android phone test, with the user reporting observations/screenshots where needed.
- A QA report recording pass/fail for every test, defects, fix commits, deployed commit, and test URL.
- A **PASS / FAIL / BLOCKED** decision.

**Gate rule:** PASS = freeze phase and unlock next phase. FAIL = fix only current phase and retest. BLOCKED = do not proceed; identify missing permission, business decision, credentials, or external dependency.

## Phase status

| Phase | Independently testable deliverable | Status |
|---|---|---|
| 1 | Foundation, page loading, responsive shell, navigation and mobile drawer | Static checks passed; live test pending; NOT FROZEN |
| 2 | Real login, logout, session restore and password reset | Locked |
| 3 | Role-based access and protected pages | Locked |
| 4 | Admin dashboard with working summary/data states | Locked |
| 5 | User/customer create, list, search, view and edit | Locked |
| 6 | Identity verification review and private document access | Locked |
| 7 | Product, brand and category management | Locked |
| 8 | Public product catalogue and product detail journey | Locked |
| 9 | Installment plan setup and calculator | Locked — business rules required |
| 10 | Customer order creation and installment schedule | Locked |
| 11 | Payment collection, receipts and due tracking | Locked |
| 12 | Wallet, profit ledger and referral attribution | Locked — business rules required |
| 13 | User portal with personal account and permitted records | Locked |
| 14 | Reports, exports and activity/audit history | Locked |
| 15 | Website content/settings, posters and manual WhatsApp sharing | Locked |
| 16 | Security, accessibility, performance, full regression and release readiness | Locked |

## Phase-by-phase scope and live acceptance tests

### Phase 1 — Foundation and responsive shell
**Deliverable:** Existing entry/login/admin pages load; shared styles and helpers load; navigation and mobile drawer work; layout adapts to phone/tablet/desktop. This phase tests the foundation only, not real authentication or database features.

**Live test:** Open the staging URL on desktop and Android. Visit every implemented page; test navigation, mobile drawer open/close, scrolling, keyboard/Escape where supported, layout widths, and horizontal overflow. Check browser console and network errors.

**Exit:** All implemented pages load and the above interactions work. Record known non-functional placeholders clearly. After PASS, freeze all Phase 1 files.

**Current state:** Static repository checks were completed earlier; live browser/mobile testing is still pending. Phase 1 is NOT yet accepted or frozen.

### Phase 2 — Real authentication
**Deliverable:** Real Supabase Auth login, logout, session persistence/restore, password reset and clear error/loading states. No fake login.

**Live test:** Test valid and invalid credentials, refresh while signed in, logout, expired session, password reset email/link, and direct access after logout. Verify no privileged key or plaintext password is exposed.

**Exit:** All authentication flows work on staging and Android. Supabase configuration/credentials must be supplied safely; service-role key must never enter frontend code. No database schema changes without separate approval.

### Phase 3 — Roles and protected access
**Deliverable:** Admin and user roles with protected navigation and trusted authorization enforcement.

**Live test:** Sign in as each role; verify allowed and denied pages/actions; paste restricted URLs directly; attempt unauthorized data access. Hiding a button alone does not count as security.

**Exit:** UI and backend/data authorization tests pass. Role assignment source and any required RLS/schema changes must be approved first.

### Phase 4 — Working admin dashboard
**Deliverable:** Admin landing dashboard with real approved data or explicitly labelled test data, functional navigation, loading/empty/error states.

**Live test:** Sign in as admin; inspect cards, totals, navigation, empty state, error state, refresh and phone layout. Totals must reconcile with the test data source.

### Phase 5 — User/customer management
**Deliverable:** Create, list, search, view and edit user/customer records, with validation and status display.

**Live test:** Create a test record; search it; open and edit it; test required fields, invalid values, duplicate handling and refresh persistence. Confirm a regular user cannot access admin-only operations.

### Phase 6 — Identity verification
**Deliverable:** Submit/view verification status and admin review workflow, including private document upload/view where approved.

**Live test:** Submit test verification; review/approve/reject as admin; verify status changes; test unauthorized document access and file restrictions. Use synthetic test documents only.

### Phase 7 — Product administration
**Deliverable:** Create/edit/archive products, brands and categories with validated fields and image handling.

**Live test:** Add test brand/category/product; edit and archive; validate image upload and errors; confirm list/search/filter and persistence.

### Phase 8 — Public catalogue
**Deliverable:** Customer-facing product listing, search/filter and product details connected to approved catalogue data.

**Live test:** Browse as signed-out visitor; search/filter; open product; verify images, price and availability; test empty and unavailable states on phone and desktop.

### Phase 9 — Installment plans and calculator
**Deliverable:** Admin-configured plans and customer-facing calculator using only confirmed business rules.

**Must decide first:** 3/6/9 month terms, advance amount/percentage, markup/fees, rounding, due-date rules, late charges, eligibility and product-specific differences.

**Live test:** Run approved sample calculations, boundary values, invalid inputs and rounding/date cases. Compare against independently agreed expected results. No assumptions on financial formulas.

### Phase 10 — Customer orders and schedules
**Deliverable:** Create a test order from a product and approved plan; generate installment schedule and order status.

**Live test:** Complete order flow; inspect schedule, totals and status; test invalid plan/product, cancellation and duplicate submission. Confirm data persists correctly.

### Phase 11 — Payments, receipts and due tracking
**Deliverable:** Record an actual test payment, issue a receipt, and show paid/upcoming/overdue instalments.

**Live test:** Record payment; refresh; inspect receipt and remaining balance; test duplicate payment prevention, partial payment if supported, overdue status and permissions. Use test records, not real money.

### Phase 12 — Wallet, profit and referrals
**Deliverable:** Referral attribution and ledger entries based on approved business rules.

**Must decide first:** Exact profit formula, qualifying event, reversals, referral ownership/window and payout rules. Profit must not be credited before actual advance receipt.

**Live test:** Test referred and non-referred orders, qualifying advance receipt, pre-receipt state, cancellation/reversal and ledger reconciliation. Client-side edits must not forge attribution or balances.

### Phase 13 — User portal
**Deliverable:** Signed-in user dashboard and permitted personal records, balances and referral information.

**Live test:** Sign in as two separate test users; confirm each sees only their own data; test direct URLs, refresh, logout and phone navigation.

### Phase 14 — Reports and audit history
**Deliverable:** Searchable reports, approved exports and traceable activity history.

**Live test:** Generate reports from known test records; check date filters, totals, pagination and exports; verify unauthorized users cannot read sensitive logs.

### Phase 15 — Website settings and communication tools
**Deliverable:** Approved editable website content/posters/theme settings and prefilled WhatsApp messages for manual review/send.

**Live test:** Change test banner/content/theme and verify preview/persistence; test invalid uploads; generate WhatsApp link and verify correct encoded text. No automated WhatsApp sending is included.

### Phase 16 — Hardening and release readiness
**Deliverable:** Security/privacy/accessibility/performance fixes, full regression report and agreed PWA vs APK decision.

**Live test:** Repeat all phase acceptance tests; check Android and desktop; inspect secrets, permissions, private files, keyboard/focus, contrast, responsive behavior and performance. APK may only be claimed after it is actually built and tested.

## Frozen phase register

For each PASS phase, append:
- Phase number and PASS date.
- Exact commit SHA and staging build URL.
- QA report path and test evidence.
- Complete list of files frozen by that phase.
- Any published interfaces/contracts that later phases must use.

Later phases must not edit any path in this frozen-file register. Keep new functionality in new phase-owned files and connect it through pre-agreed extension points.

## QA report format

For every phase create `docs/PHASE_<number>_QA.md` containing:
- Scope and acceptance checklist.
- Files added/changed (all inside this project folder).
- Static test outcomes.
- Staging deployment URL and exact commit SHA.
- Browser test results.
- Android test results.
- Backend/security test results where applicable.
- Defects and retest outcomes.
- PASS / FAIL / BLOCKED decision.
- Frozen file list when PASS.

## Deployment policy

- GitHub is the source of truth.
- Deploy each phase's exact commit to staging for user testing after the user approves staging setup/deployment.
- A phase's staging deployment is a test release, not production.
- Ask before configuring Cloudflare Pages, connecting a custom domain, enabling paid services, or deploying production.
- Do not apply Supabase migrations or alter schema/data/Storage/RLS without explicit approval.
