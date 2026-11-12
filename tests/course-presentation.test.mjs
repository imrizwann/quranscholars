import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { JSDOM } from "jsdom";

const records = Array.from({ length: 4 }, (_, index) => ({
  _id: `course-${index + 1}`, slug: `recitation-${index + 1}`, title: `Recitation foundations ${index + 1}`,
  shortDescription: "Build confidence through guided practice.", thumbnailUrl: "https://images.example.test/cover.webp",
  category: { name: "Quran", slug: "quran" }, instructor: { name: "Sara Ahmed" },
  level: "Beginner", language: "English", stats: { totalLessons: 6 }, totalDuration: 1800,
  price: { original: 499, currency: "INR" },
}));
const fullQuery = { page: 1, limit: 8, search: "", category: "All", level: "All", language: "All" };

async function bundle(layout) {
  const output = resolve("tests", `course-presentation-fixture-${randomUUID()}.mjs`);
  const result = await build({
    stdin: { contents: `export {default as Catalog} from './src/pages/recorded-courses/RecordedCourses.jsx'; export {default as Home} from './src/pages/home/Home.jsx'; export {default as api} from './src/services/api/courses/courses.api.js';`, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic",
    alias: { "@": resolve("src") }, loader: { ".css": "empty", ".svg": "dataurl", ".png": "dataurl" },
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test", ...(layout && { VITE_CATALOGUE_LAYOUT: layout }) }) },
  });
  await writeFile(output, result.outputFiles[0].text);
  return { ...(await import(pathToFileURL(output))), output };
}

for (const layout of [undefined, "full"]) test(`${layout || "featured (default)"} presentation uses existing published course data and preserves discovery links`, async () => {
  const previousFetch = globalThis.fetch;
  const mod = await bundle(layout);
  const store = configureStore({ reducer: { [mod.api.reducerPath]: mod.api.reducer, user: () => ({ user: null }) }, middleware: defaults => defaults().concat(mod.api.middleware) });
  let count = 1;
  const requests = [];
  globalThis.fetch = async request => {
    const url = new URL(request.url); requests.push(url);
    assert.equal(request.method, "GET"); assert.equal(request.credentials, "include");
    assert.equal(url.pathname, "/api/public/recorded-courses");
    const limit = Number(url.searchParams.get("limit"));
    return Response.json({ data: { courses: records.slice(0, Math.min(count, limit)), pagination: { page: 1, limit, totalCourses: count, totalPages: Math.ceil(count / limit) } } });
  };
  const load = args => store.dispatch(mod.api.endpoints.getRecordedCourses.initiate(args, { subscribe: false, forceRefetch: true })).unwrap();
  const render = (Component, path = "/courses") => new JSDOM(renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Component)))));
  const inspect = (Component, path, verify) => { const dom = render(Component, path); try { verify(dom.window.document); } finally { dom.window.close(); } };
  try {
    await load({ limit: 3 }); await load(fullQuery);
    inspect(mod.Catalog, "/courses", document => {
      assert.match(document.body.textContent, /Recitation foundations 1/);
      assert.match(document.body.textContent, /Sara Ahmed|30 min|499/);
      assert(document.querySelector('a[href="/courses/recitation-1"] img'));
      assert.equal(document.querySelector("video"), null, "course previews link to the existing detail page, without loading video");
      if (layout === "full") {
        assert(document.querySelector('input[name="search"]'));
        assert.equal(document.querySelector(".course-selection"), null);
      } else {
        assert.equal(document.querySelectorAll(".course-selection article").length, 1);
        assert(document.querySelector(".recorded-course-card--featured"));
        assert.equal(document.querySelector('input[type="search"], [role="combobox"], .catalogue-pagination'), null);
      }
      assert(document.querySelector("#how-courses-work"));
    });
    inspect(mod.Home, "/", document => {
      const hero = document.querySelector(".home-hero");
      if (layout === "full") {
        assert(hero.querySelector(".home-start-panel"));
        assert(hero.querySelector('a[href="/get-started/instructor"]'));
      } else {
        assert.equal(hero.querySelector(".home-start-panel"), null);
        assert.match(hero.querySelector(".home-featured-course").textContent, /Recitation foundations 1/);
        assert.equal(hero.querySelector(".home-hero-actions a").getAttribute("href"), "/courses");
        assert.match(hero.querySelector("h1").textContent, /IQRA/);
        assert.equal(document.querySelectorAll("article .catalogue-course-media").length, 1, "one course appears as one prominent preview");
        assert.match(document.querySelector(".home-study-guide").textContent, /Your learning routine/);
      }
    });
    if (layout !== "full") {
      for (count of [2, 3]) {
        await load({ limit: 3 });
        inspect(mod.Catalog, "/courses", document => {
          assert.equal(document.querySelectorAll(".course-selection article").length, count);
          assert.equal(document.querySelector(".recorded-course-card--featured"), null);
          assert.equal(document.querySelector('input[type="search"]'), null);
        });
      }
      count = 4; await load({ limit: 3 }); await load(fullQuery);
      inspect(mod.Catalog, "/courses", document => {
        assert(document.querySelector('input[name="search"]'));
        assert.match(document.body.textContent, /Recitation foundations 4/, "a growing catalogue never silently loses courses");
      });
      count = 1; await load({ limit: 3 });
      await load({ ...fullQuery, search: "recitation" });
      inspect(mod.Catalog, "/courses?search=recitation", document => {
        assert.equal(document.querySelector('input[name="search"]').value, "recitation");
        assert.match(document.body.textContent, /Recitation foundations 1/);
      });
      assert(requests.some(url => url.searchParams.get("search") === "recitation"));
      count = 0; await load({ limit: 3 });
      inspect(mod.Catalog, "/courses", document => {
        assert.match(document.body.textContent, /New courses are on the way/);
        assert(document.querySelector('a[href="/contact"]'));
        assert.equal(document.querySelectorAll("article").length, 0);
        assert.doesNotMatch(document.body.textContent, /Free|undefined|NaN/);
      });
    }
  } finally {
    store.dispatch(mod.api.util.resetApiState()); globalThis.fetch = previousFetch; await unlink(mod.output);
  }
});

test("featured catalogue exposes loading and retry states without stale courses or extra controls", async () => {
  const dom = new JSDOM("<html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const previousFetch = globalThis.fetch;
  const mod = await bundle("featured");
  const store = configureStore({ reducer: { [mod.api.reducerPath]: mod.api.reducer, user: () => ({ user: null }) }, middleware: defaults => defaults().concat(mod.api.middleware) });
  const root = createRoot(document.getElementById("root"));
  let release, failure = true;
  const gate = new Promise(done => { release = done; });
  globalThis.fetch = async () => { await gate; return failure ? Response.json({}, { status: 400 }) : Response.json({ data: { courses: [records[0]], pagination: { page: 1, totalCourses: 1, totalPages: 1 } } }); };
  const settle = async condition => { for (let i = 0; i < 100; i++) { await act(async () => { await new Promise(done => setTimeout(done, 10)); }); if (condition()) return; } assert.fail(document.body.textContent); };
  try {
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(mod.Catalog)))));
    assert.match(document.querySelector('[role="status"]').textContent, /Loading courses/);
    assert.equal(document.querySelectorAll("article").length, 0);
    await act(async () => release());
    await settle(() => document.querySelector('[role="alert"]'));
    assert.match(document.querySelector('[role="alert"]').textContent, /temporarily unavailable/);
    failure = false;
    await act(async () => [...document.querySelectorAll("button")].find(button => button.textContent === "Try again").click());
    await settle(() => document.querySelector(".course-selection article"));
    assert.match(document.body.textContent, /Recitation foundations 1/);
    assert.equal(document.querySelector('[role="alert"]'), null);
  } finally {
    release?.(); await act(async () => root.unmount()); store.dispatch(mod.api.util.resetApiState());
    globalThis.fetch = previousFetch; await unlink(mod.output); dom.window.close();
  }
});
