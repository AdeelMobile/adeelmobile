# Phase 3 — User Management

- Admin-only user list with search and status filters.
- Create a user profile and linked Supabase Auth login.
- Update profile fields and activate/disable accounts.
- Reset linked user passwords without storing them in the application table.
- No delete action because user rows are referenced by sales and incentive records.

## Security
- Edge Function validates the Supabase session and requires `public.ims_whoami()` to return `admin`.
- Service-role secret is read only from the Edge Function environment as `MY_SERVICE_KEY`.
- Browser code never queries the users table directly.
- User access remains controlled by the active row and server-side role RPC.
- Passwords are not written to application tables or logs.

## Validation
- Test unauthenticated and non-admin denial, then admin list/create/update/disable/password-reset workflows.
- Confirm disabled users receive role `none` from `ims_whoami()`.
- Existing user and transaction records are not deleted.
