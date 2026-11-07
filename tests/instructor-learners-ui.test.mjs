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

test("instructor roster renders account progress, expandable quiz scores, pagination, empty and recoverable error states", { timeout: 20_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test/instructor/students", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const output = resolve("tests", `instructor-learners-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, api;
  try {
    const compiled = await build({ stdin: { contents: `export {default as Students} from './src/pages/instructor/InstructorStudents.jsx'; export {default as api} from './src/services/api/instructor/recordedCoursesApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output)); api = mod.api;
    store = configureStore({ reducer: { user: () => ({ user: { _id: "teacher1", role: "instructor" } }), [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(api.middleware) });
    const at = "2026-11-07T04:00:00.000Z";
    const row = { _id: "purchase1", name: "Amina", email: "amina@example.test", courseId: "course1", courseTitle: "Tajweed foundations", status: "active", enrolledAt: at,
      learning: { completed: false, started: true, completedLessons: 1, totalLessons: 2, progressPercent: 50, lastActivity: { type: "quiz", title: "First knowledge check", at },
        quizzes: { total: 1, attempted: 1, passed: 1, results: [{ quizId: "quiz1", title: "First knowledge check", sectionTitle: "Getting started", available: true, attempts: 2, passed: true, bestScore: 100, latestScore: 0, lastSubmittedAt: at }] } } };
    let release, fail = false;
    const gate = new Promise(resolve => { release = resolve; });
    const requests = [];
    globalThis.fetch = async request => {
      const url = new URL(request.url); requests.push(url);
      assert.equal(url.pathname, "/api/instructor/recorded-courses/students");
      assert.equal(request.credentials, "include");
      assert.equal(url.searchParams.has("userId"), false);
      await gate;
      if (fail) return Response.json({ success: false, userMessage: "We could not load your learners. Try again." }, { status: 503 });
      const page = Number(url.searchParams.get("page"));
      const items = url.searchParams.get("search") ? [] : page === 1 ? [row] : [{ ...row, _id: "purchase2", name: "Bilal", learning: { completed: false, started: false, completedLessons: 0, totalLessons: 2, progressPercent: 0, lastActivity: null, quizzes: { total: 0, attempted: 0, passed: 0, results: [] } } }];
      return Response.json({ success: true, data: { items, course: url.searchParams.has("courseId") ? { id: "course1", title: row.courseTitle } : null, pagination: { page, limit: 20, total: items.length ? 21 : 0, hasNextPage: page === 1 && items.length > 0 } } });
    };
    const { createRoot } = await import("react-dom/client");
    const { MemoryRouter } = await import("react-router-dom");
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: ["/instructor/students?courseId=course1"] }, React.createElement(mod.Students)))));
    const settle = async condition => {
      for (let i = 0; i < 150; i++) { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); if (condition()) return; }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    const click = async button => { assert(button); assert.equal(button.disabled, false); await act(async () => button.click()); };
    const button = text => [...document.querySelectorAll("button")].find(node => node.textContent.trim() === text);
    assert.match(document.body.textContent, /Loading your learners and progress/);
    assert.equal(document.querySelector("progress"), null);
    await act(async () => release());
    await settle(() => document.querySelector("progress"));
    assert.equal(requests[0].searchParams.get("courseId"), "course1");
    assert.equal(document.querySelector("progress").value, 50);
    assert.match(document.body.textContent, /1 of 2 lessons completed/);
    assert.match(document.body.textContent, /Quiz: First knowledge check/);
    assert(document.querySelector(`time[datetime="${at}"]`));
    assert.equal(document.querySelector(".roster-quiz-details"), null);
    await click(button("View results"));
    assert.equal(button("Hide results").getAttribute("aria-expanded"), "true");
    assert(document.getElementById(button("Hide results").getAttribute("aria-controls")));
    assert.deepEqual([...document.querySelectorAll(".roster-quiz-details dd")].map(node => node.textContent), ["100%", "0%", "2"]);
    assert.match(document.querySelector(".roster-quiz-details").textContent, /Passed/);
    assert.match(document.querySelector(".roster-quiz-details").textContent, /optional and do not affect course completion/);
    await click(button("Hide results"));
    assert.equal(document.querySelector(".roster-quiz-details"), null);
    await click(button("Next"));
    await settle(() => document.body.textContent.includes("Bilal"));
    assert.equal(document.querySelector("progress").value, 0);
    assert.match(document.body.textContent, /Not started/);
    assert.match(document.body.textContent, /No learning activity yet/);
    assert.match(document.body.textContent, /No published quizzes/);
    await click(button("Show all courses"));
    await settle(() => requests.at(-1).searchParams.get("page") === "1" && !requests.at(-1).searchParams.has("courseId") && document.body.textContent.includes("Amina"));
    const input = document.querySelector('input[name="search"]');
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, "Unknown learner");
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await act(async () => input.closest("form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
    await settle(() => document.body.textContent.includes("No matching learners"));
    assert.equal(document.querySelector("progress"), null);
    assert.equal(requests.at(-1).searchParams.get("search"), "Unknown learner");
    fail = true;
    await click(button("Refresh"));
    await settle(() => document.querySelector('[role="alert"]'));
    assert.match(document.querySelector('[role="alert"]').textContent, /We could not load your learners/);
    fail = false;
    await click(button("Try again"));
    await settle(() => !document.querySelector('[role="alert"]') && document.body.textContent.includes("No matching learners"));
  } finally {
    if (root) await act(async () => root.unmount());
    if (store && api) {
      const running = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())];
      running.forEach(request => request.abort()); await Promise.allSettled(running);
      store.dispatch(api.util.resetApiState());
    }
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {}); dom.window.close();
  }
});
