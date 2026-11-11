# Authentication Implementation Contract

Date: 2026-11-11
Status: design and acceptance criteria only; sign-in remains disabled in the preview.

## Security invariants

1. The browser and Android client may contain only the Supabase project URL and publishable key. A service-role key, Edge Function secret, signing key or database password must never be shipped in HTML, JavaScript, APK assets or source control.
2. Supabase Auth establishes identity. Authorization is decided by trusted database functions/RLS or a verified Edge Function, never by a role value submitted by the client.
3. A missing, unknown, disabled or inconsistent role is denied by default. An Admin is recognized only by the existing trusted `ims_whoami()` / `private.is_admin()` allowlist path. An app User must resolve to an active `users.auth_user_id` mapping.
4. Hiding a button is not authorization. Every read/write must be tested with direct API requests as Admin, active User, inactive User, unrelated authenticated account and anonymous visitor.
5. Never enumerate whether an email/username exists in password-reset responses. Never log passwords, access tokens, refresh tokens, CNIC values or document URLs.
6. Sign-out must clear local session state and return to the public entry page. Expired/revoked sessions must fail closed.

## Existing integration facts

- Existing Supabase project: `adeel-mobile-database`; reuse it.
- Existing identity mapping: `profiles.id` is an Auth UUID; `users.auth_user_id` maps an app user to Auth.
- Existing trusted identity helper: `public.ims_whoami()` returns `admin`, `user` or `none` after server-side checks.
- Existing `manage-users` Edge Function requires a JWT and checks the trusted `ims_whoami()` result for Admin.
- Legacy `manage-user-login` has a fail-open role check for missing/unexpected app_metadata role values. It is explicitly prohibited for new UI integration until its authorization is corrected and independently reviewed.
- Auth leaked-password protection was reported disabled by Security Advisor; owner approval is required before changing Auth settings.
- Existing login route is intentionally a non-credential preview. Do not collect real passwords until this contract's test gates pass.

## Required client flow

1. Submit credentials only to the official Supabase Auth password sign-in endpoint over HTTPS using the publishable key.
2. On success, retain the session using the selected Supabase-supported session mechanism; do not copy tokens into URLs, logs, analytics or DOM attributes.
3. Immediately call the trusted identity helper with the authenticated session. Accept only the exact known roles `admin` or `user`; `none`, null, errors and unexpected values are denied and signed out.
4. For Admin-only screens, also require the server's Admin allowlist check through existing trusted server contracts. Do not infer Admin from `profiles.role`, `users.role`, user_metadata or app_metadata alone.
5. For User screens, require an active `users` mapping resolved by the server. Load only rows permitted by RLS; do not trust a client-supplied user id.
6. Password reset must use the configured Supabase Auth recovery flow and an approved redirect allowlist. Generic success messaging must not reveal account existence.
7. Logout must call Supabase Auth sign-out and clear all client-held session state.

## Release-blocking test matrix

| Scenario | Expected result |
|---|---|
| Valid allowlisted Admin | Admin route only after trusted identity confirms Admin |
| Valid active app User | User route only after trusted identity confirms User |
| Valid Auth account without app mapping | Deny; no Admin or User dashboard |
| Inactive app User | Deny |
| Missing/unknown role or identity RPC error | Deny and clear session |
| Tampered browser role/user id | No privilege change; RLS still denies unauthorized rows |
| Expired/revoked access token | Protected calls fail; return to sign-in |
| Password reset for known/unknown account | Same generic public response |
| User calls Admin RPC directly | Server rejects |
| User A requests User B records | RLS/server rejects |
| Anonymous caller requests private business data | Reject |
| Sign out then browser back | Protected data is not accessible |

## Known blockers before enabling the form

- Phase 1 browser/Android checks and Google Safe Browsing clearance remain pending.
- The exact deployed RPC signature and grants for `ims_whoami()` must be verified in staging before client wiring.
- The legacy `manage-user-login` fail-open authorization must be remediated in a separately approved backend change before any related feature is used.
- Auth leaked-password protection needs owner decision.
- No dedicated staging Admin/User test accounts have been validated in this work session.
- No database, Auth setting, Edge Function, RLS, Storage or production deployment change is authorized by this document.

## Acceptance rule

The login page stays in safe preview mode until the owner explicitly approves the backend/auth changes and the complete matrix above passes in staging. A working sign-in screen alone is not proof of secure authentication.
