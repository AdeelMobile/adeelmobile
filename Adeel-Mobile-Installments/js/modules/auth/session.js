import { supabase } from "../../services/supabase-client.js";

// Restore the browser session, then verify the user with the Auth server.
// Do not use locally stored session claims as an authorization decision.
export async function restoreVerifiedSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return { session: null, user: null, error: sessionError };
  }

  if (!sessionData.session) {
    return { session: null, user: null, error: null };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    return { session: null, user: null, error: userError };
  }

  return {
    session: sessionData.session,
    user: userData.user,
    error: null
  };
}

export function subscribeToAuthState(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });

  return () => data.subscription.unsubscribe();
}

// End only this browser session; do not unexpectedly sign the user out
// from their other devices.
export async function signOutCurrentSession() {
  return supabase.auth.signOut({ scope: "local" });
}
