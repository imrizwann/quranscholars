import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { createActionFeedbackMiddleware } from "../src/components/feedback/actionFeedbackMiddleware.js";

for (const scenario of ["verified callback", "failed callback", "return without callback", "manual recovery", "webhook first", "expired test checkout"]) {
test(`themed checkout safely recovers ${scenario} without a second order`, async t => {
  const notices = [];
  for (const type of ["loading", "success", "error", "info", "dismiss"]) t.mock.method(toast, type, (...args) => { notices.push({ type, title: args[0] }); });
  let releaseVerification;
  const verificationGate = new Promise(resolve => { releaseVerification = resolve; });
  const dom = new JSDOM("<!doctype html><html style='--primary: #0f766e'><body><div id='root'></div></body></html>", { url: "https://frontend.example.test/courses/tajweed", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent", "localStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter } = await import("react-router-dom");
  const output = resolve("tests", `razorpay-ui-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, apis, options;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Enrollment} from './src/features/recorded-courses/components/CourseEnrollment.jsx'; export {default as paymentApi} from './src/services/api/user/paymentApi.js'; export {default as learnerApi} from './src/services/api/user/learnerApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test", PROD: true }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); apis = [mod.paymentApi, mod.learnerApi];
    const user = { _id: "buyer1", name: "Learner", email: "learner@example.test", role: "user" };
    const course = { id: "course1", title: "Tajweed foundations", slug: "tajweed", enrollmentOpen: true, instructor: { id: "teacher1" }, price: { current: 149 } };
    const intent = { intentId: "a".repeat(24), courseId: course.id, state: "pending", testMode: false, amountMinor: 14900, currency: "INR", checkout: { provider: "razorpay", orderId: "order_one", publicKey: "rzp_live_public" } };
    let active = false, verified = 0, captured = false, recoveryChecks = 0;
    const attempts = [];
    window.Razorpay = class { constructor(input) { options = input; } open() {} close() { options.modal.ondismiss(); } };
    globalThis.fetch = async request => {
      const path = new URL(request.url).pathname;
      assert.equal(request.credentials, "include");
      if (path === "/api/purchases/course1/access") return Response.json({ success: true, data: { canAccessCourse: active, checkoutAvailable: true, enrollmentOpen: true } });
      if (path === "/api/payments/checkout") {
        attempts.push(await request.json());
        if (scenario === "expired test checkout" && attempts.length === 1) return Response.json({ userMessage: "This checkout is no longer available. Please start a new checkout." }, { status: 410 });
        return Response.json({ success: true, data: intent });
      }
      if (path.endsWith("/verify")) {
        assert.equal(request.headers.get("X-CSRF-Protection"), "1");
        assert.deepEqual(await request.json(), { paymentId: "pay_one", signature: "b".repeat(64) });
        assert.equal(active, false); verified++;
        captured = true;
        if (scenario === "webhook first") {
          active = true;
          store.dispatch(mod.paymentApi.endpoints.getCourseAccess.initiate(course.id, { subscribe: false, forceRefetch: true }));
          await verificationGate;
          return Response.json({ success: false, message: "Callback response was interrupted" }, { status: 503 });
        }
        if (["failed callback", "manual recovery"].includes(scenario)) return Response.json({ success: false, message: "Database temporarily unavailable" }, { status: 503 });
        active = true;
        return Response.json({ success: true, data: { ...intent, state: "paid" } });
      }
      if (path.endsWith("/reconcile")) {
        assert.equal(request.method, "POST");
        assert.equal(request.headers.get("X-CSRF-Protection"), "1");
        assert.deepEqual(await request.json(), {});
        recoveryChecks++;
        if (scenario === "manual recovery" && captured && recoveryChecks === 2) return Response.json({ success: false, message: "Provider temporarily unavailable" }, { status: 503 });
        active = captured;
        return Response.json({ success: true, data: { ...intent, state: active ? "paid" : "pending", canAccessCourse: active } });
      }
      assert.equal(path, `/api/payments/${intent.intentId}`);
      return Response.json({ success: true, data: { ...intent, checkout: undefined, state: active ? "paid" : "pending" } });
    };
    store = configureStore({ reducer: { user: () => ({ user }), ...Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])) }, middleware: defaults => defaults().concat(createActionFeedbackMiddleware(), ...apis.map(api => api.middleware)) });
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(mod.Enrollment, { course })))));
    const settle = async condition => {
      for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    const button = label => [...document.querySelectorAll("button")].find(button => button.textContent.includes(label));
    await settle(() => button("Buy course"));
    await act(async () => button("Buy course").click());
    if (scenario === "expired test checkout") {
      await settle(() => document.body.textContent.includes("This checkout is no longer available.") && !button("Buy course").disabled);
      assert.equal(options, undefined);
      await act(async () => button("Buy course").click());
      await settle(() => options);
      assert.notEqual(attempts[0].idempotencyKey, attempts[1].idempotencyKey, "only the retired sandbox checkout gets a new retry key");
      return;
    }
    await settle(() => options);
    assert.equal(options.theme.color, "#0f766e"); assert.equal(options.amount, 14900);
    assert.equal(verified, 0); assert.equal(document.querySelector('a[href="/learn/tajweed"]'), null);
    assert.match(document.body.textContent, /Secure checkout/);
    assert.doesNotMatch(document.body.textContent, /Test mode/);
    assert(button("Checkout open").disabled);
    await act(async () => options.modal.ondismiss());
    await settle(() => button("Continue payment") && !button("Continue payment").disabled);
    await act(async () => button("Continue payment").click());
    await settle(() => attempts.length === 2);
    assert.deepEqual(attempts[0], attempts[1], "resume reuses original checkout key");
    if (scenario === "return without callback") {
      captured = true;
      await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(mod.Enrollment, { key: "returned", course })))));
    } else {
      await act(async () => options.handler({ razorpay_order_id: "order_one", razorpay_payment_id: "pay_one", razorpay_signature: "b".repeat(64) }));
    }
    if (scenario === "webhook first") {
      await settle(() => document.querySelector('a[href="/learn/tajweed"]'));
      assert.equal(notices.filter(notice => notice.title === "Your course is ready").length, 1);
      assert(!notices.some(notice => /Confirming your payment|awaiting confirmation/i.test(String(notice.title))), "an already-confirmed enrollment must not retain a separate pending toast");
      await act(async () => releaseVerification());
      await settle(() => recoveryChecks >= 2);
      assert.equal(notices.filter(notice => notice.type === "error").length, 0, "a late callback failure must not contradict verified course access");
    }
    if (scenario === "manual recovery") {
      await settle(() => document.body.textContent.includes("We could not confirm your payment yet"));
      assert.equal(document.querySelector('a[href="/learn/tajweed"]'), null);
      await settle(() => button("Check payment status") && !button("Check payment status").disabled);
      await act(async () => button("Check payment status").click());
    }
    await settle(() => document.querySelector('a[href="/learn/tajweed"]'));
    assert.equal(verified, scenario === "return without callback" ? 0 : 1);
    assert.equal(attempts.length, 2, "recovery must not initiate another checkout");
    assert(recoveryChecks >= (scenario === "verified callback" ? 1 : 2));
    assert.equal(notices.filter(notice => notice.title === "Your course is ready").length, 1);
    assert.doesNotMatch(JSON.stringify({ ...localStorage }), /signature|pay_one|rzp_|bbbb/);
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(mod.Enrollment, { key: "already-enrolled", course })))));
    await settle(() => document.querySelector('a[href="/learn/tajweed"]'));
    assert.equal(notices.filter(notice => notice.title === "Your course is ready").length, 1, "reopening an already enrolled course must not repeat purchase feedback");
  } finally {
    releaseVerification();
    if (root) await act(async () => root.unmount());
    if (store && apis) for (const api of apis) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
}
