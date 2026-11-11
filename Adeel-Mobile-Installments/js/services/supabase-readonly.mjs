/**
 * Read-only authenticated Supabase data access.
 *
 * This module deliberately exposes only a small allowlist of reads. It never
 * accepts a user_id filter, never writes data, and relies on database RLS for
 * row visibility (staff-own/admin-all). Callers must keep the access token in memory and pass it only
 * for the duration of a request. This is not an authentication/session manager.
 */
const CUSTOMER_COLUMNS = [
  "id",
  "name",
  "phone",
  "category",
  "status",
  "created_at",
  "updated_at"
].join(",");

const SALES_COLUMNS = [
  "id",
  "order_reference",
  "customer_name",
  "product_name",
  "sale_amount",
  "sale_date",
  "status",
  "notes",
  "created_at"
].join(",");

function requireConfig(config) {
  if (!config || typeof config.url !== "string" || typeof config.publishableKey !== "string") {
    throw new TypeError("Supabase URL and publishable key are required.");
  }
  const url = new URL(config.url);
  if (url.protocol !== "https:" ||
      url.hostname !== "nqihozwbdrvpyalctwbc.supabase.co" ||
      url.username || url.password || url.pathname !== "/" ||
      url.search || url.hash) {
    throw new TypeError("The configured Adeel Mobile HTTPS Supabase project URL is required.");
  }
  if (!config.publishableKey.startsWith("sb_publishable_")) {
    throw new TypeError("A Supabase publishable key is required.");
  }
  return { baseUrl: url.origin, key: config.publishableKey };
}

function requireDateOnly(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(label + " must be a valid YYYY-MM-DD date.");
  }
  const parsed = new Date(value + "T00:00:00.000Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TypeError(label + " must be a valid YYYY-MM-DD date.");
  }
  return value;
}

function requireAccessToken(token) {
  if (typeof token !== "string" || token.length < 20 || /\s/.test(token)) {
    throw new TypeError("A valid access token is required.");
  }
  return token;
}

function makeHeaders(key, token) {
  return {
    apikey: key,
    Authorization: "Bearer " + token,
    Accept: "application/json"
  };
}

async function readJson(response) {
  if (!response || typeof response.ok !== "boolean") {
    throw new TypeError("Fetch returned an invalid response.");
  }
  if (!response.ok) {
    const error = new Error("Supabase read failed (" + response.status + ").");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function createSupabaseReadOnlyService({ url, publishableKey, fetchImpl = globalThis.fetch } = {}) {
  const config = requireConfig({ url, publishableKey });
  if (typeof fetchImpl !== "function") throw new TypeError("A fetch implementation is required.");

  async function whoAmI(accessToken) {
    const token = requireAccessToken(accessToken);
    const response = await fetchImpl(config.baseUrl + "/rest/v1/rpc/ims_whoami", {
      method: "POST",
      headers: { ...makeHeaders(config.key, token), "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store"
    });
    const identity = await readJson(response);
    if (identity !== "admin" && identity !== "user") {
      throw new Error("Access denied: trusted application identity was not confirmed.");
    }
    return identity;
  }

  async function getVisibleCustomers(accessToken, { limit = 50 } = {}) {
    const token = requireAccessToken(accessToken);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("Customer record limit must be between 1 and 100.");
    }
    const params = new URLSearchParams({
      select: CUSTOMER_COLUMNS,
      order: "created_at.desc,id.desc",
      limit: String(limit)
    });
    const response = await fetchImpl(config.baseUrl + "/rest/v1/p6_customers?" + params.toString(), {
      method: "GET",
      headers: makeHeaders(config.key, token),
      cache: "no-store"
    });
    const rows = await readJson(response);
    if (!Array.isArray(rows)) throw new TypeError("Unexpected customer records response.");
    return rows;
  }

  async function getVisibleSalesRecords(accessToken, { limit = 50 } = {}) {
    const token = requireAccessToken(accessToken);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("Sales record limit must be between 1 and 100.");
    }
    const params = new URLSearchParams({
      select: SALES_COLUMNS,
      order: "sale_date.desc.nullslast,created_at.desc",
      limit: String(limit)
    });
    const response = await fetchImpl(config.baseUrl + "/rest/v1/sales_records?" + params.toString(), {
      method: "GET",
      headers: makeHeaders(config.key, token),
      cache: "no-store"
    });
    const rows = await readJson(response);
    if (!Array.isArray(rows)) throw new TypeError("Unexpected sales records response.");
    return rows;
  }

  async function getVisibleSalesRecordsByDateRange(accessToken, { startDate, endDate, limit = 100 } = {}) {
    const token = requireAccessToken(accessToken);
    const start = requireDateOnly(startDate, "Start date");
    const end = requireDateOnly(endDate, "End date");
    if (start > end) throw new RangeError("Start date must not be after end date.");
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("Sales record limit must be between 1 and 100.");
    }
    const params = new URLSearchParams({
      select: SALES_COLUMNS,
      and: "(sale_date.gte." + start + ",sale_date.lte." + end + ")",
      order: "sale_date.asc,created_at.asc",
      limit: String(limit)
    });
    const response = await fetchImpl(config.baseUrl + "/rest/v1/sales_records?" + params.toString(), {
      method: "GET",
      headers: makeHeaders(config.key, token),
      cache: "no-store"
    });
    const rows = await readJson(response);
    if (!Array.isArray(rows)) throw new TypeError("Unexpected sales records response.");
    return rows;
  }

  return Object.freeze({ whoAmI, getVisibleCustomers, getVisibleSalesRecords, getVisibleSalesRecordsByDateRange });
}

export const READ_ONLY_SALES_COLUMNS = SALES_COLUMNS;
