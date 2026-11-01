create table if not exists private.admin_allowlist (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint admin_allowlist_email_lowercase check (email = lower(email))
);

revoke all on table private.admin_allowlist from public, anon, authenticated;

insert into private.admin_allowlist (auth_user_id, email, enabled)
values ('b503f7eb-e570-4a6a-83e7-1b97e9f20635'::uuid, 'adeelmobilelinkroad@gmail.com', true)
on conflict (auth_user_id) do update
set email = excluded.email, enabled = true;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select auth.uid() is not null
     and exists (
       select 1
       from private.admin_allowlist as a
       where a.auth_user_id = auth.uid()
         and a.enabled is true
     );
$function$;

create or replace function public.ims_whoami()
returns text
language sql
stable
security definer
set search_path to ''
as $function$
  select case
    when private.is_admin() then 'admin'
    when exists (
      select 1
      from public.users as u
      where u.auth_user_id = auth.uid()
        and u.status = 'active'
    ) then 'user'
    else 'none'
  end;
$function$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

revoke all on function public.ims_whoami() from public, anon;
grant execute on function public.ims_whoami() to authenticated;
