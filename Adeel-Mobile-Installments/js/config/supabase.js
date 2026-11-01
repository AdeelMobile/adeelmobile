(() => {
  "use strict";

  const SUPABASE_URL = "https://nqihozwbdrvpyalctwbc.supabase.co";
  // Publishable key is designed for browser use. Database access remains protected by RLS.
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KQG5u2pwI4QjgYMZsJ97Kw_sTPH1OeL";

  if (!window.supabase?.createClient) {
    console.error("Supabase client library did not load.");
    return;
  }

  window.adeelDb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
})();