# Implementation Start — Repository & Supabase Audit

Date: 2026-11-11
Branch: work/adeel-mobile-system-audit
Scope: read-only assessment plus this audit note. No database, Storage, RLS, production, or legacy-file changes were made.

## Repository boundary and current state

- Repository: AdeelMobile/adeelmobile
- Application root: `Adeel-Mobile-Installments/`
- All future application files must remain inside that directory.
- Legacy files outside that directory are out of scope and must remain untouched.
- Current login page is a safety preview only; it explicitly does not collect credentials.
- Current admin dashboard JavaScript only provides drawer/date behavior and placeholder alerts. It is not a functional business dashboard.

## Existing Supabase project

- Project: `adeel-mobile-database`
- Project ID: `nqihozwbdrvpyalctwbc`
- Status observed: ACTIVE_HEALTHY
- Existing catalog data observed: 9 brands, 146 models, 146 variants.
- Several operational tables currently have zero rows, including customers, orders, sales_records and installment_plans.
- RLS is enabled on the inspected public business tables. RLS being enabled does not by itself prove that every policy is correct.

## Existing schema areas to reuse

- Identity and staff: `auth.users`, `profiles`, `users`, private admin allowlist.
- Catalog: `brands`, `models`, `variants`, `product_images`.
- Customer/verification: `p5_verification_applications`, `p6_customers`, verification tables and private document storage.
- Operations: orders, installment contracts/plans, receipts, installments, sales records, wallet and payout tables.
- Configuration: `ims_settings`, `website_settings`.

Do not create parallel tables until the existing schema and its intended lifecycle have been mapped.

## Security observations requiring investigation before live customer data

1. A Storage INSERT policy named `public_upload_customer_docs` currently grants the `anon` role insert access to bucket `customer-docs` for paths whose first folder is `cnic`. This is a high-priority review item because CNIC documents are sensitive. Do not upload real identity documents or enable a public customer-document flow until bucket privacy, upload constraints, object access, retention and abuse controls are verified.
2. Private verification documents use a separate `p5-verification-docs` bucket with owner/admin read checks in the inspected policies. Verify bucket configuration and the complete upload/download lifecycle before relying on it.
3. Catalog tables have public read policies, which is appropriate only for fields intended for public display. Keep private pricing, internal notes and customer data out of public catalog responses.
4. `private.is_admin()` checks an enabled private allowlist row for the authenticated user. `private.current_app_user_id()` resolves an active app user through `users.auth_user_id`. Keep role decisions server-side; never accept a role from browser form data or user-editable metadata.
5. Several operational tables have admin-only writes and user-specific reads. The frontend must match those policies and must not assume that a visible UI control means the database will authorize the operation.
6. The policies were inspected, but no penetration test or cross-account access test has been performed.

## Build and delivery gates

- The existing roadmap requires Phase 1 Android/browser live checks and Safe Browsing clearance before Phase 1 can be marked PASS.
- Do not ask users to bypass a browser phishing warning.
- No production deployment without explicit approval.
- No Supabase schema/data/Storage/RLS changes or migrations without separate approval.
- Do not claim an APK until a remote Android build succeeds and the APK is verified.

## Financial rules to implement as configurable business settings

Currency: PKR.

- Retail price below PKR 60,000: 20% advance.
- Retail price PKR 60,000 or above: 30% advance.
- Finance the remaining amount after advance.
- Markup on the remaining amount: 3 months 15%, 6 months 28%, 9 months 38%.
- Total installment balance = remaining amount × (1 + markup).
- Monthly installment = total installment balance ÷ number of months.

These values must be centralized/configurable and covered by boundary and rounding tests. Do not silently alter existing database calculations.

## Next safe implementation sequence

1. Complete the Phase 1 live verification and resolve the Safe Browsing gate.
2. Map existing auth configuration, user-to-auth links, admin allowlist, grants, Storage bucket settings and policy gaps without changing production data.
3. Implement real Supabase Auth only after the Phase 1 gate is accepted; use public anon/publishable credentials only in the client.
4. Add admin/user authorization tests before enabling business writes.
5. Build each operational module against the existing schema, with isolated staging/test data and user acceptance checks.

## Verification status

- Repository documents and current login/dashboard files: inspected.
- Supabase project status and public table definitions: inspected.
- Public RLS policies and Storage object policies: inspected.
- Database mutations/migrations: none.
- Storage mutations: none.
- Production deployment: none.
- Android build: not run; this environment does not have an Android SDK/Gradle toolchain.
