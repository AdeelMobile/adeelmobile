# Sales dashboard summary helper

`js/utils/dashboard-summary.mjs` derives a display summary from a sales-record array that has already been fetched under the caller's authenticated Supabase token.

## Output
- Number of rows in the supplied snapshot.
- Sum of valid, non-negative `sale_amount` values.
- Count of rows with valid amounts and count with missing/invalid amounts.
- Row counts grouped by normalized status.
- Latest parseable sale date.
- `isSnapshot: true` to make the limited scope explicit.

## Important limits
- This helper performs no network requests and makes no database changes.
- It does not claim the result is a lifetime or all-time business total. If the service fetches only its default 50 rows, these metrics describe only those 50 rows.
- RLS remains the authority for which rows Admin or Staff can see.
- It does not calculate profit, wallet balance, incentives, outstanding receivables, or payments. Those require separately verified business rules and authorized data sources.
- It does not make Phase 4 live or complete. Authentication, integration, full-range pagination, staging and user acceptance remain pending.
