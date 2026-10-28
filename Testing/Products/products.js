"use strict";

(function () {
  const list = document.getElementById("products-list");
  const loading = document.getElementById("products-loading");
  const empty = document.getElementById("products-empty");
  const errorBox = document.getElementById("products-error");

  let brandProfits = [];
  let modelIncentives = [];

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

  // Model name se akhir mein likha variant code hatayein.
  function cleanModelName(modelName, variantName) {
    const name = String(modelName || "").trim();
    const variant = String(variantName || "").trim();

    if (!name || !variant) return name;

    const escapedVariant = variant.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const variantAtEnd = new RegExp(
      "\\s+" + escapedVariant + "\\s*$",
      "i"
    );

    return name.replace(variantAtEnd, "").trim();
  }

  // Variant 8/256 ko 8GB / 256GB ki tarah dikhayein.
  function formatVariant(variantName) {
    const value = String(variantName || "").trim();

    const match = value.match(
      /^(\d+)\s*\/\s*(\d+)$/
    );

    if (match) {
      return match[1] + "GB / " + match[2] + "GB";
    }

    return value || "Standard";
  }

  function calculateProfit(brandId, modelId, price) {
    const brandSetting = brandProfits.find(
      item => String(item.brand_id) === String(brandId)
    );

    const modelSetting = modelIncentives.find(
      item => String(item.model_id) === String(modelId)
    );

    const brandProfit =
      price * Number(brandSetting?.percent || 0) / 100;

    let incentive = 0;

    if (modelSetting) {
      incentive = modelSetting.type === "percent"
        ? price * Number(modelSetting.value || 0) / 100
        : Number(modelSetting.value || 0);
    }

    return brandProfit + incentive;
  }

  function productCard(brand, model, variant) {
    const price = Number(
      variant.discount_price ?? variant.price ?? 0
    );

    const profit = calculateProfit(
      brand.id,
      model.id,
      price
    );

    const image = variant.image_link || brand.logo_url || "";
    const modelName = cleanModelName(model.model, variant.variant);
    const variantName = formatVariant(variant.variant);

    return `
      <article class="product-card">
        <img
          class="product-image"
          src="${safe(image)}"
          alt="${safe(brand.brand)} ${safe(modelName)}"
          loading="lazy"
          onerror="this.style.display='none'"
        >

        <div class="product-info">
          <h3 class="product-brand">${safe(brand.brand)}</h3>
          <p class="product-model">${safe(modelName)}</p>

          <div class="product-detail">
            <span>Variant</span>
            <strong>${safe(variantName)}</strong>
          </div>

          <div class="product-detail">
            <span>Price</span>
            <strong>${money(price)}</strong>
          </div>

          <div class="product-detail">
            <span>Advance</span>
            <strong>Installment plan ke mutabiq</strong>
          </div>

          <div class="product-profit">
            Your Profit: ${money(profit)}
          </div>

          <button
            class="product-details-button"
            type="button"
            data-product-id="${safe(variant.id)}"
          >
            View Details
          </button>
        </div>
      </article>
    `;
  }

  async function loadProducts() {
    loading.hidden = false;
    empty.hidden = true;
    errorBox.hidden = true;
    list.innerHTML = "";

    try {
      if (typeof db === "undefined") {
        throw new Error("Supabase configuration nahi mili.");
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

      const results = await Promise.all([
        db.from("brands")
          .select("id, brand, logo_url, show_brand")
          .eq("show_brand", true),

        db.from("models")
          .select("id, brand_id, model, status")
          .eq("status", "active"),

        db.from("variants")
          .select("id, model_id, variant, price, discount_price, image_link, show_website")
          .eq("show_website", true),

        db.from("user_brand_profit")
          .select("brand_id, percent")
          .eq("user_id", user.id),

        db.from("user_model_incentive")
          .select("model_id, type, value")
          .eq("user_id", user.id)
      ]);

      for (const result of results) {
        if (result.error) throw result.error;
      }

      const brands = results[0].data || [];
      const models = results[1].data || [];
      const variants = results[2].data || [];

      brandProfits = results[3].data || [];
      modelIncentives = results[4].data || [];

      const cards = [];

      for (const variant of variants) {
        const model = models.find(
          item => String(item.id) === String(variant.model_id)
        );

        if (!model) continue;

        const brand = brands.find(
          item => String(item.id) === String(model.brand_id)
        );

        if (!brand) continue;

        cards.push(productCard(brand, model, variant));
      }

      list.innerHTML = cards.join("");
      empty.hidden = cards.length > 0;

      list.querySelectorAll("[data-product-id]").forEach(button => {
        button.addEventListener("click", () => {
          const id = button.getAttribute("data-product-id");
          window.location.href =
            "product-details.html?id=" + encodeURIComponent(id);
        });
      });

    } catch (err) {
      console.error("Products loading error:", err);
      errorBox.textContent =
        "Products load nahi huay: " + (err.message || "Database error");
      errorBox.hidden = false;
    } finally {
      loading.hidden = true;
    }
  }

  loadProducts();
})();