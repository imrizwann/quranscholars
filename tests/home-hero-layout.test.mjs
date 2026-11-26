import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

async function renderHome(env, path = "/") {
  const output = resolve("tests", `home-hero-layout-fixture-${randomUUID()}.mjs`);
  const result = await build({
    stdin: { contents: `export {default as Home} from './src/pages/home/Home.jsx'; export {default as api} from './src/services/api/courses/courses.api.js';`, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic",
    alias: { "@": resolve("src") }, loader: { ".css": "empty", ".svg": "dataurl", ".png": "dataurl" },
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test", ...env }) },
  });
  await writeFile(output, result.outputFiles[0].text);
  try {
    const mod = await import(pathToFileURL(output));
    const store = configureStore({ reducer: { [mod.api.reducerPath]: mod.api.reducer, user: () => ({ user: null }) }, middleware: defaults => defaults().concat(mod.api.middleware) });
    return renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(mod.Home))));
  } finally {
    await unlink(output);
  }
}

const heroClass = html => html.match(/<section id="main" class="([^"]+)"/)?.[1];

test("home hero follows VITE_HOME_HERO_LAYOUT and defaults to the current layout", async () => {
  assert.match(heroClass(await renderHome({})), /home-hero--featured/, "no flag shows the current layout");
  assert.match(heroClass(await renderHome({ VITE_HOME_HERO_LAYOUT: "current" })), /home-hero--featured/);
  assert.match(heroClass(await renderHome({ VITE_HOME_HERO_LAYOUT: "video" })), /home-hero--stage/);
  assert.match(heroClass(await renderHome({ VITE_HOME_HERO_LAYOUT: "path" })), /home-hero--path/);
  assert.match(heroClass(await renderHome({ VITE_HOME_HERO_LAYOUT: "editorial" })), /home-hero--editorial/);
  assert.match(heroClass(await renderHome({ VITE_HOME_HERO_LAYOUT: "unknown" })), /home-hero--featured/, "unknown values fall back to current");
});

test("only the build flag chooses the hero, and the full catalogue always uses the current layout", async () => {
  const html = await renderHome({ DEV: true, VITE_HOME_HERO_LAYOUT: "current" }, "/?hero=video");
  assert.match(heroClass(html), /home-hero--featured/, "the URL cannot change the hero layout");
  assert.doesNotMatch(html, /home-hero-switcher/, "no on-page layout switcher");
  assert.match(heroClass(await renderHome({ VITE_HOME_HERO_LAYOUT: "video", VITE_CATALOGUE_LAYOUT: "full" })), /home-hero--full/);
});
