# Phase 2 — Secure Authentication Foundation

Date: 2026-11-01  
Repository: `AdeelMobile/adeelmobile`  
Implementation branch: `phase-2-secure-auth`  
Project boundary: `Adeel-Mobile-Installments/`

## Implemented

- Added the Supabase browser client using the project's publishable key (never a service-role or secret key).
- Added email/password sign-in with Supabase Auth.
- After sign-in, the client asks the existing `public.ims_whoami()` RPC for the server-verified application role.
- Admins route to the admin dashboard; active users route to a limited user landing page.
- Unknown/disabled roles are signed out and denied access.
- Admin dashboard and user landing page re-check the authenticated user and role on page load.
- Added sign-out and a password visibility control.
- Removed the temporary static redirect that hid all admin routes. The pages contain no customer/user records; data access must remain behind RLS.
- Pinned the browser SDK to `@supabase/supabase-js@2.118.0`.

## Supabase security change

- Enabled RLS on `private.admin_allowlist`.
- Verified the table owner is `postgres`; the existing `private.is_admin()` function is `SECURITY DEFINER`, has an empty pinned `search_path`, and checks the caller's `auth.uid()` against enabled allowlist rows.
- Verified `anon` and `authenticated` have no direct table grants on `private.admin_allowlist`; only `postgres` has table privileges.
- Verified the existing `public.ims_whoami()` RPC is executable by `authenticated`, not `anon`, and returns `none` when no user session exists.
- The RLS advisor reports an informational “RLS enabled, no policy” finding for this private table. This is intentional: direct table access is not granted to client roles; the existing narrowly scoped role-check function reads it as its owner. Do not add a broad client policy.

## Verification and limitations

- Confirmed the new files exist on this branch and the role-check RPC returns `none` without an authenticated session.
- Confirmed the new admin account is email-confirmed and has a password credential configured; the password itself was not read or changed.
- Static code review completed. A real browser sign-in test still requires entering the admin password privately in the deployed preview.
- Cloudflare build/output settings and the branch preview URL have not yet been verified.
- No changes were made to GitHub `main`; no production deployment was triggered.
- Existing Supabase advisor warnings about unrelated public SECURITY DEFINER RPCs and leaked-password protection remain outside this narrowly scoped change.

## Next steps

1. Confirm Cloudflare's preview deployment is serving this branch and the scaffold folder.
2. Test admin sign-in on the preview using the admin's own password (never send it in chat).
3. Test an ordinary active user and a disabled/unknown account.
4. Finish the Users/Create User/All Users module with least-privilege RLS before enabling any user data actions.
5. Merge to `main` only after preview testing and the existing Google Safe Browsing / Search Console review are complete.
