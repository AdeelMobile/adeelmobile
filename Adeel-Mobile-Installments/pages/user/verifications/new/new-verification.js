import { getProductVariants, submitP5Application } from "../../../../js/services/phase5-verification-service.js";

const form = document.querySelector("#p5-application-form");
const product = document.querySelector("#variant_id");
const price = document.querySelector("[data-product-price]");
const message = document.querySelector("[data-message]");
const submit = form.querySelector("button[type=submit]");

function show(text, error = false) {
  message.hidden = false; message.textContent = text;
  message.classList.toggle("error", error);
}

try {
  const variants = await getProductVariants();
  product.innerHTML = '<option value="">Select mobile model</option>' + variants.map(v =>
    '<option value="' + v.id + '" data-price="' + v.price + '">' +
    v.label.replaceAll("&","&amp;").replaceAll("<","&lt;") + '</option>'
  ).join("");
} catch (error) { show("Products load nahi ho sake: " + error.message, true); }

product.addEventListener("change", () => {
  const selected = product.selectedOptions[0];
  price.textContent = selected?.dataset.price ? "Product price: Rs. " + Number(selected.dataset.price).toLocaleString("en-PK") : "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.hidden = true;
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const front = form.elements.cnic_front.files[0];
  const back = form.elements.cnic_back.files[0];
  submit.disabled = true; submit.textContent = "Submitting securely…";
  try {
    const id = await submitP5Application(values, front, back);
    show("Application #" + id + " successfully submit ho gayi. Admin review ke baad status yahan nazar aayega.");
    form.reset(); price.textContent = "";
  } catch (error) { show(error.message || "Application submit nahi ho saki.", true); }
  finally { submit.disabled = false; submit.textContent = "Submit application"; }
});
