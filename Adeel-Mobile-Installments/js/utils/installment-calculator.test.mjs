import test from "node:test";
import assert from "node:assert/strict";
import { calculateInstallment, formatPKR } from "./installment-calculator.mjs";

test("price below 60,000 uses 20% advance", () => {
  const result = calculateInstallment(50000, 3);
  assert.equal(result.advancePercent, 20);
  assert.equal(result.advanceAmount, 10000);
  assert.equal(result.financedAmount, 40000);
  assert.equal(result.markupAmount, 6000);
  assert.equal(result.totalInstallmentBalance, 46000);
  assert.equal(result.monthlyInstallment, 46000 / 3);
});

test("exactly 60,000 uses 30% advance", () => {
  const result = calculateInstallment(60000, 6);
  assert.equal(result.advancePercent, 30);
  assert.equal(result.advanceAmount, 18000);
  assert.equal(result.financedAmount, 42000);
  assert.ok(Math.abs(result.markupAmount - 11760) < 1e-8);
  assert.ok(Math.abs(result.totalInstallmentBalance - 53760) < 1e-8);
  assert.ok(Math.abs(result.monthlyInstallment - 8960) < 1e-8);
});

test("above 60,000 uses 30% advance and 9-month markup", () => {
  const result = calculateInstallment(100000, 9);
  assert.equal(result.advancePercent, 30);
  assert.equal(result.advanceAmount, 30000);
  assert.equal(result.financedAmount, 70000);
  assert.equal(result.markupAmount, 26600);
  assert.equal(result.totalInstallmentBalance, 96600);
  assert.equal(result.monthlyInstallment, 10733.333333333334);
});

test("custom rules can be supplied without mutating defaults", () => {
  const custom = {
    currency: "PKR",
    advanceThreshold: 60000,
    advanceBelowThresholdPercent: 10,
    advanceAtOrAboveThresholdPercent: 25,
    plans: { 3: 5, 6: 10, 9: 15 },
  };
  const result = calculateInstallment(50000, 3, custom);
  assert.equal(result.advanceAmount, 5000);
  assert.equal(result.markupAmount, 2250);
});

test("rejects invalid prices and unsupported plans", () => {
  assert.throws(() => calculateInstallment(0, 3), TypeError);
  assert.throws(() => calculateInstallment(-1, 3), TypeError);
  assert.throws(() => calculateInstallment(Number.NaN, 3), TypeError);
  assert.throws(() => calculateInstallment(50000.5, 3), TypeError);
  assert.throws(() => calculateInstallment(Number.MAX_SAFE_INTEGER + 1, 3), TypeError);
  assert.throws(() => calculateInstallment(50000, 12), RangeError);
});

test("rejects malformed advance configuration", () => {
  const invalid = {
    currency: "PKR",
    advanceThreshold: 60000,
    advanceBelowThresholdPercent: 101,
    advanceAtOrAboveThresholdPercent: 30,
    plans: { 3: 15, 6: 28, 9: 38 },
  };
  assert.throws(() => calculateInstallment(50000, 3, invalid), TypeError);
});

test("PKR formatter rejects non-finite values and returns currency text", () => {
  assert.match(formatPKR(1000), /1,000/);
  assert.throws(() => formatPKR(Number.NaN), TypeError);
});

test("rejects advance configurations that leave no installment balance", () => {
  const invalid = {
    currency: "PKR",
    advanceThreshold: 60000,
    advanceBelowThresholdPercent: 100,
    advanceAtOrAboveThresholdPercent: 30,
    plans: { 3: 15, 6: 28, 9: 38 },
  };
  assert.throws(() => calculateInstallment(50000, 3, invalid), TypeError);
});
