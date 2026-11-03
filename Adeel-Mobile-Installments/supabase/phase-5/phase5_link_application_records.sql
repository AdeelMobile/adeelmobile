-- Enforce the Phase 5 application-to-customer and application-to-contract links.
alter table public.p5_verification_applications
  add constraint p5_app_customer_fk
  foreign key (customer_id) references public.p5_customers(id) on delete restrict;
alter table public.p5_verification_applications
  add constraint p5_app_contract_fk
  foreign key (installment_contract_id) references public.p5_installment_contracts(id) on delete restrict;