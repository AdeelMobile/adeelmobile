-- Supporting indexes for the two non-unique foreign keys flagged by the database advisor.
-- These are additional to the six Step 37 search/filter indexes.
create index p6_customers_p5_customer_idx
  on public.p6_customers (p5_customer_id);
create index p6_customers_created_by_idx
  on public.p6_customers (created_by);