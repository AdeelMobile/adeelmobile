import { supabase } from "../../services/supabase-client.js";

const metrics = [
  { key: "users", label: "Active users", table: "users", icon: "U", tone: "green" },
  { key: "customers", label: "Customers", table: "customers", icon: "C", tone: "blue" },
  { key: "brands", label: "Brands", table: "brands", icon: "B", tone: "violet" },
  { key: "models", label: "Models", table: "models", icon: "M", tone: "amber" },
  { key: "variants", label: "Product variants", table: "variants", icon: "P", tone: "blue" },
  { key: "orders", label: "Orders", table: "orders", icon: "O", tone: "green" },
  { key: "verifications", label: "Verifications", table: "verifications", icon: "V", tone: "amber" }
];

const numberFormat = new Intl.NumberFormat("en-PK");
const grid = document.querySelector("[data-metric-grid]");
const refreshButton = document.querySelector("[data-refresh-dashboard]");
const updatedLabel = document.querySelector("[data-last-updated]");
const alertBox = document.querySelector("[data-dashboard-alert]");

function metricCard(metric) {
  const article = document.createElement("article");
  article.className = "dashboard-metric";
  article.dataset.metric = metric.key;

  const top = document.createElement("div");
  top.className = "metric-top";
  const icon = document.createElement("span");
  icon.className = `metric-icon metric-icon--${metric.tone}`;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = metric.icon;
  const label = document.createElement("span");
  label.className = "metric-label";
  label.textContent = metric.label;
  top.append(icon, label);

  const value = document.createElement("p");
  value.className = "metric-value";
  value.textContent = "—";
  value.dataset.metricValue = metric.key;

  const foot = document.createElement("p");
  foot.className = "metric-foot";
  foot.textContent = "Live database count";

  article.append(top, value, foot);
  return article;
}

function renderCards() {
  grid.replaceChildren(...metrics.map(metricCard));
}

async function fetchCount(metric) {
  let query = supabase.from(metric.table).select("id", { count: "exact", head: true });
  if (metric.key === "users") query = query.eq("status", "active");
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function setMetric(key, value, failed = false) {
  const node = document.querySelector(`[data-metric-value="${key}"]`);
  if (!node) return;
  node.textContent = failed ? "Unavailable" : numberFormat.format(value);
  node.closest(".dashboard-metric")?.classList.toggle("is-error", failed);
}

async function loadDashboard() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing…";
  alertBox.hidden = true;

  const results = await Promise.allSettled(metrics.map(metric => fetchCount(metric)));
  let failures = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") setMetric(metrics[index].key, result.value);
    else {
      failures += 1;
      setMetric(metrics[index].key, 0, true);
    }
  });

  updatedLabel.textContent = `Last updated: ${new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium", timeStyle: "short"
  }).format(new Date())}`;

  if (failures) {
    alertBox.textContent = `${failures} summary item(s) could not load. Check access or connection, then refresh.`;
    alertBox.hidden = false;
  }

  refreshButton.disabled = false;
  refreshButton.textContent = "Refresh data";
}

renderCards();
refreshButton.addEventListener("click", loadDashboard);
loadDashboard();
