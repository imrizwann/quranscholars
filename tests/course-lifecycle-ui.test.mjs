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

test("availability controls confirm changes, preserve access messaging, refresh course state and recover errors", { timeout: 15_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const { createRoot } = await import("react-dom/client");
  const output = resolve("tests", `course-lifecycle-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, api, store;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Availability} from './src/features/instructor-courses/CourseAvailability.jsx'; export {default as Enrollment} from './src/features/recorded-courses/components/CourseEnrollment.jsx'; export {default as api} from './src/services/api/instructor/recordedCoursesApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); api = mod.api;
    let course = { _id: "course1", title: "Recitation", published: true, status: "Published", enrollmentOpen: true, protection: { canDelete: false, hasLearners: true } };
    const writes = [];
    let fail = false, finishRequest;
    globalThis.fetch = async request => {
      if (request.method === "PATCH") {
        const body = await request.json(); writes.push(body);
        if (body.action === "pause_enrollments") await new Promise(resolve => { finishRequest = resolve; });
        if (fail) return Response.json({ success: false, message: "Protected lesson playback is not configured. Contact the team before reopening enrollment.", userMessage: "Protected lesson playback is not configured. Contact the team before reopening enrollment." }, { status: 409 });
        course = { ...course, status: body.action === "archive" ? "Archived" : "Published", enrollmentOpen: body.action === "resume_enrollments" };
        return Response.json({ success: true, data: { status: course.status, published: true, enrollmentOpen: course.enrollmentOpen } });
      }
      return Response.json({ success: true, data: { course } });
    };
    store = configureStore({ reducer: { [api.reducerPath]: api.reducer, user: () => ({ user: { _id: "owner", role: "instructor" } }) }, middleware: defaults => defaults().concat(api.middleware) });
    const Harness = () => {
      const query = api.endpoints.getCourse.useQuery({ courseId: "course1" });
      const [busy, setBusy] = React.useState(false);
      return query.currentData ? React.createElement(mod.Availability, { course: query.currentData.course, disabled: busy, onBusy: setBusy }) : null;
    };
    root = createRoot(document.getElementById("root"));
    await act(async () => { root.render(React.createElement(Provider, { store }, React.createElement(Harness))); });
    const settle = async condition => {
      for (let attempt = 0; attempt < 100; attempt++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    const button = (text, modal = false) => [...document.querySelectorAll(modal ? ".qs-confirm-actions button" : "button")].find(node => node.textContent.trim() === text);
    const click = async node => { assert.ok(node); assert.equal(node.disabled, false); await act(async () => node.click()); };
    await settle(() => button("Pause enrollments"));
    await click(button("Pause enrollments"));
    assert.match(document.querySelector('[role="dialog"]').textContent, /existing learners keep their access/i);
    assert.equal(writes.length, 0, "Opening a confirmation never mutates availability");
    await click(button("Pause enrollments", true));
    await settle(() => writes.length === 1);
    assert.match(document.querySelector('.qs-confirm-actions').textContent, /Saving availability/);
    await act(async () => finishRequest());
    await settle(() => button("Reopen enrollment"));
    await click(button("Archive course")); await click(button("Archive course", true));
    await settle(() => button("Restore course"));
    assert.match(document.body.textContent, /Enrolled learners can continue studying/);
    assert.equal(button("Reopen enrollment"), undefined);
    await click(button("Restore course")); await click(button("Restore course", true));
    await settle(() => button("Reopen enrollment"));
    fail = true;
    await click(button("Reopen enrollment")); await click(button("Reopen enrollment", true));
    await settle(() => document.querySelector('.qs-confirm-error'));
    assert.match(document.querySelector('.qs-confirm-error').textContent, /Protected lesson playback is not configured/);
    assert.doesNotMatch(document.querySelector('.qs-confirm-error').textContent, /This item has changed/);
    assert.equal(course.enrollmentOpen, false);
    const review = document.querySelector('a[href="#course-publish-checklist"]');
    assert.equal(review.textContent, "Review course checklist");
    await act(async () => review.click());
    await settle(() => !document.querySelector('[role="dialog"]'));
    fail = false; await click(button("Reopen enrollment")); await click(button("Reopen enrollment", true));
    await settle(() => button("Pause enrollments") && !document.querySelector('[role="dialog"]'));
    assert.deepEqual(writes.map(item => item.action), ["pause_enrollments", "archive", "restore", "resume_enrollments", "resume_enrollments"]);
    assert.equal(course.protection.hasLearners, true);
    const { MemoryRouter } = await import("react-router-dom");
    const guestStore = configureStore({ reducer: { user: () => ({ user: null }) } });
    await act(async () => root.render(React.createElement(Provider, { store: guestStore }, React.createElement(MemoryRouter, null, React.createElement(mod.Enrollment, { course: { id: "course1", slug: "recitation", enrollmentOpen: false } })))));
    assert.match(document.body.textContent, /Enrollment is currently closed/);
    assert.equal(document.querySelector('a[href="/login"]'), null);
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) { const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())]; requests.forEach(item => item.abort()); await Promise.allSettled(requests); store.dispatch(api.util.resetApiState()); }
    await new Promise(resolve => setTimeout(resolve, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
