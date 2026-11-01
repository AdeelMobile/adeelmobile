import { supabase } from "./supabase-client.js";

export const P5_BUCKET = "p5-verification-docs";
const PAGE_SIZE = 20;

export function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(2);
  if (digits.startsWith("92") && digits.length === 12) digits = "0" + digits.slice(2);
  if (digits.length === 10 && digits.startsWith("3")) digits = "0" + digits;
  return digits;
}
export function validPakistaniPhone(value) { return /^03\d{9}$/.test(normalizePhone(value)); }
export function validCnic(value) { return /^\d{5}-\d{7}-\d$/.test(String(value || "").trim()); }
function extension(file) {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "application/pdf") return "pdf";
  throw new Error("CNIC file JPG, PNG ya PDF honi chahiye.");
}
function validateDocument(file) {
  if (!file) throw new Error("CNIC front aur back dono files select karein.");
  extension(file);
  if (file.size > 8 * 1024 * 1024) throw new Error("Har file 8 MB se chhoti honi chahiye.");
}

export async function getProductVariants() {
  const { data, error } = await supabase.from("variants")
    .select("id,variant,price,models!inner(model,brands!inner(brand))").order("id");
  if (error) throw error;
  return (data || []).map((v) => ({
    id: v.id,
    label: [v.models?.brands?.brand, v.models?.model, v.variant].filter(Boolean).join(" · "),
    price: Number(v.price)
  }));
}

export async function submitP5Application(form, frontFile, backFile) {
  validateDocument(frontFile); validateDocument(backFile);
  if (!validCnic(form.cnic_number)) throw new Error("CNIC format 12345-1234567-1 hona chahiye.");
  if (!validPakistaniPhone(form.customer_phone) || !validPakistaniPhone(form.whatsapp)) {
    throw new Error("Mobile aur WhatsApp number 03XXXXXXXXX format mein likhein.");
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Session expire ho gaya. Dobara login karein.");
  const user = authData.user;
  const { data: product, error: productError } = await supabase.from("variants")
    .select("id,variant,price,models!inner(model,brands!inner(brand))")
    .eq("id", Number(form.variant_id)).single();
  if (productError || !product) throw new Error("Selected product dobara choose karein.");
  const productName = [product.models?.brands?.brand, product.models?.model].filter(Boolean).join(" ");
  const { data: row, error: insertError } = await supabase.from("p5_verification_applications")
    .insert({
      customer_name: form.customer_name.trim(), father_name: form.father_name.trim(),
      cnic_number: form.cnic_number.trim(), customer_phone: normalizePhone(form.customer_phone),
      whatsapp: normalizePhone(form.whatsapp), address: form.address.trim(),
      variant_id: product.id, product_name: productName, variant_name: product.variant,
      product_price: Number(product.price), plan_months: Number(form.plan_months)
    }).select("id").single();
  if (insertError) {
    if (insertError.code === "23505") throw new Error("Is phone number ki aapki pending application pehle se mojood hai.");
    throw insertError;
  }
  const appId = row.id; const paths = [];
  try {
    const frontPath = user.id + "/" + appId + "/front." + extension(frontFile);
    const backPath = user.id + "/" + appId + "/back." + extension(backFile);
    for (const [path, file] of [[frontPath, frontFile], [backPath, backFile]]) {
      const { error } = await supabase.storage.from(P5_BUCKET).upload(path, file, {
        cacheControl: "0", upsert: false, contentType: file.type
      });
      if (error) throw error;
      paths.push(path);
    }
    const { error: attachError } = await supabase.rpc("p5_attach_verification_documents", {
      p_application_id: appId, p_front_path: frontPath, p_back_path: backPath
    });
    if (attachError) throw attachError;
    return appId;
  } catch (error) {
    const { error: cancelError } = await supabase.rpc("p5_cancel_incomplete_application", { p_application_id: appId });
    if (!cancelError && paths.length) await supabase.storage.from(P5_BUCKET).remove(paths);
    throw new Error(error.message || "Documents upload nahi ho sakin. Dobara koshish karein.");
  }
}

export async function getMyP5Applications() {
  const { data, error } = await supabase.from("p5_verification_applications")
    .select("id,customer_name,product_name,variant_name,plan_months,status,rejection_reason,submitted_at,updated_at")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getAdminP5Applications(status = "pending", page = 0) {
  let query = supabase.from("p5_verification_applications")
    .select("id,customer_name,customer_phone,product_name,variant_name,plan_months,status,submitted_at,owner_auth_id", { count: "exact" })
    .order("submitted_at", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status);
  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: data || [], count: count || 0, pageSize: PAGE_SIZE };
}
export async function getP5ApplicationDetails(id) {
  const { data, error } = await supabase.from("p5_verification_applications").select("*").eq("id", id).single();
  if (error) throw error;
  const { data: events, error: eventError } = await supabase.from("p5_verification_events")
    .select("id,event_type,details,created_at,actor_auth_id").eq("application_id", id).order("created_at");
  if (eventError) throw eventError;
  const documents = {};
  for (const [key, path] of [["front", data.document_front_path], ["back", data.document_back_path]]) {
    if (path) {
      const { data: signed, error: signError } = await supabase.storage.from(P5_BUCKET).createSignedUrl(path, 3600);
      if (signError) throw signError;
      documents[key] = signed.signedUrl;
    }
  }
  return { application: data, events: events || [], documents };
}
export async function approveP5Application(id, expectedAdvance, actualAdvance) {
  const { data, error } = await supabase.rpc("p5_admin_approve_verification", {
    p_application_id: Number(id),
    p_expected_advance: expectedAdvance === "" ? null : Number(expectedAdvance),
    p_actual_advance: Number(actualAdvance)
  });
  if (error) throw error;
  return data;
}
export async function rejectP5Application(id, reasonCode, detail) {
  const { error } = await supabase.rpc("p5_admin_reject_verification", {
    p_application_id: Number(id), p_reason_code: reasonCode, p_reason_detail: detail || null
  });
  if (error) throw error;
}
export function buildWhatsAppUrl(application, template = "approved") {
  const phone = normalizePhone(application.whatsapp || application.customer_phone);
  const intl = phone.startsWith("0") ? "92" + phone.slice(1) : phone;
  const name = application.customer_name || "Customer";
  const product = [application.product_name, application.variant_name].filter(Boolean).join(" ");
  const messages = {
    approved: "Assalam-o-Alaikum " + name + ", aapki Adeel Mobile Installments ki application #" + application.id +
      " approve ho gayi hai. Product: " + product + ". Plan: " + application.plan_months +
      " months. Advance received: Rs. " + Number(application.actual_advance || 0).toLocaleString("en-PK") +
      ". Mazeed maloomat ke liye rabta karein.",
    rejected: "Assalam-o-Alaikum " + name + ", aapki application #" + application.id +
      " review ki gayi hai. Wajah: " + (application.rejection_reason || "Mazeed maloomat darkar hain") +
      ". Barah-e-karam durust maloomat ke sath dobara apply karein.",
    pending: "Assalam-o-Alaikum " + name + ", aapki Adeel Mobile Installments application #" + application.id +
      " receive ho gayi hai. Review ke baad aapko update kar diya jayega."
  };
  return "https://wa.me/" + intl + "?text=" + encodeURIComponent(messages[template] || messages.pending);
}
