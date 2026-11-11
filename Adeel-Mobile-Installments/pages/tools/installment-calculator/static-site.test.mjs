import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(testDir, "../../..");
const calculatorDir = path.join(appRoot, "pages/tools/installment-calculator");

test("login preview calculator link resolves to an existing page", () => {
  const loginPath = path.join(appRoot, "pages/login/index.html");
  const html = readFileSync(loginPath, "utf8");
  const match = html.match(/href="(\.\.\/tools\/installment-calculator\/?)"/);
  assert.ok(match, "login preview should link to calculator");
  const target = path.resolve(path.dirname(loginPath), match[1], "index.html");
  assert.ok(existsSync(target), "calculator link target should exist");
});

test("calculator page stylesheet and script references resolve", () => {
  const html = readFileSync(path.join(calculatorDir, "index.html"), "utf8");
  const css = html.match(/href="\.\/calculator\.css"/);
  const script = html.match(/src="\.\/calculator\.js"/);
  const sharedCss = html.match(/href="\.\.\/\.\.\/\.\.\/css\/main\.css"/);
  assert.ok(css);
  assert.ok(script);
  assert.ok(sharedCss);
  assert.ok(existsSync(path.join(calculatorDir, "calculator.css")));
  assert.ok(existsSync(path.join(calculatorDir, "calculator.js")));
  assert.ok(existsSync(path.resolve(calculatorDir, "../../../css/main.css")));
});

test("calculator utility imports resolve within the app folder", () => {
  const source = readFileSync(path.join(calculatorDir, "calculator.js"), "utf8");
  for (const moduleName of ["installment-calculator.mjs", "installment-schedule.mjs"]) {
    assert.ok(source.includes(moduleName));
    assert.ok(existsSync(path.resolve(calculatorDir, "../../../js/utils", moduleName)));
  }
});

test("root redirect points to the safe login preview", () => {
  const html = readFileSync(path.join(appRoot, "index.html"), "utf8");
  assert.match(html, /pages\/login\//);
  assert.ok(existsSync(path.join(appRoot, "pages/login/index.html")));
});
