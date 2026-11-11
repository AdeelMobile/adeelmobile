# Adeel Mobile Installments

Mobile-first business management system for Adeel Mobile Installments.

## Product scope

The current approved product scope includes:
- Secure Admin and Staff authentication with server-verified roles.
- Admin dashboard, staff management and role-based workspaces.
- Product catalog and multi-shop inventory.
- Customer verification and protected customer records.
- Installment quotes, contracts, payment schedules, receipts and collection tracking.
- Expenses, wallet, payouts, incentives and reports.
- Public customer website and catalog.
- Customer portal for each customer's own permitted records.
- Android APK delivery after build and release verification.

## Current preview

Open `pages/login/` for the safe sign-in preview. The installment calculator is linked from that page and is also available at `pages/tools/installment-calculator/`.

The calculator is a local preview utility only. It does not authenticate users, create sales, store customer details or write to Supabase. The login and admin areas must not be treated as production-ready until authentication, authorization and the required QA gates are complete.

## Finance defaults currently encoded in the calculator

- PKR currency.
- Retail price below Rs. 60,000: 20% advance.
- Retail price of Rs. 60,000 or above: 30% advance.
- Markup on the remaining amount: 3 months 15%, 6 months 28%, 9 months 38%.
- Monthly installment = total installment balance divided by plan months.

These are currently preview defaults. Production settings must be centrally configurable and confirmed against approved business settings before enabling transactional writes.

## Development

- Node.js 20 or newer.
- Run `npm test` from this folder to execute utility and calculator UI smoke tests.
- No runtime npm dependency is currently required by the static preview.

## Safety and repository boundaries

- Keep all app files and app-specific docs inside `Adeel-Mobile-Installments/`.
- Do not modify legacy repository files outside this directory.
- Do not deploy to production or change Supabase schema, data, Storage, RLS or Edge Functions without the required separate approval.
- Never put Supabase service-role/secret keys or Android signing materials in browser code or the repository.
- Do not enable public CNIC/document uploads until the documented security issues are resolved.
- Do not mark a phase PASS until its actual browser/device/backend checks have been completed.
