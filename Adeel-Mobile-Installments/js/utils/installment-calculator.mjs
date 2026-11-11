/**
 * Adeel Mobile Installments — finance calculator
 *
 * Pure calculation only. It does not write to Supabase or create a sale.
 * Amounts are PKR. Keep calculation precision here; round only for display
 * until the business confirms a formal ledger-rounding policy.
 */

export const DEFAULT_INSTALLMENT_RULES = Object.freeze({
  currency: "PKR",
  advanceThreshold: 60000,
  advanceBelowThresholdPercent: 20,
  advanceAtOrAboveThresholdPercent: 30,
  plans: Object.freeze({
    3: 15,
    6: 28,
    9: 38,
  }),
});

const isValidRetailPrice = (value) =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

export function calculateInstallment(retailPrice, months, rules = DEFAULT_INSTALLMENT_RULES) {
  if (!isValidRetailPrice(retailPrice)) {
    throw new TypeError("Retail price must be a positive whole-rupee safe integer.");
  }

  if (!rules || typeof rules !== "object") {
    throw new TypeError("Installment rules are required.");
  }

  const markupPercent = rules.plans?.[months];
  if (!Number.isInteger(months) || !Number.isFinite(markupPercent) || markupPercent < 0) {
    throw new RangeError("Plan must be configured for 3, 6, or 9 months.");
  }

  const threshold = rules.advanceThreshold;
  const belowPercent = rules.advanceBelowThresholdPercent;
  const atOrAbovePercent = rules.advanceAtOrAboveThresholdPercent;

  if (![threshold, belowPercent, atOrAbovePercent].every(Number.isFinite) ||
      threshold <= 0 || belowPercent < 0 || atOrAbovePercent < 0 ||
      belowPercent >= 100 || atOrAbovePercent >= 100) {
    throw new TypeError("Advance settings are invalid.");
  }

  const advancePercent = retailPrice < threshold ? belowPercent : atOrAbovePercent;
  const advanceAmount = retailPrice * (advancePercent / 100);
  const financedAmount = retailPrice - advanceAmount;
  const markupAmount = financedAmount * (markupPercent / 100);
  const totalInstallmentBalance = financedAmount + markupAmount;

  return Object.freeze({
    currency: rules.currency || "PKR",
    retailPrice,
    months,
    advancePercent,
    advanceAmount,
    financedAmount,
    markupPercent,
    markupAmount,
    totalInstallmentBalance,
    monthlyInstallment: totalInstallmentBalance / months,
  });
}

export function formatPKR(amount, locale = "en-PK") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError("Amount must be a finite number.");
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
