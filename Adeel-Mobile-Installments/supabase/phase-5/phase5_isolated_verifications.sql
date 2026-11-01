-- Phase 5 isolated verification workflow.
-- IMPORTANT: Draft only. Do not apply until the user explicitly approves.
-- Existing verifications/customers/installment_plans/ims_* objects and customer-docs bucket are untouched.

create table public.p5_verification_applications (
  id bigint generated always as identity primary key,
  owner_auth_id uuid not null default auth.uid(),
  app_user_id bigint,
  customer_name text not null check (length(btrim(customer_name)) between 2 and 120),
  father_name text not null check (length(btrim(father_name)) between 2 and 120),
  cnic_number text not null check (cnic_number ~ '^[0-9]{5}-[0-9]{7}-[0-9]$'),
  customer_phone text not null check (length(regexp_replace(customer_phone, '\D', '', 'g')) between 10 and 13),
  customer_phone_normalized text generated always as (regexp_replace(customer_phone, '\D', '', 'g')) stored,
  whatsapp text not null check (length(regexp_replace(whatsapp, '\D', '', 'g')) between 10 and 13),
  address text not null check (length(btrim(address)) between 5 and 500),
  variant_id bigint not null references public.variants(id) on delete restrict,
  product_name text not null,
  variant_name text not null,
  product_price numeric(14,2) not null check (product_price > 0),
  plan_months integer not null check (plan_months in (3,6,9,12)),
  expected_advance numeric(14,2) check (expected_advance is null or expected_advance >= 0),
  actual_advance numeric(14,2) not null default 0 check (actual_advance >= 0),
  document_front_path text,
  document_back_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  customer_id bigint,
  installment_contract_id bigint,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid,
  rejected_at timestamptz,
  rejected_by uuid,
  constraint p5_rejection_reason_state check (
    (status <> 'rejected') or (rejection_reason is not null and length(btrim(rejection_reason)) > 0)
  )
);

create table public.p5_customers (
  id bigint generated always as identity primary key,
  application_id bigint not null unique references public.p5_verification_applications(id) on delete restrict,
  owner_auth_id uuid not null,
  app_user_id bigint,
  customer_name text not null,
  father_name text not null,
  cnic_number text not null,
  customer_phone text not null,
  whatsapp text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table public.p5_installment_contracts (
  id bigint generated always as identity primary key,
  application_id bigint not null unique references public.p5_verification_applications(id) on delete restrict,
  customer_id bigint not null references public.p5_customers(id) on delete restrict,
  variant_id bigint not null references public.variants(id) on delete restrict,
  product_name text not null,
  variant_name text not null,
  product_price numeric(14,2) not null check (product_price > 0),
  plan_months integer not null check (plan_months in (3,6,9,12)),
  expected_advance numeric(14,2) check (expected_advance is null or expected_advance >= 0),
  actual_advance numeric(14,2) not null check (actual_advance >= 0),
  created_at timestamptz not null default now()
);

create table public.p5_advance_receipts (
  id bigint generated always as identity primary key,
  application_id bigint not null unique references public.p5_verification_applications(id) on delete restrict,
  customer_id bigint not null references public.p5_customers(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  reference text not null unique,
  received_by uuid not null,
  received_at timestamptz not null default now()
);

create table public.p5_verification_events (
  id bigint generated always as identity primary key,
  application_id bigint not null references public.p5_verification_applications(id) on delete restrict,
  actor_auth_id uuid,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index p5_verifications_status_created_idx on public.p5_verification_applications(status, submitted_at desc, id desc);
create index p5_verifications_owner_created_idx on public.p5_verification_applications(owner_auth_id, submitted_at desc);
create unique index p5_verifications_one_pending_phone_idx
  on public.p5_verification_applications(owner_auth_id, customer_phone_normalized)
  where status = 'pending';
create index p5_events_application_created_idx on public.p5_verification_events(application_id, created_at asc);

create or replace function public.p5_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.p5_set_application_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  new.owner_auth_id := auth.uid();
  new.app_user_id := private.current_app_user_id();
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
$$;

create or replace function public.p5_record_application_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_event text; v_details jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    v_event := 'submitted';
  elsif old.status is distinct from new.status then
    v_event := 'status_' || new.status;
    if new.status = 'approved' then
      v_details := jsonb_build_object('actual_advance', new.actual_advance, 'expected_advance', new.expected_advance);
    elsif new.status = 'rejected' then
      v_details := jsonb_build_object('reason', new.rejection_reason);
    end if;
  elsif old.document_front_path is distinct from new.document_front_path
     or old.document_back_path is distinct from new.document_back_path then
    v_event := 'documents_attached';
  else
    return new;
  end if;
  insert into public.p5_verification_events(application_id, actor_auth_id, event_type, details)
  values (new.id, auth.uid(), v_event, v_details);
  return new;
end;
$$;

create trigger p5_verification_owner_before_insert
before insert on public.p5_verification_applications
for each row execute function public.p5_set_application_owner();

create trigger p5_verification_updated_at
before update on public.p5_verification_applications
for each row execute function public.p5_touch_updated_at();

create trigger p5_verification_event_after_change
after insert or update on public.p5_verification_applications
for each row execute function public.p5_record_application_event();

alter table public.p5_verification_applications enable row level security;
alter table public.p5_customers enable row level security;
alter table public.p5_installment_contracts enable row level security;
alter table public.p5_advance_receipts enable row level security;
alter table public.p5_verification_events enable row level security;

create policy p5_applications_select_owner_or_admin on public.p5_verification_applications
for select to authenticated
using (owner_auth_id = (select auth.uid()) or (select private.is_admin()));

create policy p5_applications_insert_owner on public.p5_verification_applications
for insert to authenticated
with check (owner_auth_id = (select auth.uid()) and status = 'pending');

create policy p5_customers_admin_read on public.p5_customers
for select to authenticated using ((select private.is_admin()));
create policy p5_contracts_admin_read on public.p5_installment_contracts
for select to authenticated using ((select private.is_admin()));
create policy p5_receipts_admin_read on public.p5_advance_receipts
for select to authenticated using ((select private.is_admin()));

create policy p5_events_owner_or_admin_read on public.p5_verification_events
for select to authenticated
using (
  (select private.is_admin()) or exists (
    select 1 from public.p5_verification_applications a
    where a.id = application_id and a.owner_auth_id = (select auth.uid())
  )
);

grant select, insert on public.p5_verification_applications to authenticated;
grant select on public.p5_customers, public.p5_installment_contracts,
  public.p5_advance_receipts, public.p5_verification_events to authenticated;
grant usage, select on sequence public.p5_verification_applications_id_seq to authenticated;

-- All post-submit writes go through narrowly scoped RPCs; clients cannot directly
-- update status, customer/contract IDs, advance values, or audit events.
create or replace function public.p5_attach_verification_documents(
  p_application_id bigint, p_front_path text, p_back_path text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select owner_auth_id into v_owner from public.p5_verification_applications
    where id = p_application_id and status = 'pending' for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'Application not found'; end if;
  if p_front_path = p_back_path
     or split_part(p_front_path, '/', 1) <> auth.uid()::text
     or split_part(p_front_path, '/', 2) <> p_application_id::text
     or split_part(p_back_path, '/', 1) <> auth.uid()::text
     or split_part(p_back_path, '/', 2) <> p_application_id::text
     or not exists (select 1 from storage.objects where bucket_id = 'p5-verification-docs' and name = p_front_path)
     or not exists (select 1 from storage.objects where bucket_id = 'p5-verification-docs' and name = p_back_path) then
    raise exception 'Invalid or missing document upload';
  end if;
  update public.p5_verification_applications
    set document_front_path = p_front_path, document_back_path = p_back_path
    where id = p_application_id;
end;
$$;


create or replace function public.p5_cancel_incomplete_application(p_application_id bigint)
returns void language plpgsql security definer set search_path = '' as $
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.p5_verification_applications
    where id = p_application_id and owner_auth_id = auth.uid()
      and status = 'pending' and document_front_path is null and document_back_path is null
    for update
  ) then raise exception 'Incomplete application cannot be removed'; end if;
  delete from public.p5_verification_events where application_id = p_application_id;
  delete from public.p5_verification_applications where id = p_application_id;
end;
$;
revoke all on function public.p5_cancel_incomplete_application(bigint) from public, anon;
grant execute on function public.p5_cancel_incomplete_application(bigint) to authenticated;

create or replace function public.p5_admin_approve_verification(
  p_application_id bigint, p_expected_advance numeric, p_actual_advance numeric
) returns jsonb language plpgsql security definer set search_path = '' as $$
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
  if a.document_front_path is null or a.document_back_path is null then
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
$$;

create or replace function public.p5_admin_reject_verification(
  p_application_id bigint, p_reason_code text, p_reason_detail text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_reason text;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Admin access required'; end if;
  if p_reason_code is null or p_reason_code not in ('invalid_id','duplicate_application','incomplete_info','other') then
    raise exception 'Invalid rejection reason';
  end if;
  v_reason := case p_reason_code
    when 'invalid_id' then 'Invalid ID document'
    when 'duplicate_application' then 'Duplicate application'
    when 'incomplete_info' then 'Incomplete information'
    else null end;
  if p_reason_code = 'other' then
    v_reason := nullif(btrim(coalesce(p_reason_detail,'')), '');
    if v_reason is null then raise exception 'Please provide the rejection reason'; end if;
  end if;
  update public.p5_verification_applications
    set status = 'rejected', rejection_reason = v_reason,
        rejected_at = now(), rejected_by = auth.uid()
    where id = p_application_id and status = 'pending';
  if not found then raise exception 'Only pending applications can be rejected'; end if;
end;
$$;

revoke all on function public.p5_attach_verification_documents(bigint,text,text) from public, anon;
revoke all on function public.p5_cancel_incomplete_application(bigint) from public, anon;
revoke all on function public.p5_admin_approve_verification(bigint,numeric,numeric) from public, anon;
revoke all on function public.p5_admin_reject_verification(bigint,text,text) from public, anon;
grant execute on function public.p5_attach_verification_documents(bigint,text,text) to authenticated;
grant execute on function public.p5_cancel_incomplete_application(bigint) to authenticated;
grant execute on function public.p5_admin_approve_verification(bigint,numeric,numeric) to authenticated;
grant execute on function public.p5_admin_reject_verification(bigint,text,text) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('p5-verification-docs', 'p5-verification-docs', false, 8388608,
  array['image/jpeg','image/png','application/pdf'])
;

create policy p5_private_docs_insert_owner on storage.objects
for insert to authenticated
with check (
  bucket_id = 'p5-verification-docs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.p5_verification_applications a
    where a.id::text = (storage.foldername(name))[2]
      and a.owner_auth_id = (select auth.uid()) and a.status = 'pending'
  )
);

create policy p5_private_docs_select_owner_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'p5-verification-docs'
  and (
    (select private.is_admin())
    or exists (
      select 1 from public.p5_verification_applications a
      where a.owner_auth_id = (select auth.uid())
        and a.id::text = (storage.foldername(name))[2]
    )
  )
);

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
    )
  )
);
