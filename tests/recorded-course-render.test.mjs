import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

test("API-backed catalog and detail render real DTO shapes, counts, errors and missing data", async () => {
  const outputPath = resolve("tests", `render-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    stdin: { contents: `
      import "./src/features/recorded-courses/services/recordedCoursesRepository.js";
      export { default as api } from "./src/services/api/courses/courses.api.js";
      export { default as Catalog } from "./src/pages/recorded-courses/RecordedCourses.jsx";
      export { default as Detail } from "./src/pages/recorded-courses/RecordedCourseDetails.jsx";
      export { default as LoadingState } from "./src/components/feedback/LoadingState.jsx";
      export { default as CourseVideo } from "./src/features/recorded-courses/components/CourseVideo.jsx";
    `, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external",
    jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" },
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "http://localhost:3000" }) },
  });
  await writeFile(outputPath, compiled.outputFiles[0].text);
  const originalFetch = globalThis.fetch;
  let store;
  const requests = [];
  const record = { _id: "course-1", slug: "example-course", title: "Example course", category: { name: "Quran", slug: "quran" }, instructor: { _id: "teacher-1" }, price: { original: 299.5, sale: 0, currency: "INR" }, stats: { totalSections: 0 }, totalDuration: 0 };
  try {
    globalThis.fetch = async (request) => {
      const url = new URL(request.url || request);
      requests.push(url);
      if (url.pathname.endsWith("/missing")) return Response.json({ message: "Course not found" }, { status: 404 });
      if (url.pathname.endsWith("/unavailable")) return Response.json({ message: "Unavailable" }, { status: 500 });
      if (url.pathname.endsWith("/example-course")) return Response.json({ success: true, data: { course: record } });
      return Response.json({ success: true, data: { courses: [record], pagination: { page: 2, limit: 8, totalCourses: 33, totalPages: 5 }, filters: {} } });
    };
    const { api, Catalog, Detail, CourseVideo, LoadingState } = await import(pathToFileURL(outputPath));
    store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (getDefault) => getDefault().concat(api.middleware) });
    const render = (Component, url, path) => renderToStaticMarkup(React.createElement(Provider, { store },
      React.createElement(MemoryRouter, { initialEntries: [url] }, React.createElement(Routes, null,
        React.createElement(Route, { path, element: React.createElement(Component) })))));
    const args = { page: 2, limit: 8, search: "faith", category: "quran", level: "Beginner", language: "Urdu" };
    await store.dispatch(api.endpoints.getRecordedCourses.initiate(args));
    const catalog = render(Catalog, "/courses?page=2&search=faith&subject=quran&level=Beginner&language=Urdu", "/courses");
    assert.match(catalog, /Example course/);
    assert.match(catalog, /Showing 1 of 33/);
    assert.match(catalog, /Page 2 of 5/);
    assert.match(catalog, /Free/);
    assert.equal(requests[0].pathname, "/api/public/recorded-courses");
    assert.equal(requests[0].searchParams.get("search"), "faith");
    assert.equal(requests[0].searchParams.get("page"), "2");
    assert.equal(requests[0].searchParams.get("sort"), null);
    await store.dispatch(api.endpoints.getRecordedCourseBySlug.initiate("example-course"));
    const detail = render(Detail, "/courses/example-course", "/courses/:slug");
    assert.match(detail, /Instructor not listed/);
    assert.match(detail, /Lesson count not listed/);
    assert.match(detail, /The lesson outline is not available yet/);
    assert.match(detail, /Enrollment coming soon/);
    assert.doesNotMatch(detail, /Verified learner|undefined|\[object Object\]/);
    await store.dispatch(api.endpoints.getRecordedCourseBySlug.initiate("missing"));
    assert.match(render(Detail, "/courses/missing", "/courses/:slug"), /Course not found/);
    await store.dispatch(api.endpoints.getRecordedCourseBySlug.initiate("unavailable"));
    assert.match(render(Detail, "/courses/unavailable", "/courses/:slug"), /We could not load this course/);
    assert.match(renderToStaticMarkup(React.createElement(CourseVideo, { title: "Preview" })), /Video preview is not available yet/);
    const returned = render(Detail, { pathname: "/courses/example-course", state: { courseCatalog: { url: "/courses?subject=quran&page=2", key: "catalog-entry" } } }, "/courses/:slug");
    assert.match(returned, /href="\/courses\?subject=quran&amp;page=2"/);
    const loader = renderToStaticMarkup(React.createElement(LoadingState, { variant: "inline", label: "Updating courses..." }));
    assert.match(loader, /role="status"/);
    assert.match(loader, /aria-live="polite"/);
    assert.match(loader, /Updating courses/);
    assert.equal((loader.match(/role="status"/g) || []).length, 1);
    store.dispatch(api.util.resetApiState());
  } finally {
    globalThis.fetch = originalFetch;
    await unlink(outputPath);
  }
});
