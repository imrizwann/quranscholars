import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { validatePublicEnvironment } from "../scripts/public-environment.mjs";
import { createCustomSession, enabledMethods, loadCustomRazorpay, paymentDetails, supportedApps, validQr, validateCustomOrder, verifiedCallback } from "../src/features/payments/custom/custom-checkout-sdk.js";

const payment = { state: "pending", amountMinor: 14900, currency: "INR", checkout: { provider: "razorpay", orderId: "order_one", publicKey: "rzp_test_public" } };
const methods = enabledMethods({ card: true, upi: true, netbanking: { HDFC: "HDFC Bank", SBIN: "State Bank of India", MALFORMED: false } }, "INR");
const contact = { email: "learner@example.test", contact: "+91 90000 00000" };

test("custom checkout defaults closed for live payments and preserves production test-key restrictions", () => {
  validateCustomOrder(payment);
  assert.throws(() => validateCustomOrder(payment, { production: true }), /not enabled/);
  const live = { ...payment, checkout: { ...payment.checkout, publicKey: "rzp_live_public" } };
  assert.throws(() => validateCustomOrder(live), /not enabled/);
  validateCustomOrder(live, { production: true, liveEnabled: true });
  for (const patch of [{ amountMinor: 0 }, { amountMinor: 1.1 }, { state: "paid" }, { currency: "bad" }, { checkout: { ...payment.checkout, orderId: "foreign" } }]) assert.throws(() => validateCustomOrder({ ...payment, ...patch }));
  const env = { VITE_API_URL: "/", VITE_PUBLIC_SITE_URL: "https://lms.example.test", VITE_PAYMENT_CHECKOUT: "custom", VITE_CUSTOM_CHECKOUT_LIVE_ENABLED: "false" };
  validatePublicEnvironment(env);
  assert.throws(() => validatePublicEnvironment({ ...env, VITE_PAYMENT_CHECKOUT: "customm" }));
  assert.throws(() => validatePublicEnvironment({ ...env, VITE_CUSTOM_CHECKOUT_LIVE_ENABLED: "yes" }));
});

test("only account-enabled methods, banks and SDK-reported UPI apps are offered", () => {
  assert.deepEqual(methods, { card: true, upi: true, wallets: [], banks: [["HDFC", "HDFC Bank"], ["SBIN", "State Bank of India"]] });
  assert.deepEqual(enabledMethods({}, "INR"), { card: false, upi: false, wallets: [], banks: [] });
  assert.equal(enabledMethods({ upi: true }, "USD").upi, false);
  assert.deepEqual(supportedApps(["gpay", "phonepe", "gpay", "invalid", "__proto__"]), ["gpay", "phonepe"]);
});

test("wallets must be documented and explicitly enabled by Razorpay", () => {
  const available = enabledMethods({ wallet: { amazonpay: true, mobikwik: true, phonepe: false, payzapp: "false", invented: true } }, "INR");
  assert.deepEqual(available.wallets, [["mobikwik", "MobiKwik"], ["amazonpay", "Amazon Pay"]]);
  const result = paymentDetails(payment, "wallet", { ...contact, wallet: "amazonpay", amount: 1 }, available);
  assert.equal(result.wallet, "amazonpay"); assert.equal(result.amount, payment.amountMinor);
  for (const wallet of ["phonepe", "invented", "__proto__", ""]) assert.throws(() => paymentDetails(payment, "wallet", { ...contact, wallet }, available));
});

test("method payloads use the server order, price and currency and never accept caller overrides", () => {
  const fields = { ...contact, amount: 1, amountMinor: 1, currency: "USD", order_id: "order_foreign", bank: "HDFC" };
  assert.deepEqual(paymentDetails(payment, "netbanking", fields, methods), { amount: 14900, currency: "INR", order_id: "order_one", method: "netbanking", email: contact.email, contact: "+919000000000", bank: "HDFC" });
  assert.deepEqual(paymentDetails(payment, "upi", { ...fields, vpa: "blocked@example", upi: { flow: "collect" } }, methods), { amount: 14900, currency: "INR", order_id: "order_one", method: "upi", email: contact.email, contact: "+919000000000" });
  assert.throws(() => paymentDetails(payment, "netbanking", { ...fields, bank: "UNAVAILABLE" }, methods));
  assert.throws(() => paymentDetails(payment, "card", fields, { ...methods, card: false }));
});

test("card fields are validated locally and sent only in the documented SDK payload", () => {
  const fields = { ...contact, name: "Test Learner", number: "4111 1111 1111 1111", cvv: "123", expiry: "12/30" };
  const now = new Date("2026-11-15T00:00:00Z");
  const result = paymentDetails(payment, "card", fields, methods, now);
  assert.equal(result["card[number]"], "4111111111111111");
  assert.equal(result["card[expiry_year]"], "30");
  assert.equal(result["card[cvv]"], "123");
  for (const patch of [{ expiry: "00/30" }, { expiry: "10/26" }, { expiry: "11/2025" }, { number: "4111111111111112" }, { cvv: "secret" }, { name: "" }, { contact: "invalid" }, { email: "invalid" }]) {
    assert.throws(() => paymentDetails(payment, "card", { ...fields, ...patch }, methods, now), error => !error.message.includes(fields.number) && !error.message.includes(fields.cvv));
  }
});

test("QR events reject arbitrary URLs, expired values and invalid lifetimes", () => {
  const now = Date.now(), event = { status: "created", qr_url: "upi://pay?pa=merchant%40bank&am=149", expires_on: now + 600000 };
  assert.equal(validQr(event, now).value, event.qr_url);
  for (const patch of [{ status: "expired" }, { qr_url: "https://attacker.example/qr" }, { qr_url: "javascript:alert(1)" }, { expires_on: now }, { expires_on: now + 86400000 }]) assert.equal(validQr({ ...event, ...patch }, now), null);
});

test("SDK submits synchronously once, validates success, sanitizes failures and ignores disposed callbacks", async () => {
  const previous = globalThis.window;
  globalThis.window = { location: { origin: "https://lms.example.test" } };
  const events = {}, calls = [], successes = [], errors = [], qr = [];
  let ready;
  class SDK {
    constructor(options) { assert.equal(options.key, payment.checkout.publicKey); assert.equal(options.redirect, false); }
    once(name, fn) { events[name] = fn; }
    on(name, fn) { events[name] = fn; }
    getSupportedUpiIntentApps() { return Promise.resolve(["gpay", "invalid"]); }
    createPayment(data, options) { calls.push({ data, options }); }
    emit(name) { calls.push(name); }
  }
  const session = createCustomSession(SDK, payment, { ready: value => { ready = value; }, success: value => successes.push(value), error: value => errors.push(value), qr: value => qr.push(value) });
  try {
    events.ready({ methods: { card: true, upi: true } }); assert(ready.card);
    assert.deepEqual(await session.apps(), ["gpay"]);
    const data = paymentDetails(payment, "upi", contact, methods);
    assert.equal(session.submit(data, { app: "phonepe" }), true);
    assert.equal(calls.length, 1, "no await between user gesture and createPayment");
    assert.equal(session.submit(data), false);
    events["payment.upi.qr"]({ status: "expired" }); assert.deepEqual(qr, [null]);
    events["payment.error"]({ error: { description: "sensitive-raw-provider-value" } });
    assert.equal(errors.length, 1); assert(!errors[0].includes("sensitive-raw-provider-value"));
    assert.equal(session.submit(data, { app: "any", flow: "qr" }), true);
    events["payment.success"]({ razorpay_order_id: "order_foreign", razorpay_payment_id: "pay_one", razorpay_signature: "a".repeat(64) });
    assert.deepEqual(successes, [null]);
    const response = { razorpay_order_id: "order_one", razorpay_payment_id: "pay_one", razorpay_signature: "a".repeat(64) };
    assert.deepEqual(verifiedCallback(response, payment), { paymentId: "pay_one", signature: "a".repeat(64) });
    session.submit(data); session.dispose();
    assert.equal(calls.at(-1), "payment.cancel");
    events["payment.success"](response); assert.equal(successes.length, 1);
    assert.equal(session.submit(data), false);
  } finally { session.dispose(); globalThis.window = previous; }
});

test("custom SDK loader uses the official script, coalesces requests and retries failed loads", async () => {
  const dom = new JSDOM("<!doctype html><html><head></head></html>");
  const saved = { window: globalThis.window, document: globalThis.document };
  Object.assign(globalThis, { window: dom.window, document: dom.window.document });
  try {
    const first = loadCustomRazorpay();
    assert.equal(first, loadCustomRazorpay());
    const script = document.querySelector("script");
    assert.equal(script.src, "https://checkout.razorpay.com/v1/razorpay.js");
    script.dispatchEvent(new dom.window.Event("error"));
    await assert.rejects(first, /could not load/);
    assert.equal(document.querySelector("script"), null);
    const retry = loadCustomRazorpay();
    window.Razorpay = class {};
    document.querySelector("script").dispatchEvent(new dom.window.Event("load"));
    assert.equal(await retry, window.Razorpay);
  } finally { Object.assign(globalThis, saved); dom.window.close(); }
});
