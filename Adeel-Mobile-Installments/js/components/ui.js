(() => {
  "use strict";

  const showMessage = (target, message, type = "info") => {
    const element = typeof target === "string" ? document.getElementById(target) : target;
    if (!element) return false;

    element.textContent = String(message ?? "");
    element.hidden = false;
    element.classList.remove("ui-alert-success", "ui-alert-warning", "ui-alert-danger");
    if (["success", "warning", "danger"].includes(type)) {
      element.classList.add(`ui-alert-${type}`);
    }
    if (!element.classList.contains("ui-alert")) element.classList.add("ui-alert");
    element.setAttribute("role", type === "danger" ? "alert" : "status");
    element.setAttribute("aria-live", type === "danger" ? "assertive" : "polite");
    return true;
  };

  const setButtonBusy = (button, isBusy, busyLabel = "Please wait…") => {
    if (!button) return false;

    if (isBusy) {
      if (!("originalLabel" in button.dataset)) {
        button.dataset.originalLabel = button.textContent.trim();
      }
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = busyLabel;
      return true;
    }

    button.disabled = false;
    button.removeAttribute("aria-busy");
    if ("originalLabel" in button.dataset) {
      button.textContent = button.dataset.originalLabel;
      delete button.dataset.originalLabel;
    }
    return true;
  };

  const copyText = async (value) => {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(String(value ?? ""));
      return true;
    } catch {
      return false;
    }
  };

  window.AMUI = Object.freeze({ showMessage, setButtonBusy, copyText });
})();
