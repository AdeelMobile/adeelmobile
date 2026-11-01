import { signInWithUsername } from "../../js/modules/auth/login.js";

const form = document.querySelector("#login-form");
const submitButton = document.querySelector("#login-submit");
const message = document.querySelector("#login-message");
const passwordInput = document.querySelector("#password");
const toggleButton = document.querySelector("#password-toggle");

toggleButton.addEventListener("click", () => {
  const reveal = passwordInput.type === "password";
  passwordInput.type = reveal ? "text" : "password";
  toggleButton.textContent = reveal ? "Hide" : "Show";
  toggleButton.setAttribute("aria-pressed", String(reveal));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.hidden = true;
  message.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Signing in…";

  try {
    const { error } = await signInWithUsername(
      form.elements.username.value,
      passwordInput.value,
      form.elements.remember.checked
    );

    if (error) throw error;

    message.className = "form-message form-message-success";
    message.textContent = "Login verified. Role-based access and dashboard routing will be enabled in Phase 3.";
    message.hidden = false;
    form.reset();
  } catch (error) {
    message.className = "form-message";
    message.textContent = "Unable to sign in. Check your details or contact the administrator.";
    message.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign in";
  }
});
