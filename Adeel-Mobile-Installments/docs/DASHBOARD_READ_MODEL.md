# Dashboard read model

`js/services/dashboard-read-model.mjs` composes the authenticated, read-only Supabase adapter with the pure summary helper.

- Uses `getVisibleSalesRecords`; row visibility remains controlled by Supabase RLS.
- Defaults to the adapter's bounded 50-row snapshot and accepts a caller limit.
- Returns snapshot metrics only; it does not label the result all-time totals.
- Propagates authorization/network errors instead of replacing them with zero values.
- Performs no writes and does not manage authentication.

This is a data-layer building block, not a completed dashboard page or a verified Phase 4 release. Live Admin/Staff tests, complete date-range pagination, and staging acceptance remain outstanding.
