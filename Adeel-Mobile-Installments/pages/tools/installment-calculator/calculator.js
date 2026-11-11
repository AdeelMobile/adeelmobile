import { calculateInstallment, formatPKR } from "../../../js/utils/installment-calculator.mjs";
import { buildInstallmentSchedule } from "../../../js/utils/installment-schedule.mjs";

const form = document.getElementById("calculator-form");
const priceInput = document.getElementById("retail-price");
const error = document.getElementById("calc-error");
const status = document.getElementById("calc-status");
const fields = {
  monthly: document.getElementById("monthly-amount"),
  monthlyCaption: document.getElementById("monthly-caption"),
  retail: document.getElementById("retail-output"),
  advancePercent: document.getElementById("advance-percent"),
  advance: document.getElementById("advance-output"),
  finance: document.getElementById("finance-output"),
  markupPercent: document.getElementById("markup-percent"),
  markup: document.getElementById("markup-output"),
  total: document.getElementById("total-output"),
};

function selectedMonths() {
  return Number(form.querySelector('input[name="months"]:checked')?.value || 3);
}

function clearResult() {
  Object.values(fields).forEach((field) => {
    if (field) field.textContent = field === fields.monthlyCaption
      ? "Select a price and plan to calculate"
      : field === fields.advancePercent || field === fields.markupPercent ? "(—)" : formatPKR(0);
  });
  status.textContent = "Waiting for price";
}

function calculate(event) {
  event?.preventDefault();
  error.hidden = true;
  const raw = priceInput.value.trim();
  const price = Number(raw);
  if (!raw || !Number.isFinite(price) || price <= 0 || price > 100000000) {
    error.textContent = "Please enter a valid retail price greater than zero (maximum Rs. 100,000,000).";
    error.hidden = false;
    priceInput.focus();
    return;
  }

  try {
    const months = selectedMonths();
    const result = calculateInstallment(price, months);
    const schedule = buildInstallmentSchedule(result.totalInstallmentBalance, months, new Date().toISOString().slice(0, 10));
    fields.monthly.textContent = formatPKR(result.monthlyInstallment);
    fields.monthlyCaption.textContent = months + " monthly payments · " + result.markupPercent + "% markup";
    fields.retail.textContent = formatPKR(result.retailPrice);
    fields.advancePercent.textContent = "(" + result.advancePercent + "%)";
    fields.advance.textContent = formatPKR(result.advanceAmount);
    fields.finance.textContent = formatPKR(result.financedAmount);
    fields.markupPercent.textContent = "(" + result.markupPercent + "%)";
    fields.markup.textContent = formatPKR(result.markupAmount);
    fields.total.textContent = formatPKR(result.totalInstallmentBalance);
    status.textContent = schedule.length + " payments estimated";
  } catch {
    error.textContent = "Unable to calculate this plan. Please check the entered price and try again.";
    error.hidden = false;
    clearResult();
  }
}

form.addEventListener("submit", calculate);
form.querySelectorAll('input[name="months"]').forEach((radio) => radio.addEventListener("change", () => {
  if (priceInput.value.trim()) calculate();
}));
document.getElementById("reset-button").addEventListener("click", () => {
  form.reset();
  error.hidden = true;
  clearResult();
  priceInput.focus();
});
clearResult();