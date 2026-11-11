/**
 * Pure, read-only summary helpers for an already-authorized sales-record
 * snapshot. These figures describe only the rows supplied by the caller;
 * they are not lifetime totals unless the caller has fetched the full range.
 */
export function summarizeSalesSnapshot(rows) {
  if (!Array.isArray(rows)) throw new TypeError("Sales records must be an array.");

  let totalSaleAmount = 0;
  let amountRowCount = 0;
  const byStatus = Object.create(null);
  let latestSaleDate = null;

  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new TypeError("Each sales record must be an object.");
    }

    const status = typeof row.status === "string" && row.status.trim()
      ? row.status.trim().toLowerCase()
      : "unspecified";
    byStatus[status] = (byStatus[status] || 0) + 1;

    const amount = typeof row.sale_amount === "number"
      ? row.sale_amount
      : typeof row.sale_amount === "string" && row.sale_amount.trim()
        ? Number(row.sale_amount)
        : NaN;
    if (Number.isFinite(amount) && amount >= 0) {
      totalSaleAmount += amount;
      amountRowCount += 1;
    }

    if (typeof row.sale_date === "string" && row.sale_date.trim()) {
      const parsed = Date.parse(row.sale_date);
      if (Number.isFinite(parsed) &&
          (latestSaleDate === null || parsed > Date.parse(latestSaleDate))) {
        latestSaleDate = row.sale_date;
      }
    }
  }

  return Object.freeze({
    recordCount: rows.length,
    totalSaleAmount: Math.round((totalSaleAmount + Number.EPSILON) * 100) / 100,
    amountRowCount,
    rowsMissingAmount: rows.length - amountRowCount,
    byStatus: Object.freeze({ ...byStatus }),
    latestSaleDate,
    isSnapshot: true
  });
}
