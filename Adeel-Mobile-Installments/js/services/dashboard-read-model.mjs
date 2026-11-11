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
