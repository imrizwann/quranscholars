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

test("studio preserves editing drafts and requires a typed title before course deletion", { timeout: 15_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  // Node isolates test files in separate processes. Keep DOM APIs available for
  // deferred Base UI cleanup even after this root and window are closed.
  const expose = (key, value) => {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "HTMLButtonElement", "HTMLFormElement", "MutationObserver", "Document", "ShadowRoot", "Event", "MouseEvent"]) expose(key, key === "window" ? dom.window : dom.window[key]);
  expose("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
  expose("requestAnimationFrame", dom.window.requestAnimationFrame.bind(dom.window));
  expose("cancelAnimationFrame", dom.window.cancelAnimationFrame.bind(dom.window));
  expose("IS_REACT_ACT_ENVIRONMENT", true);
  dom.window.matchMedia = query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  dom.window.HTMLMediaElement.prototype.pause = () => {};
  const output = resolve("tests", `studio-interactions-fixture-${randomUUID()}.mjs`);
  let root, store, api, router;
  const previousFetch = globalThis.fetch;
  try {
    const { createRoot } = await import("react-dom/client");
    const { createMemoryRouter, RouterProvider } = await import("react-router-dom");
    const compiled = await build({ stdin: { contents: `export {default as Workspace} from './src/pages/instructor/RecordedCourseWorkspace.jsx'; export {default as api} from './src/services/api/instructor/recordedCoursesApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const module = await import(pathToFileURL(output));
    api = module.api;
    const sections = [], writes = [], lessonWrites = [], deletionWrites = [], lessons = new Map();
    let finishDeletion;
    const course = { _id: "course1", title: "Recitation foundations", description: "A full introduction to Quran recitation for beginners.", category: { _id: "category1", name: "Quran" }, status: "Draft", language: "English", level: "Beginner", tags: [], outcomes: [], requirements: [], audience: [], price: { original: 100, currency: "INR" }, trailerVideo: { status: "NOT_UPLOADED" } };
    const page = items => ({ items, pagination: { page: 1, hasNextPage: false } });
    globalThis.fetch = async request => {
      const url = new URL(request.url);
      let data;
      if (request.method === "DELETE") {
        deletionWrites.push(await request.json());
        if (deletionWrites.length === 1) return new Promise(resolve => { finishDeletion = () => resolve(Response.json({ success: false, message: "Deletion is temporarily unavailable." }, { status: 503 })); });
        return Response.json({ success: true, data: { deletionId: "deletion1", storageCleanupPending: true } }, { status: 202 });
      } else if (url.pathname.endsWith("/readiness")) data = { ready: false, checks: [] };
      else if (request.method === "POST" && url.pathname.endsWith("/sections")) {
        const body = await request.json();
        writes.push(body);
        const section = { _id: `section${sections.length + 1}`, title: body.title, description: body.description, order: (sections.length + 1) * 30 };
        sections.push(section);
        data = { sectionId: section._id, courseId: course._id };
      } else if (request.method === "POST" && url.pathname.endsWith("/lessons")) {
        const body = await request.json();
        lessonWrites.push(body);
        const sectionId = url.pathname.split("/").at(-2);
        const items = lessons.get(sectionId) || [];
        const lesson = { _id: `lesson${items.length + 1}`, sectionId, courseId: course._id, ...body, order: items.length + 1, published: false, video: { status: "NOT_UPLOADED" } };
        lessons.set(sectionId, [...items, lesson]);
        data = lesson;
      } else if (url.pathname.endsWith("/categories")) data = page([{ _id: "category1", name: "Quran" }]);
      else if (url.pathname.endsWith("/sections")) data = page([...sections]);
      else if (url.pathname.endsWith("/lessons")) data = page(lessons.get(url.pathname.split("/").at(-2)) || []);
      else data = { course };
      return Response.json({ success: true, data });
    };
    store = configureStore({ reducer: { [api.reducerPath]: api.reducer, user: () => ({ user: { _id: "teacher", role: "instructor" } }) }, middleware: defaults => defaults().concat(api.middleware) });
    router = createMemoryRouter([{ path: "/instructor/courses/:courseId", element: React.createElement(module.Workspace) }, { path: "/instructor/courses/deletions/:deletionId", element: React.createElement("p", null, "Course deletion status") }], { initialEntries: [{ pathname: "/instructor/courses/course1", state: { startWithCurriculum: true } }] });
    root = createRoot(document.getElementById("root"));
    const settle = async condition => {
      for (let attempt = 0; attempt < 100; attempt++) {
        await act(async () => { await new Promise(done => setTimeout(done, 20)); });
        if (condition()) return;
      }
      assert.fail("Studio interaction did not settle");
    };
    const click = async element => {
      assert.ok(element, "Expected control to be rendered");
      assert.notEqual(element.disabled, true, "Expected control to be enabled");
      await act(async () => element.click());
    };
    const fill = async (input, value) => {
      assert.equal(input.disabled, false, "Section title must remain editable");
      const prototype = input.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      await act(async () => {
        Object.getOwnPropertyDescriptor(prototype, "value").set.call(input, value);
        input.dispatchEvent(new window.Event("input", { bubbles: true }));
      });
    };
    const button = text => [...document.querySelectorAll("button")].find(item => item.textContent.trim() === text);
    const sectionInput = () => document.querySelector('input[placeholder="e.g. Getting started"]');
    await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(RouterProvider, { router }))));
    await settle(() => sectionInput());
    const unidentifiedFields = () => [...document.querySelectorAll("input, textarea, select")].filter(field => !field.id && !field.name);
    assert.deepEqual(unidentifiedFields().map(field => field.outerHTML), [], "Rendered controls, including file pickers and custom-select internals, need identifiers");
    for (const title of ["First section", "Second section"]) {
      await fill(sectionInput(), title);
      if (title === "First section") {
        await click(document.querySelector(".cw-sections .cw-add-description summary"));
        await fill(document.querySelector('.cw-sections .cw-add-form textarea[name="description"]'), "  First section overview  ");
      }
      await click(button("Add section"));
      await settle(() => sectionInput()?.value === "" && !sectionInput().disabled && writes.length === (title === "First section" ? 1 : 2));
    }
    assert.deepEqual(writes, [{ title: "First section", description: "First section overview" }, { title: "Second section", description: "" }]);

    await click(button("Course Details"));
    await click(button("Edit details"));
    const description = document.querySelector('textarea[name="description"]');
    const draft = "An unsaved description that must survive curriculum work.";
    await fill(description, draft);
    await click(button("Curriculum"));
    await fill(sectionInput(), "Third section");
    await click(button("Add section"));
    await settle(() => writes.length === 3 && sectionInput()?.value === "" && !sectionInput().disabled);
    await click([...document.querySelectorAll(".cw-section")].find(item => item.textContent.includes("Second section")));
    await click(button("Pricing"));
    await click(button("Edit pricing"));
    await fill(document.querySelector('input[name="original"]'), "125");
    await click(button("Curriculum"));
    await fill(sectionInput(), "Fourth section");
    await click(button("Add section"));
    await settle(() => writes.length === 4 && sectionInput()?.value === "" && !sectionInput().disabled);
    const lessonForm = document.querySelector(".cw-lessons .cw-add-form");
    await fill(lessonForm.querySelector('input[name="title"]'), "Introduction lesson");
    await click(lessonForm.querySelector("summary"));
    await fill(lessonForm.querySelector('textarea[name="description"]'), "  Practise reciting the first short passage.  ");
    await click(button("Add lesson"));
    await settle(() => lessonWrites.length === 1 && document.querySelector(".cw-lesson-description"));
    assert.deepEqual(lessonWrites, [{ title: "Introduction lesson", description: "Practise reciting the first short passage." }]);
    assert.equal(document.querySelector(".cw-lesson-description").textContent, "Practise reciting the first short passage.");
    await click(button("Course Details"));
    assert.equal(document.querySelector('textarea[name="description"]').value, draft);
    await click(button("Pricing"));
    assert.equal(document.querySelector('input[name="original"]').value, "125");
    assert.deepEqual(unidentifiedFields().map(field => field.outerHTML), [], "Editing forms must keep every field identifiable");
    assert.equal(writes.length, 4);

    const visibleButton = text => [...document.querySelectorAll("button")].find(item => item.textContent.trim() === text && !item.closest("[hidden]"));
    await click(visibleButton("Cancel"));
    await click(button("Course Details"));
    await click(visibleButton("Cancel"));
    await click(button("Publish"));
    await click(button("Delete course"));
    const confirmationInput = () => document.querySelector('input[name="confirmationTitle"]');
    const confirmButton = () => [...document.querySelectorAll('.qs-confirm-actions button')].find(item => item.textContent.trim() === "Delete course");
    await settle(() => confirmationInput());
    assert.equal(confirmButton().disabled, true);
    await fill(confirmationInput(), "Wrong course");
    assert.equal(confirmButton().disabled, true);
    await fill(confirmationInput(), course.title.toLowerCase());
    assert.equal(confirmButton().disabled, true, "Title confirmation is case sensitive");
    await fill(confirmationInput(), course.title);
    assert.equal(confirmButton().disabled, false);
    await click([...document.querySelectorAll('.qs-confirm-actions button')].find(item => item.textContent.trim() === "Cancel"));
    await settle(() => !confirmationInput());
    await click(button("Delete course"));
    await settle(() => confirmationInput());
    assert.equal(confirmationInput().value, "", "Reopening never reuses a previous confirmation");
    assert.equal(confirmButton().disabled, true);
    assert.equal(deletionWrites.length, 0);
    await fill(confirmationInput(), `  ${course.title}  `);
    await click(confirmButton());
    await settle(() => deletionWrites.length === 1);
    assert.equal(confirmationInput().disabled, true);
    assert.match(document.querySelector('.qs-confirm-actions').textContent, /Deleting course/);
    assert.deepEqual(deletionWrites, [{ confirmationTitle: course.title }]);
    await act(async () => finishDeletion());
    await settle(() => document.querySelector('.qs-confirm-error'));
    assert.equal(confirmationInput().value.trim(), course.title, "A failed request preserves the typed confirmation for retry");
    await click(confirmButton());
    await settle(() => router.state.location.pathname === "/instructor/courses/deletions/deletion1");
    assert.equal(deletionWrites.length, 2);
  } finally {
    if (root) await act(async () => root.unmount());
    router?.dispose();
    if (store && api) {
      const requests = [...store.dispatch(api.util.getRunningQueriesThunk()), ...store.dispatch(api.util.getRunningMutationsThunk())];
      requests.forEach(request => request.abort());
      await Promise.allSettled(requests);
      store.dispatch(api.util.resetApiState());
    }
    await new Promise(done => setTimeout(done, 100));
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {});
    dom.window.close();
  }
});
