import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../../config/supabase.public.js";

const grid = document.getElementById("catalog-grid");
const searchInput = document.getElementById("catalog-search");
const brandFilter = document.getElementById("brand-filter");
const sortFilter = document.getElementById("sort-filter");
const countLabel = document.getElementById("catalog-count");
const clearButton = document.getElementById("clear-filters");
const projectHost = new URL(SUPABASE_URL).hostname;

let products = [];
let brands = [];

function money(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function safeProductImage(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== projectHost ||
        !url.pathname.startsWith("/storage/v1/object/public/phone-images/")) return "";
    return url.href;
  } catch {
    return "";
  }
}

async function apiGet(table, query) {
  const url = SUPABASE_URL + "/rest/v1/" + table + "?" + query;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    throw new Error("Catalog request failed (" + response.status + ").");
  }
  return response.json();
}

function renderBrands() {
  brandFilter.replaceChildren(new Option("All brands", ""));
  brands.forEach((brand) => brandFilter.add(new Option(brand.brand, String(brand.id))));
}

function makePhoneCard(product) {
  const card = document.createElement("article");
  card.className = "phone-card";

  const imageBox = document.createElement("div");
  imageBox.className = "phone-image";
  const imageUrl = safeProductImage(product.image_link);
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = product.model.model + " " + (product.variant || "") + " mobile phone";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      image.replaceWith(makeFallback());
    }, { once: true });
    imageBox.append(image);
  } else {
    imageBox.append(makeFallback());
  }

  const info = document.createElement("div");
  info.className = "phone-info";
  const brand = document.createElement("p");
  brand.className = "phone-brand";
  brand.textContent = product.model.brand.brand;
  const name = document.createElement("h2");
  name.textContent = product.model.model;
  const variant = document.createElement("p");
  variant.className = "phone-variant";
  variant.textContent = product.variant || "Standard variant";

  const priceBox = document.createElement("div");
  priceBox.className = "phone-price";
  const price = Number(product.price) || 0;
  const discount = Number(product.discount_price) || 0;
  const current = discount > 0 && discount < price ? discount : price;
  const currentLabel = document.createElement("strong");
  currentLabel.textContent = money(current);
  priceBox.append(currentLabel);
  if (current < price) {
    const old = document.createElement("del");
    old.textContent = money(price);
    priceBox.append(old);
  }

  const actions = document.createElement("div");
  actions.className = "phone-actions";
  const estimate = document.createElement("a");
  estimate.href = "../tools/installment-calculator/?price=" + encodeURIComponent(String(current));
  estimate.textContent = "Estimate installments";
  actions.append(estimate);

  info.append(brand, name, variant, priceBox, actions);
  card.append(imageBox, info);
  return card;
}

function makeFallback() {
  const fallback = document.createElement("div");
  fallback.className = "phone-fallback";
  fallback.textContent = "AM";
  fallback.setAttribute("aria-hidden", "true");
  return fallback;
}

function filteredProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const brandId = brandFilter.value;
  const visible = products.filter((product) => {
    const brand = product.model.brand;
    const matchesBrand = !brandId || String(brand.id) === brandId;
    const haystack = [brand.brand, product.model.model, product.variant].join(" ").toLocaleLowerCase();
    return matchesBrand && (!query || haystack.includes(query));
  });

  if (sortFilter.value === "price-desc") {
    visible.sort((a,b) => effectivePrice(b) - effectivePrice(a));
  } else if (sortFilter.value === "name") {
    visible.sort((a,b) => a.model.model.localeCompare(b.model.model));
  } else {
    visible.sort((a,b) => effectivePrice(a) - effectivePrice(b));
  }
  return visible;
}

function effectivePrice(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount_price) || 0;
  return discount > 0 && discount < price ? discount : price;
}

function renderCatalog() {
  const visible = filteredProducts();
  grid.replaceChildren();
  countLabel.textContent = visible.length + (visible.length === 1 ? " phone" : " phones") + " shown";
  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "catalog-state catalog-empty";
    const message = document.createElement("p");
    message.textContent = "No phones match these filters. Try another search.";
    empty.append(message);
    grid.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  visible.forEach((product) => fragment.append(makePhoneCard(product)));
  grid.append(fragment);
}

async function loadCatalog() {
  try {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error("Public catalog connection is not configured.");
    const [brandRows, variantRows] = await Promise.all([
      apiGet("brands", "select=id,brand,show_brand&show_brand=eq.true&order=brand.asc"),
      apiGet("variants", "select=id,variant,price,discount_price,image_link,model:models!inner(id,model,show_catalog,brand:brands!inner(id,brand,show_brand))&show_website=eq.true&model.show_catalog=eq.true&model.brand.show_brand=eq.true&order=price.asc&limit=200")
    ]);
    brands = brandRows.filter((brand) => brand.show_brand === true);
    products = variantRows.filter((product) =>
      product.model?.show_catalog === true &&
      product.model?.brand?.show_brand === true
    );
    renderBrands();
    renderCatalog();
  } catch (error) {
    grid.replaceChildren();
    const state = document.createElement("div");
    state.className = "catalog-state";
    const message = document.createElement("p");
    message.className = "catalog-error";
    message.textContent = "We could not load the phone catalog right now. Please try again later.";
    state.append(message);
    grid.append(state);
    countLabel.textContent = "Catalog unavailable";
    console.error("Adeel Mobile public catalog:", error);
  }
}

searchInput.addEventListener("input", renderCatalog);
brandFilter.addEventListener("change", renderCatalog);
sortFilter.addEventListener("change", renderCatalog);
clearButton.addEventListener("click", () => {
  searchInput.value = "";
  brandFilter.value = "";
  sortFilter.value = "price-asc";
  renderCatalog();
});
document.getElementById("current-year").textContent = String(new Date().getFullYear());
loadCatalog();
