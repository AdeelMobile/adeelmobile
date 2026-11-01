import { supabase } from "../../services/supabase-client.js";

const AUTH_EMAIL_DOMAIN = "adeelmobile.app";

export function usernameToAuthEmail(username) {
  const normalized = String(username ?? "").trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,32}$/.test(normalized)) {
    throw new Error("Enter a valid username.");
  }

  // Existing project convention: username maps to a private Auth email alias.
  return `${normalized}@${AUTH_EMAIL_DOMAIN}`;
}

export async function signInWithUsername(username, password) {
  const email = usernameToAuthEmail(username);
  const cleanPassword = String(password ?? "");

  if (!cleanPassword) {
    throw new Error("Enter your password.");
  }

  return supabase.auth.signInWithPassword({
    email,
    password: cleanPassword
  });
}
