(() => {
  "use strict";

  const sidebar = document.getElementById("admin-sidebar");
  const openButton = document.getElementById("menu-open");
  const closeButton = document.getElementById("menu-close");
  const backdrop = document.getElementById("sidebar-backdrop");
  const moreButton = document.getElementById("bottom-more");
  const dateLabel = document.getElementById("dashboard-date");
  const logoutButton = document.getElementById("logout-button");

  const setSidebarOpen = (isOpen) => {
    if (!sidebar || !openButton || !backdrop) return;

    sidebar.classList.toggle("is-open", isOpen);
    backdrop.hidden = !isOpen;
    openButton.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("sidebar-is-open", isOpen);
  };

  openButton?.addEventListener("click", () => setSidebarOpen(true));
  closeButton?.addEventListener("click", () => setSidebarOpen(false));
  backdrop?.addEventListener("click", () => setSidebarOpen(false));
  moreButton?.addEventListener("click", () => setSidebarOpen(true));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSidebarOpen(false);
  });

  document.querySelectorAll("[data-coming-soon]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.alert("This module is outside the current development stage and will be added after the locked scope is tested.");
    });
  });

  if (dateLabel) {
    const today = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date());
    dateLabel.textContent = today;
  }

  logoutButton?.addEventListener("click", () => {
    window.alert("Secure sign-out will be enabled when the authentication service is connected.");
  });
})();
