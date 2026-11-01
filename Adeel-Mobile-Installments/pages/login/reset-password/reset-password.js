import { supabase } from "../../../js/services/supabase-client.js";

const form = document.querySelector("#reset-form");
const status = document.querySelector("#reset-status");
const message = document.querySelector("#reset-message");
const submit = document.querySelector("#reset-submit");
const password = document.querySelector("#new-password");
const confirmPassword = document.querySelector("#confirm-password");
const toggle = document.querySelector("#password-toggle");

let recoveryReady = false;
let completed = false;

function showStatus(text, isError = false) {
  status.hidden = false;
  status.textContent = text;
  status.className = isError ? "form-message" : "form-message form-message-success";
}

function showRecoveryForm() {
  recoveryReady = true;
  status.hidden = true;
  form.hidden = false;
  password.focus();
}

toggle.addEventListener("click", () => {
  const reveal = password.type === "password";
  password.type = reveal ? "text" : "password";
  confirmPassword.type = reveal ? "text" : "password";
  toggle.textContent = reveal ? "Hide" : "Show";
  toggle.setAttribute("aria-pressed", String(reveal));
});

const query = new URLSearchParams(window.location.search);
const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
const authError = query.get("error_description") || hash.get("error_description");

if (authError) {
  showStatus("This recovery link is invalid or has expired. Request a fresh password reset email.", true);
} else {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) showRecoveryForm();
  });

  // Supabase emits PASSWORD_RECOVERY after it exchanges the one-time PKCE code.
  window.setTimeout(() => {
    if (!recoveryReady && !completed) {
      showStatus("The recovery link could not be verified or has expired. Request a fresh password reset email.", true);
    }
  }, 10000);

  window.addEventListener("pagehide", () => subscription.unsubscribe(), { once: true });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.hidden = true;
  message.textContent = "";

  if (!recoveryReady || completed) return;
  if (password.value.length < 8) {
    message.textContent = "Use a password with at least 8 characters.";
    message.hidden = false;
    return;
  }
  if (password.value !== confirmPassword.value) {
    message.textContent = "The passwords do not match.";
    message.hidden = false;
    return;
  }

  submit.disabled = true;
  submit.textContent = "Updating password…";
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value });
    if (error) throw error;
    completed = true;
    recoveryReady = false;
    form.reset();
    form.hidden = true;
    showStatus("Your password has been updated. You can now sign in with your new password.");
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Password update already succeeded; do not misreport it as a failure.
    }
  } catch {
    message.textContent = "The password could not be updated. Your recovery link may have expired; request a fresh one and try again.";
    message.hidden = false;
  } finally {
    submit.disabled = false;
    submit.textContent = "Update password";
  }
});
