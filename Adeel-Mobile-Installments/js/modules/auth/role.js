import { supabase } from "../../services/supabase-client.js";
import { restoreVerifiedSession, signOutCurrentSession } from "./session.js";

// The database is the trusted source of the app role. Never authorize from
// local storage, user_metadata, or a client-controlled URL parameter.
export async function getVerifiedAppIdentity() {
  const restored = await restoreVerifiedSession();
  if (restored.error) return { ...restored, role: null };
  if (!restored.user || !restored.session) {
    return { session: null, user: null, role: null, error: null };
  }

  const { data, error } = await supabase.rpc("ims_whoami");
  if (error) {
    return { session: restored.session, user: restored.user, role: null, error };
  }

  const role = typeof data === "string" ? data : data?.role;
  if (role !== "admin" && role !== "user") {
    return {
      session: restored.session,
      user: restored.user,
      role: "none",
      error: null
    };
  }

  return { session: restored.session, user: restored.user, role, error: null };
}

export { signOutCurrentSession };
