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

test("simplified auth forms preserve registration, session hydration and intended destinations with accessible busy/error states", { timeout: 15_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test/register", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLFormElement", "Event", "MouseEvent", "localStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter, Routes, Route, useLocation } = await import("react-router-dom");
  const output = resolve("tests", `auth-pages-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, api;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Login} from './src/pages/auth/Login.jsx'; export {default as Register} from './src/pages/auth/Register.jsx'; export {default as api} from './src/services/api/user/userAuthApis.js'; export {default as userReducer} from './src/store/slices/userSlice.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); api = mod.api;
    const requests = [], user = { _id: "learner1", name: "Noor Fatima", email: "student@example.test", role: "user", expires: Date.now() + 3600_000 };
    let registrationCount = 0, loginCount = 0, completeRegistration;
    globalThis.fetch = async request => {
      assert.equal(request.credentials, "include"); assert.equal(request.headers.get("X-CSRF-Protection"), "1");
      const path = new URL(request.url).pathname, body = await request.json(); requests.push({ path, body });
      if (path === "/api/auth/register") {
        if (++registrationCount === 1) return Response.json({ userMessage: "Registration is temporarily unavailable. Try again." }, { status: 503 });
        await new Promise(resolve => { completeRegistration = resolve; });
        return Response.json({ message: "Your account has been created.", user }, { status: 201 });
      }
      assert.equal(path, "/api/auth/login");
      if (++loginCount === 1) return Response.json({ userMessage: "We could not sign you in. Please try again." }, { status: 503 });
      if (loginCount === 2) return Response.json({ unexpected: "response" });
      return Response.json(user);
    };
    store = configureStore({ reducer: { user: mod.userReducer, [api.reducerPath]: api.reducer }, preloadedState: { user: { user: null } }, middleware: defaults => defaults().concat(api.middleware) });
    await store.dispatch(api.util.upsertQueryData("me", undefined, null));
    const Capture = () => { const location = useLocation(); return React.createElement("output", { "data-location": true, "data-state": JSON.stringify(location.state) }, location.pathname + location.search); };
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: [{ pathname: "/register", state: { from: "/courses/tajweed?enroll=1" } }] }, React.createElement(Capture), React.createElement(Routes, null, React.createElement(Route, { path: "/register", element: React.createElement(mod.Register) }), React.createElement(Route, { path: "/login", element: React.createElement(mod.Login) }), React.createElement(Route, { path: "*", element: React.createElement("p", null, "Destination reached") }))))));
    const settle = async condition => {
      for (let attempt = 0; attempt < 100; attempt++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    const enter = async (name, value) => act(async () => { const input = document.querySelector(`input[name="${name}"]`); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new window.Event("input", { bubbles: true })); });
    const submit = async () => act(async () => document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(document.querySelectorAll("h1").length, 1);
    assert.equal(document.querySelectorAll("input").length, 3);
    assert.equal(document.querySelector("aside"), null);
    assert.equal(document.querySelector('input[name="role"]'), null);
    assert.equal(document.querySelector("form").checkValidity(), false);
    await submit(); assert.equal(requests.length, 0);
    for (const input of document.querySelectorAll("input")) { assert(input.id && input.name); assert(document.querySelector(`label[for="${input.id}"]`)); assert.equal(input.required, true); }
    assert.equal(document.querySelector('input[name="password"]').autocomplete, "new-password");
    await enter("name", " Noor Fatima "); await enter("email", "Student@Example.TEST"); await enter("password", " secret with spaces ");
    await submit(); await settle(() => document.querySelector('[role="alert"]'));
    assert.match(document.querySelector('[role="alert"]').textContent, /Registration is temporarily unavailable/);
    assert.equal(document.querySelector('input[name="name"]').value, " Noor Fatima ");
    await act(async () => { const form = document.querySelector("form"); for (let i = 0; i < 2; i++) form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })); });
    await settle(() => completeRegistration);
    assert.equal(registrationCount, 2);
    assert.match(document.querySelector('button[type="submit"]').textContent, /Creating account/);
    assert.equal(document.querySelector('button[type="submit"]').disabled, true);
    assert([...document.querySelectorAll("input")].every(input => input.disabled));
    await act(async () => completeRegistration());
    await settle(() => document.querySelector('[data-location]').textContent === "/login");
    assert.match(document.querySelector('[role="status"]').textContent, /account has been created/);
    assert.equal(document.querySelectorAll("input").length, 2);
    assert.equal(document.querySelector('input[name="password"]').value, "");
    assert.equal(store.getState().user.user, null, "Registration still requires sign-in");
    assert.doesNotMatch(document.querySelector('[data-location]').getAttribute("data-state"), /secret with spaces|password/);
    assert.equal(document.querySelector('input[name="email"]').autocomplete, "username");
    assert.equal(document.querySelector('input[name="password"]').autocomplete, "current-password");
    const reveal = document.querySelector('button[aria-label="Show password"]');
    await act(async () => reveal.click());
    assert.equal(document.querySelector('input[name="password"]').type, "text");
    assert.equal(reveal.getAttribute("aria-pressed"), "true");
    await act(async () => reveal.click());
    await enter("email", "Student@Example.TEST"); await enter("password", " secret with spaces ");
    await submit(); await settle(() => document.querySelector('[role="alert"]'));
    assert.equal(document.querySelector('input[name="password"]').value, " secret with spaces ");
    assert.equal(store.getState().user.user, null);
    await submit(); await settle(() => loginCount === 2 && !document.querySelector('button[type="submit"]').disabled);
    assert.equal(store.getState().user.user, null, "Malformed login data cannot populate authenticated state");
    assert.doesNotMatch(document.querySelector('[role="alert"]').textContent, /Invalid sign-in response|unexpected/);
    await act(async () => { const form = document.querySelector("form"); for (let i = 0; i < 2; i++) form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })); });
    await settle(() => document.querySelector('[data-location]').textContent === "/courses/tajweed?enroll=1");
    assert.equal(loginCount, 3);
    assert.equal(store.getState().user.user._id, user._id);
    assert.equal(api.endpoints.me.select()(store.getState()).data._id, user._id);
    assert.deepEqual(requests[0].body, { name: "Noor Fatima", email: "student@example.test", password: " secret with spaces " });
    assert(requests.filter(request => request.path === "/api/auth/login").every(request => JSON.stringify(request.body) === JSON.stringify({ email: "student@example.test", password: " secret with spaces " })));
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
