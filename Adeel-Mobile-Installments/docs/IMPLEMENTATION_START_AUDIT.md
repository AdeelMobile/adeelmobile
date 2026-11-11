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

1. Storage bucket `customer-docs` is private, but a Storage INSERT policy named `public_upload_customer_docs` grants the `anon` role insert access for paths whose first folder is `cnic`. The bucket has no configured file-size limit or MIME-type allowlist. This is high priority: do not enable public CNIC uploads or store real identity documents until abuse controls, validation, access, retention and deletion are reviewed.
2. Bucket `p5-verification-docs` is private and has an 8 MiB limit plus JPEG/PNG/PDF MIME restrictions. Its inspected object policies use owner/admin checks for reads and constrained owner uploads. Verify the complete lifecycle before relying on it.
3. Bucket `apk-files` is currently public. Do not place private builds, signing materials, credentials or customer data there. Public release binaries should be intentionally versioned and reviewed.
4. Catalog tables have public read policies, which is appropriate only for fields intended for public display. Keep private pricing, internal notes and customer data out of public catalog responses.
5. `private.is_admin()` checks an enabled private allowlist row for the authenticated user. `private.current_app_user_id()` resolves an active app user through `users.auth_user_id`. Keep role decisions server-side; never accept a role from browser form data or user-editable metadata.
6. Several operational tables have admin-only writes and user-specific reads. The frontend must match those policies and must not assume that a visible UI control means the database will authorize the operation.
7. Existing `ims_settings` contains a `calc` object, but the inspected `advance_percent`, `markup.3`, `markup.6` and `markup.9` values are null. Do not treat the database as already configured with the agreed installment terms.
8. The policies were inspected, but no penetration test or cross-account access test has been performed.

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
- Public RLS policies, Storage object policies, bucket privacy/limits and calculator settings: inspected.
- Database mutations/migrations: none.
- Storage mutations: none.
- Production deployment: none.
- Android build: not run; this environment does not have an Android SDK/Gradle toolchain.

## Follow-up implementation work (2026-11-11)

- Added a pure configurable installment calculator in `js/utils/installment-calculator.mjs`; it encodes the agreed PKR advance threshold and 3/6/9-month markup rules without database writes.
- Added Node test coverage. Local execution: **7 tests passed, 0 failed**.
- Added `docs/INSTALLMENT_CALCULATOR.md` and `docs/PRODUCT_SCOPE_DECISION.md`; the latter records the user's complete web + Android scope while preserving the existing approval gates.
- Added `docs/SUPABASE_INTEGRATION_AND_RLS_REVIEW.md`, documenting observed schema, FK graph, RLS policies, trigger flow, Edge Function contracts and Security Advisor findings.
- Confirmed an existing P5/P6 approval flow exists through SECURITY DEFINER RPCs; those functions internally check `private.is_admin()`. No replacement approval logic should be invented.
- Found a legacy `manage-user-login` Edge Function whose Admin check is fail-open for missing/unexpected app_metadata role values. It is not approved for use by the new UI until corrected and reviewed. No live function was changed.
- Supabase Security Advisor also reports leaked-password protection disabled and several SECURITY DEFINER/public-RPC warnings. These are documented for review; no settings or grants were changed.
- No production database, Storage, RLS, Edge Function, or deployment changes were made.
- APK remains unbuilt; no Android SDK/Gradle toolchain is available in the current build environment.

- Added a pure monthly schedule builder in `js/utils/installment-schedule.mjs`: calendar-month dates, month-end clamping, integer-paisa allocation and final-installment remainder.
- Added 5 schedule tests; local execution: **5 passed, 0 failed**. Combined calculator + schedule coverage: **12 tests passed, 0 failed**.
- Schedule builder is intentionally not connected to any live contract or payment table. Its date/rounding conventions remain proposals until business acceptance and a separately approved ledger migration.

- Added a standalone mobile-first calculator screen at `pages/tools/installment-calculator/` and linked it from the safe login preview. It uses the tested pure calculator and schedule modules; it does not submit sales, save customer data or connect to Supabase.
- The calculator screen is still awaiting real-browser/mobile QA. Static code presence is not a claim of device testing or production readiness.

- Calculator UI now renders an illustrative monthly due-date/payment-amount list using the pure schedule utility. The list is explicitly labeled as an estimate from today's date, not a confirmed contract schedule.
- Added a lightweight fake-DOM Node smoke-test suite for the calculator UI (under-threshold calculation, exact Rs. 60,000 boundary, six-month markup, invalid-input clearing and reset). Added `npm test` scripts; these new UI smoke tests are committed but have **not yet been executed in this environment**.
- Corrected the calculator input font declaration and ensured invalid values clear stale result/schedule output.
- Updated the project README so the full website + Android scope is no longer described as deferred.

- Added the public phone catalog at `pages/shop/`; the app root now routes customers to the catalog and the Admin sign-in preview remains at `pages/login/`.
- Connected the catalog with a browser-safe Supabase publishable key and read-only REST requests to the existing public `brands` and `variants` tables. The query selects only public catalog fields, filters brand/model/variant website visibility flags, and distinguishes upcoming models. No customer or staff data is queried.
- The latest read-only catalog snapshot showed 9 visible brands and 146 catalog-visible models/variants (145 active, 1 upcoming). This is a point-in-time DB observation, not a live browser API test.
- Product images are accepted only from the existing project's HTTPS public `phone-images` Storage path. Product names/prices are inserted as text nodes, not HTML.
- Product cards link to the installment calculator with the selected retail price prefilled. Catalog fetch is read-only; there are no public inquiry, CNIC upload, order or payment writes.
- Added static catalog safety/route tests. Public catalog browser/CORS/API checks are pending; no deployment has occurred.

- Extended the read-only catalog with a product-details dialog, safe image gallery and up to 12 public specification fields where available. Upcoming products are labeled and do not offer installment estimates. Product details are rendered via DOM text nodes; gallery URLs are restricted to the existing public phone-images bucket.
