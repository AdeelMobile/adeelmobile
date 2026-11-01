grant select, insert, update, delete on public.user_brand_incentives to authenticated;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.sync_variant_cover() from public, anon, authenticated;
