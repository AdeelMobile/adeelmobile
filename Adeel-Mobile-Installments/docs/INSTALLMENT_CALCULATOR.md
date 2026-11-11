# Installment Calculator — Initial Logic

Status: implemented as a pure, unconnected calculation module on the working branch.
No database values or live sales are changed by this module.

## Rules currently encoded

- Retail price below PKR 60,000: 20% advance.
- Retail price of PKR 60,000 or more: 30% advance.
- Remaining financed amount = retail price − advance.
- Markup on the financed amount: 3 months 15%, 6 months 28%, 9 months 38%.
- Total installment balance = financed amount + markup amount.
- Monthly installment = total installment balance ÷ months.

## Precision

The calculation keeps JavaScript numeric precision and does not round intermediate amounts. UI formatting displays PKR to two decimal places. A formal ledger rounding policy (including how to distribute a paisa remainder across scheduled payments) is intentionally not assumed; it must be agreed before posting real transactions.

## Files

- `js/utils/installment-calculator.mjs`: reusable pure calculator and PKR formatter.
- `js/utils/installment-calculator.test.mjs`: Node built-in test cases.

## Test coverage

- Below-threshold advance.
- Exact PKR 60,000 boundary.
- Above-threshold advance.
- All three markup plans are covered across examples.
- Custom configuration.
- Invalid amounts and unsupported plan rejection.

## Not yet connected

This module is not wired to a live sale, customer record, database setting or payment schedule. That connection requires the relevant phase gate and backend authorization checks.
