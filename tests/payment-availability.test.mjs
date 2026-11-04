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

test("unconfigured paid checkout stays unavailable, retired checkout references clear, and free/current access remains usable", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test/courses/tajweed", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent", "localStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter } = await import("react-router-dom");
  const output = resolve("tests", `payment-availability-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, apis;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Enrollment} from './src/features/recorded-courses/components/CourseEnrollment.jsx'; export {default as paymentApi} from './src/services/api/user/paymentApi.js'; export {default as learnerApi} from './src/services/api/user/learnerApi.js'; export {saveCheckout, readCheckout} from './src/features/payments/checkout-session.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); apis = [mod.paymentApi, mod.learnerApi];
    const user = { _id: "buyer1", role: "user" }, course = { id: "course1", slug: "tajweed", enrollmentOpen: true, instructor: { id: "teacher1" }, price: { current: 100 } };
    const retiredId = "a".repeat(24), writes = [];
    let active = false, retiredReads = 0;
    globalThis.fetch = async request => {
      assert.equal(request.credentials, "include");
      const path = new URL(request.url).pathname;
      if (path === "/api/purchases/course1/access") return Response.json({ success: true, data: { canAccessCourse: active, checkoutAvailable: false, enrollmentOpen: true } });
      if (path === `/api/payments/${retiredId}`) { retiredReads++; return Response.json({ userMessage: "This checkout is no longer available. Please start a new checkout." }, { status: 410 }); }
      assert.equal(path, "/api/learner/enrollments/free");
      assert.equal(request.method, "POST"); assert.equal(request.headers.get("X-CSRF-Protection"), "1");
      writes.push(await request.json()); active = true;
      return Response.json({ success: true, data: { status: "ACTIVE", courseId: course.id } });
    };
    store = configureStore({ reducer: { user: () => ({ user }), ...Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])) }, middleware: defaults => defaults().concat(...apis.map(api => api.middleware)) });
    root = createRoot(document.getElementById("root"));
    const render = (key, current) => act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(mod.Enrollment, { key, course: current })))));
    const settle = async condition => {
      for (let attempt = 0; attempt < 150; attempt++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    await render("paid", course);
    await settle(() => document.body.textContent.includes("Online purchases are not available yet"));
    assert.equal(document.querySelector("button"), null);
    assert(document.querySelector('a[href="/contact"]'));
    mod.saveCheckout(user._id, course.id, { idempotencyKey: randomUUID(), intentId: retiredId });
    await render("retired", course);
    await settle(() => retiredReads === 1 && mod.readCheckout(user._id, course.id) === null);
    assert.match(document.body.textContent, /Online purchases are not available yet/);
    await render("free", { ...course, price: { current: 0 } });
    await settle(() => [...document.querySelectorAll("button")].some(button => button.textContent.includes("Enroll for free") && !button.disabled));
    const enroll = [...document.querySelectorAll("button")].find(button => button.textContent.includes("Enroll for free"));
    await act(async () => enroll.click());
    await settle(() => writes.length === 1);
    await settle(() => document.querySelector('a[href="/learn/tajweed"]'));
    assert.deepEqual(writes, [{ courseId: course.id }]);
    await render("existing-access", course);
    await settle(() => document.querySelector('a[href="/learn/tajweed"]'));
    assert.doesNotMatch(document.body.textContent, /Online purchases|Test purchase|Simulated/);
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && apis) for (const api of apis) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
