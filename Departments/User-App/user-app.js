"use strict";

// Adeel Mobile - User Dashboard
// Supabase + Products + User Profit + Navigation + Reports + Poster

const LOGIN_PAGE = new URL("../../index.html", document.currentScript.src).href;

const appScreen = document.getElementById("app-screen");
const appMessage = document.getElementById("app-message");
const loadingScreen = document.getElementById("loading-screen");

let currentUser = null;
let currentProfile = null;
let productList = [];
let productLoadStarted = false;
let topProductIndex = 0;
let topProductTimer = null;

function $(id) {
  return document.getElementById(id);
}

// -------------------------------------
// General helpers
// -------------------------------------

function showAppMessage(message) {
  if (!appMessage) return;
  appMessage.textContent = message || "";
  appMessage.classList.toggle("show", Boolean(message));
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Rs. 0";
  return "Rs. " + Math.round(amount).toLocaleString("en-PK");
}

function showLoading(message = "Loading your account...") {
  if (loadingScreen) {
    loadingScreen.textContent = message;
    loadingScreen.style.display = "block";
  }
  appScreen?.classList.add("hidden");
}

function showApp() {
  if (loadingScreen) loadingScreen.style.display = "none";
  appScreen?.classList.remove("hidden");
}

function escapeHTML(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c];
  });
}

function isUserAccount(user) {
  return user?.app_metadata?.role === "user";
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function effectivePrice(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount_price) || 0;
  return discount > 0 && discount < price ? discount : price;
}

function formatVariant(value) {
  const match = String(value || "").match(/^(\d+)\s*\/\s*(\d+)$/);
  return match
    ? `${match[1]}GB / ${match[2]}GB`
    : String(value || "");
}

// Customer product link mein referral code shamil hai.
function getPublicProductURL(productId) {
  const url = new URL("../Website-Preview/product.html", location.href);
  url.searchParams.set("id", productId);

  const referralCode = currentProfile?.referral_code;
  if (referralCode) {
    url.searchParams.set("referral", referralCode);
  }

  return url.href;
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

// -------------------------------------
// Installment calculation
// -------------------------------------

function calculateInstallmentPlan(price, months) {
  const MARKUP = { 3: 0.15, 6: 0.30, 9: 0.40 };
  const amount = Number(price) || 0;
  const advance = Math.round(amount * (amount < 60000 ? 0.20 : 0.30));
  const remaining = amount - advance;
  const markup = Math.round(remaining * (MARKUP[months] || 0.30));

  return {
    advance,
    monthly: Math.round((remaining + markup) / months),
    total: advance + remaining + markup
  };
}

// -------------------------------------
// Profit calculation
// -------------------------------------

function calculateUserProfit(price, brandPercent, incentiveType, incentiveValue) {
  price = Number(price) || 0;
  brandPercent = Number(brandPercent) || 0;
  incentiveValue = Number(incentiveValue) || 0;

  const brandProfit = price * brandPercent / 100;

  const modelIncentive = incentiveType === "percent"
    ? price * incentiveValue / 100
    : incentiveType === "fixed"
      ? incentiveValue
      : 0;

  return {
    brandProfit: Math.round(brandProfit),
    modelIncentive: Math.round(modelIncentive),
    totalProfit: Math.round(brandProfit + modelIncentive)
  };
}

// -------------------------------------
// Navigation
// -------------------------------------

function closeSideMenu() {
  const menu = $("side-menu");
  const overlay = $("menu-overlay");

  menu?.classList.remove("open", "active");
  overlay?.classList.add("hidden");

  if (overlay) overlay.style.display = "none";
  $("menu-toggle")?.setAttribute("aria-expanded", "false");
}

function openSideMenu() {
  const menu = $("side-menu");
  const overlay = $("menu-overlay");

  if (!menu) return;

  menu.classList.add("open", "active");

  if (overlay) {
    overlay.classList.remove("hidden");
    overlay.style.display = "block";
  }

  $("menu-toggle")?.setAttribute("aria-expanded", "true");
}

function setActiveNavigation(pageName) {
  document.querySelectorAll("[data-page]").forEach(button => {
    const isActive = button.dataset.page === pageName;
    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function switchPage(pageName) {
  closeSideMenu();
  showAppMessage("");

  // Products / My Profits List alag page par khulega.
  if (pageName === "products") {
    window.location.href = "my-profits.html";
    return;
  }

  const availablePages = [
    "home",
    "sales",
    "applications",
    "wallet",
    "customers",
    "target",
    "share",
    "settings",
    "profile"
  ];

  if (!availablePages.includes(pageName)) return;

  const targetPage = $(`tab-${pageName}`);

  if (!targetPage) {
    showAppMessage("Ye section abhi HTML mein available nahi hai.");
    return;
  }

  document.querySelectorAll(".tab-page").forEach(page => {
    page.classList.add("hidden");
  });

  targetPage.classList.remove("hidden");
  setActiveNavigation(pageName);
  window.scrollTo({ top: 0, behavior: "auto" });

  if (pageName === "home") {
    stopTopProductSlider();
    startTopProductSlider();
  } else {
    stopTopProductSlider();
  }
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    switchPage(button.dataset.page);
  });
});

$("menu-toggle")?.addEventListener("click", () => {
  const menu = $("side-menu");

  if (menu?.classList.contains("open") ||
      menu?.classList.contains("active")) {
    closeSideMenu();
  } else {
    openSideMenu();
  }
});

$("menu-overlay")?.addEventListener("click", closeSideMenu);

$("products-back")?.addEventListener("click", () => {
  switchPage("home");
});

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    switchPage(button.dataset.tab);
  });
});

$("products-tab-button")?.addEventListener("click", () => {
  switchPage("products");
});

// My Profits List button — direct page connection.
$("my-profits-list-button")?.addEventListener("click", () => {
  window.location.href = "my-profits.html";
});

// -------------------------------------
// Monthly sales and target progress
// -------------------------------------

async function loadMonthlySales() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data, error } = await db
      .from("sales_records")
      .select("*")
      .eq("user_id", currentUser.id)
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", nextMonth.toISOString());

    if (error) throw error;

    const totalSales = (data || []).reduce((sum, sale) => {
      return sum + Number(sale.sale_amount || sale.total_amount || 0);
    }, 0);

    const salesElement = document.getElementById("monthly-sales");
    if (salesElement) {
      salesElement.textContent = formatAmount(totalSales);
    }

    const target = Number(currentProfile?.sale_target || 0);
    const progress = target > 0
      ? Math.min((totalSales / target) * 100, 100)
      : 0;

    const targetElement = document.getElementById("target-progress");
    if (targetElement) {
      targetElement.style.width = `${progress}%`;
    }

    const targetText = document.getElementById("target-progress-text");
    if (targetText) {
      targetText.textContent = `${Math.round(progress)}%`;
    }

    setText("target-percent", `${Math.round(progress)}%`);
    setText("monthly-target", formatAmount(target));

  } catch (error) {
    console.error("Monthly sales load error:", error);
  }
}

// -------------------------------------
// Verification counts
// -------------------------------------

async function loadVerificationCounts() {
  try {
    const { data, error } = await db
      .from("verifications")
      .select("*")
      .eq("user_id", currentUser.id);

    if (error) throw error;

    const records = data || [];

    const pending = records.filter(item =>
      String(item.status || "").toLowerCase() === "pending"
    ).length;

    const pendingElement = document.getElementById("pending-verifications");
    if (pendingElement) {
      pendingElement.textContent = pending;
    }

    setText(
      "rejected-verifications",
      records.filter(item =>
        String(item.status || "").toLowerCase() === "rejected"
      ).length
    );

    setText(
      "approved-verifications",
      records.filter(item =>
        String(item.status || "").toLowerCase() === "approved"
      ).length
    );

  } catch (error) {
    console.error("Verification counts load error:", error);
  }
}

// -------------------------------------
// Wallet balance
// -------------------------------------

async function loadWalletBalance() {
  try {
    const { data, error } = await db
      .from("user_payouts")
      .select("*")
      .eq("user_id", currentUser.id);

    if (error) throw error;

    const balance = (data || []).reduce((sum, payout) => {
      return sum + Number(
        payout.amount || payout.profit_amount || 0
      );
    }, 0);

    const walletElement = document.getElementById("wallet-balance");
    if (walletElement) {
      walletElement.textContent = formatAmount(balance);
    }

    setText("welcome-wallet-balance", formatAmount(balance));

  } catch (error) {
    console.error("Wallet balance load error:", error);
  }
}
// -------------------------------------
// Customer count
// -------------------------------------

async function loadCustomerCount() {
  try {
    const { count, error } = await db
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUser.id);

    if (error) throw error;

    const customerElement = document.getElementById("customer-count");
    if (customerElement) {
      customerElement.textContent = count || 0;
    }
  } catch (error) {
    console.error("Customer count load error:", error);
  }
}

// -------------------------------------
// Load user profile
// -------------------------------------

async function loadUserProfile() {
  try {
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("auth_user_id", currentUser.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error("User profile not found.");
    }

    currentProfile = data;

    const nameElement = document.getElementById("user-name");
    if (nameElement) {
      nameElement.textContent = data.name || "User";
    }

    const headerNameElement = document.getElementById("header-user-name");
    if (headerNameElement) {
      headerNameElement.textContent = data.name || "User";
    }

    const menuNameElement = document.getElementById("menu-user-name");
    if (menuNameElement) {
      menuNameElement.textContent = data.name || "User";
    }

    const referralElement = document.getElementById("referral-code");
    if (referralElement) {
      referralElement.textContent = data.referral_code || "—";
    }

    renderProfile(data);

  } catch (error) {
    console.error("User profile load error:", error);
    throw error;
  }
}

// -------------------------------------
// Render profile
// -------------------------------------

function renderProfile(profile) {
  const nameElement = document.getElementById("profile-name");
  if (nameElement) {
    nameElement.textContent = profile.name || "User";
  }

  const contactElement = document.getElementById("profile-contact");
  if (contactElement) {
    contactElement.textContent = profile.contact || "—";
  }

  const usernameElement = document.getElementById("profile-username");
  if (usernameElement) {
    usernameElement.textContent = profile.login_username || "—";
  }

  const referralElement = document.getElementById("profile-referral-code");
  if (referralElement) {
    referralElement.textContent = profile.referral_code || "—";
  }
}

// -------------------------------------
// Load user products
// -------------------------------------

async function loadUserProducts() {
  try {
    const { data, error } = await db
      .from("variants")
      .select(`
        id,
        ram_storage,
        price,
        discount_price,
        image_url,
        status,
        models (
          id,
          name,
          show_website,
          show_inst_website,
          brands (
            id,
            name
          )
        )
      `);

    if (error) throw error;

    const variants = (data || []).filter(variant => {
      const model = variant.models;
      return model &&
        model.show_inst_website === true &&
        String(variant.status || "active").toLowerCase() === "active";
    });

    const { data: brandProfits, error: brandError } = await db
      .from("user_brand_profit")
      .select("*")
      .eq("user_id", currentUser.id);

    if (brandError) throw brandError;

    const { data: modelIncentives, error: incentiveError } = await db
      .from("user_model_incentive")
      .select("*")
      .eq("user_id", currentUser.id);

    if (incentiveError) throw incentiveError;

    productList = variants.map(variant => {
      const model = variant.models || {};
      const brand = model.brands || {};

      const brandProfit = (brandProfits || []).find(item =>
        String(item.brand_id) === String(brand.id)
      );

      const modelIncentive = (modelIncentives || []).find(item =>
        String(item.model_id) === String(model.id)
      );

      const price = effectivePrice(variant);

      const profit = calculateUserProfit(
        price,
        brandProfit?.profit_percent || brandProfit?.percentage || 0,
        modelIncentive?.incentive_type || "fixed",
        modelIncentive?.incentive_value || modelIncentive?.amount || 0
      );

      return {
        id: variant.id,
        brand: brand.name || "Unknown Brand",
        model: model.name || "Unknown Model",
        variant: variant.ram_storage || "",
        price: Number(variant.price) || 0,
        discount_price: Number(variant.discount_price) || 0,
        image_url: variant.image_url || "",
        advance: calculateInstallmentPlan(price, 9).advance,
        user_profit: profit.totalProfit
      };
    });

    renderUserProducts(productList);
    renderTopProducts(productList);

  } catch (error) {
    console.error("User products load error:", error);
    showAppMessage("Products load nahi ho sake. Dobara try karein.");
  }
}

// -------------------------------------
// Render user products
// -------------------------------------

function renderUserProducts(products) {
  const container = $("user-products-grid");
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <p class="empty-message">Abhi koi product available nahi hai.</p>
    `;
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="product-card">
      <div class="product-image">
        ${
          product.image_url
            ? `<img src="${escapeHTML(product.image_url)}"
                 alt="${escapeHTML(product.brand)} ${escapeHTML(product.model)}"
                 loading="lazy">`
            : `<div class="product-image-placeholder">No Image</div>`
        }
      </div>

      <div class="product-info">
        <h3>${escapeHTML(product.brand)} ${escapeHTML(product.model)}</h3>
        <p class="product-variant">${escapeHTML(formatVariant(product.variant))}</p>
        <p>Price: <strong>${formatAmount(effectivePrice(product))}</strong></p>
        <p>Advance: <strong>${formatAmount(product.advance)}</strong></p>
        <p class="user-profit">
          Your Profit: <strong>${formatAmount(product.user_profit)}</strong>
        </p>

        <div class="product-actions">
          <button type="button"
            data-product-action="share"
            data-product-id="${escapeHTML(product.id)}">
            Share
          </button>

          <button type="button"
            data-product-action="poster"
            data-product-id="${escapeHTML(product.id)}">
            Download Poster
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

// -------------------------------------
// Top 5 profitable products slider
// -------------------------------------

function renderTopProducts(products) {
  const container = $("top-products-slider");
  if (!container) return;

  const topProducts = [...(products || [])]
    .sort((a, b) => Number(b.user_profit || 0) - Number(a.user_profit || 0))
    .slice(0, 5);

  if (topProducts.length === 0) {
    container.innerHTML = `
      <p class="empty-message">Abhi products available nahi hain.</p>
    `;
    updateTopProductDots(0);
    return;
  }

  container.innerHTML = topProducts.map((product, index) => `
    <article class="top-product-card ${index === 0 ? "active" : ""}"
      data-top-index="${index}">
      <div class="top-product-image">
        ${
          product.image_url
            ? `<img src="${escapeHTML(product.image_url)}"
                 alt="${escapeHTML(product.brand)} ${escapeHTML(product.model)}"
                 loading="lazy">`
            : `<div class="product-image-placeholder">No Image</div>`
        }
      </div>

      <div class="top-product-info">
        <h3>${escapeHTML(product.brand)} ${escapeHTML(product.model)}</h3>
        <p>${escapeHTML(formatVariant(product.variant))}</p>
        <p>Your Profit:
          <strong>${formatAmount(product.user_profit)}</strong>
        </p>
        <button type="button"
          data-product-action="share"
          data-product-id="${escapeHTML(product.id)}">
          Share Product
        </button>
      </div>
    </article>
  `).join("");

  topProductIndex = 0;
  updateTopProductDots(topProducts.length);
}

function moveTopProductSlider() {
  const cards = document.querySelectorAll(".top-product-card");
  if (cards.length <= 1) return;

  cards[topProductIndex]?.classList.remove("active");

  topProductIndex = (topProductIndex + 1) % cards.length;

  cards[topProductIndex]?.classList.add("active");
  updateTopProductDots(cards.length);
}

function updateTopProductDots(total) {
  const dotsContainer = $("top-products-dots");
  if (!dotsContainer) return;

  if (!total) {
    dotsContainer.innerHTML = "";
    return;
  }

  dotsContainer.innerHTML = Array.from(
    { length: total },
    (_, index) => `
      <button type="button"
        class="top-product-dot ${index === topProductIndex ? "active" : ""}"
        data-top-dot="${index}"
        aria-label="Show product ${index + 1}">
      </button>
    `
  ).join("");
}

function startTopProductSlider() {
  stopTopProductSlider();

  const cards = document.querySelectorAll(".top-product-card");
  if (cards.length <= 1) return;

  // Slider har 60 seconds baad move hoga.
  topProductTimer = setInterval(moveTopProductSlider, 60000);
}

function stopTopProductSlider() {
  if (topProductTimer) {
    clearInterval(topProductTimer);
    topProductTimer = null;
  }
}

function restartTopProductSlider() {
  topProductIndex = 0;

  document.querySelectorAll(".top-product-card").forEach((card, index) => {
    card.classList.toggle("active", index === 0);
  });

  updateTopProductDots(
    document.querySelectorAll(".top-product-card").length
  );

  startTopProductSlider();
}

// -------------------------------------
// Share customer product on WhatsApp
// -------------------------------------

async function shareCustomerProduct(productId) {
  try {
    const product = productList.find(item =>
      String(item.id) === String(productId)
    );

    if (!product) {
      showAppMessage("Product nahi mila.");
      return;
    }

    const productURL = getPublicProductURL(product.id);
    const price = effectivePrice(product);
    const plan3 = calculateInstallmentPlan(price, 3);
    const plan6 = calculateInstallmentPlan(price, 6);
    const plan9 = calculateInstallmentPlan(price, 9);

    const message = [
      "📱 *Adeel Mobile*",
      "",
      `*${product.brand} ${product.model}*`,
      `Variant: ${formatVariant(product.variant)}`,
      `Price: ${formatAmount(price)}`,
      "",
      "*Installment Plans:*",
      `3 Months: Advance ${formatAmount(plan3.advance)} + ${formatAmount(plan3.monthly)}/month`,
      `6 Months: Advance ${formatAmount(plan6.advance)} + ${formatAmount(plan6.monthly)}/month`,
      `9 Months: Advance ${formatAmount(plan9.advance)} + ${formatAmount(plan9.monthly)}/month`,
      "",
      "Product details aur order ke liye link kholein:",
      productURL
    ].join("\n");

    const whatsappURL =
      "https://wa.me/?text=" + encodeURIComponent(message);

    window.open(whatsappURL, "_blank");
  } catch (error) {
    console.error("Share product error:", error);
    showAppMessage("Product share nahi ho saka.");
  }
}
// -------------------------------------
// Download product poster
// -------------------------------------

async function downloadProductPoster(productId) {
  try {
    const product = productList.find(item =>
      String(item.id) === String(productId)
    );

    if (!product) {
      showAppMessage("Product nahi mila.");
      return;
    }

    const price = effectivePrice(product);
    const plan3 = calculateInstallmentPlan(price, 3);
    const plan6 = calculateInstallmentPlan(price, 6);
    const plan9 = calculateInstallmentPlan(price, 9);

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      showAppMessage("Poster canvas available nahi hai.");
      return;
    }

    // Poster background
    ctx.fillStyle = "#171717";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 64px Arial";
    ctx.fillText("ADEEL MOBILE", 540, 115);

    ctx.fillStyle = "#bdbdbd";
    ctx.font = "32px Arial";
    ctx.fillText("EASY MONTHLY INSTALLMENTS", 540, 175);

    // Divider
    ctx.fillStyle = "#666666";
    ctx.fillRect(100, 220, 880, 4);

    // Product name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px Arial";
    ctx.fillText(`${product.brand} ${product.model}`, 540, 315, 940);

    ctx.fillStyle = "#cccccc";
    ctx.font = "36px Arial";
    ctx.fillText(formatVariant(product.variant), 540, 375);

    // Product image
    const drawProductImage = async () => {
      if (!product.image_url) return;

      try {
        const image = new Image();
        image.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = product.image_url;
        });

        const maxWidth = 760;
        const maxHeight = 650;
        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height
        );

        const width = image.width * scale;
        const height = image.height * scale;

        ctx.drawImage(
          image,
          (canvas.width - width) / 2,
          430 + (maxHeight - height) / 2,
          width,
          height
        );
      } catch (error) {
        console.warn("Poster product image could not load:", error);
      }
    };

    await drawProductImage();

    // Price
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.fillText("CASH PRICE", 540, 1160);

    ctx.fillStyle = "#d6d6d6";
    ctx.font = "bold 76px Arial";
    ctx.fillText(formatAmount(price), 540, 1250);

    // Advance
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "38px Arial";
    ctx.fillText("ADVANCE PAYMENT", 540, 1335);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 54px Arial";
    ctx.fillText(formatAmount(plan9.advance), 540, 1410);

    // Installment plans
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Arial";
    ctx.fillText("MONTHLY PLANS", 540, 1500);

    ctx.textAlign = "left";
    ctx.font = "34px Arial";
    ctx.fillStyle = "#e8e8e8";

    ctx.fillText(
      `3 Months: ${formatAmount(plan3.monthly)} / month`,
      115,
      1575
    );

    ctx.fillText(
      `6 Months: ${formatAmount(plan6.monthly)} / month`,
      115,
      1640
    );

    ctx.fillText(
      `9 Months: ${formatAmount(plan9.monthly)} / month`,
      115,
      1705
    );

    // Footer
    ctx.fillStyle = "#666666";
    ctx.fillRect(100, 1760, 880, 3);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.fillText("Contact us to order", 540, 1820);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "28px Arial";
    ctx.fillText("Adeel Mobile", 540, 1870);

    // Download poster
    canvas.toBlob(blob => {
      if (!blob) {
        showAppMessage("Poster download nahi ho saka.");
        return;
      }

      const downloadURL = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadURL;
      link.download = `adeel-mobile-${product.id}-poster.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Download start hone ke baad URL revoke karein.
      setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);
    }, "image/png");

  } catch (error) {
    console.error("Poster download error:", error);
    showAppMessage("Poster banate waqt error aaya.");
  }
}

// -------------------------------------
// Product action buttons
// -------------------------------------

async function handleProductAction(action, productId) {
  if (action === "share") {
    await shareCustomerProduct(productId);
    return;
  }

  if (action === "poster") {
    await downloadProductPoster(productId);
  }
}

// Product grid buttons
$("user-products-grid")?.addEventListener("click", event => {
  const button = event.target.closest("[data-product-action]");
  if (!button) return;

  handleProductAction(
    button.dataset.productAction,
    button.dataset.productId
  );
});

// Top products slider buttons
$("top-products-slider")?.addEventListener("click", event => {
  const button = event.target.closest("[data-product-action]");
  if (!button) return;

  handleProductAction(
    button.dataset.productAction,
    button.dataset.productId
  );
});

// Top product slider dots
$("top-products-dots")?.addEventListener("click", event => {
  const button = event.target.closest("[data-top-dot]");
  if (!button) return;

  const index = Number(button.dataset.topDot);
  const cards = document.querySelectorAll(".top-product-card");

  if (!Number.isInteger(index) || index < 0 || index >= cards.length) {
    return;
  }

  topProductIndex = index;

  cards.forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });

  updateTopProductDots(cards.length);
  startTopProductSlider();
});

// -------------------------------------
// Share website on WhatsApp
// -------------------------------------

function shareWebsiteOnWhatsApp() {
  const websiteURL = new URL(
    "../Website-Preview/index.html",
    location.href
  ).href;

  const message = [
    "Assalam-o-Alaikum!",
    "",
    "Adeel Mobile par mobiles aur installment plans dekhein.",
    "",
    websiteURL
  ].join("\n");

  const whatsappURL =
    "https://wa.me/?text=" + encodeURIComponent(message);

  window.open(whatsappURL, "_blank");
}

// -------------------------------------
// Open website
// -------------------------------------

function openWebsite() {
  const websiteURL = new URL(
    "../Website-Preview/index.html",
    location.href
  ).href;

  window.open(websiteURL, "_blank");
}

// -------------------------------------
// Copy referral code
// -------------------------------------

async function copyReferralCode() {
  const referralCode = currentProfile?.referral_code;

  if (!referralCode) {
    showAppMessage("Referral code available nahi hai.");
    return;
  }

  try {
    await navigator.clipboard.writeText(referralCode);
    showAppMessage("Referral code copy ho gaya.");
  } catch (error) {
    console.error("Copy referral code error:", error);
    showAppMessage("Code copy nahi hua. Khud select karke copy karein.");
  }
}

// -------------------------------------
// Button event listeners
// -------------------------------------

$("share-website")?.addEventListener("click", shareWebsiteOnWhatsApp);
$("share-website-button")?.addEventListener("click", shareWebsiteOnWhatsApp);

$("open-website")?.addEventListener("click", openWebsite);
$("open-website-button")?.addEventListener("click", openWebsite);

$("copy-referral-code")?.addEventListener("click", copyReferralCode);
$("copy-referral-button")?.addEventListener("click", copyReferralCode);

// -------------------------------------
// Logout
// -------------------------------------

async function logout() {
  try {
    stopTopProductSlider();

    const { error } = await db.auth.signOut();

    if (error) throw error;

    window.location.href = LOGIN_PAGE;
  } catch (error) {
    console.error("Logout error:", error);
    showAppMessage("Logout nahi ho saka. Dobara try karein.");
  }
}

$("logout-button")?.addEventListener("click", logout);
$("logout")?.addEventListener("click", logout);

// -------------------------------------
// Open User App
// -------------------------------------

function openUserApp() {
  window.location.href = LOGIN_PAGE;
}

// -------------------------------------
// Initialize User App
// -------------------------------------

async function initializeUserApp() {
  showLoading("Loading your account...");

  try {
    // Supabase config se shared database client hasil karein.
    const dbClient = window.db;

    if (!dbClient) {
      throw new Error("Supabase database client initialize nahi hua.");
    }

    const { data, error } = await dbClient.auth.getSession();

    if (error) throw error;

    const session = data?.session;

    if (!session?.user) {
      window.location.href = LOGIN_PAGE;
      return;
    }

    currentUser = session.user;

    if (!isUserAccount(currentUser)) {
      showAppMessage("Yeh account User App ke liye nahi hai.");
      showApp();
      return;
    }

    await loadUserProfile();

    await Promise.all([
      loadMonthlySales(),
      loadVerificationCounts(),
      loadWalletBalance(),
      loadCustomerCount()
    ]);

    await loadUserProducts();

    showApp();
    switchPage("home");

  } catch (error) {
    console.error("User App initialization error:", error);
    showLoading(
      "Account load nahi ho saka. Page refresh karke dobara try karein."
    );
  }
}

// -------------------------------------
// Start User App
// -------------------------------------

initializeUserApp();