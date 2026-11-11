import test from "node:test";
import assert from "node:assert/strict";
import { buildInstallmentSchedule } from "./installment-schedule.mjs";

test("builds three equal monthly payments with exact total", () => {
  const rows = buildInstallmentSchedule(1000, 3, "2026-01-15");
  assert.deepEqual(rows.map(x => x.dueDate), ["2026-02-15", "2026-03-15", "2026-04-15"]);
  assert.deepEqual(rows.map(x => x.amountPaisa), [33333, 33333, 33334]);
  assert.equal(rows.reduce((sum, x) => sum + x.amountPaisa, 0), 100000);
});

test("clamps month-end due dates without drifting", () => {
  const rows = buildInstallmentSchedule(900, 3, "2026-01-31");
  assert.deepEqual(rows.map(x => x.dueDate), ["2026-02-28", "2026-03-31", "2026-04-30"]);
});

test("handles leap-year February", () => {
  const rows = buildInstallmentSchedule(600, 3, "2028-01-31");
  assert.equal(rows[0].dueDate, "2028-02-29");
  assert.equal(rows[1].dueDate, "2028-03-31");
});

test("creates supported 6 and 9 month schedules", () => {
  assert.equal(buildInstallmentSchedule(6000, 6, "2026-06-30").length, 6);
  assert.equal(buildInstallmentSchedule(9000, 9, "2026-06-30").length, 9);
});

test("rejects invalid totals, plans and dates", () => {
  assert.throws(() => buildInstallmentSchedule(0, 3, "2026-01-01"), TypeError);
  assert.throws(() => buildInstallmentSchedule(100, 12, "2026-01-01"), RangeError);
  assert.throws(() => buildInstallmentSchedule(100, 3, "2026-02-30"), RangeError);
  assert.throws(() => buildInstallmentSchedule(0.01, 3, "2026-01-01"), RangeError);
});
