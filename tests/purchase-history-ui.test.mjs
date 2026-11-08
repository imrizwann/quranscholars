import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

test("purchase history shows real order details, statuses, cursor navigation, empty and error states without leaking across accounts", { timeout: 20_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter } = await import("react-router-dom");
  const output = resolve("tests", `purchase-history-fixture-${randomUUID()}.mjs`), previousFetch = globalThis.fetch;
  let root, api, store;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Page} from './src/pages/account/LearnerPurchases.jsx'; export {default as api} from './src/services/api/user/paymentApi.js'; export {paymentSessionMiddleware} from './src/features/payments/paymentSessionMiddleware.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text); const mod = await import(pathToFileURL(output)); api = mod.api;
    store = configureStore({ reducer: { user: (state = { user: { _id: "buyer-one", role: "user" } }, action) => action.type === "user/setUser" ? { user: action.payload } : state, [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(mod.paymentSessionMiddleware, api.middleware) });
    const cursor = "a".repeat(24), requests = [];
    let release, fail = false, empty = false, account = "one", holdOld = false, releaseOld;
    const gate = new Promise(done => { release = done; });
    const order = (id, status, extra = {}) => ({ id, course: { id: "course-id", title: id === "paid-order" ? "Original Tajweed course" : `Course ${id}`, slug: id === "review-order" ? null : "tajweed" }, amountMinor: 109900, currency: "INR", currencyExponent: 2, status, provider: "razorpay", orderedAt: "2026-11-01T12:30:00.000Z", orderReference: `order_${id}`, paymentReference: status === "pending" ? null : `pay_${id}`, testMode: status === "paid", ...extra });
    globalThis.fetch = async request => {
      requests.push(request); const buyer = account, url = new URL(request.url);
      await gate;
      if (holdOld && buyer === "one") { holdOld = false; await new Promise(done => { releaseOld = done; }); }
      if (fail) return Response.json({ userMessage: "Purchase history is temporarily unavailable." }, { status: 503 });
      const next = url.searchParams.get("before") === cursor;
      const items = empty ? [] : buyer === "two" ? [order("NEW_ACCOUNT_ONLY", "paid")] : next ? [order("refund-order", "refunded", { currency: "JPY", currencyExponent: 0, amountMinor: 499, testMode: false })] : [order("paid-order", "paid"), order("pending-order", "pending"), order("review-order", "review_required")];
      return Response.json({ success: true, data: { items, pagination: { limit: 10, hasNextPage: buyer === "one" && !next && !empty, nextCursor: buyer === "one" && !next && !empty ? cursor : null } } });
    };
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: ["/dashboard/purchases"] }, React.createElement(mod.Page)))));
    assert.match(document.body.textContent, /Loading your purchases/);
    const settle = async condition => { for (let index = 0; index < 150; index++) { await act(async () => { await new Promise(done => setTimeout(done, 10)); }); if (condition()) return; } assert.fail(document.body.textContent); };
    const click = async text => { const button = [...document.querySelectorAll("button")].find(node => node.textContent.trim() === text); assert.ok(button, `Missing ${text}`); await act(async () => button.click()); };
    await act(async () => release()); await settle(() => document.querySelectorAll(".purchase-card").length === 3);
    assert.match(document.body.textContent, /Original Tajweed course/); assert.match(document.body.textContent, /1,099\.00/);
    assert.match(document.body.textContent, /Test payment/); assert.match(document.body.textContent, /Pending confirmation/); assert.match(document.body.textContent, /Access needs review/);
    assert.match(document.body.textContent, /pay_paid-order/); assert.match(document.body.textContent, /order_paid-order/); assert.match(document.body.textContent, /Not available yet/);
    assert.match(document.body.textContent, /before making another payment/);
    assert.equal(document.querySelectorAll("time").length, 3); assert.equal(document.querySelectorAll('a[href="/courses/tajweed"]').length, 2);
    assert.equal(document.querySelector('a[href="/dashboard/learning"]').textContent, "My learning");
    assert.equal(requests[0].url, "https://api.example.test/api/purchases/history?limit=10"); assert.equal(requests[0].credentials, "include");
    await click("Next"); await settle(() => document.body.textContent.includes("Refund recorded"));
    assert.match(requests.at(-1).url, new RegExp(`before=${cursor}`)); assert.equal(document.querySelectorAll(".purchase-card").length, 1);
    assert.doesNotMatch(document.body.textContent, /pay_paid-order/); assert.match(document.querySelector(".purchase-amount").textContent, /499$/);
    assert.doesNotMatch(document.querySelector(".purchase-amount").textContent, /\.00/, "zero-decimal currency amounts retain their original precision");
    assert.ok(document.querySelector("button").textContent); assert.equal([...document.querySelectorAll("button")].find(node => node.textContent === "Next").disabled, true);
    await click("Previous"); await settle(() => document.body.textContent.includes("pay_paid-order"));
    fail = true; await click("Refresh"); await settle(() => document.querySelector('[role="alert"]'));
    assert.doesNotMatch(document.body.textContent, /pay_paid-order/);
    fail = false; await click("Try again"); await settle(() => document.body.textContent.includes("pay_paid-order"));
    empty = true; await click("Refresh"); await settle(() => document.body.textContent.includes("Your purchases will appear here"));
    assert.ok(document.querySelector('a[href="/courses"]')); assert.doesNotMatch(document.body.textContent, /Coming soon|pay_paid-order/);
    empty = false; holdOld = true; await click("Refresh"); await settle(() => typeof releaseOld === "function");
    account = "two";
    await act(async () => store.dispatch({ type: "user/setUser", payload: { _id: "buyer-two", role: "user" } }));
    await settle(() => document.body.textContent.includes("NEW_ACCOUNT_ONLY"));
    await act(async () => releaseOld()); await new Promise(done => setTimeout(done, 30));
    assert.doesNotMatch(document.body.textContent, /pay_paid-order|pending-order|review-order/);
  } finally {
    if (root) await act(async () => root.unmount()); if (api) store?.dispatch(api.util.resetApiState());
    globalThis.fetch = previousFetch; await unlink(output).catch(() => {}); dom.window.close();
  }
});
