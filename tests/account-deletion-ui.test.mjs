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

test("account deletion checks ownership before confirmation, handles failures and only signs out after successful deletion", { timeout: 20_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test/profile", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent", "localStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter, useLocation } = await import("react-router-dom");
  const output = resolve("tests", `account-deletion-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, api;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Modal} from './src/features/profile/components/ProfileDeleteModal.jsx'; export {default as api} from './src/services/api/user/userAuthApis.js'; export {default as userReducer} from './src/store/slices/userSlice.js'; export {default as uploadApi} from './src/services/api/user/fileUploadApis.js'; export {default as admissionApi} from './src/services/api/user/admissionApis.js'; export {default as adminApi} from './src/services/api/admin/adminAdmissionApis.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); api = mod.api;
    const user = { _id: "instructor1", name: "Instructor", role: "instructor" };
    const blockers = [{ code: "COURSES_REQUIRE_OWNER", message: "You still manage courses. Contact our team to arrange course ownership before deleting your account." }];
    let mode = "blocked", mutation = "race", releaseStatus, statusPending = true;
    const posts = [];
    globalThis.fetch = async request => {
      assert.equal(request.credentials, "include");
      const path = new URL(request.url).pathname;
      if (path === "/api/auth/account-deletion") {
        if (statusPending) await new Promise(resolve => { releaseStatus = resolve; });
        if (mode === "error") return Response.json({ success: false, userMessage: "We could not check your account. Please try again." }, { status: 503 });
        return Response.json({ success: true, data: { canDelete: mode === "ready", blockers: mode === "ready" ? [] : blockers } });
      }
      assert.equal(path, "/api/auth/delete_profile");
      assert.equal(request.method, "POST"); assert.equal(request.headers.get("X-CSRF-Protection"), "1");
      posts.push(await request.json());
      if (mutation === "race") { mode = "blocked"; return Response.json({ success: false, userMessage: blockers[0].message }, { status: 409 }); }
      if (mutation === "failure") return Response.json({ success: false, userMessage: "We could not delete your account. Please try again." }, { status: 500 });
      return Response.json({ success: true, message: "Profile deleted successfully" });
    };
    const apis = [api, mod.uploadApi, mod.admissionApi, mod.adminApi];
    store = configureStore({ reducer: { user: mod.userReducer, ...Object.fromEntries(apis.map(item => [item.reducerPath, item.reducer])) }, preloadedState: { user: { user } }, middleware: defaults => defaults().concat(...apis.map(item => item.middleware)) });
    const Harness = () => {
      const [open, setOpen] = React.useState(true);
      const location = useLocation();
      return React.createElement(React.Fragment, null, React.createElement("span", { "data-location": true }, location.pathname), React.createElement(mod.Modal, { open, onClose: () => setOpen(false) }));
    };
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: ["/profile"] }, React.createElement(Harness)))));
    const settle = async condition => {
      for (let attempt = 0; attempt < 150; attempt++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    const button = text => [...document.querySelectorAll("button")].find(node => node.textContent.trim() === text);
    const click = async node => { assert(node); assert.equal(node.disabled, false); await act(async () => node.click()); };
    const enterPassword = async () => {
      const input = document.getElementById("delete-profile-password"); assert(input);
      await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, "current-password"); input.dispatchEvent(new window.Event("input", { bubbles: true })); });
    };
    await settle(() => releaseStatus);
    assert.equal(button("Delete account").disabled, true);
    assert.equal(document.getElementById("delete-profile-password"), null);
    assert.match(document.body.textContent, /Checking account deletion/);
    statusPending = false; await act(async () => releaseStatus());
    await settle(() => document.querySelector('a[href="/instructor/courses"]'));
    assert.equal(button("Delete account").disabled, true);
    assert(document.querySelector('a[href="/contact"]'));
    assert.equal(posts.length, 0);
    mode = "error"; await click(button("Check again"));
    await settle(() => document.querySelector('[role="alert"]'));
    assert.equal(button("Delete account").disabled, true);
    mode = "ready"; await click(button("Check again"));
    await settle(() => document.getElementById("delete-profile-password"));
    await click(button("Delete account"));
    assert.match(document.getElementById("delete-profile-error").textContent, /Enter your password/);
    assert.equal(posts.length, 0);
    await enterPassword(); await click(button("Delete account"));
    await settle(() => document.querySelector('a[href="/instructor/courses"]'));
    assert.equal(button("Delete account").disabled, true);
    assert.equal(store.getState().user.user._id, user._id, "A rejected deletion must not sign the instructor out");
    mode = "ready"; mutation = "failure"; await click(button("Check again"));
    await settle(() => document.getElementById("delete-profile-password"));
    await enterPassword(); await click(button("Delete account"));
    await settle(() => document.getElementById("delete-profile-error")?.textContent.includes("could not delete"));
    assert.equal(store.getState().user.user._id, user._id);
    mutation = "success"; await click(button("Delete account"));
    await settle(() => store.getState().user.user === null && document.querySelector('[data-location]').textContent === "/");
    assert.equal(posts.length, 3);
    assert(posts.every(body => JSON.stringify(body) === JSON.stringify({ password: "current-password" })));
    assert.equal(Object.keys(store.getState()[api.reducerPath].queries).length, 0);
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
