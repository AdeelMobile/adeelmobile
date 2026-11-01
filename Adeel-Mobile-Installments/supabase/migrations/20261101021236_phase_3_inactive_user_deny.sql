create or replace function private.current_app_user_id()
returns bigint
language sql
stable
security definer
set search_path to ''
as $function$
  select u.id
  from public.users as u
  where u.auth_user_id = auth.uid()
    and u.status = 'active'
  limit 1;
$function$;

create or replace function private.current_app_referral_code()
returns text
language sql
stable
security definer
set search_path to ''
as $function$
  select u.referral_code
  from public.users as u
  where u.auth_user_id = auth.uid()
    and u.status = 'active'
  limit 1;
$function$;

drop policy if exists users_read_own on public.users;
create policy users_read_own
on public.users for select to authenticated
using (auth_user_id = auth.uid() and status = 'active');
