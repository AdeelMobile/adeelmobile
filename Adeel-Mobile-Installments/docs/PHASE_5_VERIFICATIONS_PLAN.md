# Phase 5 — Isolated Verification Workflow (Steps 29–36)

## Isolation guarantee
This phase introduces only new `p5_*` database objects and a new private Storage bucket named `p5-verification-docs`. It does not alter or delete the legacy `verifications`, `customers`, `installment_plans`, `ims_audit_log`, `ims_wallet_tx`, `customer-docs`, existing Edge Functions, existing policies, or any existing records. Existing `variants`, `models`, `brands`, the trusted role resolver and `private.is_admin()` are read-only dependencies.

The isolated SQL has been applied to Supabase in migrations `phase5_isolated_verifications`, `phase5_lock_trigger_function_exec`, `phase5_require_active_app_user`, `phase5_verification_fk_indexes`, `phase5_link_application_records`, `phase5_normalize_pending_phone` and `phase5_lock_attached_documents`. Existing tables and bucket remain untouched.

## Delivered application code
- User routes: `/user/verifications/new` and `/user/verifications`.
- Admin routes: `/admin/verifications` and `/admin/verifications/detail?id=<id>`.
- Product choices read from existing active catalog data; the database trigger re-reads the selected variant snapshot so client-submitted prices/product names are not trusted.
- User form validates required identity/contact/product/plan/address fields, Pakistani mobile numbers, CNIC format, JPG/PNG/PDF documents and 8 MB per file.
- Submission inserts a pending application, uploads both documents to the new private bucket under `<auth-user-id>/<application-id>/`, then attaches the paths through a narrow RPC. Upload failure attempts file cleanup and removes the incomplete application/audit event.
- Duplicate pending applications are prevented per authenticated user and normalized customer phone (03, +92 and 0092 formats converge) with a partial unique index.
- User can read only their own application/status/rejection reason.
- Admin queue provides Pending/Approved/Rejected/All tabs, exact counts and 20-row pagination.
- Admin details include customer/product/plan information, one-hour signed document links and an activity timeline.
- Approval is one atomic RPC: it locks a pending row, creates a new Phase 5 customer record and installment contract, stores expected and actual advance separately, records a unique advance receipt when actual advance is greater than zero, and marks the application approved.
- Rejection supports Invalid ID, Duplicate application, Incomplete information and Other (custom reason). A rejected user may submit a new application.
- WhatsApp messages are generated as manual `wa.me` links; no message is sent automatically.

## Financial scope boundary
The existing `installment_plans` table currently has no configured rows. Phase 5 therefore stores the selected duration and product price but does not invent markup, monthly installment, due dates, fees or balance calculations. Those calculations require approved business rules in the installment-plan phase. Expected advance is optional and entered by Admin; actual advance is separately recorded as the amount actually received.

## SQL objects proposed
- Tables: `p5_verification_applications`, `p5_customers`, `p5_installment_contracts`, `p5_advance_receipts`, `p5_verification_events`.
- Functions: `p5_attach_verification_documents`, `p5_cancel_incomplete_application`, `p5_admin_approve_verification`, `p5_admin_reject_verification`.
- New private bucket: `p5-verification-docs`.
- New RLS and Storage policies are prefixed `p5_`; user-side writes to application status/customer/contract/advance/audit fields are not granted.

## Required acceptance tests after migration and staging deployment
1. Anonymous visitor cannot read or upload Phase 5 applications/documents.
2. User A can create and read their own application; User B cannot read it or its documents.
3. User A cannot create a second pending application for the same normalized phone; a rejected application can be resubmitted.
4. Upload accepts JPG, PNG and PDF up to 8 MB; rejects unsupported/oversize files; a failed second upload cleans the first file and incomplete application.
5. Admin can see all statuses and paginate; user cannot open admin routes or call admin RPCs.
6. Signed document links work for authorized user/Admin and expire after 60 minutes; direct public URL access is denied. After attachment, the applicant cannot delete or replace linked documents.
7. Approve creates exactly one Phase 5 customer, contract and (if amount > 0) advance receipt; expected and actual advance remain distinct; repeat approval is rejected.
8. Reject requires a reason; custom Other requires text; each status transition appears in the activity timeline.
9. WhatsApp link opens a prefilled message only; no automatic send.
10. Regression: Phase 2 login/session/logout; Phase 3 Admin/User/none route + RLS isolation; Phase 4 dashboard counts/refresh/navigation. Run desktop browser and Android viewport tests separately.

## Current status
- GitHub implementation and isolated SQL proposal staged on `phase-5-verifications`.
- Supabase isolated migration is applied; five `p5_*` tables, a private bucket, nine RLS/Storage policies and four guarded RPCs are present.
- SQL simulations passed for active-user submission, server-side product snapshot validation, unmapped-account denial, cross-user read isolation, Admin rejection and status-event logging, and equivalent-phone duplicate rejection. Test transactions were rolled back; current Phase 5 tables contain zero records.
- Supabase Security Advisor still reports pre-existing legacy findings (including the existing public `ims_submit_verification` RPC, existing Auth password-protection setting and unrelated RLS notices). Phase 5 Admin/owner SECURITY DEFINER RPC warnings are intentional and protected by explicit role/owner checks; trigger-only functions have direct execution revoked.
- Live preview/browser/Android testing is not yet verified. Phase 5 is **BACKEND APPLIED / FRONTEND IN BRANCH / LIVE QA BLOCKED**, not PASS and not frozen.
- Next: verify Cloudflare branch preview, then run the acceptance and Phase 2–4 regression tests above.
