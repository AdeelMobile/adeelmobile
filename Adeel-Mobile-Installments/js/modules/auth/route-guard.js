import { getVerifiedAppIdentity, signOutCurrentSession } from "./role.js";
import { supabase } from "../../services/supabase-client.js";

const requiredRole = document.body.dataset.requiredRole || "admin";
const loginUrl = "/pages/login/";

function showDenied(message) {
  document.body.hidden = false;
  document.body.innerHTML = "";
  const main = document.createElement("main");
  const heading = document.createElement("h1");
  const detail = document.createElement("p");
  const link = document.createElement("a");
  heading.textContent = "Access denied";
  detail.textContent = message;
  link.href = loginUrl;
  link.textContent = "Return to sign in";
  main.append(heading, detail, link);
  document.body.append(main);
  document.documentElement.removeAttribute("data-auth-checking");
}

async function guard() {
  const identity = await getVerifiedAppIdentity();
  if (identity.error) {
    showDenied("Your session or role could not be verified. Please sign in again.");
    return;
  }
  if (!identity.user) {
    window.location.replace(loginUrl);
    return;
  }
  if (identity.role !== requiredRole) {
    if (identity.role === "user" && requiredRole === "admin") {
      window.location.replace("/pages/user/");
      return;
    }
    showDenied("This account does not have permission to open this page.");
    return;
  }

  document.documentElement.removeAttribute("data-auth-checking");
  document.body.hidden = false;

  const logout = document.querySelector("[data-sign-out]");
  if (logout) {
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      const { error } = await signOutCurrentSession();
      if (error) {
        logout.disabled = false;
        showDenied("Sign out could not be completed. Please try again.");
        return;
      }
      window.location.replace(loginUrl);
    });
  }
}

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") window.location.replace(loginUrl);
});

guard();
