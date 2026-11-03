-- Index Phase 5 foreign keys for queue and customer/contract lookups.
create index p5_applications_variant_idx on public.p5_verification_applications(variant_id);
create index p5_contracts_customer_idx on public.p5_installment_contracts(customer_id);
create index p5_contracts_variant_idx on public.p5_installment_contracts(variant_id);
create index p5_receipts_customer_idx on public.p5_advance_receipts(customer_id);