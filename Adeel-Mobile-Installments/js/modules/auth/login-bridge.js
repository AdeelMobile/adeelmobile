import { getVerifiedAppIdentity, signOutCurrentSession } from "./role.js";
import { setRememberSession, supabase } from "../../services/supabase-client.js";

let routing = false;
const message = document.querySelector("#login-message");

async function routeAfterVerifiedLogin() {
  if (routing) return;
  routing = true;
  try {
    const identity = await getVerifiedAppIdentity();
    if (!identity.user) return;
    if (identity.error) {
      if (message) {
        message.hidden = false;
        message.textContent = "Your account role could not be verified. Please contact the administrator.";
      }
      await signOutCurrentSession();
      return;
    }
    if (identity.role === "admin") {
      window.location.replace("/pages/admin/dashboard/");
      return;
    }
    if (identity.role === "user") {
      window.location.replace("/pages/user/");
      return;
    }
    if (message) {
      message.hidden = false;
      message.textContent = "This account is not active or has no assigned app role. Contact the administrator.";
    }
    await signOutCurrentSession();
  } finally {
    routing = false;
  }
}

// Phase 3 also permits the trusted Admin to sign in with the actual Auth email.
// The existing Phase 2 username convention remains unchanged for standard users.
const form = document.querySelector("#login-form");
if (form) {
  form.addEventListener("submit", async (event) => {
    const identifier = String(form.elements.username.value || "").trim();
    if (!identifier.includes("@")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const submitButton = document.querySelector("#login-submit");
    if (message) {
      message.hidden = true;
      message.textContent = "";
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Signing in…";
    }

    try {
      setRememberSession(Boolean(form.elements.remember.checked));
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier.toLowerCase(),
        password: form.elements.password.value
      });
      if (error) throw error;
      window.setTimeout(routeAfterVerifiedLogin, 0);
    } catch {
      if (message) {
        message.hidden = false;
        message.textContent = "Unable to sign in. Check your details or contact the administrator.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Sign in";
      }
    }
  }, true);
}

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") {
    // Do not await Supabase calls inside the auth-state callback.
    window.setTimeout(routeAfterVerifiedLogin, 0);
  }
});

routeAfterVerifiedLogin();
