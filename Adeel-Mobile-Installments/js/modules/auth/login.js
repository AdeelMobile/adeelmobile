import { supabase } from "../../services/supabase-client.js";
import { setRememberSession } from "../../services/supabase-client.js";

const AUTH_EMAIL_DOMAIN = "adeelmobile.app";

export function usernameToAuthEmail(username) {
  const normalized = String(username ?? "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(normalized)) {
    throw new Error("Please check your username and password.");
  }
  return `${normalized}@${AUTH_EMAIL_DOMAIN}`;
}

export async function signInWithUsername(username, password, rememberSession = false) {
  const email = usernameToAuthEmail(username);
  const cleanPassword = String(password ?? "");

  if (cleanPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  setRememberSession(Boolean(rememberSession));
  return supabase.auth.signInWithPassword({ email, password: cleanPassword });
}
