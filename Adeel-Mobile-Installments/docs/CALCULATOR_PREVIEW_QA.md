# Installment Calculator Preview — QA Checklist

Status: implementation committed; browser/device execution remains pending.

## Automated checks

Run from `Adeel-Mobile-Installments/`:

```bash
npm test
```

The suite includes:
- Finance formula and Rs. 60,000 advance boundary tests.
- Month-end and leap-year installment schedule tests.
- Calculator UI smoke tests for 20%/30% advance, 3/6-month calculations, invalid input and reset.
- Static route and asset-reference checks.

## Manual browser/mobile checks still required

- [ ] Open the root app URL and confirm it reaches the safe login preview.
- [ ] Open the calculator link from the login preview.
- [ ] Verify the page at 360px, 390px, 412px and tablet/desktop widths.
- [ ] Enter Rs. 59,999: advance should be 20%.
- [ ] Enter Rs. 60,000: advance should be 30%.
- [ ] Check all 3, 6 and 9 month plans.
- [ ] Confirm the displayed schedule totals exactly to the rounded installment balance.
- [ ] Confirm month-end dates and dates around leap year using the schedule utility tests.
- [ ] Try blank, zero, negative, non-finite and over-limit prices.
- [ ] Use keyboard navigation and screen reader labels.
- [ ] Confirm no customer data, credentials or calculation inputs are sent to a server.
- [ ] Check browser console for module/CSS errors.

## Expected business formula

- Price < Rs. 60,000: 20% advance; otherwise 30%.
- Markup on remaining amount: 3 months 15%, 6 months 28%, 9 months 38%.
- Monthly installment calculation is based on the exact total balance; schedule allocation is rounded to paisa and the final row absorbs the remainder.

## Release gate

Do not mark this QA checklist complete based only on automated tests. Real browser/mobile checks and later secure authentication/backend integration remain separate gates.
