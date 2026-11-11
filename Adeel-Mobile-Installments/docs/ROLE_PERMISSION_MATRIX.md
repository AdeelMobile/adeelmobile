# Role and Permission Matrix

Date: 2026-11-11
Status: design baseline only. No protected route or business write is enabled by this document.

## Trust model

- Authentication identity comes from Supabase Auth.
- Application identity comes from the trusted server-side `ims_whoami()` contract and the existing Admin allowlist / active `users.auth_user_id` mapping.
- The client must not infer role from editable profile fields, user_metadata, local storage, query parameters or form values.
- RLS and trusted Edge Functions/RPCs are the final authorization boundary. Navigation visibility is only presentation.
- Any unknown role, missing mapping, inactive user, RPC error or stale session is denied by default.

## Proposed permission matrix

| Capability | Anonymous | Customer | Staff/User | Admin |
|---|---:|---:|---:|---:|
| Public visible phone catalog | Allow | Allow | Allow | Allow |
| Public installment estimate | Allow | Allow | Allow | Allow |
| View own customer portal data | Deny | Own records only | Deny | Support access only through audited trusted workflow |
| View own staff profile | Deny | Deny | Own record only | Allow |
| View all staff | Deny | Deny | Deny | Allow |
| Create/edit/disable staff | Deny | Deny | Deny | Allow through verified admin backend |
| View assigned customers | Deny | Deny | Only after an approved policy/RPC exists | Allow through verified workflow |
| Submit verification request | Only after abuse/privacy gate | Only after abuse/privacy gate | Only if approved business flow requires it | Allow through trusted workflow |
| Review/approve/reject verification | Deny | Deny | Deny unless explicit delegated permission is approved | Allow through existing guarded RPC/Edge Function |
| Manage brands/models/variants | Deny | Deny | Deny unless explicitly delegated | Allow |
| Create sale/order/contract | Deny | Deny | Only after staff RLS/RPC is approved | Allow |
| Record payment/receipt | Deny | Deny | Only after payment ledger and permissions are approved | Allow |
| View wallet/profit/payouts | Deny | Deny | Own permitted incentive summary only after policy approval | Allow |
| Change business-wide settings | Deny | Deny | Deny | Allow |
| View audit log | Deny | Deny | Own activity only if approved | Allow |

## Current database constraints that affect the UI

- The inspected RLS policy set gives Admin-only access to `orders`, `customers` and `installment_plans`; do not expose Staff create/edit actions against these tables.
- `sales_records` has a staff-own/admin SELECT policy, but inspected writes are Admin-only.
- `p6_customers` has Admin ALL and owner SELECT; no staff insert/update policy was observed.
- `users` permits an active app user to select their own mapped row; Admin has broader access.
- Catalog SELECT is public, so query-level visibility flags must be applied and private fields omitted. Those flags are not a security boundary.
- The P5/P6 verification workflow has trusted trigger/RPC logic; Admin approval must use the verified guarded backend contract, not direct browser table writes.
- Public CNIC upload and unauthenticated verification status lookup remain disabled until rate limiting, abuse protection, privacy, CORS and monitoring are resolved.

## Route behavior

1. Public routes: catalog, product details and non-binding calculator preview.
2. Login route: safe information page until Phase 1 gate and Phase 2 authentication acceptance.
3. Admin routes: require fresh server-confirmed Admin identity; a direct URL visit must not render protected data before the check.
4. Staff routes: require fresh server-confirmed active User identity and must query only records permitted by RLS.
5. Customer portal: separate customer identity and ownership model; do not reuse Staff role or accept a customer id as proof of ownership.
6. On authorization error, expired session or unknown identity, clear protected UI state and return to the safe sign-in route.

## Mandatory negative tests

- Anonymous caller reads customer, verification, contract, payment, staff or wallet data.
- Staff A requests Staff B's profile, customer, sales or incentive rows.
- Staff calls Admin RPC or writes directly to Admin-only tables.
- User edits local storage, URL parameters, request body or user metadata to claim Admin.
- Disabled staff account reuses an old access token.
- Customer changes a record id in a portal URL to another customer's record.
- An unexpected role string or failed identity RPC attempts to open a protected route.

Every case must be rejected by the backend, not merely hidden by the frontend.

## Change-control boundary

This matrix does not authorize schema, RLS, Storage, Auth settings, Edge Function or production changes. Where current policies do not support a required business action, prepare a migration/RPC proposal and obtain separate approval before applying it.
