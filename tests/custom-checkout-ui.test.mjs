import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import React, { act } from "react";
import { JSDOM } from "jsdom";

for (const method of ["card", "netbanking", "wallet", "embedded QR", "hosted QR", "UPI app", "no UPI apps"]) {
  test(`custom form submits ${method} through the SDK and never through the LMS API`, async () => {
    const dom = new JSDOM("<!doctype html><html><head></head><body><div id='root'></div></body></html>", { url: "https://lms.example.test", pretendToBeVisual: true });
    for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent", "localStorage", "FormData", "MutationObserver", "Document", "ShadowRoot", "HTMLInputElement"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
    globalThis.getComputedStyle = window.getComputedStyle.bind(window);
    globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
    globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: ["UPI app", "no UPI apps"].includes(method) ? "Android Mobile" : "Desktop" });
    const file = resolve("tests", `custom-ui-fixture-${randomUUID()}.mjs`);
    const previousFetch = globalThis.fetch;
    const events = {}, submissions = [], completed = [];
    let root;
    try {
      globalThis.fetch = async () => { assert.fail("The custom form must not send card data to any API"); };
      const output = await build({ entryPoints: ["src/features/payments/custom/CustomCheckout.jsx"], bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ DEV: true }) } });
      await writeFile(file, output.outputFiles[0].text);
      const { default: Checkout } = await import(pathToFileURL(file));
      window.Razorpay = class {
        once(name, callback) { if (name === "ready") queueMicrotask(() => callback({ methods: { card: true, upi: true, netbanking: { HDFC: "HDFC Bank" }, wallet: { amazonpay: true, mobikwik: false } } })); }
        on(name, callback) { events[name] = callback; }
        createPayment(data, options) { submissions.push({ data, options }); }
        getSupportedUpiIntentApps() { return Promise.resolve(method === "UPI app" ? ["gpay", "phonepe", "paytm", "any", "invalid"] : []); }
        emit(name) { assert.equal(name, "payment.cancel"); }
      };
      const { createRoot } = await import("react-dom/client");
      root = createRoot(document.getElementById("root"));
      const payment = { state: "pending", amountMinor: 14900, currency: "INR", checkout: { provider: "razorpay", orderId: "order_one", publicKey: "rzp_test_public" } };
      await act(async () => root.render(React.createElement(Checkout, { payment, course: { title: "Tajweed foundations" }, user: { email: "test@example.test" }, embeddedQr: method === "embedded QR", onFinish: response => completed.push(response) })));
      const settle = async condition => { for (let i = 0; i < 100; i++) { await act(async () => { await new Promise(done => setTimeout(done, 10)); }); if (condition()) return; } assert.fail("Checkout did not reach the expected state"); };
      await settle(() => document.querySelector("script"));
      await act(async () => document.querySelector("script").dispatchEvent(new Event("load")));
      await settle(() => document.querySelector("form"));
      assert(document.querySelector('[role="dialog"]'));
      assert.match(document.body.textContent, /No real money will be charged/);
      if (["card", "netbanking", "wallet"].includes(method)) await act(async () => document.querySelector(`input[value="${method}"]`).click());
      document.querySelector('[name="contact"]').value = "+919000000000";
      if (method === "card") {
        for (const [name, value] of Object.entries({ number: "4111111111111111", name: "Test Learner", cvv: "123", expiry: "12/35" })) document.querySelector(`[name="${name}"]`).value = value;
      }
      if (method === "netbanking") document.querySelector('[name="bank"]').value = "HDFC";
      if (method === "wallet") {
        assert.deepEqual([...document.querySelector('[name="wallet"]').options].map(option => option.value), ["", "amazonpay"]);
        document.querySelector('[name="wallet"]').value = "amazonpay";
      }
      if (method === "UPI app") {
        await settle(() => document.querySelector('input[name="upiApp"][value="phonepe"]'));
        assert.deepEqual([...document.querySelectorAll('input[name="upiApp"]')].map(input => input.value), ["gpay", "phonepe", "paytm", "any"]);
        await act(async () => document.querySelector('input[name="upiApp"][value="phonepe"]').click());
      }
      if (method === "no UPI apps") {
        assert.equal(document.querySelector('.custom-pay-submit').disabled, true);
        assert.equal(document.querySelector('[name="vpa"]'), null);
        await act(async () => document.querySelector('form').dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
        assert.equal(submissions.length, 0);
        return;
      }
      const form = document.querySelector("form");
      await act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      assert.equal(submissions.length, 1, "repeat clicks cannot start a second payment");
      const { data, options } = submissions[0];
      assert.equal(data.order_id, "order_one"); assert.equal(data.amount, 14900);
      assert.equal(data.currency, "INR"); assert.equal(document.querySelector('input[name="cvv"]'), null);
      assert.equal(localStorage.length, 0);
      if (method === "card") { assert.equal(data.method, "card"); assert.equal(data["card[number]"], "4111111111111111"); assert.equal(form.querySelector('[name="cvv"]').value, ""); }
      else if (method === "netbanking") { assert.equal(data.method, "netbanking"); assert.equal(data.bank, "HDFC"); }
      else if (method === "wallet") { assert.equal(data.method, "wallet"); assert.equal(data.wallet, "amazonpay"); }
      else if (method === "UPI app") { assert.deepEqual(options, { app: "phonepe" }); assert.equal(data.vpa, undefined); }
      else if (method === "hosted QR") { assert.deepEqual(data.upi, { qr: true, timeout: 10 }); assert.equal(options, undefined); }
      else {
        assert.deepEqual(options, { app: "any", flow: "qr" });
        await act(async () => events["payment.upi.qr"]({ status: "created", qr_url: "upi://pay?pa=merchant%40bank&am=149", expires_on: Date.now() + 600000 }));
        assert.match(document.querySelector('.custom-pay-qr').src, /^data:image\//);
        assert(!document.querySelector('.custom-pay-qr').src.includes("upi://"));
        await act(async () => events["payment.upi.qr"]({ status: "expired" }));
        assert.equal(document.querySelector('.custom-pay-qr'), null);
        assert.match(document.querySelector('[role="alert"]').textContent, /expired/);
      }
      if (method === "netbanking") {
        await act(async () => events["payment.error"]({ error: { description: "must-not-render-provider-data" } }));
        assert.doesNotMatch(document.body.textContent, /must-not-render-provider-data/);
        assert.equal(document.querySelector("form"), null, "uncertain payment cannot be retried before reconciliation");
        await act(async () => document.querySelector('.custom-pay-return').click());
        assert.deepEqual(completed, [null]);
      } else {
        const response = { razorpay_order_id: "order_one", razorpay_payment_id: "pay_one", razorpay_signature: "a".repeat(64) };
        await act(async () => events["payment.success"](response));
        assert.deepEqual(completed, [{ paymentId: "pay_one", signature: "a".repeat(64) }]);
      }
    } finally {
      if (root) await act(async () => root.unmount());
      globalThis.fetch = previousFetch;
      await unlink(file).catch(() => {});
      dom.window.close();
    }
  });
}
