-- Remove direct API execution of trigger-only Phase 5 functions.
-- Existing triggers continue to invoke their bound trigger procedures.
revoke all on function public.p5_record_application_event() from public, anon, authenticated;
revoke all on function public.p5_set_application_owner() from public, anon, authenticated;
