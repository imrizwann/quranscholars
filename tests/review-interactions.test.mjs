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

async function fixture(run) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const output = resolve("tests", `review-ui-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, apis;
  try {
    const compiled = await build({ stdin: { contents: `export {CourseReviewEditor as Editor, default as Reviews} from './src/features/recorded-courses/components/CourseReviews.jsx'; export {default as learnerApi} from './src/services/api/user/learnerApi.js'; export {default as paymentApi} from './src/services/api/user/paymentApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); apis = [mod.learnerApi, mod.paymentApi];
    store = configureStore({ reducer: { user: (state = { user: { _id: "account1", role: "user" } }, action) => action.type === "test/user" ? action.payload : state, ...Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])) }, middleware: defaults => defaults().concat(...apis.map(api => api.middleware)) });
    const { createRoot } = await import("react-dom/client");
    const { MemoryRouter } = await import("react-router-dom");
    root = createRoot(document.getElementById("root"));
    const render = component => act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, component))));
    const settle = async condition => {
      for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    await run({ mod, store, render, settle });
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && apis) for (const api of apis) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
}
const button = label => [...document.querySelectorAll("button")].find(item => item.textContent.includes(label));
const click = element => act(async () => element.click());
const response = data => Response.json({ success: true, data });


test("missing rating is prominent, focuses the stars, and never sends a review", async () => fixture(async ({ mod, render, settle }) => {
  let writes = 0;
  globalThis.fetch = async request => { if (request.method !== "GET") writes++; return response({ review: null, revision: null }); };
  await render(React.createElement(mod.Editor, { courseId: "course1" }));
  await settle(() => button("Publish review"));
  await click(button("Publish review"));
  assert.equal(writes, 0);
  assert.match(document.querySelector('.course-review-rating [role="alert"]').textContent, /Choose a star rating/);
  assert.equal(document.querySelector('.course-review-rating').getAttribute('aria-invalid'), "true");
  assert.equal(document.activeElement, document.querySelector('input[type="radio"]'));
  await click(document.querySelector('input[value="4"]'));
  assert.equal(document.querySelector('.course-review-rating [role="alert"]'), null);
}));

test("review moderation stays admin-only and opens its confirmation through the action menu", async () => fixture(async ({ mod, store, render, settle }) => {
  let writes = 0;
  globalThis.fetch = async request => {
    if (request.method !== "GET") writes++;
    if (request.url.includes("/access")) return response({ canAccessCourse: false });
    return response({ summary: { average: 4, count: 1 }, reviews: [{ id: "review1", name: "Test learner", rating: 4, comment: "Useful lessons", createdAt: "2026-11-01T10:00:00Z", revision: "v1" }], pagination: { totalPages: 1 } });
  };
  await render(React.createElement(mod.Reviews, { course: { id: "course1", slug: "test-course", instructor: { id: "teacher1" } } }));
  await settle(() => document.body.textContent.includes("Useful lessons"));
  assert.equal(document.querySelector('.cw-actions-trigger'), null);
  await act(async () => store.dispatch({ type: "test/user", payload: { user: { _id: "admin1", role: "admin" } } }));
  await settle(() => document.querySelector('.cw-actions-trigger'));
  assert.equal(button("Hide review"), undefined, "moderation is not a loose action below every review");
  await click(document.querySelector('.cw-actions-trigger'));
  await settle(() => document.querySelector('[role="menuitem"]'));
  assert.match(document.querySelector('[role="menuitem"]').textContent, /Hide review/);
  await click(document.querySelector('[role="menuitem"]'));
  await settle(() => document.querySelector('[role="dialog"]'));
  assert.match(document.querySelector('[role="dialog"]').textContent, /Hide this review/);
  assert.equal(writes, 0, "opening moderation never changes a review");
}));
