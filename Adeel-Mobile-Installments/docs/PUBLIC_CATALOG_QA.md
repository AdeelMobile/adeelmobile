# Public Phone Catalog — QA Checklist

Status: page and read-only query implementation committed; browser/API execution pending.

## Data and security design

- Uses the existing Supabase project URL and a publishable (browser-safe) key only.
- Queries only public `brands` and `variants` rows, embedding their `models` and `brands` relationships.
- Applies `show_brand`, `show_catalog`, `show_website`, and active/upcoming status filters.
- Does not query staff, customers, CNIC, sales, orders, contracts, payments or private settings.
- Does not perform insert, update, delete, upload or RPC operations.
- Product images are restricted to HTTPS objects in the existing project's public `phone-images` bucket.
- Product-provided text is rendered with textContent, not innerHTML.

## Automated static checks

Run `npm test` from the app folder. Static tests verify the catalog files, publishable-key format, visibility filters, and price-prefill link. These tests do not prove that the hosted Supabase REST API request succeeds.

## Browser checks required

- [ ] Open the website root and verify it redirects to the public catalog.
- [ ] Verify all 9 visible brands appear in the brand selector.
- [ ] Verify catalog results load; last read-only DB snapshot showed 146 visible variants.
- [ ] Verify active models display normally and upcoming models display a Coming soon label.
- [ ] Search by brand, model and variant.
- [ ] Filter by brand and clear filters.
- [ ] Sort low-to-high, high-to-low and by name.
- [ ] Confirm discount price is used only when positive and below retail price.
- [ ] Confirm broken/missing images show the AM fallback.
- [ ] Open Estimate installments and verify the correct price is prefilled.
- [ ] Confirm no CORS/API errors in browser console/network panel.
- [ ] Confirm 360px/390px/412px and desktop layouts.
- [ ] Confirm the browser does not send personal/customer data.

## Release gate

The website is not production-ready until real browser testing confirms the Data API request, RLS visibility, CORS, image loading, mobile layout and Google Safe Browsing status. No production deployment has been made.
