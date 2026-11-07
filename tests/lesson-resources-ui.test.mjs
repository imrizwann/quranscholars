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

test("lesson resources validate PDFs, upload once, download through authentication, confirm removal and keep learner UI read-only", { timeout: 20_000 }, async t => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window); globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const output = resolve("tests", `lesson-resources-fixture-${randomUUID()}.mjs`), previousFetch = globalThis.fetch;
  let root, store, api;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Resources} from './src/features/recorded-courses/components/LessonResources.jsx'; export {default as api} from './src/services/api/instructor/recordedCoursesApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text); const mod = await import(pathToFileURL(output)); api = mod.api;
    store = configureStore({ reducer: { user: () => ({ user: { _id: "teacher1", role: "instructor" } }), [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(api.middleware) });
    const pdf = new File(["%PDF-1.7\nWorksheet\n%%EOF"], "worksheet.pdf", { type: "application/pdf" });
    const row = { id: "resource1", title: "Practice worksheet", name: pdf.name, size: pdf.size };
    let items = [], canManage = true, failDownload = false, uploads = 0, removals = 0, release;
    const gate = new Promise(resolve => { release = resolve; }), downloads = [], busy = [];
    t.mock.method(URL, "createObjectURL", () => "blob:https://frontend.example.test/authorized-pdf"); t.mock.method(URL, "revokeObjectURL", () => {});
    t.mock.method(dom.window.HTMLAnchorElement.prototype, "click", function () { downloads.push({ href: this.href, name: this.download }); });
    globalThis.fetch = async request => {
      assert.equal(request.credentials, "include"); const url = new URL(request.url);
      assert.match(url.pathname, /^\/api\/learning\/courses\/course1\/sections\/section1\/lessons\/lesson1\/resources/); assert.equal(url.search, "");
      if (url.pathname.endsWith("/download")) return failDownload ? Response.json({ userMessage: "Course access is required." }, { status: 403 }) : new Response(await pdf.arrayBuffer(), { headers: { "Content-Type": "application/pdf" } });
      if (request.method === "POST") {
        uploads++; assert.equal(request.headers.get("X-CSRF-Protection"), "1"); const form = await request.formData();
        assert.deepEqual([...form.keys()].sort(), ["file", "title"]); assert.equal(form.get("title"), row.title); assert.equal(form.get("file").type, "application/pdf");
        await gate; items = [row]; return Response.json({ success: true, data: { resource: row } });
      }
      if (request.method === "DELETE") { removals++; assert.equal(request.headers.get("X-CSRF-Protection"), "1"); items = []; return Response.json({ success: true, data: { removed: true } }); }
      return Response.json({ success: true, data: { available: true, canManage, items, maxFiles: 5, maxBytes: 3 * 1024 * 1024 } });
    };
    const { createRoot } = await import("react-dom/client"); root = createRoot(document.getElementById("root"));
    const render = (manage, key = "instructor") => act(async () => root.render(React.createElement(Provider, { store }, React.createElement(mod.Resources, { key, target: { courseId: "course1", sectionId: "section1", lessonId: "lesson1" }, manage, onBusy: value => busy.push(value) }))));
    const settle = async condition => { for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; } assert.fail(document.body.textContent); };
    const button = text => [...document.querySelectorAll("button")].find(node => node.textContent.trim() === text);
    const select = async file => act(async () => { const input = document.querySelector('input[type="file"]'); Object.defineProperty(input, "files", { configurable: true, value: [file] }); input.dispatchEvent(new window.Event("change", { bubbles: true })); });
    await render(true); await settle(() => document.querySelector('input[type="file"]'));
    await select(new File(["HTML"], "file.html", { type: "text/html" })); assert.match(document.body.textContent, /Choose a PDF/); assert.equal(uploads, 0);
    await select(pdf);
    await act(async () => { const input = document.querySelector('input[name="title"]'); Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, row.title); input.dispatchEvent(new window.Event("input", { bubbles: true })); });
    await act(async () => { button("Upload PDF").click(); button("Upload PDF").click(); }); await settle(() => uploads === 1); assert.equal(button("Uploading PDF").disabled, true);
    await act(async () => release()); await settle(() => document.querySelector('button[aria-label="Download Practice worksheet"]'));
    assert.deepEqual(busy, [true, false]); assert.match(document.body.textContent, /ready for learners/);
    await act(async () => document.querySelector('button[aria-label="Download Practice worksheet"]').click()); await settle(() => downloads.length === 1); assert.equal(downloads[0].name, "worksheet.pdf"); assert.match(downloads[0].href, /^blob:/);
    await act(async () => document.querySelector('button[aria-label="Remove Practice worksheet"]').click()); await settle(() => document.querySelector('[role="dialog"]')); assert.equal(removals, 0);
    await act(async () => button("Cancel").click()); await settle(() => !document.querySelector('[role="dialog"]')); assert.equal(removals, 0);
    await act(async () => document.querySelector('button[aria-label="Remove Practice worksheet"]').click()); await settle(() => button("Remove resource")); await act(async () => button("Remove resource").click());
    await settle(() => !document.querySelector('button[aria-label="Download Practice worksheet"]')); assert.equal(removals, 1);
    canManage = false; items = [row]; await render(false, "learner"); await settle(() => document.querySelector('button[aria-label="Download Practice worksheet"]'));
    assert.equal(document.querySelector('input[type="file"]'), null); assert.equal(document.querySelector('button[aria-label="Remove Practice worksheet"]'), null);
    failDownload = true; await act(async () => document.querySelector('button[aria-label="Download Practice worksheet"]').click()); await settle(() => document.querySelector('[role="alert"]')); assert.equal(downloads.length, 1);
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) { const running = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; running.forEach(request => request.abort()); await Promise.allSettled(running); store.dispatch(api.util.resetApiState()); }
    globalThis.fetch = previousFetch; await unlink(output).catch(() => {}); dom.window.close();
  }
});
