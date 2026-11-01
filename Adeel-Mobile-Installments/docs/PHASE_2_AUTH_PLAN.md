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
- User requirement previously specified a four-digit numeric password. This is not being enabled until the security policy is resolved; Supabase recommends a minimum password length of at least 8 characters and does not recommend short numeric passwords.
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

## Phase 2 delivery gates

1. Resolve the password policy safely before enabling login UI. Do not weaken Supabase password requirements to accept a four-digit PIN without explicit security review.
2. Confirm the admin-assisted password reset process and how a user's identity is verified before reset.
3. Wire the login form, show/hide password, Remember Me, loading and generic error states.
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
