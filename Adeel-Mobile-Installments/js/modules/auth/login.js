(() => {
  "use strict";

  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const togglePasswordButton = document.getElementById("toggle-password");
  const forgotPasswordLink = document.getElementById("forgot-password");
  const message = document.getElementById("login-message");
  const loginButton = document.getElementById("login-button");

  if (!form || !usernameInput || !passwordInput || !message || !loginButton) {
    return;
  }

  const showMessage = (text) => {
    message.textContent = text;
    message.hidden = false;
  };

  const clearMessage = () => {
    message.textContent = "";
    message.hidden = true;
  };

  passwordInput.addEventListener("input", () => {
    passwordInput.value = passwordInput.value.replace(/[^0-9]/g, "").slice(0, 4);
    clearMessage();
  });

  usernameInput.addEventListener("input", clearMessage);

  if (togglePasswordButton) {
    togglePasswordButton.addEventListener("click", () => {
      const isVisible = passwordInput.type === "text";
      passwordInput.type = isVisible ? "password" : "text";
      togglePasswordButton.textContent = isVisible ? "Show" : "Hide";
      togglePasswordButton.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      togglePasswordButton.setAttribute("aria-pressed", String(!isVisible));
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (event) => {
      event.preventDefault();
      showMessage("Password recovery will be available after the secure authentication service is connected. Please contact your administrator for now.");
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
      showMessage("Please enter your username.");
      usernameInput.focus();
      return;
    }

    if (!/^\d{4}$/.test(password)) {
      showMessage("Please enter exactly 4 numeric digits for your password.");
      passwordInput.focus();
      return;
    }

    // Authentication is intentionally not simulated. It will be connected
    // to the approved secure authentication provider in a later step.
    showMessage("The secure login service is not connected yet. Your details have not been submitted or saved.");
  });
})();
