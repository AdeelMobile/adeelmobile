import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";
const DOMAIN = "@adeelmobile.app";

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin) {
    let allowed = false;
    try {
      const host = new URL(origin).hostname.toLowerCase();
      allowed =
        host === "adeelmobile-installments.pages.dev" ||
        host.endsWith(".adeelmobile-installments.pages.dev");
    } catch {
      allowed = false;
    }
    if (allowed) headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function reply(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const cleanText = (value: unknown, max = 200): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("MY_SERVICE_KEY");
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const publishableKey = req.headers.get("apikey");

  if (!supabaseUrl || !serviceKey || !token || !publishableKey) {
    return reply({ error: "Server configuration or login session is missing" }, 401, origin);
  }

  // Verify the caller's real Supabase identity and the server-side admin allowlist.
  const verifier = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: identity, error: identityError } = await verifier.auth.getUser(token);
  if (identityError || !identity.user) {
    return reply({ error: "Your session is invalid. Please sign in again." }, 401, origin);
  }
  const { data: role, error: roleError } = await verifier.rpc("ims_whoami");
  if (roleError || role !== "admin") {
    return reply({ error: "Admin access required" }, 403, origin);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Invalid request body" }, 400, origin);
  }

  const action = String(body.action || "");
  const allowedStatuses = new Set(["active", "disabled"]);

  if (action === "list") {
    const { data, error } = await admin
      .from("users")
      .select("id,name,father_name,contact,whatsapp,address,percentage,sale_target,incentive,status,referral_code,login_username,created_at,auth_user_id")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return reply({ error: "Could not load user records" }, 500, origin);
    const rows = (data || []).map(({ auth_user_id: linked, ...row }) => ({
      ...row,
      has_login: Boolean(linked),
    }));
    return reply({ ok: true, users: rows }, 200, origin);
  }

  if (action === "create") {
    const name = cleanText(body.name, 120);
    const fatherName = cleanText(body.father_name, 120);
    const contact = cleanText(body.contact, 40);
    const whatsapp = cleanText(body.whatsapp, 40);
    const address = cleanText(body.address, 500);
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name) return reply({ error: "User name is required" }, 400, origin);
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      return reply({ error: "Username must be 3–30 characters (letters, numbers, dot or underscore)" }, 400, origin);
    }
    if (password.length < 8) {
      return reply({ error: "Password must be at least 8 characters" }, 400, origin);
    }

    const email = username + DOMAIN;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "user" },
      user_metadata: { name, username },
    });
    if (created.error || !created.data.user) {
      const msg = created.error?.message || "Could not create login account";
      return reply({ error: /already|registered|exists/i.test(msg) ? "This username is already in use" : msg }, 400, origin);
    }

    const { data: row, error: insertError } = await admin
      .from("users")
      .insert({
        name,
        father_name: fatherName,
        contact,
        whatsapp,
        address,
        login_username: username,
        auth_user_id: created.data.user.id,
        status: "active",
      })
      .select("id,name,father_name,contact,whatsapp,address,percentage,sale_target,incentive,status,referral_code,login_username,created_at")
      .single();

    if (insertError || !row) {
      await admin.auth.admin.deleteUser(created.data.user.id);
      const msg = insertError?.code === "23505"
        ? "This username or referral value is already in use"
        : "User record could not be saved; the login account was rolled back";
      return reply({ error: msg }, 400, origin);
    }
    return reply({ ok: true, user: { ...row, has_login: true } }, 201, origin);
  }

  const userId = Number(body.user_id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return reply({ error: "A valid user ID is required" }, 400, origin);
  }

  const { data: existing, error: lookupError } = await admin
    .from("users")
    .select("id,auth_user_id,login_username")
    .eq("id", userId)
    .maybeSingle();
  if (lookupError) return reply({ error: "Could not find this user" }, 500, origin);
  if (!existing) return reply({ error: "User not found" }, 404, origin);

  if (action === "update") {
    const name = cleanText(body.name, 120);
    if (!name) return reply({ error: "User name is required" }, 400, origin);
    const status = String(body.status || "active");
    if (!allowedStatuses.has(status)) return reply({ error: "Invalid account status" }, 400, origin);

    const patch = {
      name,
      father_name: cleanText(body.father_name, 120),
      contact: cleanText(body.contact, 40),
      whatsapp: cleanText(body.whatsapp, 40),
      address: cleanText(body.address, 500),
      status,
    };
    const { data, error } = await admin
      .from("users")
      .update(patch)
      .eq("id", userId)
      .select("id,name,father_name,contact,whatsapp,address,percentage,sale_target,incentive,status,referral_code,login_username,created_at")
      .single();
    if (error) return reply({ error: "User details could not be updated" }, 400, origin);
    return reply({ ok: true, user: { ...data, has_login: Boolean(existing.auth_user_id) } }, 200, origin);
  }

  if (action === "reset_password") {
    const password = String(body.password || "");
    if (!existing.auth_user_id) return reply({ error: "This user does not have a login account" }, 400, origin);
    if (password.length < 8) return reply({ error: "Password must be at least 8 characters" }, 400, origin);
    const { error } = await admin.auth.admin.updateUserById(existing.auth_user_id, { password });
    if (error) return reply({ error: "Password could not be updated" }, 400, origin);
    return reply({ ok: true }, 200, origin);
  }

  return reply({ error: "Unknown action" }, 400, origin);
});