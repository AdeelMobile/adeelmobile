# Supabase Access Policy Audit — 2026-11-11

## Scope and method

Read-only inspection of PostgreSQL `pg_policies` in project `nqihozwbdrvpyalctwbc`. No SQL writes, migrations, grants, RLS changes, Auth changes, Storage changes, or Edge Function deployments were performed.

This document records the policies actually returned by the database query. It is not a penetration test and does not prove that every column, RPC, view, or Storage object is safe.

## Confirmed policy behavior

| Table | Confirmed policy | Effective behavior |
|---|---|---|
| `brands`, `models`, `variants` | Public catalog SELECT for anon/authenticated; admin ALL | Public read is permitted by RLS; application must still select only explicitly public fields and apply catalog visibility filters. |
| `users` | Admin ALL; active user can SELECT own row where `auth_user_id = auth.uid()` | Staff can read own app-user row; no staff write policy was observed. |
| `profiles` | SELECT where `auth.uid() = id` | Own profile read only in inspected policy set. |
| `sales_records` | Admin INSERT/UPDATE/DELETE; SELECT admin or own `user_id = private.current_app_user_id()` | Staff sales history is own-row read-only; staff sales creation is not authorized by these policies. |
| `orders` | Admin ALL | Staff order creation/update is not authorized by inspected policy set. |
| `installment_plans` | Admin ALL | Staff cannot manage plans through direct table access under inspected policy set. |
| `p6_customers` | Admin ALL; owner SELECT where `owner_auth_id = auth.uid()` | Staff/customer-owner read only; no owner INSERT/UPDATE policy observed. |
| `p6_customer_installments` | Admin ALL; owner SELECT via linked `p6_customers.owner_auth_id` | Owner read only; no owner payment write policy observed. |
| `p5_verification_applications` | Owner INSERT constrained to own auth UID, non-null app user and pending status; owner/admin SELECT | This is the only inspected non-admin INSERT path in this group. Do not treat it as permission to upload identity documents without separate Storage lifecycle/security review. |
| `p5_installment_contracts`, `p5_advance_receipts` | Admin SELECT | No staff read/write policy was observed in the returned policy set. |

## Product implementation consequences

1. Keep public storefront/catalog read-only.
2. Do not wire staff UI buttons for creating orders, customers, installment plans, sales records, receipts, or payment entries to direct table writes. The observed policies do not authorize those writes for staff.
3. Staff dashboard may show own `users` profile and own `sales_records` only after secure authentication and browser-level RLS tests prove the result.
4. Admin operations must use a verified server-side Admin identity. Do not trust role values supplied by browser state or user-editable metadata.
5. Verification application submission is a constrained owner INSERT, but CNIC document upload remains gated by Storage policy review, abuse controls, retention, and deletion workflow.
6. Any future write workflow needs an explicitly approved backend authorization design (RLS policy or narrowly scoped Edge Function), negative cross-user tests, and a separately approved production change.

## Outstanding verification

- Execute real anon/authenticated requests against the Data API and confirm CORS, selected columns, and row filtering.
- Test as Admin, active Staff, inactive Staff, unmapped auth user, and unauthenticated visitor.
- Review grants, views, RPC execute privileges, triggers, and all policies outside this focused table set.
- Review Storage policies and CNIC document lifecycle before enabling document uploads.
- Do not mark login, dashboard data, payment collection, or sales entry as production-ready until these tests pass.

## Release safety

The app's sign-in preview must remain non-credential-collecting until the existing Auth integration is independently validated. The Google Safe Browsing review and Android build/test gates remain separate release blockers.
