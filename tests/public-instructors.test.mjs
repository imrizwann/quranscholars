import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { configureStore } from "@reduxjs/toolkit";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";

test("instructor pages render fetched profiles and real courses; bylines accept only local profile links and real image URLs", async () => {
  const output = resolve("tests", `public-instructors-fixture-${randomUUID()}.mjs`);
  const compiled = await build({ stdin: { contents: `export { default as api } from './src/services/api/courses/instructorsApi.js'; export { default as Directory } from './src/pages/instructors/Instructors.jsx'; export { default as Profile } from './src/pages/instructors/InstructorProfile.jsx'; export { default as Byline } from './src/features/profile/components/InstructorByline.jsx'; export { adaptRecordedCourse } from './src/features/recorded-courses/model/recordedCourseAdapter.js'; export { buildRecordedCourseQuery } from './src/features/recorded-courses/services/recordedCourseContract.js';`, resolveDir: process.cwd() }, bundle: true, write: false, platform: "node", format: "esm", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
  await writeFile(output, compiled.outputFiles[0].text);
  const previous = globalThis.fetch;
  let store, api;
  try {
    const module = await import(pathToFileURL(output)); api = module.api;
    store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(api.middleware) });
    const id = "a".repeat(24), avatar = "https://media.example/avatar.webp?signature=TEST_ONLY";
    const instructor = { id, name: "Amina Current", title: "Tajweed", bio: "Real approved teaching biography.", avatar, profileUrl: `/instructors/${id}`, languages: ["English", "Arabic"], specializations: ["Tajweed"], experienceYears: 0, courseCount: 1 };
    const course = { _id: "b".repeat(24), slug: "real-tajweed", title: "Real Tajweed Course", instructor, language: "English", level: "Beginner", price: { original: 100, currency: "INR" } };
    const requests = [];
    globalThis.fetch = async request => {
      requests.push(request.url);
      const url = new URL(request.url);
      if (url.pathname === "/api/public/instructors") return Response.json({ success: true, data: { items: [instructor], pagination: { page: 1, total: 1, hasNextPage: false } } });
      if (url.pathname.endsWith(id)) return Response.json({ success: true, data: { instructor } });
      return Response.json({ success: true, data: { courses: [course], pagination: { page: 1, totalCourses: 1, totalPages: 1, limit: 12 } } });
    };
    await store.dispatch(api.endpoints.getPublicInstructors.initiate({ page: 1, search: "" })).unwrap();
    await store.dispatch(api.endpoints.getPublicInstructor.initiate(id)).unwrap();
    await store.dispatch(api.endpoints.getRecordedCourses.initiate({ instructor: id, page: 1, limit: 12 })).unwrap();
    const render = (Component, path, pattern) => renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Routes, null, React.createElement(Route, { path: pattern || path, element: React.createElement(Component) })))));
    const directory = render(module.Directory, "/instructors");
    assert.match(directory, /Amina Current/); assert.match(directory, /Real approved teaching biography/); assert.match(directory, /0 years of teaching/); assert.match(directory, /1 course/); assert.match(directory, /avatar.webp/);
    assert.doesNotMatch(directory, /1,240|4\.9|Al-Makki|shadow-sm/);
    const profile = render(module.Profile, `/instructors/${id}`, "/instructors/:slug");
    assert.match(profile, /Courses by Amina Current/); assert.match(profile, /Real Tajweed Course/); assert.match(profile, /href="\/courses\/real-tajweed"/);
    assert.ok(requests.some(url => new URL(url).searchParams.get("instructor") === id));
    assert.match(render(module.Profile, "/instructors/old-demo-name", "/instructors/:slug"), /Instructor not found/);
    const adapted = module.adaptRecordedCourse(course);
    assert.equal(adapted.instructor.avatar, avatar); assert.equal(adapted.instructor.profileUrl, instructor.profileUrl);
    assert.equal(module.adaptRecordedCourse({ instructor: { avatar: { filename: "PRIVATE_KEY" } } }).instructor.avatar, null);
    for (const profileUrl of ["https://evil.example", "//evil.example", "/instructors/../admin", "/instructors/old-placeholder"]) {
      const markup = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(module.Byline, { instructor: { ...instructor, profileUrl } })));
      assert.doesNotMatch(markup, /<a\s/); assert.match(markup, /Amina Current/);
    }
    assert.equal(module.buildRecordedCourseQuery({ instructor: id }).instructor, id);
    assert.equal(module.buildRecordedCourseQuery({ instructor: { $ne: null } }).instructor, undefined);
  } finally { if (store) store.dispatch(api.util.resetApiState()); globalThis.fetch = previous; await unlink(output); }
});
