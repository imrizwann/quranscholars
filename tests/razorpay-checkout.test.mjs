import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { loadRazorpay, openRazorpayCheckout } from "../src/features/payments/razorpay-checkout.js";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

test("checkout loads only Razorpay's script, uses the existing theme and validates its callback", async () => {
  const dom = new JSDOM("<!doctype html><html style='--primary: #0f766e'><head></head><body></body></html>", { url: "https://www.quranscholar.in" });
  const saved = Object.fromEntries(["window", "document", "getComputedStyle"].map(key => [key, globalThis[key]]));
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, getComputedStyle: dom.window.getComputedStyle.bind(dom.window) });
  let options, opened = 0;
  try {
    const first = loadRazorpay(), second = loadRazorpay();
    assert.equal(first, second);
    const script = document.querySelector("script");
    assert.equal(script.src, "https://checkout.razorpay.com/v1/checkout.js");
    assert.equal(document.querySelectorAll("script").length, 1);
    window.Razorpay = class { constructor(input) { options = input; } open() { opened++; } };
    script.dispatchEvent(new dom.window.Event("load")); await first;
    const input = { payment: { amountMinor: 14900, currency: "INR", checkout: { provider: "razorpay", orderId: "order_one", publicKey: "rzp_test_public" } }, course: { title: "Tajweed foundations" }, user: { name: "Learner", email: "learner@example.test" } };
    const checkout = openRazorpayCheckout(input); await Promise.resolve();
    assert.equal(opened, 1); assert.equal(options.theme.color, "#0f766e");
    assert.equal(options.name, "QuranScholar"); assert.equal(options.order_id, "order_one");
    assert.equal(options.image, "https://www.quranscholar.in/web-app-manifest-192x192.png");
    assert.equal(options.amount, 14900); assert.equal(options.modal.backdropclose, false);
    options.handler({ razorpay_order_id: "order_one", razorpay_payment_id: "pay_one", razorpay_signature: "signature" });
    assert.deepEqual(await checkout, { paymentId: "pay_one", signature: "signature" });
    const dismissed = openRazorpayCheckout(input); await Promise.resolve(); options.modal.ondismiss(); assert.equal(await dismissed, null);
    const invalid = openRazorpayCheckout(input); await Promise.resolve(); options.handler({ razorpay_order_id: "order_foreign" });
    await assert.rejects(invalid, /could not verify/);
    const stopped = openRazorpayCheckout({ ...input, onInstance: () => false });
    assert.equal(await stopped, null); assert.equal(opened, 3, "unmounted or signed-out user cannot open checkout");
    await assert.rejects(openRazorpayCheckout({ ...input, payment: { ...input.payment, amountMinor: 0 } }), /not available/);
    const file = resolve("tests", `razorpay-production-fixture-${randomUUID()}.mjs`);
    try {
      const compiled = await build({ entryPoints: ["src/features/payments/razorpay-checkout.js"], bundle: true, write: false, format: "esm", platform: "node", define: { "import.meta.env": JSON.stringify({ PROD: true }) } });
      await writeFile(file, compiled.outputFiles[0].text);
      const production = await import(pathToFileURL(file));
      await assert.rejects(production.openRazorpayCheckout(input), /not available/);
      assert.equal(opened, 3, "production cannot open a sandbox checkout");
      const live = { ...input, payment: { ...input.payment, checkout: { ...input.payment.checkout, publicKey: "rzp_live_public" } }, onInstance: () => false };
      assert.equal(await production.openRazorpayCheckout(live), null);
      assert.equal(options.key, "rzp_live_public");
    } finally { await unlink(file).catch(() => {}); }
  } finally {
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
    dom.window.close();
  }
});
