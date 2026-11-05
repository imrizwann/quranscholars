import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { JSDOM } from "jsdom";
import React, { act } from "react";

test("a rejected lazy route renders the eager recovery page instead of a raw application stack", async t => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test/profile?tab=details#about" });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // A failed automatic recovery has already been attempted in this tab.
  dom.window.sessionStorage.setItem("qs:module-reload", String(Date.now()));
  t.mock.method(console, "error", () => {});
  const output = resolve("tests", `route-error-fixture-${randomUUID()}.mjs`);
  let root, router;
  try {
    const compiled = await build({ entryPoints: ["src/components/feedback/RouteErrorPage.jsx"], bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") } });
    await writeFile(output, compiled.outputFiles[0].text);
    const { default: RouteErrorPage } = await import(pathToFileURL(output));
    const { createMemoryRouter, RouterProvider, Outlet } = await import("react-router-dom");
    const { createRoot } = await import("react-dom/client");
    const BadRoute = React.lazy(() => Promise.reject(new TypeError("Failed to fetch dynamically imported module: https://frontend.example.test/assets/Profile-old.js")));
    router = createMemoryRouter([{ element: React.createElement(React.Suspense, { fallback: "Loading" }, React.createElement(Outlet)), errorElement: React.createElement(RouteErrorPage), children: [{ path: "/profile", element: React.createElement(BadRoute) }, { path: "/broken", loader() { throw new Error("Private server diagnostics must not be rendered"); }, element: null }] }], { initialEntries: ["/profile?tab=details#about"] });
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(RouterProvider, { router }))));
    for (let i = 0; i < 30 && !document.querySelector("h1"); i++) await act(async () => { await new Promise(done => setTimeout(done, 10)); });
    assert.match(document.querySelector("h1").textContent, /couldn’t load/);
    assert.match(document.querySelector('[role="alert"]').textContent, /site may have been updated/);
    assert.equal(document.querySelector("button").textContent, "Refresh page");
    assert.equal(document.querySelector("a").getAttribute("href"), "/");
    assert.doesNotMatch(document.body.textContent, /TypeError|Profile-old|Unexpected Application Error/);
    assert.equal(router.state.location.pathname, "/profile"); assert.equal(router.state.location.search, "?tab=details"); assert.equal(router.state.location.hash, "#about");
    await act(async () => router.navigate("/broken"));
    assert.match(document.body.textContent, /If the problem continues, contact our team/);
    assert.doesNotMatch(document.body.textContent, /Private server diagnostics/);
    Object.defineProperty(dom.window.navigator, "onLine", { configurable: true, value: false });
    await act(async () => router.navigate("/profile"));
    assert.match(document.querySelector("h1").textContent, /offline/);
    assert.match(document.querySelector('[role="alert"]').textContent, /Reconnect/);
  } finally {
    if (root) await act(async () => root.unmount());
    router?.dispose(); await unlink(output).catch(() => {}); dom.window.close();
  }
});
