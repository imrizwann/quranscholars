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

const token = `${"a".repeat(24)}.${"b".repeat(43)}`;
async function fixture(run) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "Event", "MouseEvent", "localStorage", "sessionStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const previousFetch = globalThis.fetch;
  const output = resolve("tests", `account-email-fixture-${randomUUID()}.mjs`);
  let root, store, api;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Forgot} from './src/pages/auth/ForgotPassword.jsx'; export {default as Reset} from './src/pages/auth/ResetPassword.jsx'; export {default as Verify} from './src/pages/auth/VerifyEmail.jsx'; export {default as api} from './src/services/api/user/userAuthApis.js'; export {default as userReducer} from './src/store/slices/userSlice.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); api = mod.api;
    store = configureStore({ reducer: { user: mod.userReducer, [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(api.middleware) });
    const { createRoot } = await import("react-dom/client");
    const { MemoryRouter, Routes, Route, useLocation } = await import("react-router-dom");
    root = createRoot(document.getElementById("root"));
    const Capture = () => { const location = useLocation(); return React.createElement("output", { "data-location": true }, location.pathname + location.search + location.hash); };
    const render = (path, user = null) => act(async () => {
      store.dispatch({ type: "user/setUser", payload: user });
      root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { key: path, initialEntries: [path] }, React.createElement(Capture), React.createElement(Routes, null,
        React.createElement(Route, { path: "/forgot-password", element: React.createElement(mod.Forgot) }), React.createElement(Route, { path: "/reset-password", element: React.createElement(mod.Reset) }), React.createElement(Route, { path: "/verify-email", element: React.createElement(mod.Verify) }), React.createElement(Route, { path: "*", element: React.createElement("p", null, "Destination reached") })))));
    });
    const settle = async condition => { for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(done => setTimeout(done, 10)); }); if (condition()) return; } assert.fail(`UI did not settle: ${document.body.textContent}`); };
    const enter = (name, value) => act(async () => { const input = document.querySelector(`input[name="${name}"]`); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new window.Event("input", { bubbles: true })); });
    const submit = () => act(async () => document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    await run({ mod, api, store, render, settle, enter, submit });
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(request => request.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    globalThis.fetch = previousFetch; await unlink(output).catch(() => {}); dom.window.close();
  }
}
const button = label => [...document.querySelectorAll("button")].find(item => item.textContent.includes(label));
const click = element => act(async () => element.click());

test("forgot password gives a generic confirmation, guards duplicate clicks and preserves the email after a safe service error", async () => fixture(async ({ render, settle, enter, submit }) => {
  const writes = []; let release, fail = false;
  globalThis.fetch = async request => {
    assert.equal(request.credentials, "include"); assert.equal(request.headers.get("x-csrf-protection"), "1");
    writes.push(await request.json());
    if (fail) return Response.json({ userMessage: "Email is temporarily unavailable." }, { status: 503 });
    return new Promise(resolve => { release = () => resolve(Response.json({ message: "Request accepted" }, { status: 202 })); });
  };
  await render("/forgot-password"); await enter("email", " Learner@Example.COM ");
  await submit(); await submit(); await settle(() => release);
  assert.equal(writes.length, 1); assert.deepEqual(writes[0], { email: "learner@example.com" }); assert(button("Requesting reset link").disabled);
  await act(async () => release()); await settle(() => document.body.textContent.includes("If an account matches"));
  assert.equal(document.querySelector("input"), null); assert.equal(document.querySelector('a[href="/login"]').textContent, "Back to sign in");
  await click(button("Use a different email")); fail = true; await submit();
  await settle(() => document.querySelector('[role="alert"]'));
  assert.match(document.querySelector('[role="alert"]').textContent, /temporarily unavailable/); assert.equal(document.querySelector("input").value, "Learner@Example.COM");
}));

test("password reset keeps the link secret out of history/storage, validates confirmation, and clears account state after success", async () => fixture(async ({ store, render, settle, enter, submit }) => {
  const writes = [];
  globalThis.fetch = async request => { assert(!request.url.includes(token)); writes.push(await request.json()); return Response.json({ message: "Password updated" }); };
  await render(`/reset-password#token=${token}`, { _id: "account1", email: "learner@example.com", role: "user" });
  assert.equal(document.querySelector('[data-location]').textContent, "/reset-password"); assert.equal(writes.length, 0);
  for (const storage of [localStorage, sessionStorage]) for (let i = 0; i < storage.length; i++) assert(!storage.getItem(storage.key(i)).includes(token));
  await enter("password", "new-password-123"); await enter("confirmPassword", "different-password"); await submit();
  assert.match(document.querySelector('[role="alert"]').textContent, /don’t match/); assert.equal(writes.length, 0);
  await enter("confirmPassword", "new-password-123"); await submit();
  await settle(() => document.body.textContent.includes("Password updated"));
  assert.deepEqual(writes, [{ token, password: "new-password-123" }]); assert.equal(store.getState().user.user, null);
  assert.equal(document.querySelector("input"), null); assert.doesNotMatch(document.body.textContent, /new-password-123|bbbbbbbb/);
  await render("/reset-password#token=invalid"); assert.match(document.body.textContent, /reset link is incomplete/); assert.equal(document.querySelector("form"), null);
}));

test("verification requires confirmation, refreshes account state, and offers a bounded authenticated resend flow", async () => fixture(async ({ store, render, settle }) => {
  const writes = []; let verified = false;
  const account = { _id: "account1", email: "learner@example.com", role: "user", emailVerified: false, verificationEmailAvailable: true };
  globalThis.fetch = async request => {
    if (request.url.endsWith("/me")) return Response.json({ ...account, emailVerified: verified });
    assert.equal(request.headers.get("x-csrf-protection"), "1");
    const body = await request.json(); writes.push({ url: request.url, body });
    if (request.url.endsWith("/confirm")) { verified = true; return Response.json({ message: "Verified" }); }
    return Response.json({ message: "Verification email sent.", emailSent: true });
  };
  await render(`/verify-email#token=${token}`, account);
  assert.equal(document.querySelector('[data-location]').textContent, "/verify-email"); assert.equal(writes.length, 0, "email scanners and page views cannot consume a verification token");
  await click(button("Verify email address")); await settle(() => store.getState().user.user?.emailVerified === true);
  assert.match(document.querySelector("h1").textContent, /Email verified/); assert.deepEqual(writes[0].body, { token }); assert(!writes[0].url.includes(token));
  verified = false; await render("/verify-email", account); await click(button("Send verification email"));
  await settle(() => button("Resend in")); assert.equal(button("Resend in").disabled, true);
  assert.deepEqual(writes[1].body, {}); assert.match(document.body.textContent, /learner@example.com/);
  await render("/verify-email#token=invalid"); assert.match(document.body.textContent, /link is incomplete/); assert.equal(button("Verify email address"), undefined);
  assert(document.querySelector('a[href="/login"]'));
}));
