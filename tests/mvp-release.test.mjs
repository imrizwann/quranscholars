import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter, matchRoutes } from "react-router-dom";
import { JSDOM } from "jsdom";

test("MVP navigation exposes working features, deferred links redirect safely, and production excludes demo pages", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "CustomEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  dom.window.matchMedia = query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  const output = resolve("tests", `mvp-release-fixture-${randomUUID()}.mjs`);
  try {
    let source = await readFile("src/main.jsx", "utf8");
    // Inspect the real production route definitions without mounting a router
    // or running real authentication/network requests.
    source = source.slice(0, source.indexOf("ReactDOM.createRoot"))
      .replace("const router = createBrowserRouter([", "export const routes = [")
      .replace(/\]\);\s*$/, "];\n");
    source += `export {store}; export {default as Navbar} from './layouts/Navbar.jsx'; export {default as Footer} from './layouts/Footer.jsx'; export {default as Workspace} from './layouts/WorkspaceLayout.jsx'; export {default as Home} from './pages/home/Home.jsx'; export {default as MyLearning} from './pages/account/MyLearning.jsx';`;
    const compiled = await build({ stdin: { contents: source, resolveDir: resolve("src"), loader: "jsx" }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty", ".svg": "dataurl", ".png": "dataurl", ".jpg": "dataurl", ".jpeg": "dataurl", ".webp": "dataurl", ".gif": "dataurl", ".mp4": "empty", ".webm": "empty" }, define: { "import.meta.env": JSON.stringify({ DEV: false, PROD: true, VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text); const mod = await import(pathToFileURL(output));
    const render = (Component, props, path = "/") => renderToStaticMarkup(React.createElement(Provider, { store: mod.store }, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Component, props))));
    const instructor = render(mod.Workspace, { type: "instructor" }, "/instructor/dashboard");
    assert.match(instructor, /\/instructor\/courses/); assert.match(instructor, /\/instructor\/students/); assert.match(instructor, /\/instructor\/analytics/);
    assert.doesNotMatch(instructor, /href="\/instructor\/(live-classes|assignments|resources|reviews)/);
    const learner = render(mod.Workspace, { type: "student" }, "/dashboard");
    assert.match(learner, /\/dashboard\/learning/); assert.match(learner, /\/dashboard\/progress/);
    assert.match(learner, /href="\/dashboard\/purchases"/);
    assert.doesNotMatch(learner, /href="\/dashboard\/(assignments|wishlist)/);
    const publicNavigation = render(mod.Navbar) + render(mod.Footer);
    assert.doesNotMatch(publicNavigation, /href="\/(live-classes|blogs|services)/);
    const home = render(mod.Home);
    assert.doesNotMatch(home, /Learn live|Live scholar-led|Blended learning|home-testimonials|id="mentors"|href="\/live-classes/);
    assert.match(home, /recorded video lessons/);
    const library = render(mod.MyLearning, {}, "/dashboard/learning?type=live-classes");
    assert.match(library, /learning-library/); assert.doesNotMatch(library, /Live classes|Your classrooms|Coming soon/);
    const redirects = {
      "/live-classes": "/courses", "/live-classes/old-program": "/courses", "/courses/live/old-program": "/courses", "/services/courses/old-program": "/courses",
      "/classroom/old-program": "/dashboard/learning", "/dashboard/assignments": "/dashboard/learning", "/dashboard/wishlist": "/dashboard/learning",
      "/instructor/live-classes/new": "/instructor/courses", "/instructor/assignments": "/instructor/courses", "/instructor/resources": "/instructor/courses", "/instructor/reviews": "/instructor/courses", "/blogs": "/courses",
    };
    for (const [path, destination] of Object.entries(redirects)) {
      const route = matchRoutes(mod.routes, path).at(-1).route;
      assert.equal(route.element.props.to, destination, path); assert.equal(route.element.props.replace, true);
    }
    const purchases = matchRoutes(mod.routes, "/dashboard/purchases");
    assert.equal(purchases.at(-1).route.path, "purchases");
    assert.equal(purchases.at(-1).route.element.props.to, undefined, "the purchase page is available instead of a placeholder redirect");
    for (const path of ["/test", "/example-theme"]) assert.equal(matchRoutes(mod.routes, path).at(-1).route.path, "*", "demo pages cannot be opened in production");
  } finally { await unlink(output).catch(() => {}); dom.window.close(); }
});
