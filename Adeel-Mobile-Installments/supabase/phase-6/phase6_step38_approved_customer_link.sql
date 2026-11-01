-- Phase 6 / Step 38 — link approved Phase 5 verifications to canonical Phase 6 customers.
-- Additive only: no Phase 5 functions/tables or legacy customer objects are modified.
-- A private mapping table supports multiple approved applications for one customer profile.

create table public.p6_customer_verifications (
  id bigint generated always as identity primary key,
  customer_id bigint not null
    references public.p6_customers(id) on delete restrict,
  verification_id bigint not null unique
    references public.p5_verification_applications(id) on delete restrict,
  p5_customer_id bigint not null unique
    references public.p5_customers(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index p6_customer_verifications_customer_idx
  on public.p6_customer_verifications (customer_id, created_at desc);

alter table public.p6_customer_verifications enable row level security;
-- Deliberately no API grants or client policies: this is an internal relationship table
-- maintained only by the approval transaction's trigger.

create index p6_customers_owner_cnic_exact_idx
  on public.p6_customers (
    owner_auth_id,
    (regexp_replace(cnic, '[^0-9]', '', 'g'))
  );

-- Preserve any Step 37 rows as explicit verification links (idempotent).
insert into public.p6_customer_verifications (
  customer_id, verification_id, p5_customer_id
)
select id, verification_id, p5_customer_id
from public.p6_customers
on conflict (verification_id) do nothing;

create or replace function public.p6_link_approved_verification()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $p6link$
declare
  v_p5_customer_id bigint;
  v_contract_id bigint;
  v_customer_id bigint;
  v_linked_customer_id bigint;
  v_is_repeat boolean := false;
  v_normalized_cnic text;
begin
  if new.status <> 'approved' or old.status is not distinct from new.status then
    return new;
  end if;

  if new.customer_id is null or new.installment_contract_id is null then
    raise exception 'Approved verification is missing its Phase 5 customer or installment contract';
  end if;

  select pc.id
    into v_p5_customer_id
  from public.p5_customers pc
  where pc.id = new.customer_id
    and pc.application_id = new.id;

  if v_p5_customer_id is null then
    raise exception 'Approved verification has no matching Phase 5 customer';
  end if;

  select ic.id
    into v_contract_id
  from public.p5_installment_contracts ic
  where ic.id = new.installment_contract_id
    and ic.application_id = new.id
    and ic.customer_id = v_p5_customer_id;

  if v_contract_id is null then
    raise exception 'Approved verification has no matching Phase 5 installment contract';
  end if;

  v_normalized_cnic := regexp_replace(new.cnic_number, '[^0-9]', '', 'g');

  -- Serialize approvals for the same owner + CNIC to avoid concurrent duplicates.
  perform pg_advisory_xact_lock(
    hashtextextended(new.owner_auth_id::text || ':' || v_normalized_cnic, 0)
  );

  -- First recover a profile already created for this exact verification (e.g. Step 37 backfill).
  select c.id
    into v_customer_id
  from public.p6_customers c
  where c.verification_id = new.id
  for update;

  if v_customer_id is null then
    -- Reuse a same-owner profile for the same normalized CNIC.
    select c.id
      into v_customer_id
    from public.p6_customers c
    where c.owner_auth_id = new.owner_auth_id
      and regexp_replace(c.cnic, '[^0-9]', '', 'g') = v_normalized_cnic
    order by c.created_at, c.id
    limit 1
    for update;

    if v_customer_id is not null then
      v_is_repeat := true;
      update public.p6_customers
        set category = 'repeat_customer'
      where id = v_customer_id
        and category <> 'repeat_customer';
    end if;
  end if;

  if v_customer_id is null then
    insert into public.p6_customers (
      verification_id, p5_customer_id, owner_auth_id, referring_user_id,
      created_by, name, phone, whatsapp, address, cnic, category, status
    )
    select
      new.id, pc.id, new.owner_auth_id, new.app_user_id,
      new.approved_by, pc.customer_name, pc.customer_phone, pc.whatsapp,
      pc.address, pc.cnic_number, 'approved', 'active'
    from public.p5_customers pc
    where pc.id = v_p5_customer_id
    returning id into v_customer_id;
  end if;

  insert into public.p6_customer_verifications (
    customer_id, verification_id, p5_customer_id
  )
  values (v_customer_id, new.id, v_p5_customer_id)
  on conflict (verification_id) do nothing;

  select customer_id
    into v_linked_customer_id
  from public.p6_customer_verifications
  where verification_id = new.id;

  if v_linked_customer_id is distinct from v_customer_id then
    raise exception 'Verification is already linked to a different Phase 6 customer';
  end if;

  insert into public.p6_customer_installments (
    customer_id, installment_contract_id
  )
  values (v_customer_id, v_contract_id)
  on conflict (installment_contract_id) do nothing;

  select customer_id
    into v_linked_customer_id
  from public.p6_customer_installments
  where installment_contract_id = v_contract_id;

  if v_linked_customer_id is distinct from v_customer_id then
    raise exception 'Installment contract is already linked to a different Phase 6 customer';
  end if;

  return new;
end;
$p6link$;

revoke all on function public.p6_link_approved_verification() from public, anon, authenticated;

create trigger p6_customer_after_verification_approved
after update of status on public.p5_verification_applications
for each row
when (old.status is distinct from new.status and new.status = 'approved')
execute function public.p6_link_approved_verification();
