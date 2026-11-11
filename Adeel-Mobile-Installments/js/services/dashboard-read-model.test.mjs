import test from "node:test";
import assert from "node:assert/strict";
import { loadSalesDashboardSnapshot } from "./dashboard-read-model.mjs";

test("loads rows through the RLS-backed service and summarizes only that snapshot", async () => {
  const calls = [];
  const service = {
    async getVisibleSalesRecords(token, options) {
      calls.push({ token, options });
      return [
        { sale_amount: 10000, status: "completed", sale_date: "2026-11-10" },
        { sale_amount: 5000, status: "pending", sale_date: "2026-11-11" }
      ];
    }
  };
  const result = await loadSalesDashboardSnapshot(service, "in-memory-access-token", { limit: 20 });
  assert.deepEqual(calls, [{ token: "in-memory-access-token", options: { limit: 20 } }]);
  assert.equal(result.recordCount, 2);
  assert.equal(result.totalSaleAmount, 15000);
  assert.equal(result.isSnapshot, true);
});

test("does not hide service failures", async () => {
  const service = { getVisibleSalesRecords: async () => { throw new Error("denied"); } };
  await assert.rejects(loadSalesDashboardSnapshot(service, "token"), /denied/);
});

test("rejects a missing read-only service", async () => {
  await assert.rejects(loadSalesDashboardSnapshot(null, "token"), TypeError);
});


test("loads a bounded date-range summary and labels possible truncation", async () => {
  const calls = [];
  const service = {
    async getVisibleSalesRecordsByDateRange(token, options) {
      calls.push({ token, options });
      return [{ sale_amount: 1234.56, status: "paid", sale_date: "2026-11-15" }];
    }
  };
  const { loadSalesDashboardDateRange } = await import("./dashboard-read-model.mjs");
  const result = await loadSalesDashboardDateRange(service, "token", {
    startDate: "2026-11-01", endDate: "2026-11-30", limit: 10
  });
  assert.deepEqual(calls, [{
    token: "token",
    options: { startDate: "2026-11-01", endDate: "2026-11-30", limit: 10 }
  }]);
  assert.equal(result.totalSaleAmount, 1234.56);
  assert.deepEqual(result.period, { startDate: "2026-11-01", endDate: "2026-11-30" });
  assert.equal(result.isCompletePeriod, true);
  assert.equal(result.isSnapshot, true);
});

test("marks a date-range result incomplete when the row cap is reached", async () => {
  const { loadSalesDashboardDateRange } = await import("./dashboard-read-model.mjs");
  const service = { getVisibleSalesRecordsByDateRange: async () => [{sale_amount: 10},{sale_amount:20}] };
  const result = await loadSalesDashboardDateRange(service, "token", {
    startDate: "2026-11-01", endDate: "2026-11-30", limit: 2
  });
  assert.equal(result.isCompletePeriod, false);
});

test("rejects a service without date-range support", async () => {
  const { loadSalesDashboardDateRange } = await import("./dashboard-read-model.mjs");
  await assert.rejects(loadSalesDashboardDateRange({}, "token", {
    startDate: "2026-11-01", endDate: "2026-11-30"
  }), TypeError);
});
