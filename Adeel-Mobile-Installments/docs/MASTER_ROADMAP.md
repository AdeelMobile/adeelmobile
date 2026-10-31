# Adeel Mobile Installments — Master Roadmap & Phase Test Gates

## Working rules

1. Work only inside `Adeel-Mobile-Installments/`. Do not modify the unrelated legacy project.
2. Build one small, reviewable step at a time. Keep each phase independently testable.
3. Every phase ends with a test gate. The next phase cannot start until the current gate is marked **PASS** by evidence.
4. A phase is not considered fully complete just because its code is committed. Static checks, browser checks, mobile checks, and backend checks must be reported separately.
5. Use a separate staging/test deployment for browser and phone testing when needed. Do not publish to production without the user's explicit approval.
6. Do not change Supabase database schema, data, Storage, or RLS policies without explicit approval. Read-only inspection and frontend preparation do not authorize changes.
7. Never store plaintext passwords, trust client-supplied roles, or describe a mock login as secure authentication.
8. Record test results, defects, fixes, and commit SHA in the phase QA report.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 1 | Project foundation and responsive shell | Implementation/static checks complete; live visual test pending |
| 2 | Authentication and session foundation | Not started |
| 3 | Roles, permissions, and protected navigation | Not started |
| 4 | Admin dashboard and shared admin shell | Not started |
| 5 | User/customer records and verification workflow | Not started |
| 6 | Products, brands, categories, and catalog management | Not started |
| 7 | Installment plans, calculator, and payment rules | Not started — business rules must be confirmed first |
| 8 | Orders, installment schedules, receipts, and payment tracking | Not started |
| 9 | Wallet, profit ledger, and referral attribution | Not started — profit rules must be confirmed first |
| 10 | Customer-facing website and product journey | Not started |
| 11 | User portal and account self-service | Not started |
| 12 | Reports, exports, activity logs, and audit trail | Not started |
| 13 | WhatsApp sharing and manual message workflows | Not started |
| 14 | Website settings, content management, and themes | Not started |
| 15 | Security, privacy, accessibility, and performance hardening | Not started |
| 16 | Full regression, device QA, PWA decision, and release readiness | Not started |

## Phase details and mandatory test gates

### Phase 1 — Project foundation and responsive shell
**Goal:** Establish the project structure, entry points, shared styles/components, navigation, and responsive layout.

**Implementation checklist**
- Project folder structure and documentation.
- Root entry point and login entry page.
- Global design tokens and shared component styles.
- Shared UI helper functions.
- Admin page shell, sidebar, and mobile drawer behavior.
- Responsive breakpoints, focus states, and touch target baseline.

**Test gate**
- Static: HTML local references resolve; CSS/JS syntax checks; shared assets load; no files changed outside the project folder.
- Browser: root page and each implemented page load without console errors.
- Mobile: check narrow screen layout, drawer open/close, Escape behavior where supported, scrolling, touch targets, and horizontal overflow.
- Confirm all navigation destinations behave as expected; unfinished destinations must be clearly identified.
- Save screenshots/observations and record defects.

**Current result:** Static repository checks passed. Browser/device visual QA has not yet been performed. Phase 1 remains **awaiting live/manual test gate**. A staging deployment is only made after the user approves it.

### Phase 2 — Authentication and session foundation
**Goal:** Implement real Supabase Auth flows, not a simulated login.

**Implementation checklist**
- Confirm authentication method and required account setup.
- Configure frontend client using public project URL and anon/publishable key only; never expose service-role keys.
- Login, logout, session restore, password reset, and user-facing error states.
- Loading states and safe handling of expired sessions.
- Do not create or change database schema unless separately approved.

**Test gate**
- Valid login succeeds; invalid login fails safely.
- Refresh restores a valid session; logout clears it.
- Password reset flow is tested end-to-end.
- No password or privileged secret is written to local storage, source code, or logs.
- Test on desktop and Android browser; record results.

### Phase 3 — Roles, permissions, and protected navigation
**Goal:** Enforce admin/user access using trusted authorization, not client-side hiding alone.

**Implementation checklist**
- Define role names and allowed actions with the user.
- Decide and approve the trusted source for role assignment.
- Protected routes and safe unauthorized states.
- Backend/database enforcement plan; request approval before RLS/schema changes.

**Test gate**
- Admin and regular user see only permitted screens.
- Direct URL access to restricted screens is denied.
- API/data access is denied when unauthorized, not merely hidden in UI.
- Verify session expiry and role changes.

### Phase 4 — Admin dashboard and shared admin shell
**Goal:** Complete admin navigation, dashboard summary cards, responsive shell, and empty/loading/error states.

**Test gate**
- All dashboard links resolve to implemented pages or clear placeholders.
- Layout checked at phone, tablet, and desktop widths.
- Loading, empty, and error states render correctly.
- No unauthorized data appears.

### Phase 5 — User/customer records and verification
**Goal:** Build user/customer profiles, create/edit/list/search flows, and identity verification workflow.

**Test gate**
- Create, view, edit, search, filter, and status changes work.
- Required-field validation and duplicate handling work.
- Private identity documents are access-controlled; test unauthorized access.
- Audit events are recorded if the approved backend design includes them.

### Phase 6 — Products, brands, categories, and catalog management
**Goal:** Admin CRUD and catalog browsing foundations.

**Test gate**
- Create/edit/archive products, brands, and categories.
- Image upload constraints and failure handling.
- Search/filter/sort and product detail consistency.
- Test empty catalog, large lists, and mobile layout.

### Phase 7 — Installment plans, calculator, and payment rules
**Goal:** Implement approved plan terms and accurate calculations.

**Must confirm before implementation**
- 3/6/9 month plan eligibility and terms.
- Advance amount/percentage, markup, fees, rounding, due-date rules, and late-payment policy.
- Whether prices or terms can vary by product/customer.

**Test gate**
- User-approved sample cases match independently calculated expected values.
- Boundary, rounding, invalid-input, and date cases pass.
- No unapproved financial formula is assumed.

### Phase 8 — Orders, installment schedules, receipts, and payment tracking
**Goal:** Link customer orders to approved plans and track due/paid/overdue installments.

**Test gate**
- Order lifecycle and schedule calculations are consistent.
- Payment recording is permission-controlled and auditable.
- Duplicate submissions do not double-record a payment.
- Receipt totals reconcile with the ledger.

### Phase 9 — Wallet, profit ledger, and referral attribution
**Goal:** Track wallet/profit and referrals using confirmed business rules.

**Must confirm before implementation**
- Exact profit formula and when profit becomes eligible.
- Confirmed rule: profit is not credited before actual advance receipt.
- Referral ownership, attribution window, reversal/cancellation behavior, and payout rules.

**Test gate**
- No profit is credited before the qualifying receipt.
- Reversals/cancellations are handled correctly.
- Referral attribution cannot be forged by editing client-side values.
- Ledger totals reconcile with underlying transactions.

### Phase 10 — Customer-facing website and product journey
**Goal:** Homepage, catalog, search, filters, product details, plan display, and inquiry journey.

**Test gate**
- Browse/search/filter/product detail journeys work on phone and desktop.
- Displayed prices and installment terms match approved data.
- Broken images, empty results, and unavailable products have clear states.
- Forms validate and do not expose private information.

### Phase 11 — User portal and account self-service
**Goal:** Private user dashboard, profile, relevant records, calculator, referrals, and permitted reports.

**Test gate**
- Each user can access only their own authorized records.
- Direct URL and data-access checks pass.
- Dashboard totals reconcile with source records.
- Mobile navigation and session expiry behave correctly.

### Phase 12 — Reports, exports, activity logs, and audit trail
**Goal:** Reliable operational reports and traceable administrative actions.

**Test gate**
- Report totals match source records for known test data.
- Date filters, pagination, and exports are correct.
- Sensitive actions record actor, time, and action details as approved.
- Unauthorized users cannot read logs or exports.

### Phase 13 — WhatsApp sharing and manual message workflows
**Goal:** Create prefilled WhatsApp messages/links for manual sending only.

**Test gate**
- Correct customer/product/plan details are inserted.
- Phone numbers and URL encoding are handled safely.
- User must manually review and send; no automated messaging is claimed.
- Test with and without WhatsApp installed.

### Phase 14 — Website settings, content management, and themes
**Goal:** Manage approved site content, banners/posters, and appearance settings.

**Test gate**
- Changes preview correctly and persist only through approved storage.
- Invalid uploads and missing content fail gracefully.
- Theme and content changes work across screen sizes.
- No unapproved public exposure of private files.

### Phase 15 — Security, privacy, accessibility, and performance hardening
**Goal:** Cross-cutting security and quality review.

**Test gate**
- Authorization and private-file access tests pass.
- Secrets are not present in frontend bundles or repository.
- Form labels, keyboard navigation, focus visibility, contrast, and reduced-motion behavior reviewed.
- Performance and responsive checks run on representative devices.
- All high-severity defects resolved.

### Phase 16 — Full regression and release readiness
**Goal:** Verify complete workflows and decide release format.

**Test gate**
- End-to-end scenarios pass from sign-in through customer/order/payment/report workflows.
- Regression suite passes after fixes.
- Android and desktop browser checks completed.
- PWA vs APK decision made with the user; do not claim an APK unless one is actually built and tested.
- Production release/deployment only after explicit user approval.

## Standard phase exit report

Every phase must finish with a report containing:
- Phase number and scope.
- Files created/changed (all paths under this project folder).
- Commit SHA.
- Static test results.
- Browser/device/backend test results, clearly separated.
- Defects found and their status.
- **Gate decision: PASS / FAIL / BLOCKED**.
- Exact next phase, which remains locked unless the gate is PASS.

## Deployment policy

- GitHub is the source of truth for code.
- Use a staging/test deployment to perform live browser and mobile checks when required.
- Ask before creating or configuring a Cloudflare Pages project, connecting a domain, or deploying.
- Staging is not production. Never describe a staging build as a public production launch.
- Never deploy database migrations or alter Supabase resources without separate explicit approval.
