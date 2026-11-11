# Supabase Integration Map and Read-Only Security Review

Date: 2026-11-11
Project: `adeel-mobile-database` (`nqihozwbdrvpyalctwbc`)
Review type: Read-only metadata and policy inspection. No SQL mutations, data changes, migrations or Storage changes were made.

## 1. Existing business data model (observed columns)

| Area | Existing tables | Notes |
|---|---|---|
| Identity | `profiles`, `users` | Supabase Auth UUID maps to `users.auth_user_id`; app user has bigint id, login_username, status, referral_code and target/incentive fields. |
| Product catalog | `brands`, `models`, `variants` | Existing hierarchy: brands → models.brand_id → variants.model_id. Product display flags already exist. |
| Business settings | `ims_settings` | JSONB key/value settings. The `calc` row exists but previously inspected advance/markup keys were null. |
| Customer records | `customers`, `p6_customers` | Two distinct customer structures exist. Do not merge or choose one without reviewing legacy workflows and foreign keys. |
| Verification | `p5_verification_applications` | Includes CNIC number and private document paths; treat as highly sensitive. |
| Orders/sales | `orders`, `sales_records` | Both exist with overlapping but non-identical fields. Do not create duplicate transaction flows until relationships and legacy usage are mapped. |
| Installment quotes | `installment_plans` | Stores item, price, months, advance, balance, markup, total payable and monthly amount. Current RLS is admin-only. |

## 2. Existing RLS policies observed

### Catalog
- `brands`, `models`, `variants`: anon/authenticated SELECT policies use `qual=true`; admin ALL policies use `private.is_admin()`.
- The public website must select only intentionally public fields and apply visibility flags in queries. RLS currently permits row reads broadly; visibility flags are not an authorization boundary.

### Users and profiles
- `users`: admin ALL; authenticated user SELECT only where `auth_user_id=auth.uid()` and `status='active'`.
- `profiles`: user SELECT own row only (`auth.uid()=id`).
- This is consistent with a server-authorized admin allowlist and app-user mapping, but create/update flows still require testing.

### Sales and customers
- `sales_records`: SELECT own app user or admin; INSERT/UPDATE/DELETE are admin-only.
- `orders`, `customers`, `installment_plans`: inspected policy set shows admin-only ALL policies; no staff-own read/write policy was observed for these tables.
- `p6_customers`: admin ALL and owner SELECT; no staff INSERT/UPDATE policy was observed.
- `p5_verification_applications`: owner/admin SELECT; owner INSERT requires owner_auth_id = auth.uid(), app_user_id non-null and status='pending'. The policy does not visibly assert app_user_id = private.current_app_user_id().

## 3. Integration blockers / security review items

1. **Do not assume staff can operate orders or installment plans.** Their observed RLS policies are admin-only. Staff dashboard features must not be enabled until approved, tested policies/RPCs exist.
2. **Review p5 app_user_id binding.** The INSERT check binds owner_auth_id to auth.uid() but does not visibly bind app_user_id to the authenticated user's own app id. Verify whether a trigger or constraint enforces this; otherwise it needs a separately approved RLS hardening migration.
3. **Public catalog rows are broadly readable.** Website query must filter display flags and avoid selecting internal fields. Consider a narrow public view/RPC only after separate approval.
4. **ims_settings has a broad authenticated SELECT policy.** Do not put secrets or private operational data in this table. Admin writes are protected by private.is_admin(); calculator settings must be treated as public/non-secret if exposed to anon.
5. **Customer and CNIC records are sensitive.** Keep documents private; do not use the legacy `customers.cnic_front/cnic_back` text fields as public URLs. Do not upload real CNIC files during staging.
6. **Duplicate business entities exist.** `customers` vs `p6_customers`, and `orders` vs `sales_records`, need a verified relationship/ownership map before UI writes.
7. **Installment rules are not yet configured in the existing `ims_settings.calc` values** (based on prior read-only inspection). Never assume null means defaults are installed in production.

## 4. Safe integration order

1. Build isolated frontend modules and pure calculations with no database writes.
2. Confirm exact intended table and foreign-key relationships.
3. Design role-specific reads against the observed policies.
4. Prepare a proposed migration/policy diff for review; do not apply it without separate approval.
5. Test with dedicated dummy Admin and Staff accounts in staging.
6. Verify cross-user denial by direct API requests, not only hidden UI elements.
7. Only after approval, connect transactional writes and validate audit/reversal behavior.

## 5. Explicit non-actions

- No `INSERT`, `UPDATE`, `DELETE`, DDL or migration executed.
- No RLS or Storage policy changed.
- No bucket permissions changed.
- No live customer records or credentials read.
- No production deployment.
