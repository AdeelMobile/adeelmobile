import { supabase } from "../../../js/services/supabase-client.js";

const form = document.querySelector("#forgot-form");
const email = document.querySelector("#email");
const message = document.querySelector("#forgot-message");
const submit = document.querySelector("#forgot-submit");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.hidden = true;
  message.textContent = "";

  if (!email.checkValidity()) {
    email.reportValidity();
    return;
  }

  submit.disabled = true;
  submit.textContent = "Sending…";
  try {
    const redirectTo = new URL("/pages/login/reset-password/", window.location.origin).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), { redirectTo });
    if (error) throw error;
    message.className = "form-message form-message-success";
    message.textContent = "If this email belongs to an eligible account, a recovery link will arrive shortly. Check your inbox and spam folder.";
    message.hidden = false;
    form.reset();
  } catch {
    message.className = "form-message";
    message.textContent = "We could not send the recovery request right now. Please wait a moment and try again.";
    message.hidden = false;
  } finally {
    submit.disabled = false;
    submit.textContent = "Send recovery email";
  }
});
