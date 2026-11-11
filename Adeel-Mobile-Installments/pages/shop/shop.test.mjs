import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(testDir, "../..");
const shopDir = path.join(appRoot, "pages/shop");

test("shop page loads its local stylesheet and module", () => {
  const html = readFileSync(path.join(shopDir, "index.html"), "utf8");
  assert.match(html, /shop\.css/);
  assert.match(html, /shop\.js/);
  assert.ok(existsSync(path.join(shopDir, "shop.css")));
  assert.ok(existsSync(path.join(shopDir, "shop.js")));
});

test("public catalog config contains only a publishable key", () => {
  const config = readFileSync(path.join(appRoot, "config/supabase.public.js"), "utf8");
  const executableConfig = config.replace(new RegExp("^//.*$", "gm"), "");
  assert.match(executableConfig, /SUPABASE_PUBLISHABLE_KEY = "sb_publishable_/);
  assert.doesNotMatch(executableConfig, /service_role|sb_secret_|SUPABASE_SECRET_KEYS/i);
});

test("catalog reads only public product tables and uses visibility filters", () => {
  const source = readFileSync(path.join(shopDir, "shop.js"), "utf8");
  assert.match(source, /apiGet\("brands"/);
  assert.match(source, /apiGet\("variants"/);
  assert.match(source, /show_website=eq\.true/);
  assert.match(source, /model\.show_catalog=eq\.true/);
  assert.match(source, /model\.brand\.show_brand=eq\.true/);
  assert.match(source, /model\.status=in\.\(active,upcoming\)/);
  assert.match(source, /gallery_images,specs/);
  assert.match(source, /showModal\\(\\)/);
  assert.doesNotMatch(source, /innerHTML/);
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(/);
});

test("catalog calculator links carry the selected public price", () => {
  const source = readFileSync(path.join(shopDir, "shop.js"), "utf8");
  assert.match(source, /tools\/installment-calculator\/\?price=/);
  const calculator = readFileSync(path.join(appRoot, "pages/tools/installment-calculator/calculator.js"), "utf8");
  assert.match(calculator, /URLSearchParams/);
});
