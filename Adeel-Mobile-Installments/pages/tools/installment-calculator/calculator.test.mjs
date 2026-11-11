import test from "node:test";
import assert from "node:assert/strict";

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.textContent = "";
    this.hidden = false;
    this.value = "";
    this.checked = false;
    this.children = [];
    this.listeners = {};
    this.focused = false;
  }
  addEventListener(type, callback) {
    (this.listeners[type] ||= []).push(callback);
  }
  dispatch(type, event = {}) {
    for (const callback of this.listeners[type] || []) callback(event);
  }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = [...items]; }
  focus() { this.focused = true; }
}

const ids = [
  "calculator-form","retail-price","calc-error","calc-status",
  "calc-schedule","schedule-rows","monthly-amount","monthly-caption",
  "retail-output","advance-percent","advance-output","finance-output",
  "markup-percent","markup-output","total-output","reset-button"
];
const elements = Object.fromEntries(ids.map(id => [id, new FakeElement(id)]));
const radios = [3,6,9].map((months,index) => {
  const radio = new FakeElement("months-" + months);
  radio.value = String(months);
  radio.checked = index === 0;
  return radio;
});
elements["calculator-form"].querySelector = () => radios.find(radio => radio.checked);
elements["calculator-form"].querySelectorAll = () => radios;
elements["calculator-form"].reset = () => {
  elements["retail-price"].value = "";
  radios.forEach((radio,index) => { radio.checked = index === 0; });
};
globalThis.document = {
  getElementById: id => elements[id],
  createElement: tag => new FakeElement(tag)
};

await import("./calculator.js");

function submit() {
  elements["calculator-form"].dispatch("submit", { preventDefault() {} });
}

test("UI calculates under-threshold advance and renders payment rows", () => {
  elements["retail-price"].value = "50000";
  submit();
  assert.equal(elements["advance-percent"].textContent, "(20%)");
  assert.match(elements["advance-output"].textContent, /10,000/);
  assert.match(elements["total-output"].textContent, /46,000/);
  assert.equal(elements["schedule-rows"].children.length, 3);
  assert.equal(elements["calc-schedule"].hidden, false);
});

test("UI applies 30 percent advance at the exact threshold and six-month markup", () => {
  elements["retail-price"].value = "60000";
  radios.forEach(radio => { radio.checked = radio.value === "6"; });
  submit();
  assert.equal(elements["advance-percent"].textContent, "(30%)");
  assert.match(elements["advance-output"].textContent, /18,000/);
  assert.match(elements["markup-output"].textContent, /11,760/);
  assert.equal(elements["schedule-rows"].children.length, 6);
});

test("invalid input shows error and clears stale result and schedule", () => {
  elements["retail-price"].value = "0";
  submit();
  assert.equal(elements["calc-error"].hidden, false);
  assert.equal(elements["calc-schedule"].hidden, true);
  assert.equal(elements["schedule-rows"].children.length, 0);
  assert.match(elements["total-output"].textContent, /0.00/);
});

test("reset clears values and restores default plan", () => {
  elements["reset-button"].dispatch("click");
  assert.equal(elements["retail-price"].value, "");
  assert.equal(radios[0].checked, true);
  assert.equal(elements["calc-error"].hidden, true);
  assert.equal(elements["calc-status"].textContent, "Waiting for price");
});
