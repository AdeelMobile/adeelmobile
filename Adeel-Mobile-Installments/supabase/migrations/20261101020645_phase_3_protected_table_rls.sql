drop policy if exists "Enable delete access for all users" on public.verifications;
drop policy if exists "Enable insert access for all users" on public.verifications;
drop policy if exists "Enable read access for all users" on public.verifications;
drop policy if exists "Enable update access for all users" on public.verifications;

drop policy if exists "Enable delete access for all users" on public.user_brand_incentives;
drop policy if exists "Enable insert access for all users" on public.user_brand_incentives;
drop policy if exists "Enable read access for all users" on public.user_brand_incentives;
drop policy if exists "Enable update access for all users" on public.user_brand_incentives;

create policy user_brand_incentives_admin_all
on public.user_brand_incentives
for all to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy user_brand_incentives_user_read_own
on public.user_brand_incentives
for select to authenticated
using (user_id = private.current_app_user_id());

drop policy if exists "Admins can delete sales records" on public.sales_records;
drop policy if exists "Admins can insert sales records" on public.sales_records;
drop policy if exists "Admins can update sales records" on public.sales_records;
drop policy if exists "Users can view their own sales records" on public.sales_records;

create policy sales_records_admin_delete
on public.sales_records for delete to authenticated
using (private.is_admin());

create policy sales_records_admin_insert
on public.sales_records for insert to authenticated
with check (private.is_admin());

create policy sales_records_admin_update
on public.sales_records for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy sales_records_read_own_or_admin
on public.sales_records for select to authenticated
using (private.is_admin() or user_id = private.current_app_user_id());

drop policy if exists allow_all_colors on public.colors;
alter table public.colors enable row level security;

create policy colors_public_read
on public.colors for select to anon, authenticated
using (true);

create policy colors_admin_write
on public.colors for all to authenticated
using (private.is_admin())
with check (private.is_admin());

grant select on public.colors to anon, authenticated;
grant insert, update, delete on public.colors to authenticated;

alter table public.download_history enable row level security;

drop policy if exists download_history_admin_all on public.download_history;
create policy download_history_admin_all
on public.download_history for all to authenticated
using (private.is_admin())
with check (private.is_admin());
