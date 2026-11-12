import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

test("admin navigation and stored account state use the backend's exact role values", async () => {
  const dom = new JSDOM("<html><body><div id='root'></div></body></html>", { url: "http://localhost:3001/admin/operations", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "localStorage"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter, Routes, Route } = await import("react-router-dom");
  const file = resolve("tests", `admin-access-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, api;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Guard} from './src/components/guards/AdminRoute.jsx'; export {default as api} from './src/services/api/user/userAuthApis.js'; export {default as userReducer} from './src/store/slices/userSlice.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "http://localhost:3000" }) } });
    await writeFile(file, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(file)); api = mod.api;
    for (const role of ["Admin", " admin ", "administrator", "user", "instructor", "admin"]) {
      const account = { _id: "account", name: "Test account", role, expires: Date.now() + 3_600_000 };
      globalThis.fetch = async request => {
        assert.equal(request.url, "http://localhost:3000/api/auth/me");
        assert.equal(request.credentials, "include");
        return Response.json(account);
      };
      // A cached admin display must not override the API's current role.
      store = configureStore({ reducer: { user: mod.userReducer, [api.reducerPath]: api.reducer }, preloadedState: { user: { user: { ...account, role: "admin" } } }, middleware: defaults => defaults().concat(api.middleware) });
      let privateRenders = 0;
      const PrivateContent = () => { privateRenders++; return React.createElement("p", null, "Private admin dashboard"); };
      root = createRoot(document.getElementById("root"));
      await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: ["/admin/operations"] }, React.createElement(Routes, null,
        React.createElement(Route, { path: "/admin/operations", element: React.createElement(mod.Guard, null, React.createElement(PrivateContent)) }),
        React.createElement(Route, { path: "/", element: React.createElement("p", null, "Public home") })
      )))));
      for (let i = 0; i < 100 && !/Private admin dashboard|Public home/.test(document.body.textContent); i++) await act(async () => { await new Promise(done => setTimeout(done, 10)); });
      assert.match(document.body.textContent, role === "admin" ? /Private admin dashboard/ : /Public home/);
      assert.equal(privateRenders > 0, role === "admin");
      assert.equal(store.getState().user.user.role, ["user", "admin", "instructor"].includes(role) ? role : "user");
      await act(async () => root.unmount()); root = null;
      store.dispatch(api.util.resetApiState());
    }
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) { store.dispatch(api.util.getRunningQueriesThunk()).forEach(request => request.abort()); store.dispatch(api.util.resetApiState()); }
    globalThis.fetch = previousFetch;
    await unlink(file).catch(() => {}); dom.window.close();
  }
});
