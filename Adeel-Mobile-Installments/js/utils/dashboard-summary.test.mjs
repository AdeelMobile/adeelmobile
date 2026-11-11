import test from "node:test";
import assert from "node:assert/strict";
import { summarizeSalesSnapshot } from "./dashboard-summary.mjs";

test("summarizes only supplied rows and groups statuses case-insensitively", () => {
  const result = summarizeSalesSnapshot([
    { sale_amount: 12500, status: "Completed", sale_date: "2026-11-10" },
    { sale_amount: "2500.50", status: "completed", sale_date: "2026-11-11" },
    { sale_amount: 1000, status: "Pending", sale_date: "invalid" }
  ]);
  assert.equal(result.recordCount, 3);
  assert.equal(result.totalSaleAmount, 16000.5);
  assert.equal(result.amountRowCount, 3);
  assert.equal(result.rowsMissingAmount, 0);
  assert.equal(result.invalidAmountRows, 0);
  assert.deepEqual({ ...result.byStatus }, { completed: 2, pending: 1 });
  assert.equal(result.latestSaleDate, "2026-11-11");
  assert.equal(result.isSnapshot, true);
});

test("does not count missing, negative or non-finite amounts", () => {
  const result = summarizeSalesSnapshot([
    { sale_amount: null, status: "paid" },
    { sale_amount: -10, status: "paid" },
    { sale_amount: "not-a-number", status: "" },
    { sale_amount: "Infinity", status: "paid" }
  ]);
  assert.equal(result.totalSaleAmount, 0);
  assert.equal(result.amountRowCount, 0);
  assert.equal(result.rowsMissingAmount, 4);
  assert.equal(result.invalidAmountRows, 4);
  assert.equal(result.byStatus.unspecified, 1);
});

test("uses integer paisa and rejects unsafe amount precision or overflow", () => {
  const result = summarizeSalesSnapshot([
    { sale_amount: 0.1 },
    { sale_amount: 0.2 },
    { sale_amount: Number.MAX_VALUE },
    { sale_amount: Number.MAX_SAFE_INTEGER }
  ]);
  assert.equal(result.totalSaleAmount, 0.3);
  assert.equal(result.amountRowCount, 2);
  assert.equal(result.invalidAmountRows, 2);
});

test("returns zero metrics for an empty snapshot", () => {
  assert.deepEqual({ ...summarizeSalesSnapshot([]) }, {
    recordCount: 0,
    totalSaleAmount: 0,
    amountRowCount: 0,
    rowsMissingAmount: 0,
    invalidAmountRows: 0,
    byStatus: {},
    latestSaleDate: null,
    isSnapshot: true
  });
});

test("rejects malformed input", () => {
  assert.throws(() => summarizeSalesSnapshot(null), TypeError);
  assert.throws(() => summarizeSalesSnapshot([null]), TypeError);
  assert.throws(() => summarizeSalesSnapshot(["row"]), TypeError);
});
