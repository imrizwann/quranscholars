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

test("learner library menus confirm hiding, restore from the hidden view and require a title before leaving", { timeout: 20_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test/dashboard/learning", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter } = await import("react-router-dom");
  const output = resolve("tests", `library-actions-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, apis;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Library} from './src/features/recorded-courses/components/LearnerLibrary.jsx'; export {default as learnerApi} from './src/services/api/user/learnerApi.js'; export {default as paymentApi} from './src/services/api/user/paymentApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); apis = [mod.learnerApi, mod.paymentApi];
    const free = { _id: "free1", title: "Recitation foundations", slug: "recitation", canLeave: true, hidden: false, totalLessons: 1, totalDuration: 100,
      progress: { completedLessons: 0, totalLessons: 1, progressPercent: 0, started: false, completed: false, continueLessonTitle: "Welcome" } };
    const paid = { _id: "paid1", title: "Advanced recitation", slug: "advanced", canLeave: false, hidden: false,
      progress: { completedLessons: 1, totalLessons: 2, progressPercent: 50, started: true, completed: false, continueLessonTitle: "Practice together" } };
    const writes = []; let left = false, failLeave = true;
    globalThis.fetch = async request => {
      assert.equal(request.credentials, "include");
      const url = new URL(request.url);
      if (url.pathname === "/api/purchases/library") {
        const courses = [free, paid].filter(course => !(course === free && left) && course.hidden === (url.searchParams.get("view") === "hidden"));
        return Response.json({ success: true, data: { courses, pagination: { page: 1, limit: 12, total: courses.length, hasNextPage: false, hasPreviousPage: false } } });
      }
      assert.equal(url.pathname, "/api/learner/enrollments/free1");
      assert.equal(request.method, "PATCH"); assert.equal(request.headers.get("X-CSRF-Protection"), "1");
      const body = await request.json(); writes.push(body);
      if (body.action === "leave" && failLeave) return Response.json({ success: false, userMessage: "We could not update your enrollment. Try again." }, { status: 409 });
      if (body.action === "leave") left = true;
      else free.hidden = body.action === "hide";
      return Response.json({ success: true, data: { courseId: free._id, action: body.action, hidden: free.hidden } });
    };
    store = configureStore({ reducer: { user: () => ({ user: { _id: "learner1", role: "user" } }), ...Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])) }, middleware: defaults => defaults().concat(...apis.map(api => api.middleware)) });
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(mod.Library)))));
    const settle = async condition => {
      for (let attempt = 0; attempt < 150; attempt++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    const click = async node => { assert(node); assert.notEqual(node.disabled, true); await act(async () => node.click()); };
    const menu = text => [...document.querySelectorAll('[role="menuitem"]')].find(node => node.textContent.trim() === text);
    const confirm = text => [...document.querySelectorAll('.qs-confirm-actions button')].find(node => node.textContent.trim() === text);
    const options = title => document.querySelector(`button[aria-label="Course options: ${title}"]`);
    const chooseView = async label => {
      await click(document.querySelector('[role="combobox"]'));
      await settle(() => document.querySelector('[role="option"]'));
      await click([...document.querySelectorAll('[role="option"]')].find(node => node.textContent.trim() === label));
    };
    await settle(() => options(free.title));
    assert.equal(document.querySelector('progress[aria-label="Advanced recitation progress"]').value, 50);
    assert.match(document.body.textContent, /1 of 2 lessons complete/);
    assert.match(document.body.textContent, /Continue with Practice together/);
    assert.equal(document.querySelector('a[aria-label="Continue learning: Advanced recitation"]').getAttribute("href"), "/learn/advanced", "the classroom resolves the latest server destination on entry");
    assert(document.querySelector('a[aria-label="Start course: Recitation foundations"]'));
    paid.progress = { ...paid.progress, completedLessons: 2, progressPercent: 100, completed: true };
    await act(async () => store.dispatch(mod.paymentApi.util.invalidateTags(["LearningLibrary"])));
    await settle(() => document.querySelector('a[aria-label="Review course: Advanced recitation"]'));
    assert.equal(document.querySelector('progress[aria-label="Advanced recitation progress"]').value, 100);
    assert.match(document.body.textContent, /Course complete/);
    await click(options(free.title)); await settle(() => menu("Hide from My learning"));
    await click(menu("Hide from My learning"));
    assert.equal(writes.length, 0, "Opening a dialog cannot change enrollment");
    assert.match(document.querySelector('[role="dialog"]').textContent, /purchase remain unchanged/);
    await click(confirm("Hide course"));
    await settle(() => !options(free.title));
    await chooseView("Hidden courses");
    await settle(() => options(free.title));
    assert.match(document.body.textContent, /Hidden course/);
    await click(options(free.title)); await settle(() => menu("Restore to My learning"));
    await click(menu("Restore to My learning")); await click(confirm("Restore course"));
    await settle(() => document.body.textContent.includes("No hidden courses"));
    await chooseView("My courses"); await settle(() => options(free.title));
    await click(options(paid.title)); await settle(() => menu("Hide from My learning"));
    assert.equal(menu("Leave free course"), undefined);
    await act(async () => document.activeElement.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    await settle(() => !document.querySelector('[role="menu"]'));
    await click(options(free.title)); await settle(() => menu("Leave free course")); await click(menu("Leave free course"));
    assert.equal(confirm("Leave course").disabled, true);
    assert.match(document.querySelector('[role="dialog"]').textContent, /Rejoining depends on course availability/);
    const input = document.querySelector('input[name="confirmationTitle"]');
    const enter = async value => act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new window.Event("input", { bubbles: true })); });
    await enter("Wrong course"); assert.equal(confirm("Leave course").disabled, true);
    await enter(free.title); await click(confirm("Leave course"));
    await settle(() => document.querySelector('.qs-confirm-error'));
    assert.equal(left, false); assert(options(free.title));
    failLeave = false; await click(confirm("Leave course"));
    await settle(() => !options(free.title) && !document.querySelector('[role="dialog"]'));
    assert(options(paid.title));
    assert.deepEqual(writes, [{ action: "hide" }, { action: "restore" }, { action: "leave", confirmationTitle: free.title }, { action: "leave", confirmationTitle: free.title }]);
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && apis) for (const api of apis) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
