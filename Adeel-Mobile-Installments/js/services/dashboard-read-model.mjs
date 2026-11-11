import { summarizeSalesSnapshot } from "../utils/dashboard-summary.mjs";

/**
 * Loads an explicitly bounded sales snapshot through the authenticated,
 * read-only adapter and derives display metrics from exactly those rows.
 */
export async function loadSalesDashboardSnapshot(readOnlyService, accessToken, { limit = 50 } = {}) {
  if (!readOnlyService || typeof readOnlyService.getVisibleSalesRecords !== "function") {
    throw new TypeError("A configured read-only Supabase service is required.");
  }
  const rows = await readOnlyService.getVisibleSalesRecords(accessToken, { limit });
  return summarizeSalesSnapshot(rows);
}


/**
 * Loads an inclusive calendar-date range. The bounded row limit is explicit;
 * this helper must not be presented as a complete period total when truncated.
 */
export async function loadSalesDashboardDateRange(readOnlyService, accessToken, { startDate, endDate, limit = 100 } = {}) {
  if (!readOnlyService || typeof readOnlyService.getVisibleSalesRecordsByDateRange !== "function") {
    throw new TypeError("A date-range capable read-only Supabase service is required.");
  }
  const rows = await readOnlyService.getVisibleSalesRecordsByDateRange(accessToken, {
    startDate, endDate, limit
  });
  const summary = summarizeSalesSnapshot(rows);
  return Object.freeze({
    ...summary,
    period: Object.freeze({ startDate, endDate }),
    isCompletePeriod: rows.length < limit,
    isSnapshot: true
  });
}
