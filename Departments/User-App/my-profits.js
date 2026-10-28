"use strict";

// Adeel Mobile - My Profits List
// Supabase + Login + Products + Profit + Search + Brand Filters
// Product cards: No Share / Download buttons

const LOGIN_PAGE = new URL("../../index.html", document.currentScript.src).href;

const $ = id => document.getElementById(id);

let currentUser = null;
let currentProfile = null;
let productList = [];
let activeBrand = "all";
let searchText = "";

const db = window.db || window.supabaseClient;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatAmount(value) {
  return "Rs. " + Math.round(Number(value) || 0).toLocaleString("en-PK");
}

function effectivePrice(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount_price) || 0;

  return discount > 0 && discount < price ? discount : price;
}

function calculateUserProfit(price, brandPercent, incentiveType, incentiveValue) {
  const basePrice = Number(price) || 0;
  const brandRate = Number(brandPercent) || 0;
  const incentiveRate = Number(incentiveValue) || 0;

  const brandProfit = basePrice * brandRate / 100;

  let modelIncentive = 0;

  if (String(incentiveType || "percent").toLowerCase() === "percent") {
    modelIncentive = basePrice * incentiveRate / 100;
  } else {
    modelIncentive = incentiveRate;
  }

  return Math.round(brandProfit + modelIncentive);
}

function showMessage(message) {
  const element = $("products-message");

  if (element) {
    element.textContent = message;
    element.style.display = message ? "block" : "none";
  }
}

function setProductCount(count) {
  const element = $("products-count");

  if (element) {
    element.textContent = `${count} Products`;
  }
}

function getProductsContainer() {
  return (
    $("user-products-grid") ||
    $("products-grid") ||
    $("products-container") ||
    $("product-list") ||
    $("products-list") ||
    $("all-products") ||
    document.querySelector(".user-products-grid") ||
    document.querySelector(".products-grid") ||
    document.querySelector(".products-list") ||
    document.querySelector(".products-container")
  );
}

async function initializeMyProfits() {
  showMessage("Loading your account...");

  try {
    if (!db) {
      throw new Error(
        "Supabase client nahi mila. supabase-config.js ka path aur configuration check karein."
      );
    }

    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();

    if (sessionError) throw sessionError;

    currentUser = sessionData?.session?.user;

    if (!currentUser) {
      window.location.href = LOGIN_PAGE;
      return;
    }

    const { data: profile, error: profileError } = await db
      .from("users")
      .select("id, name, referral_code, status, auth_user_id")
      .eq("auth_user_id", currentUser.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      throw new Error(
        "Aapki user profile database mein nahi mili. Admin se profile check karwayein."
      );
    }

    if (String(profile.status || "active").toLowerCase() !== "active") {
      throw new Error("Aapka account active nahi hai.");
    }

    currentProfile = profile;

    await loadProducts();

  } catch (error) {
    console.error("My Profits initialization error:", error);
    setProductCount(0);
    showMessage(error.message || "Account load nahi ho saka.");
  }
}

async function loadProducts() {
  showMessage("Loading products...");

  try {
    if (!currentProfile) {
      throw new Error("User profile load nahi hui.");
    }

    const { data: variants, error: productsError } = await db
      .from("variants")
      .select(`
        id,
        model_id,
        variant,
        price,
        discount_price,
        image_link,
        show_website,
        models (
          id,
          brand_id,
          model,
          status,
          show_inst_website,
          brands (
            id,
            brand,
            show_inst_website
          )
        )
      `)
      .order("id", { ascending: true })
      .limit(1000);

    if (productsError) throw productsError;

    const { data: brandRules, error: brandError } = await db
      .from("user_brand_profit")
      .select("brand_id, percent")
      .eq("user_id", currentProfile.id);

    if (brandError) throw brandError;

    const { data: incentiveRules, error: incentiveError } = await db
      .from("user_model_incentive")
      .select("model_id, type, value")
      .eq("user_id", currentProfile.id);

    if (incentiveError) throw incentiveError;

    productList = (variants || [])
      .filter(item => {
        const model = item.models;
        const brand = model?.brands;

        return Boolean(
          model &&
          brand &&
          item.show_website === true &&
          model.show_inst_website === true &&
          brand.show_inst_website === true &&
          String(model.status || "active").toLowerCase() === "active"
        );
      })
      .map(item => {
        const model = item.models;
        const brand = model.brands;

        const brandRule = (brandRules || []).find(rule =>
          String(rule.brand_id) === String(brand.id)
        );

        const incentiveRule = (incentiveRules || []).find(rule =>
          String(rule.model_id) === String(model.id)
        );

        const price = effectivePrice(item);

        const profit = calculateUserProfit(
          price,
          brandRule?.percent ?? 0,
          incentiveRule?.type ?? "percent",
          incentiveRule?.value ?? 0
        );

        return {
          id: item.id,
          modelId: model.id,
          brandId: brand.id,
          brand: brand.brand || "Unknown Brand",
          model: model.model || "Unknown Model",
          variant: item.variant || "",
          price,
          originalPrice: Number(item.price) || 0,
          discountPrice: Number(item.discount_price) || 0,
          image: item.image_link || "",
          profit
        };
      });

    renderBrandFilters();
    renderProducts();

    showMessage(
      productList.length
        ? ""
        : "Koi visible product nahi mila. Product visibility settings check karein."
    );

  } catch (error) {
    console.error("Products load error:", error);
    setProductCount(0);

    showMessage(
      "Products load nahi huay: " +
      (error.message || "Unknown error")
    );
  }
}

function renderBrandFilters() {
  const container = $("brand-filters");

  if (!container) return;

  const brands = [
    ...new Set(productList.map(product => product.brand))
  ].sort();

  container.innerHTML = `
    <button
      type="button"
      class="brand-filter ${activeBrand === "all" ? "active" : ""}"
      data-brand="all">
      All Brands
    </button>

    ${brands.map(brand => `
      <button
        type="button"
        class="brand-filter ${activeBrand === brand ? "active" : ""}"
        data-brand="${escapeHTML(brand)}">
        ${escapeHTML(brand)}
      </button>
    `).join("")}
  `;
}

function renderProducts() {
  const container = getProductsContainer();

  if (!container) {
    console.error("HTML mein user-products-grid container nahi mila.");
    showMessage("Products display container nahi mila. HTML check karein.");
    return;
  }

  const filtered = productList.filter(product => {
    const matchesBrand =
      activeBrand === "all" || product.brand === activeBrand;

    const searchable = [
      product.brand,
      product.model,
      product.variant
    ].join(" ").toLowerCase();

    return matchesBrand &&
      searchable.includes(searchText.toLowerCase());
  });

  setProductCount(filtered.length);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-products">
        <p>Koi product nahi mila.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(product => `
    <article class="user-product-card">

      ${
        product.image
          ? `
            <img
              class="user-product-image"
              src="${escapeHTML(product.image)}"
              alt="${escapeHTML(product.brand + " " + product.model)}"
              loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">

            <div
              class="user-product-image-placeholder"
              style="display:none">
              Image unavailable
            </div>
          `
          : `
            <div class="user-product-image-placeholder">
              Image unavailable
            </div>
          `
      }

      <div class="user-product-info">

        <p class="user-product-brand">
          ${escapeHTML(product.brand)}
        </p>

        <h3 class="user-product-title">
          ${escapeHTML(product.model)}
        </h3>

        <p class="user-product-variant">
          ${escapeHTML(product.variant || "Standard")}
        </p>

        <p class="user-product-price">
          ${formatAmount(product.price)}
        </p>

        <div class="user-product-profit">
          <span>Your Profit</span>
          <strong>${formatAmount(product.profit)}</strong>
        </div>

      </div>
    </article>
  `).join("");
}

/* Brand Filter Click */
document.addEventListener("click", event => {
  const brandButton = event.target.closest("[data-brand]");

  if (!brandButton) return;

  activeBrand = brandButton.dataset.brand || "all";

  renderBrandFilters();
  renderProducts();
});

/* Search */
const searchInput = $("product-search");

if (searchInput) {
  searchInput.addEventListener("input", event => {
    searchText = event.target.value || "";
    renderProducts();
  });
}

/* Clear Search */
const clearSearchButton = $("clear-search");

if (clearSearchButton && searchInput) {
  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    searchText = "";
    renderProducts();
    searchInput.focus();
  });
}

/* Start My Profits */
initializeMyProfits();