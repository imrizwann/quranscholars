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

test("dashboard analytics render loading, zero, verified currency totals, pagination and recoverable errors", { timeout: 15_000 }, async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter } = await import("react-router-dom");
  const output = resolve("tests", `dashboard-analytics-fixture-${randomUUID()}.mjs`);
  const previousFetch = globalThis.fetch;
  let root, store, apis = [];
  try {
    const compiled = await build({ stdin: { contents: `export * from './src/components/lms/DashboardAnalytics.jsx'; export {default as InstructorReports} from './src/pages/instructor/InstructorReports.jsx'; export {default as learner} from './src/services/api/user/learnerApi.js'; export {default as instructor} from './src/services/api/instructor/recordedCoursesApi.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, compiled.outputFiles[0].text);
    const mod = await import(pathToFileURL(output));
    apis = [mod.learner, mod.instructor];
    store = configureStore({ reducer: Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])), middleware: defaults => defaults().concat(...apis.map(api => api.middleware)) });
    let release, fail = false, pages = [], requests = [];
    const gate = new Promise(resolve => { release = resolve; });
    let learnerSummary = { totalEnrolledCourses: 0, completedCourses: 0, completedLessons: 0, totalLessons: 0, coursesInProgress: 0 };
    const instructor = { summary: { totalCourses: 6, publishedCourses: 4, draftCourses: 2, totalEnrollments: 12, verifiedSales: 2 }, revenue: [{ currency: "INR", currencyExponent: 2, amountMinor: 12345, sales: 1 }, { currency: "USD", currencyExponent: 2, amountMinor: 999, sales: 1 }] };
    globalThis.fetch = async request => {
      const url = new URL(request.url);
      requests.push(request);
      await gate;
      if (fail) return Response.json({ success: false, message: "Statistics are temporarily unavailable." }, { status: 503 });
      if (url.pathname.endsWith("/watch/heartbeat")) {
        learnerSummary = { ...learnerSummary, completedLessons: 3 };
        return Response.json({ success: true, data: { sequence: 1, lesson: { lessonId: "lesson-1", completed: true } } });
      }
      if (url.pathname.includes("/learner/")) return Response.json({ success: true, data: { summary: learnerSummary } });
      const page = Number(url.searchParams.get("page")); pages.push(page);
      return Response.json({ success: true, data: { ...instructor, courses: [{ _id: `course-${page}`, title: page === 1 ? "Recitation foundations" : "Advanced recitation", published: page === 1, status: page === 1 ? "Published" : "Draft", enrollments: page === 1 ? 12 : 0 }], pagination: { page, total: 6, hasNextPage: page === 1, hasPreviousPage: page > 1 } } });
    };
    root = createRoot(document.getElementById("root"));
    const mount = (Component, props) => act(async () => { root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(Component, props)))); });
    const settle = async condition => {
      for (let attempt = 0; attempt < 100; attempt++) {
        await act(async () => { await new Promise(done => setTimeout(done, 15)); });
        if (condition()) return;
      }
      assert.fail(`UI did not settle: ${document.body.textContent}`);
    };
    const click = async text => {
      const button = [...document.querySelectorAll("button")].find(button => button.textContent.trim() === text);
      assert.ok(button, `Missing ${text} button`);
      await act(async () => { button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); });
    };
    await mount(mod.LearnerAnalytics);
    assert.equal(document.querySelectorAll("dd[aria-busy=true]").length, 4);
    await act(async () => { release(); });
    await settle(() => document.body.textContent.includes("Your learning journey"));
    assert.deepEqual([...document.querySelectorAll("dd")].map(node => node.textContent), ["0", "0", "0", "0"]);
    assert.equal(requests[0].credentials, "include");
    learnerSummary = { totalEnrolledCourses: 2, completedCourses: 0, completedLessons: 2, totalLessons: 5, coursesInProgress: 2 };
    await mount(mod.LearnerAnalytics, { detailed: true });
    await act(async () => { store.dispatch(mod.learner.util.invalidateTags(["LearnerAnalytics"])); });
    await settle(() => document.querySelector("progress"));
    assert.equal(document.querySelector("progress").value, 2);
    assert.equal(document.querySelector("progress").max, 5);
    assert.match(document.body.textContent, /40%/);
    assert.match(document.body.textContent, /2 of 5 lessons completed/);
    assert.match(document.body.textContent, /Your current learning activity/);
    await act(async () => { await store.dispatch(mod.learner.endpoints.recordLessonWatch.initiate({ courseId: "course-1", sectionId: "section-1", lessonId: "lesson-1", watchId: randomUUID(), sequence: 1, position: 90, event: "tick" })).unwrap(); });
    await settle(() => document.querySelector("progress")?.value === 3);
    assert.match(document.body.textContent, /60%/);
    await click("Refresh");
    await settle(() => !document.querySelector("button[disabled]"));
    assert.equal(document.querySelector("progress").value, 3);
    learnerSummary = { ...learnerSummary, totalLessons: 200, completedLessons: 199 };
    await click("Refresh");
    await settle(() => document.querySelector("progress")?.value === 199);
    assert.match(document.body.textContent, /99%/);
    assert.doesNotMatch(document.querySelector(".analytics-learning-progress").textContent, /100%/);
    assert.match(document.body.textContent, /Quizzes are optional/);
    learnerSummary = { ...learnerSummary, totalLessons: 5, completedLessons: 5, completedCourses: 2, coursesInProgress: 0 };
    await click("Refresh");
    await settle(() => document.querySelector("progress")?.value === 5);
    assert.match(document.body.textContent, /100%/);
    learnerSummary = { ...learnerSummary, totalLessons: 0, completedLessons: 0, completedCourses: 0 };
    await click("Refresh");
    await settle(() => document.querySelector("progress")?.max === 1);
    assert.equal(document.querySelector("progress").value, 0);
    assert.doesNotMatch(document.body.textContent, /NaN|Infinity/);
    learnerSummary = { ...learnerSummary, totalLessons: undefined };
    await click("Refresh");
    await settle(() => document.body.textContent.includes("Updating lesson progress"));
    assert.equal(document.querySelector("progress"), null, "missing totals cannot fabricate zero progress during a rolling deployment");

    await mount(mod.InstructorAnalytics);
    await settle(() => document.body.textContent.includes("Recitation foundations"));
    assert.deepEqual([...document.querySelectorAll(".dashboard-metric dd")].map(node => node.textContent), ["4", "2", "12", "2"]);
    assert.match(document.body.textContent, /123\.45/); assert.match(document.body.textContent, /9\.99/);
    assert.equal(document.querySelector('a[href="/instructor/students?courseId=course-1"]').textContent, "12");
    await click("Next");
    await settle(() => document.body.textContent.includes("Advanced recitation"));
    assert.deepEqual(pages, [1, 2]);
    assert.match(document.body.textContent, /Draft/);

    fail = true;
    await act(async () => { store.dispatch(mod.instructor.util.invalidateTags([{ type: "InstructorCourse", id: "LIST" }])); });
    await settle(() => document.querySelector('[role="alert"]'));
    assert.equal(document.querySelectorAll(".dashboard-metric dd")[0].textContent, "Unavailable");
    assert.doesNotMatch(document.body.textContent, /Advanced recitation|123\.45/);
    fail = false;
    await click("Try again");
    await settle(() => document.body.textContent.includes("Advanced recitation"));
    assert.equal(document.querySelector('[role="alert"]'), null);

    await mount(mod.InstructorReports, { kind: "earnings" });
    await settle(() => document.body.textContent.includes("123.45"));
    assert.equal(document.querySelectorAll(".dashboard-metric").length, 2);
    assert.match(document.body.textContent, /Understanding your earnings/);
    assert.doesNotMatch(document.body.textContent, /Enrollments by course|Coming soon/);
    await click("Refresh");
    await settle(() => !document.querySelector("button[disabled]"));
    await mount(mod.InstructorReports, { kind: "analytics" });
    await settle(() => document.body.textContent.includes("Recitation foundations"));
    assert.equal(document.querySelectorAll(".dashboard-metric").length, 4);
    assert.doesNotMatch(document.body.textContent, /Advanced recitation|Verified revenue|Coming soon/);
  } finally {
    if (root) await act(async () => { root.unmount(); });
    for (const api of apis) store?.dispatch(api.util.resetApiState());
    globalThis.fetch = previousFetch;
    await unlink(output).catch(() => {});
    dom.window.close();
  }
});
