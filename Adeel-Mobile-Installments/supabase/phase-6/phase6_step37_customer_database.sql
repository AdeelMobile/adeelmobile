-- Phase 6 / Step 37 — additive customer database.
-- Preserve legacy public.customers and all Phase 5 objects/data.
-- New Phase 6 canonical records live in p6_customers.
-- Phase 5 approval RPC is intentionally not modified in this migration.

create extension if not exists pg_trgm with schema extensions;

create table public.p6_customers (
  id bigint generated always as identity primary key,
  verification_id bigint not null,
  p5_customer_id bigint not null,
  owner_auth_id uuid not null,
  referring_user_id bigint,
  created_by uuid,
  name text not null,
  phone text not null,
  whatsapp text,
  address text not null,
  cnic text not null,
  category text not null default 'approved',
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint p6_customers_verification_id_key
    unique (verification_id),
  constraint p6_customers_verification_fk
    foreign key (verification_id)
    references public.p5_verification_applications(id) on delete restrict,
  constraint p6_customers_p5_customer_fk
    foreign key (p5_customer_id)
    references public.p5_customers(id) on delete restrict,
  constraint p6_customers_owner_auth_fk
    foreign key (owner_auth_id)
    references auth.users(id) on delete restrict,
  constraint p6_customers_referring_user_fk
    foreign key (referring_user_id)
    references public.users(id) on delete set null,
  constraint p6_customers_created_by_fk
    foreign key (created_by)
    references auth.users(id) on delete set null,
  constraint p6_customers_category_check
    check (category in ('pending', 'approved', 'rejected', 'repeat_customer')),
  constraint p6_customers_status_check
    check (status in ('active', 'inactive'))
);

-- Six secondary indexes; the UNIQUE verification_id constraint has its own index.
create index p6_customers_owner_created_idx
  on public.p6_customers (owner_auth_id, created_at desc);
create index p6_customers_referring_user_idx
  on public.p6_customers (referring_user_id, created_at desc);
create index p6_customers_category_status_idx
  on public.p6_customers (category, status);
create index p6_customers_name_trgm_idx
  on public.p6_customers using gin (name extensions.gin_trgm_ops);
create index p6_customers_phone_trgm_idx
  on public.p6_customers using gin (phone extensions.gin_trgm_ops);
create index p6_customers_cnic_trgm_idx
  on public.p6_customers using gin (cnic extensions.gin_trgm_ops);

create or replace function public.p6_touch_customer_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $p6$
begin
  new.updated_at := now();
  return new;
end;
$p6$;

revoke all on function public.p6_touch_customer_updated_at() from public, anon, authenticated;

create trigger p6_customers_updated_at
before update on public.p6_customers
for each row execute function public.p6_touch_customer_updated_at();

alter table public.p6_customers enable row level security;

create policy p6_customers_owner_read
on public.p6_customers
for select to authenticated
using ((select auth.uid()) = owner_auth_id);

create policy p6_customers_admin_all
on public.p6_customers
for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

grant select, insert, update, delete on public.p6_customers to authenticated;
grant usage, select on sequence public.p6_customers_id_seq to authenticated;

-- Separate link table keeps the existing Phase 5 installment-contract table untouched.
create table public.p6_customer_installments (
  id bigint generated always as identity primary key,
  customer_id bigint not null
    references public.p6_customers(id) on delete restrict,
  installment_contract_id bigint not null unique
    references public.p5_installment_contracts(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index p6_customer_installments_customer_idx
  on public.p6_customer_installments (customer_id, created_at desc);

alter table public.p6_customer_installments enable row level security;

create policy p6_customer_installments_owner_read
on public.p6_customer_installments
for select to authenticated
using (
  exists (
    select 1
    from public.p6_customers c
    where c.id = customer_id
      and c.owner_auth_id = (select auth.uid())
  )
);

create policy p6_customer_installments_admin_all
on public.p6_customer_installments
for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

grant select, insert, update, delete on public.p6_customer_installments to authenticated;
grant usage, select on sequence public.p6_customer_installments_id_seq to authenticated;

-- Copy approved Phase 5 customer snapshots. Source rows remain unchanged.
-- Repeat classification is based on earlier approved records sharing the same CNIC.
with source_rows as (
  select
    pc.id as p5_customer_id,
    pc.application_id as verification_id,
    pc.owner_auth_id,
    pc.app_user_id as referring_user_id,
    a.approved_by as created_by,
    pc.customer_name as name,
    pc.customer_phone as phone,
    pc.whatsapp,
    pc.address,
    pc.cnic_number as cnic,
    pc.created_at,
    row_number() over (
      partition by regexp_replace(pc.cnic_number, '[^0-9]', '', 'g')
      order by pc.created_at, pc.id
    ) as cnic_occurrence
  from public.p5_customers pc
  join public.p5_verification_applications a
    on a.id = pc.application_id
  where a.status = 'approved'
)
insert into public.p6_customers (
  verification_id, p5_customer_id, owner_auth_id, referring_user_id,
  created_by, name, phone, whatsapp, address, cnic, category, status,
  created_at, updated_at
)
select
  verification_id, p5_customer_id, owner_auth_id, referring_user_id,
  created_by, name, phone, whatsapp, address, cnic,
  case when cnic_occurrence > 1 then 'repeat_customer' else 'approved' end,
  'active',
  created_at, created_at
from source_rows
on conflict (verification_id) do nothing;

-- Link existing Phase 5 contracts to the new customer profiles, without altering contracts.
insert into public.p6_customer_installments (customer_id, installment_contract_id)
select c.id, ic.id
from public.p5_installment_contracts ic
join public.p6_customers c
  on c.verification_id = ic.application_id
on conflict (installment_contract_id) do nothing;
