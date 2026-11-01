-- Require a trusted active app-user mapping for user-submitted Phase 5 applications.
create or replace function public.p5_set_application_owner()
returns trigger language plpgsql security definer set search_path = '' as $owner$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  new.owner_auth_id := auth.uid();
  new.app_user_id := private.current_app_user_id();
  if new.app_user_id is null then raise exception 'Active application user required'; end if;
  new.status := 'pending';
  new.actual_advance := 0;
  new.expected_advance := null;
  new.document_front_path := null;
  new.document_back_path := null;
  new.rejection_reason := null;
  new.customer_id := null;
  new.installment_contract_id := null;
  new.approved_at := null;
  new.approved_by := null;
  new.rejected_at := null;
  new.rejected_by := null;
  new.submitted_at := now();
  new.updated_at := now();
  select b.brand || ' ' || m.model, v.variant, v.price
    into new.product_name, new.variant_name, new.product_price
    from public.variants v
    join public.models m on m.id = v.model_id
    join public.brands b on b.id = m.brand_id
    where v.id = new.variant_id;
  if new.product_name is null then raise exception 'Selected product is unavailable'; end if;
  return new;
end;
$owner$;
drop policy p5_applications_insert_owner on public.p5_verification_applications;
create policy p5_applications_insert_owner on public.p5_verification_applications
for insert to authenticated
with check (owner_auth_id = (select auth.uid()) and app_user_id is not null and status = 'pending');