import { getVerifiedAppIdentity, signOutCurrentSession } from "./role.js";
import { supabase } from "../../services/supabase-client.js";

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

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") {
    // Do not await Supabase calls inside the auth-state callback.
    window.setTimeout(routeAfterVerifiedLogin, 0);
  }
});

routeAfterVerifiedLogin();
