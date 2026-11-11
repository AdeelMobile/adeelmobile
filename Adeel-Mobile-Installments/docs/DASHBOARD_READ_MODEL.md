# Dashboard read model

`js/services/dashboard-read-model.mjs` composes the authenticated, read-only Supabase adapter with the pure summary helper.

- Uses `getVisibleSalesRecords`; row visibility remains controlled by Supabase RLS.
- Defaults to the adapter's bounded 50-row snapshot and accepts a caller limit.
- Returns snapshot metrics only; it does not label the result all-time totals.
- Sums monetary values in integer paisa to avoid ordinary floating-point addition drift.
- Excludes missing, negative, non-finite, unsafe-precision and overflowing amounts from the sum, and reports their count separately as `invalidAmountRows`.
- The access-token guard rejects whitespace; a regression test covers an injected whitespace token.
- Propagates authorization/network errors instead of replacing them with zero values.
- Performs no writes and does not manage authentication.

This is a data-layer building block, not a completed dashboard page or a verified Phase 4 release. Live Admin/Staff tests, complete date-range pagination remains outstanding. The date-range read model now flags a result as potentially truncated whenever it reaches its row cap; it must not be shown as a complete period total in that case.
