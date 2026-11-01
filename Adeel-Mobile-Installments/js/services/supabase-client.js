import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../../config/supabase-public.js";

// Browser client: Supabase Auth stores and refreshes the session.
// This client must never receive a secret/service_role key.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storageKey: "adeel-mobile-auth"
  }
});
