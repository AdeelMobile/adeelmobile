# Installment Schedule Builder

Status: pure utility only; not connected to contracts or payment writes.

- Input: contract total, supported plan length (3/6/9) and contract date.
- Converts the total to integer paisa once.
- Divides paisa evenly; any remainder is assigned to the final payment so the schedule sum equals the rounded contract total exactly.
- Due dates are calendar-month anniversaries based on the original contract date. A date such as January 31 clamps to February's final day, then returns to March 31 rather than drifting from February.
- No late fee is calculated.
- All dates are handled in UTC to avoid browser timezone shifts.
- Output rows begin as pending with zero paid amount.

The contract-date anchor, rounding policy, and due-date convention are proposed defaults and must be confirmed before production use. The module does not write to Supabase.
