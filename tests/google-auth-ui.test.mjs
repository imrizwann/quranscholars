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

test("Google UI retries setup, requires explicit password linking, and hydrates the existing session at the intended destination", async () => {
  const dom = new JSDOM("<div id='root'></div>", { url: "https://frontend.example.test/login", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLFormElement", "Event", "MouseEvent", "localStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter, Routes, Route, useLocation } = await import("react-router-dom");
  const output = resolve("tests", `google-ui-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  const clientId = "123-test.apps.googleusercontent.com";
  let root, store, api, options, challengeCalls = 0, linkCalls = 0, finishLink;
  const requests = [];
  const user = { _id: "existing-learner", name: "Learner", email: "learner@gmail.com", role: "user", expires: Date.now() + 3600_000 };
  window.google = { accounts: { id: {
    initialize(value) { options = value; },
    renderButton(container, value) { assert.equal(value.text, "continue_with"); const button = document.createElement("button"); button.textContent = "Continue with Google"; button.type = "button"; container.append(button); },
  } } };
  try {
    const compiled = await build({ stdin: { contents: `export {default as Login} from './src/pages/auth/Login.jsx'; export {default as api} from './src/services/api/user/userAuthApis.js'; export {default as userReducer} from './src/store/slices/userSlice.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test", VITE_GOOGLE_CLIENT_ID: clientId }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); api = mod.api;
    globalThis.fetch = async request => {
      assert.equal(request.credentials, "include"); assert.equal(request.headers.get("X-CSRF-Protection"), "1");
      const path = new URL(request.url).pathname, body = await request.json(); requests.push({ path, body });
      if (path.endsWith("/challenge")) {
        if (++challengeCalls === 1) return Response.json({ userMessage: "Google is temporarily unavailable." }, { status: 503 });
        return Response.json({ clientId, nonce: "browser-bound-test-nonce" });
      }
      if (path === "/api/auth/google") return Response.json({ code: "GOOGLE_LINK_REQUIRED" }, { status: 409 });
      assert.equal(path, "/api/auth/google/link");
      if (++linkCalls === 1) return Response.json({ code: "GOOGLE_PASSWORD_INVALID", userMessage: "That password is incorrect." }, { status: 401 });
      await new Promise(resolve => { finishLink = resolve; });
      return Response.json(user);
    };
    store = configureStore({ reducer: { user: mod.userReducer, [api.reducerPath]: api.reducer }, preloadedState: { user: { user: null } }, middleware: defaults => defaults().concat(api.middleware) });
    const Capture = () => { const location = useLocation(); return React.createElement("output", { "data-location": true }, location.pathname + location.search); };
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: [{ pathname: "/login", state: { from: "/courses/tajweed?enroll=1" } }] }, React.createElement(Capture), React.createElement(Routes, null, React.createElement(Route, { path: "/login", element: React.createElement(mod.Login) }), React.createElement(Route, { path: "*", element: React.createElement("p", null, "Signed in") }))))));
    const settle = async predicate => { for (let i=0; i<100; i++) { await act(async () => { await new Promise(r => setTimeout(r, 10)); }); if (predicate()) return; } assert.fail(document.body.textContent); };
    await settle(() => document.querySelector('[role="alert"]'));
    assert.match(document.body.textContent, /temporarily unavailable/);
    await act(async () => document.querySelector('.auth-google-retry').click());
    await settle(() => options);
    assert.equal(options.client_id, clientId); assert.equal(options.nonce, "browser-bound-test-nonce"); assert.equal(options.auto_select, false);
    assert.equal(document.querySelector('button[type="submit"]').disabled, false, "A closed/cancelled Google popup never locks the email form");
    await act(async () => { options.callback({ credential: "ephemeral-google-jwt" }); options.callback({ credential: "ephemeral-google-jwt" }); });
    await settle(() => document.querySelector('form[aria-label="Connect Google account"]'));
    assert.equal(requests.filter(r => r.path === "/api/auth/google").length, 1);
    assert.match(document.body.textContent, /current password/);
    assert.equal(store.getState().user.user, null);
    const enter = async value => act(async () => { const input = document.querySelector('form[aria-label="Connect Google account"] input'); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new window.Event("input", { bubbles: true })); });
    const submit = async () => act(async () => document.querySelector('form[aria-label="Connect Google account"]').dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    await enter("wrong-password"); await submit(); await settle(() => document.body.textContent.includes("That password is incorrect"));
    assert.equal(document.querySelector('form[aria-label="Connect Google account"] input').value, "");
    await enter("account-password"); await submit(); await settle(() => finishLink);
    assert.equal(document.querySelector('#login-email').disabled, true);
    await submit(); assert.equal(linkCalls, 2);
    await act(async () => finishLink());
    await settle(() => document.querySelector('[data-location]').textContent === "/courses/tajweed?enroll=1");
    assert.equal(store.getState().user.user._id, user._id);
    assert.equal(api.endpoints.me.select()(store.getState()).data._id, user._id);
    assert.doesNotMatch(JSON.stringify(store.getState()), /ephemeral-google-jwt|account-password/);
    assert.doesNotMatch(JSON.stringify({ ...localStorage }), /ephemeral-google-jwt|account-password/);
    assert(requests.every(r => !["/api/auth/login", "/api/auth/refresh"].includes(r.path)));
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) store.dispatch(api.util.resetApiState());
    globalThis.fetch = previousFetch; await unlink(output).catch(() => {}); dom.window.close();
  }
});

test("Google script loader shares loads, safely retries network failure and never duplicates scripts", async () => {
  const dom = new JSDOM("<html><head></head><body></body></html>");
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  const output = resolve("tests", `google-loader-fixture-${randomUUID()}.mjs`);
  try {
    const result = await build({ entryPoints: ["src/features/auth/google-identity.js"], bundle: true, write: false, format: "esm", platform: "node", packages: "external", alias: { "@": resolve("src") }, define: { "import.meta.env": "{}" } });
    await writeFile(output, result.outputFiles[0].text);
    const { loadGoogleIdentity } = await import(pathToFileURL(output));
    const first = loadGoogleIdentity(); assert.equal(first, loadGoogleIdentity());
    assert.equal(document.scripts.length, 1); assert.equal(document.scripts[0].src, "https://accounts.google.com/gsi/client");
    const rejected = assert.rejects(first);
    document.scripts[0].dispatchEvent(new window.Event("error")); await rejected;
    assert.equal(document.scripts.length, 0);
    const retry = loadGoogleIdentity();
    window.google = { accounts: { id: { renderButton() {} } } };
    document.scripts[0].dispatchEvent(new window.Event("load"));
    assert.equal(await retry, window.google.accounts.id);
    assert.equal(await loadGoogleIdentity(), window.google.accounts.id); assert.equal(document.scripts.length, 1);
  } finally { await unlink(output).catch(() => {}); dom.window.close(); }
});
