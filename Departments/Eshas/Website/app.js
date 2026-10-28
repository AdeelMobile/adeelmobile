
"use strict";

// Esha's Website — Supabase Products, Themes, WhatsApp Share & Posters

const SUPABASE_URL = "https://ckapceiyppzqjjjrwytc.supabase.co";
const SUPABASE_KEY = "sb_publishable_kpexj5TFbbg5IU5n75LG3A_Fx5kgrwO";

let WHATSAPP_NUMBER = "";

const cakeCategories = [];
const mehndiCategories = [];
const cakes = [];
const mehndi = [];

const themes = [
  { name: "Blush Pink", primary: "#B85D78", soft: "#F6E1E5" },
  { name: "Lavender", primary: "#8064A2", soft: "#EEE7F7" },
  { name: "Peach", primary: "#C76F50", soft: "#FBE7DA" },
  { name: "Berry", primary: "#8E3657", soft: "#F4E0E9" },
  { name: "Sage Green", primary: "#63816A", soft: "#E5EDE4" },
  { name: "Mehndi Green", primary: "#47634A", soft: "#E1E9DE" },
  { name: "Royal Blue", primary: "#426A9A", soft: "#E3ECF7" },
  { name: "Burgundy", primary: "#792D42", soft: "#F2E1E5" },
  { name: "Coffee Brown", primary: "#80583F", soft: "#F0E5D9" },
  { name: "Black & Gold", primary: "#292725", soft: "#EDE4D1" }
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function money(amount) {
  return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function supabaseGet(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${table}: HTTP ${response.status} — ${detail}`);
  }

  return response.json();
}

function getStorageImageUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const safePath = String(path)
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");

  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${safePath}`;
}

function getProductImage(product) {
  const images = Array.isArray(product.product_images)
    ? [...product.product_images]
    : [];

  images.sort((a, b) =>
    Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
    Number(a.sort_order || 0) - Number(b.sort_order || 0)
  );

  return getStorageImageUrl(images[0]?.storage_path || "");
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showProductsMessage(type, message) {
  const container = document.getElementById(
    type === "cake" ? "cakeProducts" : "mehndiProducts"
  );

  if (container) {
    container.innerHTML =
      `<p class="demo-note">${escapeHTML(message)}</p>`;
  }
}

async function loadWebsiteData() {
  const results = await Promise.all([
    supabaseGet(
      "categories",
      "select=id,name,slug,category_type,description,sort_order" +
      "&is_active=eq.true&order=sort_order.asc"
    ),
    supabaseGet(
      "products",
      "select=id,category_id,name,slug,short_description,description," +
      "weight,price,discount_price,is_available,show_on_website," +
      "is_featured,sort_order," +
      "categories!products_category_id_fkey(id,name,slug,category_type)," +
      "product_images(storage_path,alt_text,is_primary,sort_order)" +
      "&is_available=eq.true&show_on_website=eq.true" +
      "&order=sort_order.asc"
    ),
    supabaseGet(
      "website_settings",
      "select=setting_key,setting_value&is_public=eq.true"
    )
  ]);

  const categoryRows = results[0];
  const productRows = results[1];
  const settingsRows = results[2];

  cakeCategories.splice(
    0,
    cakeCategories.length,
    ...categoryRows
      .filter(item => item.category_type === "cake")
      .map(item => item.name)
  );

  mehndiCategories.splice(
    0,
    mehndiCategories.length,
    ...categoryRows
      .filter(item => item.category_type === "mehndi")
      .map(item => item.name)
  );

  cakes.splice(0, cakes.length);
  mehndi.splice(0, mehndi.length);

  for (const row of productRows) {
    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;

    if (!category) continue;

    const type = category.category_type;
    if (type !== "cake" && type !== "mehndi") continue;

    const product = {
      id: row.id,
      name: row.name,
      category: category.name,
      categorySlug: category.slug || slugify(category.name),
      description: row.short_description || row.description || "",
      weight: row.weight || "",
      price: Number(row.price || 0),
      offerPrice:
        row.discount_price != null &&
        Number(row.discount_price) > 0 &&
        Number(row.discount_price) < Number(row.price)
          ? Number(row.discount_price)
          : 0,
      image: getProductImage(row),
      type,
      featured: Boolean(row.is_featured)
    };

    if (type === "cake") cakes.push(product);
    else mehndi.push(product);
  }

  for (const row of settingsRows) {
    if (row.setting_key === "whatsapp_number") {
      const value = row.setting_value;

      WHATSAPP_NUMBER =
        typeof value === "string"
          ? value
          : String(value?.number || value?.value || "");
    }
  }

  buildCategories("cakeCategories", cakeCategories, "cake");
  buildCategories("mehndiCategories", mehndiCategories, "mehndi");

  renderProducts("cake");
  renderProducts("mehndi");
}

function productCard(product, index = 0) {
  const position = index % 9;
  const layout = position < 2
    ? "layout-two"
    : position === 2
      ? "layout-one"
      : "layout-six";

  const priceHTML = product.offerPrice
    ? `<span class="old-price">${money(product.price)}</span>
       <strong>${money(product.offerPrice)}</strong>`
    : `<strong>${money(product.price)}</strong>`;

  const weightHTML = product.type === "cake" && product.weight
    ? `<p class="product-weight">Weight: ${escapeHTML(product.weight)}</p>`
    : "";

  const imageHTML = product.image
    ? `<img src="${escapeHTML(product.image)}"
         alt="${escapeHTML(product.name)}"
         loading="lazy"
         style="width:100%;height:100%;object-fit:cover"
         onerror="this.style.display='none';this.parentElement.classList.add('image-fallback')">`
    : `<div class="image-fallback" role="img"
         aria-label="Product image not uploaded"></div>`;

  return `
    <article class="product-card ${layout}" data-product-id="${escapeHTML(product.id)}">
      <div class="product-image">
        ${imageHTML}
        <span class="product-badge">${escapeHTML(product.category)}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-description">${escapeHTML(product.description)}</p>
        ${weightHTML}
        <div class="product-prices">${priceHTML}</div>
        <div class="product-actions">
          <button class="btn btn-primary order-button" type="button"
            data-action="order" data-id="${escapeHTML(product.id)}">Order Now</button>
          <button class="btn btn-outline" type="button"
            data-action="share" data-id="${escapeHTML(product.id)}">Share</button>
          <button class="btn btn-outline poster-button" type="button"
            data-action="poster" data-id="${escapeHTML(product.id)}">Download Poster</button>
        </div>
      </div>
    </article>`;
}

function buildCategories(containerId, categories, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = [
    `<button class="category-btn active" type="button"
      data-category="all" data-type="${type}">
      All ${type === "cake" ? "Cakes" : "Designs"}
    </button>`,
    ...categories.map(category =>
      `<button class="category-btn" type="button"
        data-category="${slugify(category)}" data-type="${type}">
        ${escapeHTML(category)}
      </button>`
    )
  ].join("");
}

function renderProducts(type, searchText = "", categorySlug = "all") {
  const isCake = type === "cake";
  const container = document.getElementById(
    isCake ? "cakeProducts" : "mehndiProducts"
  );

  if (!container) return;

  const products = isCake ? cakes : mehndi;
  const search = searchText.trim().toLowerCase();

  const filtered = products.filter(product => {
    const matchesSearch =
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      categorySlug === "all" || product.categorySlug === categorySlug;

    return matchesSearch && matchesCategory;
  });

  container.innerHTML = filtered.length
    ? filtered.map((product, index) => productCard(product, index)).join("")
    : `<p class="demo-note">${
        products.length
          ? "No matching products found. Try another search."
          : "Abhi products add nahi kiye gaye. Please baad mein check karein."
      }</p>`;
}

function getWhatsAppNumber() {
  return WHATSAPP_NUMBER.replace(/\D/g, "");
}

function whatsappLink(message) {
  const number = getWhatsAppNumber();
  if (!number) return "";

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function orderProduct(product) {
  const number = getWhatsAppNumber();

  if (!number) {
    showToast("WhatsApp number abhi Website Settings mein set nahi hai.");
    return;
  }

  const message =
    `Assalam-o-Alaikum! I would like to order:\n` +
    `Product: ${product.name}\n` +
    `Category: ${product.category}\n` +
    `Price: ${money(product.offerPrice || product.price)}\n` +
    (product.weight ? `Weight: ${product.weight}\n` : "") +
    `Please share further details.`;

  window.open(whatsappLink(message), "_blank", "noopener");
}

function shareProduct(product) {
  const message =
    `Check out ${product.name} at Esha's!\n` +
    `Category: ${product.category}\n` +
    `Price: ${money(product.offerPrice || product.price)}\n` +
    `${window.location.href.split("#")[0]}#${product.type === "cake" ? "cakes" : "mehndi"}`;

  const link = whatsappLink(message) ||
    `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(link, "_blank", "noopener");
}

function shareWebsite() {
  const message =
    `Explore Esha's homemade Cakes & Mehndi designs:\n` +
    window.location.href.split("#")[0];

  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener"
  );
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function downloadPoster(product) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext("2d");

  const key = product.type === "cake"
    ? "esha-cake-theme"
    : "esha-mehndi-theme";

  const savedTheme = Number(localStorage.getItem(key) || 0);
  const palette = themes[((savedTheme % themes.length) + themes.length) % themes.length];

  ctx.fillStyle = palette.soft;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = palette.primary;
  ctx.fillRect(0, 0, canvas.width, 170);

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = "bold 64px Arial";
  ctx.fillText("Esha's", 540, 105);

  try {
    if (!product.image) throw new Error("No product image");

    const image = await loadImage(product.image);
    const imageY = 220;
    const imageHeight = 850;
    const ratio = Math.min(960 / image.width, imageHeight / image.height);
    const width = image.width * ratio;
    const height = image.height * ratio;

    ctx.drawImage(
      image,
      (1080 - width) / 2,
      imageY + (imageHeight - height) / 2,
      width,
      height
    );
  } catch {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(60, 220, 960, 850);
    ctx.fillStyle = palette.primary;
    ctx.font = "bold 60px Arial";
    ctx.fillText(
      product.type === "cake" ? "Beautiful Cake" : "Mehndi Design",
      540,
      650
    );
  }

  ctx.fillStyle = "#392B30";
  ctx.textAlign = "center";
  ctx.font = "bold 52px Arial";
  wrapCanvasText(ctx, product.name, 540, 1160, 920, 65);

  ctx.font = "34px Arial";
  ctx.fillText(product.category, 540, 1300);

  if (product.weight) {
    ctx.fillText(`Weight: ${product.weight}`, 540, 1360);
  }

  let priceY = product.weight ? 1450 : 1400;

  if (product.offerPrice) {
    ctx.fillStyle = "#777777";
    ctx.font = "36px Arial";
    ctx.fillText(`Regular: ${money(product.price)}`, 540, priceY);
    priceY += 65;
  }

  ctx.fillStyle = palette.primary;
  ctx.font = "bold 58px Arial";
  ctx.fillText(`Price: ${money(product.offerPrice || product.price)}`, 540, priceY);

  ctx.fillStyle = "#392B30";
  ctx.font = "30px Arial";
  ctx.fillText("To order, contact us on WhatsApp", 540, 1710);

  const number = getWhatsAppNumber();
  ctx.font = "bold 32px Arial";
  ctx.fillText(
    number ? `WhatsApp: +${number}` : "WhatsApp: Contact details coming soon",
    540,
    1770
  );

  ctx.fillStyle = palette.primary;
  ctx.fillRect(0, 1830, 1080, 90);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "28px Arial";
  ctx.fillText("Made with love • Esha's Cakes & Mehndi", 540, 1885);

  canvas.toBlob(blob => {
    if (!blob) {
      showToast("Poster create nahi ho saka. Dobara try karein.");
      return;
    }

    const fileName = `${slugify(product.name)}-esha-poster.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast("Poster download ho raha hai.");
  }, "image/png");
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;

    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) ctx.fillText(line, x, currentY);
}

function applyTheme(type, themeIndex) {
  const theme = themes[themeIndex % themes.length];
  const section = document.querySelector(
    `[data-shop-section="${type === "cake" ? "cakes" : "mehndi"}"]`
  );

  if (!section) return;

  section.style.setProperty("--section-primary", theme.primary);
  section.style.setProperty("--section-soft", theme.soft);

  section.querySelectorAll(
    ".btn-primary, .category-btn.active, .product-badge"
  ).forEach(element => {
    element.style.backgroundColor = theme.primary;
  });

  section.style.backgroundColor = theme.soft;
}

function setupThemes() {
  ["cake", "mehndi"].forEach(type => {
    const key = type === "cake" ? "esha-cake-theme" : "esha-mehndi-theme";
    const button = document.querySelector(
      `[data-theme-toggle="${type === "cake" ? "cakes" : "mehndi"}"]`
    );

    const saved = Number(localStorage.getItem(key) || 0);
    const safeIndex = ((saved % themes.length) + themes.length) % themes.length;

    applyTheme(type, safeIndex);

    if (button) {
      button.textContent = `Theme: ${themes[safeIndex].name}`;

      button.addEventListener("click", () => {
        const current = Number(localStorage.getItem(key) || 0);
        const next = (current + 1) % themes.length;

        localStorage.setItem(key, String(next));
        applyTheme(type, next);
        button.textContent = `Theme: ${themes[next].name}`;
        showToast(`${themes[next].name} theme applied.`);
      });
    }
  });
}

function getSelectedCategory(type) {
  const container = document.getElementById(
    type === "cake" ? "cakeCategories" : "mehndiCategories"
  );

  return container?.querySelector(".category-btn.active")?.dataset.category || "all";
}

function setupSearch() {
  const cakeSearch = document.getElementById("cakeSearch");
  const mehndiSearch = document.getElementById("mehndiSearch");

  if (cakeSearch) {
    cakeSearch.addEventListener("input", () =>
      renderProducts("cake", cakeSearch.value, getSelectedCategory("cake"))
    );
  }

  if (mehndiSearch) {
    mehndiSearch.addEventListener("input", () =>
      renderProducts("mehndi", mehndiSearch.value, getSelectedCategory("mehndi"))
    );
  }
}

function setupCategoryFilters() {
  document.addEventListener("click", event => {
    const button = event.target.closest(".category-btn[data-type]");
    if (!button) return;

    const type = button.dataset.type;
    const container = document.getElementById(
      type === "cake" ? "cakeCategories" : "mehndiCategories"
    );

    if (!container) return;

    container.querySelectorAll(".category-btn").forEach(item =>
      item.classList.remove("active")
    );

    button.classList.add("active");

    const search = document.getElementById(
      type === "cake" ? "cakeSearch" : "mehndiSearch"
    );

    renderProducts(type, search?.value || "", button.dataset.category);
  });
}

function setupProductActions() {
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const product = [...cakes, ...mehndi].find(
      item => String(item.id) === String(button.dataset.id)
    );

    if (!product) return;

    if (button.dataset.action === "order") orderProduct(product);
    if (button.dataset.action === "share") shareProduct(product);
    if (button.dataset.action === "poster") downloadPoster(product);
  });
}

function setupMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupWebsiteShare() {
  const header = document.querySelector(".site-header");
  if (!header || document.getElementById("websiteShareButton")) return;

  const button = document.createElement("button");
  button.id = "websiteShareButton";
  button.type = "button";
  button.className = "btn btn-outline";
  button.textContent = "Share Website";
  button.style.margin = "8px";
  button.addEventListener("click", shareWebsite);

  header.appendChild(button);
}

function setupFooter() {
  const year = document.getElementById("currentYear");
  if (year) year.textContent = new Date().getFullYear();
}

async function init() {
  setupThemes();
  setupSearch();
  setupCategoryFilters();
  setupProductActions();
  setupMobileMenu();
  setupWebsiteShare();
  setupFooter();

  showProductsMessage("cake", "Supabase se products load ho rahe hain...");
  showProductsMessage("mehndi", "Supabase se designs load ho rahe hain...");

  try {
    await loadWebsiteData();

    console.log(
      `Esha's website loaded from Supabase: ${cakes.length} cakes and ${mehndi.length} Mehndi designs.`
    );
  } catch (error) {
    console.error("Esha's Supabase loading error:", error);

    showProductsMessage(
      "cake",
      "Products load nahi ho sake. Supabase connection aur policies check karein."
    );

    showProductsMessage(
      "mehndi",
      "Designs load nahi ho sake. Supabase connection aur policies check karein."
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
