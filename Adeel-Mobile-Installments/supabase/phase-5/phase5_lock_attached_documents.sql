-- Keep attached files immutable to the applicant and verify object existence before approval.
create or replace function public.p5_attach_verification_documents(
  p_application_id bigint, p_front_path text, p_back_path text
) returns void language plpgsql security definer set search_path = '' as $attach$
declare v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select owner_auth_id into v_owner from public.p5_verification_applications
    where id = p_application_id and status = 'pending'
      and document_front_path is null and document_back_path is null
    for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'Application not found'; end if;
  if p_front_path = p_back_path
     or split_part(p_front_path, '/', 1) <> auth.uid()::text
     or split_part(p_front_path, '/', 2) <> p_application_id::text
     or split_part(p_front_path, '/', 3) !~ '^front\.(jpg|png|pdf)$'
     or split_part(p_back_path, '/', 1) <> auth.uid()::text
     or split_part(p_back_path, '/', 2) <> p_application_id::text
     or split_part(p_back_path, '/', 3) !~ '^back\.(jpg|png|pdf)$'
     or array_length(storage.foldername(p_front_path),1) <> 2
     or array_length(storage.foldername(p_back_path),1) <> 2
     or not exists (select 1 from storage.objects where bucket_id = 'p5-verification-docs' and name = p_front_path)
     or not exists (select 1 from storage.objects where bucket_id = 'p5-verification-docs' and name = p_back_path) then
    raise exception 'Invalid or missing document upload';
  end if;
  update public.p5_verification_applications
    set document_front_path = p_front_path, document_back_path = p_back_path
    where id = p_application_id;
end;
$attach$;

create or replace function public.p5_admin_approve_verification(
  p_application_id bigint, p_expected_advance numeric, p_actual_advance numeric
) returns jsonb language plpgsql security definer set search_path = '' as $approve$
declare
  a public.p5_verification_applications%rowtype;
  c_id bigint;
  contract_id bigint;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Admin access required'; end if;
  if p_actual_advance is null or p_actual_advance < 0
     or (p_expected_advance is not null and p_expected_advance < 0) then
    raise exception 'Advance amounts must be zero or greater';
  end if;
  select * into a from public.p5_verification_applications
    where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if a.status <> 'pending' then raise exception 'Only pending applications can be approved'; end if;
  if p_actual_advance > a.product_price
     or (p_expected_advance is not null and p_expected_advance > a.product_price) then
    raise exception 'Advance cannot exceed the product price';
  end if;
  if a.document_front_path is null or a.document_back_path is null
     or not exists (select 1 from storage.objects where bucket_id='p5-verification-docs' and name=a.document_front_path)
     or not exists (select 1 from storage.objects where bucket_id='p5-verification-docs' and name=a.document_back_path) then
    raise exception 'Both identity documents must be uploaded before approval';
  end if;
  insert into public.p5_customers(
    application_id, owner_auth_id, app_user_id, customer_name, father_name,
    cnic_number, customer_phone, whatsapp, address
  ) values (
    a.id, a.owner_auth_id, a.app_user_id, a.customer_name, a.father_name,
    a.cnic_number, a.customer_phone, a.whatsapp, a.address
  ) returning id into c_id;
  insert into public.p5_installment_contracts(
    application_id, customer_id, variant_id, product_name, variant_name,
    product_price, plan_months, expected_advance, actual_advance
  ) values (
    a.id, c_id, a.variant_id, a.product_name, a.variant_name,
    a.product_price, a.plan_months, p_expected_advance, p_actual_advance
  ) returning id into contract_id;
  if p_actual_advance > 0 then
    insert into public.p5_advance_receipts(
      application_id, customer_id, amount, reference, received_by
    ) values (
      a.id, c_id, p_actual_advance, 'p5-verification:' || a.id::text || ':advance', auth.uid()
    );
  end if;
  update public.p5_verification_applications
    set status = 'approved', expected_advance = p_expected_advance,
        actual_advance = p_actual_advance, customer_id = c_id,
        installment_contract_id = contract_id, approved_at = now(), approved_by = auth.uid()
    where id = a.id;
  return jsonb_build_object('application_id', a.id, 'customer_id', c_id, 'contract_id', contract_id);
end;
$approve$;

drop policy p5_private_docs_insert_owner on storage.objects;
create policy p5_private_docs_insert_owner on storage.objects
for insert to authenticated
with check (
  bucket_id = 'p5-verification-docs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(name),1) = 2
  and split_part(name, '/', 3) ~ '^(front|back)\.(jpg|png|pdf)$'
  and exists (
    select 1 from public.p5_verification_applications a
    where a.id::text = (storage.foldername(name))[2]
      and a.owner_auth_id = (select auth.uid()) and a.status = 'pending'
      and a.document_front_path is null and a.document_back_path is null
  )
);

drop policy p5_private_docs_delete_owner_or_admin on storage.objects;
create policy p5_private_docs_delete_owner_or_admin on storage.objects
for delete to authenticated
using (
  bucket_id = 'p5-verification-docs'
  and (
    (select private.is_admin())
    or exists (
      select 1 from public.p5_verification_applications a
      where a.owner_auth_id = (select auth.uid())
        and a.id::text = (storage.foldername(name))[2]
        and a.status = 'pending'
        and a.document_front_path is null and a.document_back_path is null
    )
  )
);