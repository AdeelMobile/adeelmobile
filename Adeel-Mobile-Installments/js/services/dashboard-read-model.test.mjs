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
