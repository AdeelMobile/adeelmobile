
 // Supabase shared connection for Adeel Mobile
(function () {
  const SUPABASE_URL =
    'https://nqihozwbdrvpyalctwbc.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_KQG5u2pwI4QjgYMZsJ97Kw_sTPH1OeL';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase library did not load.');
    return;
  }

  window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  console.log('Adeel Mobile database client initialized:', !!window.db);
})();
