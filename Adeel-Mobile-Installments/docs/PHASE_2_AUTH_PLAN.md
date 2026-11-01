# Phase 2 — Authentication System

Status: IN PROGRESS (isolated branch: `phase-2-auth`)  
Supabase project: `adeel-mobile-database`  
Project ref: `nqihozwbdrvpyalctwbc`

## Confirmed project conventions

- Login identifier: username.
- Account types: Admin and standard User.
- Accounts are admin-created; public self-signup is not part of this phase.
- Existing username mapping convention: `username@adeelmobile.app` for Supabase email/password Auth.
- Existing `public.users` table already includes `login_username` and `auth_user_id` columns.
- User initially preferred a four-digit numeric password, then delegated the security decision to the project. Decision: use a strong password (minimum 8 characters) for account authentication; do not use a four-digit PIN as the online account credential. A local four-digit quick-unlock PIN is also deferred because this browser-based app does not yet have a verified device-keystore/secure-enclave implementation. Do not store a PIN or password in browser storage.
- Remember Me is part of the required login experience.
- Forgot Password recovery channel is not yet agreed. Synthetic `@adeelmobile.app` aliases are not deliverable email addresses; a password reset email cannot be assumed to reach the user. Admin-assisted reset is the known existing workflow concept, but the complete safe reset flow must be confirmed.

## Work started

- Added public-only Supabase project URL and publishable key configuration.
- Added a pinned `@supabase/supabase-js@2.118.0` browser client.
- Added verified session restore helper (local session read followed by Auth server user verification).
- Added auth-state subscription helper.
- Added local-session logout helper.
- Added username-to-email-alias sign-in service.
- No service-role/secret key is included in browser code.
- No Supabase database schema, records, Auth users, Auth settings, RLS policies, or Storage were changed.
- Added a functional username/password sign-in page on this isolated branch.
- Added opt-in Remember Me storage: sessionStorage by default, localStorage only when selected.
- Login errors are generic to avoid revealing whether a username exists.
- Existing passwords are not blocked by a client-side length check; enforce the 8-character minimum in the account provisioning/password-reset workflow once that workflow is built.
- A 4-digit local quick-unlock PIN is not implemented; do not store a PIN in browser storage.

## Phase 2 delivery gates

1. Password policy decision: new or reset passwords must be at least 8 characters; retain the existing Supabase Auth configuration until its current settings are inspected. Existing users must not be locked out by a client-only length check.
2. Confirm the admin-assisted password reset process and how a user's identity is verified before reset.
3. Login UI is now wired on this branch: username/password, show/hide password, Remember Me, loading and generic error states. Verify it in the branch preview.
4. Implement a safe password recovery/update flow.
5. Implement post-login signed-in state, session restore after refresh, and local logout.
6. Deploy this branch to the Cloudflare Pages preview URL.
7. Test with dedicated dummy Admin and User accounts on Android and desktop:
   - valid login
   - wrong password rejected
   - session survives refresh when Remember Me is enabled
   - session ends appropriately when Remember Me is disabled
   - logout clears current session
   - recovery flow succeeds without exposing whether a username exists
8. Do not treat login as role authorization. Role-based route/data protection belongs to Phase 3.

## Security constraints

- Supabase Auth only; no mock login.
- Never store plaintext passwords.
- Never trust `user_metadata` for authorization.
- No service-role key in browser code.
- New accounts must be provisioned through an authorized admin/server-side flow, not public sign-up.
- Schema, data, Auth configuration, Storage and RLS changes are not included in this initial setup and require separate approval.
