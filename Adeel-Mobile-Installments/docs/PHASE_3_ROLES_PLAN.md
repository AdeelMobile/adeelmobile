# Phase 3 — Roles and Protected Access

Status: IN PROGRESS — isolated branch `phase-3-roles`
Base: `phase-2-auth` commit `f64f5c71865c85307b4b82d98f8186a7b9d74495`
Supabase project: `adeel-mobile-database` (`nqihozwbdrvpyalctwbc`)

## Phase objective

Deliver a live-testable Admin/User access-control slice. A signed-in session alone must never grant Admin privileges. Route hiding is only a user-interface convenience; Supabase RLS and trusted server-side checks must enforce every protected data operation.

## Scope

1. Resolve a trusted role source for Admin vs standard User.
2. Load and verify the authenticated identity and app role from Supabase after login and on refresh.
3. Add centralized route guards for signed-out, standard-user, and admin-only routes.
4. Add role-aware navigation without treating hidden links as security.
5. Add safe logout handling and deny-by-default behavior when role lookup fails, account is inactive, or identity mapping is missing.
6. Add a protected-access test page/flow using dedicated dummy Admin and User accounts.
7. Test direct URL access and direct database/API access for both roles.

## Read-only audit findings (2026-11-01)

- `public.users` has `auth_user_id` and `login_username`, but no role column was found.
- `public.ims_whoami()` currently returns `admin` when `private.is_admin()` is true.
- `private.is_admin()` currently treats any authenticated Auth identity with no matching `public.users` row as Admin. This is not a safe, explicit Admin allow-list and must not be relied on as the final authorization model.
- Existing RLS policies use `private.is_admin()` across multiple tables, so role-source changes must be reviewed as a coordinated security migration.
- Audit also found broad `public` policies on `verifications` and `user_brand_incentives`, plus RLS advisor errors for `colors` and `download_history`. These need a separately reviewed remediation plan before protected-data acceptance.
- No schema, data, Auth configuration, RLS policy, function, or Storage changes were made during this audit.

## Approval boundary

The implementation may prepare client-side modules, route integration, test documentation, and SQL migration drafts on this branch. It must not apply database migrations or alter Supabase schema/data, Auth settings, functions, RLS policies, grants, or Storage until the user gives separate explicit approval. Never expose service-role keys.

## Proposed delivery gates

### Gate A — Role contract
- Agree the trusted role source and mapping for Admin and standard User.
- Admin must be explicitly allow-listed; absence from `public.users` must never imply Admin.
- Define inactive, unmapped, and unknown role behavior (deny access).
- Keep authorization claims out of editable `user_metadata`.

### Gate B — Protected route slice
- Authenticated user role is fetched from a trusted source.
- Signed-out visitor is redirected to login.
- Standard User is denied Admin-only routes.
- Admin can access the agreed Admin route.
- Refresh, back/forward, direct URL, expired session, and failed role lookup are handled.
- No protected page flashes before the role check completes.

### Gate C — Backend enforcement
- Approved migration establishes trusted role lookup and repairs affected RLS/function grants.
- Admin and User tests prove direct API/database requests are denied when unauthorized.
- Existing public-facing catalog reads and explicitly public operations continue to work.
- No broad permissive policy remains on private customer/verification/financial data.

### Gate D — Live QA
- Deploy branch preview; test on Android and desktop with dedicated dummy accounts only.
- Record exact commit SHA, preview URL, screenshots/results, and defects.
- Fix failures, repeat affected tests, then wait for user PASS before freezing Phase 3.

## Test matrix

| Test | Admin | Standard User | Signed out |
|---|---|---|---|
| Login and identity restore | Allow | Allow | Deny |
| Admin route | Allow | Deny | Redirect to login |
| User self-service route | As agreed | Own account only | Redirect to login |
| Direct protected API read/write | Only approved admin scope | Own rows only | Deny |
| Unknown/inactive/unmapped identity | Deny | Deny | Deny |
| Logout then revisit protected URL | Redirect to login | Redirect to login | Redirect to login |

## Non-goals

- No dashboard metrics, user CRUD, customer workflows, catalog editing, installment calculations, orders, payments, or UI Control Panel in this phase.
- Do not modify files owned by Phase 1 or Phase 2. Add new modules and integration points; if a frozen file must change, stop and request approval.
- Phase 2 remains separately marked IN PROGRESS until its own login/session/recovery tests pass. Starting this branch does not mark Phase 2 PASS or frozen.

## Close-out record

- Branch: `phase-3-roles`
- Base SHA: `f64f5c71865c85307b4b82d98f8186a7b9d74495`
- Implementation SHA: pending
- Preview URL: pending
- Browser/Android/backend test evidence: pending
- User result: pending
- Phase status: IN PROGRESS / NOT PASS / NOT FROZEN
