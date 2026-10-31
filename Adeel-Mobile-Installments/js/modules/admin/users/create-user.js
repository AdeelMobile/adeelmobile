(() => {
  "use strict";

  const form = document.getElementById("create-user-form");
  const message = document.getElementById("create-user-message");

  if (!form || !message) return;

  const showMessage = (text) => {
    message.textContent = text;
    message.hidden = false;
  };

  const clearMessage = () => {
    message.textContent = "";
    message.hidden = true;
  };

  form.querySelectorAll('input[inputmode="numeric"][maxlength="4"]').forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "").slice(0, 4);
      clearMessage();
    });
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      button.textContent = isVisible ? "Show" : "Hide";
      button.setAttribute("aria-pressed", String(!isVisible));
    });
  });

  form.addEventListener("reset", () => {
    clearMessage();
    window.setTimeout(() => {
      document.querySelectorAll("[data-toggle-password]").forEach((button) => {
        button.textContent = "Show";
        button.setAttribute("aria-pressed", "false");
      });
    }, 0);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const password = form.elements.password.value;
    const confirmation = form.elements.confirmPassword.value;

    if (!form.reportValidity()) return;

    if (!/^\d{4}$/.test(password)) {
      showMessage("Password must contain exactly four digits.");
      form.elements.password.focus();
      return;
    }

    if (password !== confirmation) {
      showMessage("Password and confirm password do not match.");
      form.elements.confirmPassword.focus();
      return;
    }

    // Do not create a local/demo user. Real creation requires the secure
    // backend, unique username checks, and the approved brand-profit rules.
    showMessage("User creation is not connected yet. No user record or password has been saved.");
  });
})();
