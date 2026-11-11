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

## 6. Foreign-key map (observed)

The FK graph reveals that the newer verification flow has a connected workflow and should be evaluated before using the older generic customer/order tables:

- `p5_verification_applications.variant_id → variants.id`
- `p5_advance_receipts.application_id → p5_verification_applications.id`
- `p5_installment_contracts.application_id → p5_verification_applications.id`
- `p5_installment_contracts.variant_id → variants.id`
- `p5_customers.application_id → p5_verification_applications.id`
- `p5_verification_applications.customer_id → p5_customers.id`
- `p5_verification_applications.installment_contract_id → p5_installment_contracts.id`
- `p5_verification_events.application_id → p5_verification_applications.id`
- `p6_customers.verification_id → p5_verification_applications.id`
- `p6_customers.p5_customer_id → p5_customers.id`
- `p6_customers.referring_user_id → users.id`
- `p6_customer_installments.customer_id → p6_customers.id`
- `p6_customer_verifications.customer_id → p6_customers.id`
- `p6_customer_verifications.verification_id → p5_verification_applications.id`
- `sales_records.order_id → orders.id`
- `sales_records.user_id → users.id`
- `product_images.variant_id → variants.id`

This means the verification/P5/P6 tables already form a more specific application-to-customer-to-installment workflow. Do not replace it with a newly invented parallel contract table. Before implementation, inspect the P5/P6 triggers, functions, constraints, payment/receipt tables and policy coverage as one unit. The presence of a foreign key proves referential linkage, not that the workflow is complete or secure.

## 7. P5/P6 workflow functions and trigger behavior (read-only source review)

Observed trigger functions:
- `p5_set_application_owner()` overwrites owner_auth_id with auth.uid(), obtains app_user_id from `private.current_app_user_id()`, requires an active application user, forces status=pending and actual_advance=0, clears client-supplied review/link/document fields, and derives product name/variant/price from the selected variant. This closes the app_user_id mismatch concern for normal inserts that execute this trigger.
- `p5_record_application_event()` records submission and status/document changes in `p5_verification_events`.
- `p6_link_approved_verification()` runs after a verification status changes to approved. It checks matching P5 customer and contract, serializes same-owner/CNIC approvals, reuses or creates a P6 customer, and links the verification and installment contract to P6 tables with conflict checks.
- Timestamp triggers maintain updated_at.

### Remaining approval-path question

The inspected public RLS policy list for `p5_verification_applications` contains owner INSERT and owner/admin SELECT, but no UPDATE policy. P5 customer, contract and advance-receipt policies shown are admin SELECT only. Therefore, an authenticated browser Admin cannot be assumed to approve/reject applications or create the required P5 customer/contract rows directly through PostgREST. A trusted Edge Function, security-definer RPC or another backend workflow may exist, but it has not yet been identified and verified.

Do not attempt approval by weakening RLS or by writing directly from the browser. Locate and review the trusted approval backend, its grants, validation and audit behavior before connecting the Admin review UI.

## 8. Existing Edge Functions (source inspection only)

The project currently has active Edge Functions:
- `manage-users` (JWT required): verifies the caller with Supabase Auth and calls `ims_whoami()`; it requires the returned role to equal `admin` before using its server-side key. This is the stronger existing pattern for admin operations.
- `manage-user-login` (JWT required): verifies a token with Auth, but its authorization check is `if (role === "user") deny; otherwise continue`, where role comes from `user.app_metadata?.role`. This is a fail-open role check for missing/unexpected role values and does not use `private.is_admin()` / `ims_whoami()`. Do not call this endpoint from the new Admin UI until it is corrected and reviewed by the owner; no live function was changed.
- `submit-verification` (JWT verification disabled): public application submission uses a server-side key, validates fields and JPEG payload size, uploads to the private customer-docs bucket, validates referral codes, and removes uploaded files on later failures. It has wildcard CORS and no visible CAPTCHA/rate-limit/abuse-control check in the inspected source. Keep public submission disabled in the new website until abuse controls and privacy disclosures are reviewed.
- `verification-status` (JWT verification disabled): public status lookup requires application id and normalized phone match, and returns limited application fields. No rate-limit/abuse-control check was visible in the inspected source. Do not expose it without a rate-limit/monitoring decision.
- `price-update-sync` (JWT verification disabled): requires a separate `PRICE_UPDATE_SYNC_SECRET` header before reading/updating catalog prices. Keep the secret server-side; never put it in frontend code or APK assets.

### Admin identity source
The inspected `public.ims_whoami()` returns `admin` only when `private.is_admin()` succeeds, `user` only for an active `public.users` mapping, otherwise `none`. New admin-only functions should follow this trusted server-side identity pattern rather than interpreting a missing role as Admin.

### Remediation work required before full production integration
1. Replace the fail-open authorization in `manage-user-login` with the trusted allowlist/ims_whoami check, after reviewing compatibility and existing callers.
2. Add suitable rate limiting, abuse monitoring and, where appropriate, CAPTCHA to public submission and status endpoints.
3. Restrict public CORS to actual production/staging origins where feasible; CORS is not a substitute for authentication or rate limiting.
4. Verify that the new frontend only calls the verified `manage-users` contract and never exposes server-side keys.
5. Review Edge Function secrets by name and deployment configuration without retrieving or printing secret values.

No Edge Function was deployed, replaced, or invoked during this review.
