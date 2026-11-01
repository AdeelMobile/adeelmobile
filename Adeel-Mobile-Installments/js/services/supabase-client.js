import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../../config/supabase-public.js";

const PREFERENCE_KEY = "adeel-mobile-remember-session";
const SESSION_KEY = "adeel-mobile-auth";

// Use persistent storage only when the user explicitly selects Remember me.
// Otherwise Supabase's session is kept in sessionStorage and ends with the tab.
const authStorage = {
  getItem(key) {
    const store = localStorage.getItem(PREFERENCE_KEY) === "true" ? localStorage : sessionStorage;
    return store.getItem(key);
  },
  setItem(key, value) {
    const remember = localStorage.getItem(PREFERENCE_KEY) === "true";
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(key);
    target.setItem(key, value);
  },
  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export function setRememberSession(enabled) {
  localStorage.setItem(PREFERENCE_KEY, enabled ? "true" : "false");
  if (!enabled) localStorage.removeItem(SESSION_KEY);
  else {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      localStorage.setItem(SESSION_KEY, existing);
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storageKey: SESSION_KEY,
    storage: authStorage
  }
});
