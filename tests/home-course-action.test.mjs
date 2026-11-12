import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import React, { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { JSDOM } from "jsdom";

test("homepage learning links use verified account access, deduplicate requests and reset across accounts", async () => {
  const dom = new JSDOM("<html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const output = resolve("tests", `home-action-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, api, release;
  try {
    const result = await build({ stdin: { contents: `export {default as Action} from './src/features/recorded-courses/components/CourseLearningLink.jsx'; export {default as api} from './src/services/api/user/paymentApi.js'; export {paymentSessionMiddleware} from './src/features/payments/paymentSessionMiddleware.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, result.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); api = mod.api;
    const course = { id: "c".repeat(24), slug: "recitation", title: "Recitation foundations" };
    let allowed = true, failed = false, gate = Promise.resolve();
    const requests = [];
    globalThis.fetch = async request => {
      requests.push(request);
      assert.equal(new URL(request.url).pathname, `/api/purchases/${course.id}/access`);
      assert.equal(request.credentials, "include");
      await gate;
      return failed ? Response.json({}, { status: 403 }) : Response.json({ success: true, data: { canAccessCourse: allowed } });
    };
    store = configureStore({ reducer: { user: (state = { user: null }, action) => action.type === "user/setUser" ? { user: action.payload } : state, [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(mod.paymentSessionMiddleware, api.middleware) });
    root = createRoot(document.getElementById("root"));
    const render = () => act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(React.Fragment, null, React.createElement(mod.Action, { course }), React.createElement(mod.Action, { course }))))));
    const settle = async condition => { for (let i = 0; i < 100; i++) { await act(async () => { await new Promise(done => setTimeout(done, 10)); }); if (condition()) return; } assert.fail(document.body.textContent); };
    await render();
    assert.equal(requests.length, 0, "visitors do not make private access requests");
    assert.equal(document.querySelectorAll('a[href="/courses/recitation"]').length, 2);
    await act(async () => store.dispatch({ type: "user/setUser", payload: { _id: "a".repeat(24), role: "user" } }));
    await settle(() => document.querySelectorAll('a[href="/learn/recitation"]').length === 2);
    assert.equal(requests.length, 1, "hero and card share one access query");
    assert.match(document.body.textContent, /Continue learning/);
    gate = new Promise(done => { release = done; }); allowed = false;
    await act(async () => store.dispatch({ type: "user/setUser", payload: { _id: "b".repeat(24), role: "user" } }));
    assert.equal(document.querySelector('a[href="/learn/recitation"]'), null, "a new account cannot reuse previous enrollment evidence");
    await act(async () => release());
    await settle(() => requests.length === 2 && api.endpoints.getCourseAccess.select(course.id)(store.getState()).isSuccess);
    assert.equal(document.querySelectorAll('a[href="/courses/recitation"]').length, 2);
    failed = true;
    await act(async () => store.dispatch(api.util.invalidateTags(["CourseAccess"])));
    await settle(() => requests.length === 3 && api.endpoints.getCourseAccess.select(course.id)(store.getState()).isError);
    assert.equal(document.querySelectorAll('a[href="/courses/recitation"]').length, 2);
    await act(async () => store.dispatch({ type: "user/setUser", payload: null }));
    assert.equal(document.querySelector('a[href="/learn/recitation"]'), null);
  } finally {
    release?.(); if (root) await act(async () => root.unmount());
    if (store && api) { store.dispatch(api.util.getRunningQueriesThunk()).forEach(request => request.abort()); store.dispatch(api.util.resetApiState()); }
    globalThis.fetch = previousFetch; await unlink(output).catch(() => {}); dom.window.close();
  }
});
