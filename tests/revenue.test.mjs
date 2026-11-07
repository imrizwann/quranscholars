import { test } from "node:test";
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
import { parseMoney, moneyText, moneyInput, payoutActions } from "../src/features/revenue/revenue-utils.js";

test("money inputs retain exact minor units and reject silent rounding or unsafe amounts", () => {
  assert.equal(parseMoney("123.45"), 12345); assert.equal(parseMoney("000.01"), 1);
  assert.equal(parseMoney("1.001", 3), 1001); assert.equal(parseMoney("99", 0), 99);
  for (const value of ["-1", "1.001", "1e3", "", "90071992547409.92", "NaN"]) assert.throws(() => parseMoney(value));
  assert.throws(() => parseMoney("1.0", 0)); assert.match(moneyText(null), /Awaiting review/);
  assert.equal(parseMoney(moneyInput(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);
  assert.match(moneyText(Number.MAX_SAFE_INTEGER), /\.91$/);
  assert.match(moneyText(-1), /-.*0\.01$/);
  assert.deepEqual(payoutActions("processing"), ["paid", "fail"]); assert.deepEqual(payoutActions("paid"), []);
});
test("earnings UI handles loading, live balances, test notice, sales, payout history, errors and account switches", { timeout: 20_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLFormElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "FormData", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter, useLocation } = await import("react-router-dom");
  const Location = () => React.createElement("output", { "data-testid": "location" }, useLocation().search);
  const output = resolve("tests", `revenue-fixture-${randomUUID()}.mjs`), previousFetch = globalThis.fetch;
  let root, store, api;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Dashboard} from './src/features/revenue/RevenueDashboard.jsx'; export {default as api,revenueSessionMiddleware} from './src/services/api/revenueApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text); const mod = await import(pathToFileURL(output)); api = mod.api;
    const reducer = (state = { user: { _id: "instructor-one", role: "instructor" } }, action) => action.type === "user/setUser" ? { user: action.payload } : state;
    store = configureStore({ reducer: { user: reducer, [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(mod.revenueSessionMiddleware, api.middleware) });
    let release, fail = false, offerTestOnly = false; const gate = new Promise(done => { release = done; }); const requests = [], writes = [];
    const pagination = { page: 1, total: 1, hasNextPage: false, hasPreviousPage: false };
    globalThis.fetch = async request => {
      requests.push(request); await gate; const url = new URL(request.url);
      if (fail) return Response.json({ userMessage: "Revenue is temporarily unavailable." }, { status: 503 });
      if (request.method === "POST" && url.pathname.endsWith("/payouts")) { writes.push(await request.json()); return Response.json({ data: { id: "new-payout", status: "pending" } }); }
      if (url.pathname.endsWith("/payouts")) return Response.json({ data: { items: [{ id: "payout-one", instructorName: "One", period: "2026-11", currency: "INR", currencyExponent: 2, amountMinor: 5000, withholdingMinor: 100, transferMinor: 4900, status: "paid", revision: 3, transferReference: "UTR123456", events: [{ action: "paid", at: new Date().toISOString() }], paidAt: new Date().toISOString(), createdAt: new Date().toISOString() }], pagination } });
      if (url.pathname.endsWith("/sales")) return Response.json({ data: { items: [{ id: "sale-one", courseTitle: "Tajweed foundations", instructorName: "One", grossMinor: 10000, refundedMinor: 0, earnedMinor: 4882, earnedAt: new Date().toISOString(), availableAt: new Date().toISOString(), mode: "live", status: "paid", reviewReasons: [] }], pagination } });
      const admin = url.pathname.startsWith("/api/admin/");
      if (offerTestOnly && url.pathname.endsWith('/summary')) {
        const testing = url.searchParams.get('mode') === 'test';
        return Response.json({ data: { currency: 'INR', currencyExponent: 2, currencies: ['INR'], availableModes: { live: 0, test: 2, unknown: 0 }, balance: { availableMinor: 0, heldMinor: 0, reservedMinor: 0, paidMinor: 0, carryForwardMinor: 0 }, totals: { sales: testing ? 2 : 0, grossMinor: testing ? 269800 : 0, refundedMinor: 0, gatewayFeeMinor: testing ? 6368 : 0, salesTaxMinor: 0, earnedMinor: testing ? 131716 : 0, platformMinor: testing ? 131716 : 0, reviewPending: 0, feePending: 0, reviewedSales: testing ? 2 : 0, reviewedGrossMinor: testing ? 269800 : 0, reviewedRefundedMinor: 0, reviewedGatewayFeeMinor: testing ? 6368 : 0, netMinor: testing ? 263432 : 0, shareableMinor: testing ? 263432 : 0, processorLossMinor: 0 }, groups: [], groupBy: 'course', pagination } });
      }
      return Response.json({ data: { currency: "INR", currencyExponent: 2, currencies: ["INR"], balance: { availableMinor: 4882, heldMinor: 2000, reservedMinor: 0, paidMinor: 5000, carryForwardMinor: 0 }, totals: { sales: 1, grossMinor: 10000, refundedMinor: 0, gatewayFeeMinor: 236, salesTaxMinor: 0, earnedMinor: 4882, platformMinor: 4882, reviewPending: 1, feePending: 0 }, groups: admin ? [{ id: "a".repeat(24), name: "One", sales: 1, grossMinor: 10000, earnedMinor: 4882, balance: { availableMinor: 4882 } }] : [], groupBy: admin ? "instructor" : "course", pagination } });
    };
    root = createRoot(document.getElementById("root"));
    const mount = admin => act(async () => { root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(React.Fragment, null, React.createElement(mod.Dashboard, { admin }), React.createElement(Location))))); });
    const settle = async condition => { for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(done => setTimeout(done, 10)); }); if (condition()) return; } assert.fail(document.body.textContent); };
    const click = async text => { const button = [...document.querySelectorAll("button")].find(node => node.textContent.trim() === text); assert.ok(button, text); await act(async () => { button.click(); }); };
    await mount(false); assert.equal(document.querySelectorAll("dd[aria-busy=true]").length, 4);
    await act(async () => { release(); }); await settle(() => document.body.textContent.includes("48.82"));
    assert.match(document.body.textContent, /tax treatment/); assert.match(document.body.textContent, /Test sales never become payable/);
    assert.equal(document.body.textContent.includes("Prepare payout"), false);
    assert.ok(requests.every(request => request.credentials === "include"));
    assert.ok(requests.every(request => new URL(request.url).pathname.startsWith("/api/instructor/revenue/")));
    await click("Sales ledger"); await settle(() => document.body.textContent.includes("Tajweed foundations"));
    await click("Payout history"); await settle(() => document.body.textContent.includes("UTR123456"));
    assert.match(document.body.textContent, /49\.00/); assert.equal(document.body.textContent.includes("Record payment"), false);
    fail = true; await click("Refresh"); await settle(() => document.querySelector('[role="alert"]'));
    assert.doesNotMatch(document.body.textContent, /UTR123456/);
    fail = false; await click("Try again"); await settle(() => document.body.textContent.includes("UTR123456"));
    offerTestOnly = true;
    await click('Overview'); await click('Refresh');
    await settle(() => document.body.textContent.includes('View test earnings'));
    await click('View test earnings');
    await settle(() => document.body.textContent.includes('1,317.16'));
    const calculation = document.querySelector('[aria-label="Earnings calculation"]');
    assert.match(calculation.textContent, /Test earnings calculation/);
    assert.match(calculation.textContent, /2,698.00/); assert.match(calculation.textContent, /63.68/); assert.match(calculation.textContent, /2,634.32/);
    assert.match(calculation.textContent, /Simulated earnings only/);
    assert.equal(document.querySelector('[data-testid="location"]').textContent, '?payments=test');
    await click('Refresh'); await settle(() => !document.querySelector('button[aria-busy=true]'));
    assert.equal(new URL(requests.at(-1).url).searchParams.get('mode'), 'test');
    assert.match(document.querySelector('.revenue-notice').textContent, /cannot be paid out/);
    offerTestOnly = false;
    await act(async () => { root.unmount(); root = null; store.dispatch({ type: "user/setUser", payload: { _id: "admin-two", role: "admin" } }); });
    assert.equal(Object.keys(store.getState()[api.reducerPath].queries).length, 0);
    root = createRoot(document.getElementById("root")); await mount(true);
    await settle(() => document.body.textContent.includes("Reconcile payments"));
    assert.ok(requests.some(request => new URL(request.url).pathname.startsWith("/api/admin/revenue/")));
    await click("Prepare payout"); await settle(() => document.querySelector('[role="dialog"]'));
    await click("Reserve payout"); assert.equal(writes.length, 0, "explicit confirmation is required");
    await act(async () => { document.querySelector('input[name="confirm"]').click(); });
    await click("Reserve payout"); await settle(() => writes.length === 1 && !document.querySelector('[role="dialog"]'));
    assert.equal(writes[0].confirm, true); assert.equal(writes[0].instructorId, "a".repeat(24));
    assert.equal(Object.hasOwn(writes[0], "amountMinor"), false, "the server calculates the payout amount");
    assert.ok(requests.some(request => request.method === "POST" && request.headers.get("X-CSRF-Protection") === "1"));
  } finally {
    if (root) await act(async () => root.unmount()); store?.dispatch(api.util.resetApiState());
    globalThis.fetch = previousFetch; await unlink(output).catch(() => {}); dom.window.close();
  }
});
