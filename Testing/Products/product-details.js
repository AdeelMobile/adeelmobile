"use strict";

(function () {
  const loading = document.getElementById("details-loading");
  const details = document.getElementById("product-details");
  const errorBox = document.getElementById("details-error");

  function money(value) {
    return "Rs. " + Number(value || 0).toLocaleString("en-PK");
  }

  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function showError(message) {
    loading.hidden = true;
    details.hidden = true;
    errorBox.hidden = false;
    errorBox.textContent = message;
  }

  async function loadProductDetails() {
    try {
      if (typeof db === "undefined") {
        throw new Error("Supabase configuration nahi mili.");
      }

      const params = new URLSearchParams(window.location.search);
      const variantId = params.get("id");

      if (!variantId) {
        throw new Error("Product ID nahi mila.");
      }

      const { data: authData, error: authError } =
        await db.auth.getUser();

      if (authError) throw authError;

      if (!authData?.user) {
        throw new Error("Pehle login karein.");
      }

      const { data: user, error: userError } = await db
        .from("users")
        .select("id, status, auth_user_id")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (userError) throw userError;

      if (!user || String(user.status).toLowerCase() !== "active") {
        throw new Error("Active user profile nahi mila.");
      }

      const { data: variant, error: variantError } = await db
        .from("variants")
        .select("id, model_id, variant, price, discount_price, image_link")
        .eq("id", variantId)
        .maybeSingle();

      if (variantError) throw variantError;
      if (!variant) throw new Error("Product nahi mila.");

      const { data: model, error: modelError } = await db
        .from("models")
        .select("id, brand_id, model")
        .eq("id", variant.model_id)
        .maybeSingle();

      if (modelError) throw modelError;
      if (!model) throw new Error("Product model nahi mila.");

      const { data: brand, error: brandError } = await db
        .from("brands")
        .select("id, brand, logo_url")
        .eq("id", model.brand_id)
        .maybeSingle();

      if (brandError) throw brandError;
      if (!brand) throw new Error("Product brand nahi mila.");

      const { data: brandProfit, error: profitError } = await db
        .from("user_brand_profit")
        .select("percent")
        .eq("user_id", user.id)
        .eq("brand_id", brand.id)
        .maybeSingle();

      if (profitError) throw profitError;

      const { data: incentive, error: incentiveError } = await db
        .from("user_model_incentive")
        .select("type, value")
        .eq("user_id", user.id)
        .eq("model_id", model.id)
        .maybeSingle();

      if (incentiveError) throw incentiveError;

      const price = Number(
        variant.discount_price ?? variant.price ?? 0
      );

      const brandAmount =
        price * Number(brandProfit?.percent || 0) / 100;

      let incentiveAmount = 0;

      if (incentive) {
        incentiveAmount = incentive.type === "percent"
          ? price * Number(incentive.value || 0) / 100
          : Number(incentive.value || 0);
      }

      const profit = brandAmount + incentiveAmount;
      const image = variant.image_link || brand.logo_url || "";

      document.getElementById("detail-image").src = safe(image);
      document.getElementById("detail-brand").textContent = brand.brand || "";
      document.getElementById("detail-model").textContent = model.model || "";
      document.getElementById("detail-variant").textContent =
        variant.variant || "Standard";
      document.getElementById("detail-price").textContent = money(price);
      document.getElementById("detail-profit").textContent = money(profit);
      document.getElementById("detail-advance").textContent =
        "Installment plan ke mutabiq";
      document.getElementById("detail-message").textContent = "";

      loading.hidden = true;
      errorBox.hidden = true;
      details.hidden = false;

    } catch (err) {
      console.error("Product details error:", err);
      showError(
        "Product details load nahi huay: " +
        (err.message || "Database error")
      );
    }
  }

  loadProductDetails();
})();