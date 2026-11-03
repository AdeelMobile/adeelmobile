-- Index the new application-to-customer and application-to-contract foreign keys.
create index p5_applications_customer_idx on public.p5_verification_applications(customer_id);
create index p5_applications_contract_idx on public.p5_verification_applications(installment_contract_id);