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

The calculation keeps JavaScript numeric precision and does not round intermediate amounts. Both the quote UI and pure calculation module accept only positive whole-rupee safe-integer retail prices; the UI additionally caps input at PKR 100,000,000. Advance percentages must remain below 100% so an installment plan cannot silently produce a zero balance. The UI formats PKR to two decimal places. The illustrative schedule rounds the total balance to paisa once, uses equal whole-paisa amounts for the first payments, and assigns the exact remainder to the final payment. This is preview behavior only; the production ledger policy still requires explicit business approval before real transactions are posted.

## Files

- `js/utils/installment-calculator.mjs`: reusable pure calculator and PKR formatter.
- `js/utils/installment-calculator.test.mjs`: Node built-in test cases.

## Test coverage

- Below-threshold advance.
- Exact PKR 60,000 boundary.
- Above-threshold advance.
- All three markup plans are covered across examples.
- Custom configuration.
- Invalid amounts, fractional/unsafe retail prices, advance settings that leave no financed balance, and unsupported plan rejection.
- Calculator UI rejects fractional, zero, negative and excessively large retail prices.

## Not yet connected

This module is not wired to a live sale, customer record, database setting or payment schedule. That connection requires the relevant phase gate and backend authorization checks.
