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
const typeComment = value => act(async () => {
  const input = document.querySelector('textarea[name="comment"]');
  Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
});

test("publishing shows the saved review, refreshes public reviews, and supports editing and deletion", async () => fixture(async ({ mod, render, settle }) => {
  let current = { review: null, revision: 0 }, writes = 0, publicReads = 0;
  globalThis.fetch = async request => {
    if (request.url.includes("/access")) return response({ canAccessCourse: false });
    if (request.url.includes("/api/public/")) {
      publicReads++;
      return response({ summary: { average: current.review?.rating || 0, count: current.review ? 1 : 0 }, reviews: current.review ? [{ ...current.review, id: "review1", name: "Learner" }] : [], pagination: { totalPages: 1 } });
    }
    if (request.method !== "GET") {
      writes++;
      const body = await request.json();
      assert.equal(body.revision, current.revision);
      assert.equal(request.credentials, "include");
      assert.equal(request.headers.get("X-CSRF-Protection"), "1");
      current = { revision: current.revision + 1, review: request.method === "DELETE" ? null : { rating: body.rating, comment: body.comment, hidden: false, updatedAt: "2026-11-22T10:00:00Z" } };
    }
    return response(current);
  };
  const view = () => React.createElement(React.Fragment, null, React.createElement(mod.Editor, { courseId: "course1" }), React.createElement(mod.Reviews, { course: { id: "course1", slug: "test-course" } }));
  await render(view()); await settle(() => button("Publish review"));
  await click(document.querySelector('input[value="5"]'));
  await typeComment("  Clear lessons and useful practice.  ");
  await click(button("Publish review"));
  await settle(() => button("Edit review") && document.querySelector('.course-review-list'));
  assert.equal(document.querySelector('textarea[name="comment"]'), null, "published content is no longer presented as an unsent draft");
  assert.match(document.querySelector('.course-review-published [role="status"]').textContent, /Your review is published/);
  assert.equal(current.review.comment, "Clear lessons and useful practice.");
  assert.match(document.querySelector('.course-review-list').textContent, /Clear lessons and useful practice/);
  assert.equal(writes, 1); assert(publicReads >= 2);
  await render(null); await render(view()); await settle(() => button("Edit review"));
  assert.equal(document.querySelector('textarea[name="comment"]'), null, "reopening shows the saved review");
  await click(button("Edit review"));
  assert.equal(document.querySelector('textarea').value, current.review.comment);
  await typeComment("Updated review after more lessons.");
  await click(button("Save changes"));
  await settle(() => button("Edit review"));
  assert.equal(writes, 2); assert.equal(current.revision, 2);
  assert.match(document.querySelector('.course-review-published-comment').textContent, /Updated review/);
  await click(button("Edit review")); await typeComment("Unsaved change"); await click(button("Cancel"));
  assert.equal(writes, 2); assert.doesNotMatch(document.querySelector('.course-review-published').textContent, /Unsaved change/);
  await click(document.querySelector('.course-review-editor .cw-actions-trigger'));
  await settle(() => document.querySelector('[role="menuitem"]'));
  await click(document.querySelector('[role="menuitem"]'));
  await settle(() => document.querySelector('[role="dialog"]'));
  await click([...document.querySelectorAll('[role="dialog"] button')].find(item => item.textContent === "Delete review"));
  await settle(() => button("Publish review"));
  assert.equal(current.review, null); assert.equal(writes, 3);
  assert.equal(document.querySelector('textarea[name="comment"]').value, "");
}));

for (const status of [503, 409]) test(`a rejected review (${status}) keeps the draft and never claims publication`, async () => fixture(async ({ mod, render, settle }) => {
  let writes = 0;
  globalThis.fetch = async request => {
    if (request.method !== "GET") { writes++; return Response.json({ success: false }, { status }); }
    return response({ review: null, revision: 0 });
  };
  await render(React.createElement(mod.Editor, { courseId: "course1" }));
  await settle(() => button("Publish review"));
  await click(document.querySelector('input[value="4"]')); await typeComment("Keep my draft after failure.");
  await click(button("Publish review"));
  await settle(() => document.querySelector('[role="alert"]'));
  assert.equal(writes, 1); assert.equal(document.querySelector('textarea').value, "Keep my draft after failure.");
  assert.equal(document.querySelector('.course-review-published'), null);
  if (status === 409) assert(button("Load latest review"));
}));

test("a moderated review is shown as saved, never as publicly published", async () => fixture(async ({ mod, render, settle }) => {
  globalThis.fetch = async () => response({ revision: 2, review: { rating: 4, comment: "Saved review", hidden: true } });
  await render(React.createElement(mod.Editor, { courseId: "course1" }));
  await settle(() => button("Edit review"));
  assert.match(document.body.textContent, /currently hidden/);
  assert.match(document.querySelector('[role="status"]').textContent, /Your review is saved/);
  assert.doesNotMatch(document.body.textContent, /Your review is published/);
}));


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
