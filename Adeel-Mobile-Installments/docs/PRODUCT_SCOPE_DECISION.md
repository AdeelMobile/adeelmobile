# Product Scope Decision — Complete Adeel Mobile Installments System

Date: 2026-11-11
Status: Approved scope from the user's latest instruction; implementation remains subject to the existing security and release gates.

## Supersedes the earlier limited scope

The earlier README described the public customer website and later modules as deferred. The user's latest instruction explicitly asks for the complete system and one final Android APK delivery. Therefore the intended product scope is expanded to the complete system below. This does not waive the existing rules for production deployment, database migrations, Storage/RLS changes, security testing or user acceptance.

## Product surfaces

1. Responsive Admin web dashboard.
2. Staff/User web dashboard with enforced per-user access.
3. Public customer website and mobile-friendly product catalog.
4. Android application packaging the approved mobile experience.
5. Existing Supabase project as the source of truth; reuse existing tables and data where their purpose and security model are verified.

## Core modules

- Authentication, session restore, password reset and logout.
- Server-enforced Admin and Staff roles.
- Staff accounts, status, targets, incentives and referral codes.
- Brands, models, variants, stock/catalog visibility and product media.
- Customer profiles and verification workflow.
- Installment quote calculator and configurable terms.
- Sales/orders, installment contract, due schedule, receipts and payment history.
- Collections/recovery, overdue tracking and balance reconciliation.
- Expenses, wallet, profit and payout ledger after business rules are confirmed.
- Referral attribution and commission controls.
- Reports, filters, exports and audit history.
- Public website: landing page, catalog, product details and inquiry/contact flow.
- Customer/User portal for permitted own-record access.
- Settings, business profile, WhatsApp message handoff and backup/recovery operations.

## Authorization model

- Admin privileges must be determined from trusted server-side authorization data, not client form values or user-editable metadata.
- Staff access must be restricted to records assigned to their own authenticated app-user identity.
- Admin can view/manage business-wide records only where the existing backend policies explicitly authorize it.
- Public visitors may read only intentionally public catalog/content fields.
- CNIC and verification documents remain private; do not enable anonymous CNIC uploads until upload abuse controls and access policy have been reviewed and approved.
- Never expose Supabase service-role or secret credentials in browser or APK assets.

## Financial calculation requirements

Use the configurable rules in `docs/INSTALLMENT_CALCULATOR.md`. The pure calculator currently exists but is not yet connected to transactions or database settings. Do not post real transactions until rounding, payment schedule, reversals and late-fee rules are confirmed.

## Delivery requirements

The requested final handoff is one verified Android APK link, accompanied by the final website/staging address and release notes. Do not provide a fabricated or unverified APK link. APK signing keys and secrets must be stored only in protected build secrets, never committed to GitHub.

## Phase and release controls remain active

- Keep work inside `Adeel-Mobile-Installments/`; do not alter legacy repository files.
- Keep using a separate working branch until reviewed.
- The roadmap's Phase 1 Safe Browsing and Android live-test gate remains open.
- Use dummy data for staging and QA.
- Database schema/data, Storage, RLS and migration changes require separate approval.
- Production deployment requires explicit approval.
- Mark a phase complete only after its working feature has been tested and accepted.
