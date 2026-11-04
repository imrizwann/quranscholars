import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

test("workspaces render real courses and library data, covers, and honest unavailable states", async () => {
  const output = resolve("tests", `workspace-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    stdin: { contents: `
      export { default as coursesApi } from './src/services/api/instructor/recordedCoursesApi.js';
      export { default as paymentApi } from './src/services/api/user/paymentApi.js';
      export { default as learnerApi } from './src/services/api/user/learnerApi.js';
      export { default as Courses } from './src/pages/instructor/InstructorCourses.jsx';
      export { default as InstructorDashboard } from './src/pages/instructor/InstructorDashboard.jsx';
      export { default as StudentDashboard } from './src/pages/dashboard/StudentDashboard.jsx';
      export { default as MyLearning } from './src/pages/account/MyLearning.jsx';
      export { InstructorSectionPage } from './src/pages/instructor/InstructorPages.jsx';
      export { default as StudentSectionPage } from './src/pages/dashboard/StudentSectionPage.jsx';
    `, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const previousFetch = globalThis.fetch;
  let store, apis;
  try {
    const mod = await import(pathToFileURL(output));
    apis = [mod.coursesApi, mod.paymentApi, mod.learnerApi];
    const records = [{ _id: "course-1", title: "Real Tajweed Course", slug: "tajweed", status: "Draft", category: { name: "Tajweed" }, thumbnailUrl: "https://media.example.test/cover.webp", stats: { totalSections: 2, totalLessons: 7 }, trailerVideo: { status: "COMPLETED" } }, { _id: "course-2", title: "Course Without Cover", slug: "no-cover", status: "Published", published: true }];
    globalThis.fetch = async (request) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/analytics")) return Response.json({ success: true, data: url.pathname.includes("/instructor/") ? { summary: { totalCourses: 2, publishedCourses: 1, draftCourses: 1, totalEnrollments: 0, verifiedSales: 0 }, courses: records.map(course => ({ ...course, enrollments: 0 })), revenue: [], pagination: { page: 1, total: 2, hasNextPage: false } } : { summary: { totalEnrolledCourses: 2, completedCourses: 0, completedLessons: 0, coursesInProgress: 0 } } });
      return Response.json({ success: true, data: { courses: records, pagination: { page: 1, total: 2, totalCourses: url.searchParams.get("status") ? 1 : 2, hasNextPage: false } } });
    };
    store = configureStore({ reducer: { ...Object.fromEntries(apis.map((api) => [api.reducerPath, api.reducer])), user: () => ({ user: { _id: "teacher", name: "Amina Learner", email: "amina@example.test", role: "instructor" } }) }, middleware: (defaults) => defaults().concat(...apis.map((api) => api.middleware)) });
    await Promise.all([
      store.dispatch(mod.coursesApi.endpoints.getCourses.initiate({ page: 1, search: "", status: "" })).unwrap(),
      store.dispatch(mod.coursesApi.endpoints.getCourses.initiate({ limit: 3 })).unwrap(),
      store.dispatch(mod.coursesApi.endpoints.getAnalytics.initiate({ page: 1, limit: 5 })).unwrap(),
      store.dispatch(mod.coursesApi.endpoints.getAnalytics.initiate({ page: 1, limit: 10 })).unwrap(),
      store.dispatch(mod.learnerApi.endpoints.getLearnerAnalytics.initiate()).unwrap(),
      ...[3, 12].map((limit) => store.dispatch(mod.paymentApi.endpoints.getLearningLibrary.initiate({ page: 1, limit })).unwrap()),
    ]);
    const render = (Component, url) => renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: [url] }, React.createElement(Component))));
    const courses = render(mod.Courses, "/instructor/courses");
    assert.match(courses, /studio-course-card/); assert.match(courses, /https:\/\/media.example.test\/cover.webp/); assert.match(courses, /Course Without Cover/); assert.match(courses, /Course cover/);
    assert.match(render(mod.InstructorDashboard, "/instructor/dashboard"), /Real Tajweed Course/);
    const learner = render(mod.StudentDashboard, "/dashboard");
    assert.match(learner, /Welcome back, Amina/); assert.match(learner, /Real Tajweed Course/); assert.doesNotMatch(learner, /38%|Lesson 8|1,284|SAR 8,420/);
    assert.match(render(mod.MyLearning, "/dashboard/learning"), /\/learn\/tajweed/);
    assert.doesNotMatch(render(mod.MyLearning, "/dashboard/learning?type=live-classes"), /demoLiveEnrollments|students enrolled/);
    const earnings = render(mod.InstructorSectionPage, "/instructor/earnings");
    assert.match(earnings, /Verified revenue/); assert.match(earnings, /No verified revenue yet/); assert.match(earnings, /Payouts and withdrawals are not configured/);
    assert.doesNotMatch(earnings, /Coming soon|Enrollments by course/);
    const analytics = render(mod.InstructorSectionPage, "/instructor/analytics");
    assert.match(analytics, /Enrollments by course/); assert.match(analytics, /Real Tajweed Course/);
    assert.doesNotMatch(analytics, /Coming soon|Verified revenue/);
    const progress = render(mod.StudentSectionPage, "/dashboard/progress");
    assert.match(progress, /Your progress/); assert.match(progress, /Completed lessons/); assert.match(progress, /Real Tajweed Course/);
    const account = render(mod.StudentSectionPage, "/dashboard/profile");
    assert.match(account, /amina@example.test/); assert.doesNotMatch(account, /learner@example.com|Save changes/);
  } finally {
    globalThis.fetch = previousFetch;
    for (const api of apis || []) store?.dispatch(api.util.resetApiState());
    await unlink(output);
  }
});
