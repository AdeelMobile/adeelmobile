import { supabase } from "../../../js/services/supabase-client.js";

const PAGE_SIZE = 20;
const categories = ["pending", "approved", "rejected", "repeat_customer"];
const form = document.querySelector("[data-filter-form]");
const rowsNode = document.querySelector("[data-customer-rows]");
const alertNode = document.querySelector("[data-alert]");
const summaryNode = document.querySelector("[data-result-summary]");
const pageNode = document.querySelector("[data-page-label]");
const previousButton = document.querySelector("[data-prev]");
const nextButton = document.querySelector("[data-next]");
const refreshButton = document.querySelector("[data-refresh]");
const numberFormat = new Intl.NumberFormat("en-PK");
let page = 0;
let totalRows = 0;
let requestNumber = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function displayCategory(value) {
  return ({
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    repeat_customer: "Repeat customer"
  })[value] || value || "—";
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium"
  }).format(date);
}

function currentFilters() {
  return {
    search: form.elements.search.value.trim().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim(),
    category: form.elements.category.value,
    status: form.elements.status.value
  };
}

function applyFilters(query, filters) {
  if (filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.search) {
    const term = filters.search.replace(/[%_\\]/g, "\\$&");
    const pattern = `%${term}%`;
    query = query.or(`name.ilike.${pattern},phone.ilike.${pattern},cnic.ilike.${pattern}`);
  }
  return query;
}

async function fetchCount(category = null) {
  let query = supabase.from("p6_customers").select("id", { count: "exact", head: true });
  if (category) query = query.eq("category", category);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function loadCounts() {
  const [total, ...categoryCounts] = await Promise.all([
    fetchCount(),
    ...categories.map(category => fetchCount(category))
  ]);
  document.querySelector("[data-count-total]").textContent = numberFormat.format(total);
  document.querySelector("[data-count-pending]").textContent = numberFormat.format(categoryCounts[0]);
  document.querySelector("[data-count-approved]").textContent = numberFormat.format(categoryCounts[1]);
  document.querySelector("[data-count-rejected]").textContent = numberFormat.format(categoryCounts[2]);
  document.querySelector("[data-count-repeat]").textContent = numberFormat.format(categoryCounts[3]);
}

function renderRows(customers) {
  if (!customers.length) {
    rowsNode.innerHTML = '<tr><td colspan="6" class="p6-empty">No customers match these filters.</td></tr>';
    return;
  }

  rowsNode.innerHTML = customers.map(customer => `
    <tr>
      <td><strong>${escapeHtml(customer.name)}</strong></td>
      <td>${escapeHtml(customer.phone)}</td>
      <td>${escapeHtml(customer.cnic)}</td>
      <td><span class="p6-tag p6-category-${escapeHtml(customer.category)}">${escapeHtml(displayCategory(customer.category))}</span></td>
      <td><span class="p6-tag p6-status-${escapeHtml(customer.status)}">${escapeHtml(customer.status)}</span></td>
      <td>${escapeHtml(displayDate(customer.created_at))}</td>
    </tr>
  `).join("");
}

function showError(error) {
  alertNode.hidden = false;
  alertNode.textContent = error?.message || "Customer records could not be loaded. Please try again.";
}

async function loadCustomers() {
  const thisRequest = ++requestNumber;
  const filters = currentFilters();
  alertNode.hidden = true;
  rowsNode.innerHTML = '<tr><td colspan="6" class="p6-empty">Loading customers…</td></tr>';
  summaryNode.textContent = "Loading customer records…";
  refreshButton.disabled = true;
  previousButton.disabled = true;
  nextButton.disabled = true;

  try {
    const countQuery = applyFilters(
      supabase.from("p6_customers").select("id", { count: "exact", head: true }),
      filters
    );
    const dataQuery = applyFilters(
      supabase.from("p6_customers")
        .select("id,name,phone,cnic,category,status,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1),
      filters
    );

    const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);
    if (thisRequest !== requestNumber) return;
    if (countResult.error) throw countResult.error;
    if (dataResult.error) throw dataResult.error;

    totalRows = countResult.count ?? dataResult.count ?? 0;
    const customers = dataResult.data || [];
    renderRows(customers);
    const start = totalRows ? page * PAGE_SIZE + 1 : 0;
    const end = Math.min((page + 1) * PAGE_SIZE, totalRows);
    summaryNode.textContent = `Showing ${numberFormat.format(start)}–${numberFormat.format(end)} of ${numberFormat.format(totalRows)} customers`;
    pageNode.textContent = `Page ${page + 1}`;
    previousButton.disabled = page === 0;
    nextButton.disabled = (page + 1) * PAGE_SIZE >= totalRows;
  } catch (error) {
    if (thisRequest === requestNumber) {
      rowsNode.innerHTML = '<tr><td colspan="6" class="p6-empty">Unable to load customer records.</td></tr>';
      summaryNode.textContent = "Customer list unavailable";
      showError(error);
    }
  } finally {
    if (thisRequest === requestNumber) refreshButton.disabled = false;
  }
}

async function refreshAll() {
  alertNode.hidden = true;
  try {
    await loadCounts();
    await loadCustomers();
  } catch (error) {
    showError(error);
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  page = 0;
  loadCustomers();
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    page = 0;
    loadCustomers();
  }, 0);
});

previousButton.addEventListener("click", () => {
  if (page > 0) {
    page -= 1;
    loadCustomers();
  }
});

nextButton.addEventListener("click", () => {
  if ((page + 1) * PAGE_SIZE < totalRows) {
    page += 1;
    loadCustomers();
  }
});

refreshButton.addEventListener("click", refreshAll);

await refreshAll();
