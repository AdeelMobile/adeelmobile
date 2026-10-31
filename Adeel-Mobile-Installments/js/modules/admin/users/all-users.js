(() => {
  "use strict";

  const searchInput = document.getElementById("user-search");
  const statusFilter = document.getElementById("user-status-filter");
  const sortSelect = document.getElementById("user-sort");
  const emptyHeading = document.querySelector(".user-list-empty h2");
  const emptyText = document.querySelector(".user-list-empty p");

  const explainNoData = () => {
    if (!emptyHeading || !emptyText) return;
    const hasSearch = Boolean(searchInput?.value.trim());
    emptyHeading.textContent = hasSearch ? "No matching users to show" : "No user records yet";
    emptyText.textContent = "The user database is not connected yet, so there are no records available for searching or filtering.";
  };

  searchInput?.addEventListener("input", explainNoData);
  statusFilter?.addEventListener("change", explainNoData);
  sortSelect?.addEventListener("change", explainNoData);
})();
