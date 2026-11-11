# Read-only Supabase service

Status: implemented as an isolated, tested-by-design adapter; not yet connected to a live login or dashboard.

## Purpose

`js/services/supabase-readonly.mjs` exposes a small allowlist of read operations:

- `whoAmI(accessToken)`: calls the existing `ims_whoami` RPC and accepts only the exact strings `admin` or `user`. Any other value fails closed.
- `getVisibleCustomers(accessToken, { limit })`: reads a bounded customer list from `p6_customers` using only `id`, `name`, `phone`, `category`, `status`, `created_at`, and `updated_at`. It deliberately excludes CNIC, address, notes, and owner identifiers; RLS decides whether the caller is an Admin or can see their own records.
- `getVisibleSalesRecords(accessToken, { limit })`: performs a bounded GET of a fixed sales-record column allowlist. It does not accept or send a user ID. The database's existing RLS policy decides visibility (staff: own rows; Admin: all rows).
- `getVisibleSalesRecordsByDateRange(accessToken, { startDate, endDate, limit })`: performs the same RLS-governed read with validated inclusive `YYYY-MM-DD` date bounds and a maximum of 100 rows.

## Security properties

- Pins HTTPS requests to the exact existing Adeel Mobile Supabase project hostname, rejects URL credentials/path/query/hash, and requires a `sb_publishable_` key.
- Uses the caller-provided access token only in the Authorization header.
- Uses `cache: no-store` for authenticated reads.
- Customer reads deliberately omit CNIC, address, free-text notes, and owner identifiers; no customer identity-document data is selected.
- Has no INSERT, UPDATE, DELETE, Storage, password, refresh-token, or session-persistence methods.
- Rejects unknown identity values, malformed tokens, invalid limits, unexpected response shapes, and non-2xx HTTP responses.
- Does not read or trust a client-supplied role or user ID.
- Never uses service-role credentials.

## Important limits

This adapter is not an authentication implementation and does not create a login session. The future caller must obtain the access token through the approved Supabase Auth flow, keep it out of URLs/logs/DOM, call `whoAmI` immediately after authentication, and clear the session if identity is `none`, missing, unexpected, or errors.

The sales query has not yet been verified against the live Data API, CORS, or real Admin/Staff accounts. A successful HTTP response alone is not enough: validate that Staff sees only their own rows and Admin sees only the intended business scope. Do not connect it to a dashboard until those tests pass.

## Tests

`js/services/supabase-readonly.test.mjs` covers exact identity allowlisting, unknown-role denial, absence of user-id filters, fixed column selection, bounded result limits, inclusive date-range filters and invalid-date rejection, exact project-host/path validation, publishable-key validation, and sanitized HTTP errors. Customer tests also assert the privacy-minimized field list and absence of caller-controlled owner filters.

Run from the app directory with Node 20+:

```sh
npm run test:services
npm test
```

The repository test commands were updated to include this service. Tests still require execution in a Node environment before this feature can be marked verified.
