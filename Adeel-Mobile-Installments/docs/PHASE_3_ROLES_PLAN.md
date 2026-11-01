# Phase 3 — Roles and Protected Access

Status: IN PROGRESS — backend role/RLS implementation and client route-guard code committed; live QA pending — isolated branch `phase-3-roles`
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
- Initial audit found `private.is_admin()` treated any authenticated Auth identity with no matching `public.users` row as Admin. This unsafe behavior has been replaced by an explicit private allow-list keyed to `auth.users.id`.
- Existing RLS policies use `private.is_admin()` across multiple tables, so role-source changes must be reviewed as a coordinated security migration.
- Initial audit found broad `public` policies on `verifications` and `user_brand_incentives`, plus RLS disabled on `colors` and `download_history`. These have been remediated with scoped policies; see implementation record below.
- The initial audit itself was read-only. Subsequent approved Phase 3 migrations are recorded below.

## Approval boundary

The user explicitly approved Phase 3 Database, Functions, RLS and grant changes, and separately confirmed the existing Admin Auth identity should receive trusted Admin access. The applied changes are limited to the role allow-list, the reviewed protected-table policies, and function grants documented below. No unrelated Auth settings, Storage, service-role keys, or production deployment were changed.


## Implementation record (2026-11-01)

### Trusted role contract — implemented
- Added private.admin_allowlist, keyed by the immutable Supabase Auth UUID; the table is private and has no client-role table grants.
- Existing Auth identity adeelmobilelinkroad@gmail.com (UUID b503f7eb-e570-4a6a-83e7-1b97e9f20635) is explicitly enabled in the allow-list. Its app_metadata.role remains null; role comes from the private allow-list, not editable client metadata.
- private.is_admin() now returns true only for an enabled allow-list entry. Unknown signed-in identities are not Admin.
- public.ims_whoami() returns admin, user only for an active linked public.users row, or none. An inactive/unmapped identity is denied.
- Admin account currently has no public.users row; this is intentional for the trusted Admin identity and does not grant it standard-user ownership.

### Backend policies — implemented
- Removed unrestricted public SELECT/INSERT/UPDATE/DELETE policies from verifications; existing Admin-all and own-user-read policies remain. Public verification submissions continue only through the existing validated RPC function.
- Removed unrestricted policies from user_brand_incentives; Admin has full access, active mapped users can read only their own rows, and authenticated DML grants are constrained by RLS.
- Standardized sales_records admin predicates on private.is_admin() instead of a potentially stale JWT app_metadata role.
- Enabled RLS on colors with public read and trusted Admin writes; enabled RLS on download_history with Admin-only access (the table has no owner column).
- Revoked direct client execution of trigger/event-trigger functions public.rls_auto_enable() and public.sync_variant_cover(). The public verification-submission RPC remains intentionally callable by anon and authenticated because the public application form uses it; its input checks were reviewed but rate limiting remains a separate concern.
- No Storage policies, Auth project settings, leaked-password protection settings, or password records were changed.

### Applied migration history
- 20261101020542_phase_3_trusted_admin_allowlist
- 20261101020645_phase_3_protected_table_rls
- 20261101020730_phase_3_lockdown_function_grants
- Matching SQL files are committed under supabase/migrations/.

### Client route implementation — committed, not live-tested
- Added js/modules/auth/role.js to verify the Auth user with getUser() and obtain role only from ims_whoami().
- Added route-guard.js and applied it to the Admin dashboard, user-management, all-users, create-user and standard-user landing routes. Protected pages stay hidden while role verification runs. Standard users are redirected away from Admin routes; signed-out users go to login; unknown/failed roles are denied.
- Added login-bridge.js to route a verified Admin to the Admin dashboard and a verified User to the User home after login/session restoration. Added a minimal User home route and local sign-out controls.
- Removed the temporary blanket Admin-to-login redirect from _redirects so the route guard can evaluate the authenticated role.

### Verification performed
- Database role simulation with the Admin Auth UUID returned is_admin=true and ims_whoami()='admin'.
- Database role simulation with the active Hamza user UUID returned is_admin=false and ims_whoami()='user'.
- Database role simulation with an unmapped UUID returned is_admin=false and ims_whoami()='none'.
- RLS simulation as authenticated Admin returned access to the protected verification/download tables; simulated standard User saw no unrelated verification, sales, incentive or download rows. Public colors catalogue remained readable.
- These are database-side simulated JWT/role checks, not real browser/API requests. No dummy Auth test accounts were created.

### Remaining blockers before PASS/freeze
- Deploy and verify the isolated branch preview URL; no preview deployment is confirmed yet.
- Test actual Admin and standard-user login/session restore, direct URLs, logout, refresh, browser back/forward and failed-role behavior on Android and desktop.
- Test direct REST/API reads and writes as both roles, plus signed-out/anon access, using dedicated dummy data.
- Supabase Security Advisor still reports the intentional public verification RPC, authenticated SECURITY DEFINER functions that enforce Admin checks, the existing store_settings RLS-without-policy notice, and leaked-password protection disabled. Review the advisor output before acceptance; Auth settings were not changed.
- Admin must rotate the password previously shared in chat before real login testing. Never reuse that exposed password. The 4-digit PIN remains out of scope.
- Phase 2 remains IN PROGRESS; Phase 3 cannot be frozen until the user completes live QA and explicitly reports PASS.

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
- Deploy branch preview; test on Android and desktop with dedicated dummy accounts only. This gate is still pending.
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
- Implementation SHA: pending final documentation commit
- Preview URL: pending
- Browser/Android/backend test evidence: pending
- User result: pending
- Phase status: IN PROGRESS / NOT PASS / NOT FROZEN
