-- Normalize Pakistani local and +92 phone formats consistently before the pending-duplicate check.
create or replace function public.p5_normalize_phone(p_value text)
returns text language plpgsql immutable set search_path = '' as $p5phone$
declare digits text;
begin
  digits := regexp_replace(coalesce(p_value, ''), '[^0-9]', '', 'g');
  if left(digits, 4) = '0092' then digits := substr(digits, 3); end if;
  if left(digits, 2) = '92' and length(digits) = 12 then digits := '0' || substr(digits, 3); end if;
  if length(digits) = 10 and left(digits, 1) = '3' then digits := '0' || digits; end if;
  return digits;
end;
$p5phone$;
alter table public.p5_verification_applications
  add column customer_phone_key text
  generated always as (public.p5_normalize_phone(customer_phone)) stored;
drop index public.p5_verifications_one_pending_phone_idx;
create unique index p5_verifications_one_pending_phone_idx
  on public.p5_verification_applications(owner_auth_id, customer_phone_key)
  where status = 'pending';