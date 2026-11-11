import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseReadOnlyService, READ_ONLY_SALES_COLUMNS } from "./supabase-readonly.mjs";

const config = {
  url: "https://nqihozwbdrvpyalctwbc.supabase.co",
  publishableKey: "sb_publishable_test_key_for_unit_tests"
};
const token = "eyJhbGciOiJIUzI1NiJ9.test.signature";

test("trusted identity accepts only exact admin or user values", async () => {
  let request;
  const service = createSupabaseReadOnlyService({
    ...config,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => "user" };
    }
  });
  assert.equal(await service.whoAmI(token), "user");
  assert.match(request.url, /rpc\/ims_whoami$/);
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer " + token);
  assert.equal(request.options.cache, "no-store");
});

test("unknown identity is denied", async () => {
  const service = createSupabaseReadOnlyService({
    ...config,
    fetchImpl: async () => ({ ok: true, json: async () => "none" })
  });
  await assert.rejects(service.whoAmI(token), /Access denied/);
});

test("own sales read delegates ownership to RLS and sends no user filter", async () => {
  let request;
  const service = createSupabaseReadOnlyService({
    ...config,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => [] };
    }
  });
  assert.deepEqual(await service.getVisibleSalesRecords(token, { limit: 25 }), []);
  const parsed = new URL(request.url);
  assert.equal(parsed.pathname, "/rest/v1/sales_records");
  assert.equal(parsed.searchParams.get("limit"), "25");
  assert.equal(parsed.searchParams.get("select"), READ_ONLY_SALES_COLUMNS);
  assert.equal(parsed.searchParams.has("user_id"), false);
  assert.equal(request.options.method, "GET");
  assert.equal(request.options.cache, "no-store");
});

test("sales limit is bounded and rejects invalid values", async () => {
  const service = createSupabaseReadOnlyService({ ...config, fetchImpl: async () => ({ ok: true, json: async () => [] }) });
  await assert.rejects(service.getVisibleSalesRecords(token, { limit: 101 }), RangeError);
  await assert.rejects(service.getVisibleSalesRecords(token, { limit: 0 }), RangeError);
  await assert.rejects(service.getVisibleSalesRecords(token, { limit: 1.5 }), RangeError);
});

test("rejects missing credentials, unsafe URLs and non-publishable keys", async () => {
  assert.throws(() => createSupabaseReadOnlyService({ url: "http://example.com", publishableKey: config.publishableKey }), /Supabase project URL/);
  assert.throws(() => createSupabaseReadOnlyService({ url: "https://attacker.supabase.co", publishableKey: config.publishableKey }), /Adeel Mobile HTTPS Supabase/);
  assert.throws(() => createSupabaseReadOnlyService({ url: config.url + "/unexpected-path", publishableKey: config.publishableKey }), /Adeel Mobile HTTPS Supabase/);
  assert.throws(() => createSupabaseReadOnlyService({ url: config.url, publishableKey: "service_role_secret" }), /publishable key/);
  const service = createSupabaseReadOnlyService({ ...config, fetchImpl: async () => ({ ok: true, json: async () => [] }) });
  await assert.rejects(service.getVisibleSalesRecords(""), /access token/);
  await assert.rejects(service.getVisibleSalesRecords(token + " injected"), /access token/);
});

test("HTTP errors do not expose server response bodies", async () => {
  const service = createSupabaseReadOnlyService({
    ...config,
    fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ message: "sensitive server detail" }) })
  });
  await assert.rejects(service.getVisibleSalesRecords(token), error => {
    assert.equal(error.status, 403);
    assert.equal(error.message, "Supabase read failed (403).");
    return true;
  });
});


test("date-range sales read applies validated inclusive bounds without a user filter", async () => {
  let request;
  const service = createSupabaseReadOnlyService({
    ...config,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => [] };
    }
  });
  assert.deepEqual(await service.getVisibleSalesRecordsByDateRange(token, {
    startDate: "2026-11-01", endDate: "2026-11-30", limit: 40
  }), []);
  const parsed = new URL(request.url);
  assert.deepEqual(parsed.searchParams.getAll("sale_date"), ["gte.2026-11-01", "lte.2026-11-30"]);
  assert.equal(parsed.searchParams.get("limit"), "40");
  assert.equal(parsed.searchParams.get("select"), READ_ONLY_SALES_COLUMNS);
  assert.equal(parsed.searchParams.has("user_id"), false);
  assert.equal(request.options.method, "GET");
  assert.equal(request.options.cache, "no-store");
});

test("date-range sales read rejects invalid dates, reversed ranges and unsafe limits", async () => {
  const service = createSupabaseReadOnlyService({ ...config, fetchImpl: async () => ({ ok: true, json: async () => [] }) });
  await assert.rejects(service.getVisibleSalesRecordsByDateRange(token, { startDate: "2026-02-30", endDate: "2026-03-01" }), /valid YYYY-MM-DD/);
  await assert.rejects(service.getVisibleSalesRecordsByDateRange(token, { startDate: "2026-11-02", endDate: "2026-11-01" }), RangeError);
  await assert.rejects(service.getVisibleSalesRecordsByDateRange(token, { startDate: "2026-11-01", endDate: "2026-11-30", limit: 101 }), RangeError);
  await assert.rejects(service.getVisibleSalesRecordsByDateRange(token, { startDate: "2026-11-01T00:00:00Z", endDate: "2026-11-30" }), /valid YYYY-MM-DD/);
});
