import test from "node:test";
import process from "node:process";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { configureStore } from "@reduxjs/toolkit";
import { readableError, unwrapAbortable, courseIsPending } from "../src/features/instructor-courses/courseApi.js";
import { trailerPlaybackSource } from "../src/lib/trailer-playback.js";

const root = "/api/instructor/recorded-courses";
const pagination = { page: 1, hasNextPage: false };
const waitFor = async (condition) => {
  for (let n = 0; n < 100; n++) {
    if (condition()) return;
    await new Promise((done) => setTimeout(done, 10));
  }
  assert.fail("Expected RTK Query state did not settle");
};

test("instructor RTK Query integration", async (t) => {
  const output = resolve("tests", `instructor-rtk-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    stdin: {
      contents: `export { default as api } from "./src/services/api/instructor/recordedCoursesApi.js";
        export { instructorSessionMiddleware } from "./src/features/instructor-courses/sessionMiddleware.js";
        export { pollingInterval } from "./src/features/instructor-courses/useCourseQuery.js";`,
      resolveDir: process.cwd(),
    },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external",
    alias: { "@": resolve("src") },
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const originalFetch = globalThis.fetch;
  const stores = [];
  try {
    const { api, instructorSessionMiddleware, pollingInterval } = await import(pathToFileURL(output));
    const makeStore = () => {
      const store = configureStore({
        reducer: {
          [api.reducerPath]: api.reducer,
          user: (state = { user: { _id: "owner1", role: "instructor" } }, action) =>
            action.type === "user/setUser" ? { user: action.payload } : state,
        },
        middleware: (defaults) => defaults().concat(instructorSessionMiddleware, api.middleware),
      });
      stores.push(store);
      return store;
    };
    const requests = [];
    const responseFor = (request) => {
      const url = new URL(request.url), path = url.pathname;
      if (request.method === "DELETE") return { deletionId: "deletion1", storageCleanupPending: true };
      if (path.endsWith("/upload")) return { uploadId: "upload1", uploadUrl: "https://storage.example/video" };
      if (path.endsWith("/process")) return { status: "QUEUED", uploadId: "upload1" };
      if (request.method === "POST") return { courseId: "course1", sectionId: "section1", _id: "lesson1" };
      if (path.endsWith("/categories")) return { items: [{ _id: "category1", name: "Tajweed" }], pagination };
      if (path.includes("/deletions/")) return { deletionId: "deletion1", storageCleanupPending: false };
      if (path === root) return { courses: [{ _id: "course1", title: "Course" }], pagination };
      if (path.endsWith("/sections") || path.endsWith("/lessons")) return { items: [], pagination };
      return { course: { _id: path.split("/").pop(), title: "Course", trailerVideo: { status: "COMPLETED" } }, trailerPlaybackUrl: "https://video.example.test/master.m3u8?token=preview" };
    };
    const normalFetch = async (request) => {
      requests.push(request);
      return Response.json({ success: true, data: responseFor(request) });
    };
    globalThis.fetch = normalFetch;

    await t.test("named endpoints send exact routes, bodies, cookies and CSRF headers", async () => {
      const store = makeStore();
      const target = { courseId: "course1", sectionId: "section1", lessonId: "lesson1" };
      const cases = [
        ["getCategories", { page: 2 }, "GET", `${root}/categories?page=2&limit=50`],
        ["getCourses", { page: 2, search: "Quran & Arabic" }, "GET", `${root}?page=2&limit=12&sort=updated&search=Quran+%26+Arabic`],
        ["getCourse", target, "GET", `${root}/course1`],
        ["getSections", { ...target, page: 2 }, "GET", `${root}/course1/sections?page=2&limit=20`],
        ["getLessons", { ...target, page: 3 }, "GET", `${root}/course1/sections/section1/lessons?page=3&limit=10`],
        ["getDeletion", { deletionId: "deletion1" }, "GET", `${root}/deletions/deletion1`],
        ["createCourse", { title: "Course", category: "category1" }, "POST", root, { title: "Course", category: "category1" }],
        ["createSection", { ...target, title: "Section" }, "POST", `${root}/course1/sections`, { title: "Section" }],
        ["createLesson", { ...target, title: "Lesson" }, "POST", `${root}/course1/sections/section1/lessons`, { title: "Lesson" }],
        ["deleteCourse", target, "DELETE", `${root}/course1`],
        ["deleteSection", target, "DELETE", `${root}/course1/sections/section1`],
        ["deleteLesson", target, "DELETE", `${root}/course1/sections/section1/lessons/lesson1`],
        ["deleteVideo", { courseId: "course1" }, "DELETE", `${root}/course1/trailer`],
        ["deleteVideo", target, "DELETE", `${root}/course1/sections/section1/lessons/lesson1/video`],
        ["prepareVideoUpload", { courseId: "course1", metadata: { size: 123 } }, "POST", `${root}/course1/trailer/upload`, { size: 123 }],
        ["prepareVideoUpload", { ...target, metadata: { size: 123 } }, "POST", `${root}/course1/sections/section1/lessons/lesson1/video/upload`, { size: 123 }],
        ["processVideo", { courseId: "course1", uploadId: "upload1" }, "POST", `${root}/course1/trailer/process`, { uploadId: "upload1" }],
        ["processVideo", { ...target, uploadId: "upload1" }, "POST", `${root}/course1/sections/section1/lessons/lesson1/video/process`, { uploadId: "upload1" }],
      ];
      for (const [name, args, method, path, body] of cases) {
        const before = requests.length;
        const result = await store.dispatch(api.endpoints[name].initiate(args, { subscribe: false })).unwrap();
        if (name === "getCourse") {
          assert.deepEqual(trailerPlaybackSource(result.course, result.trailerPlaybackUrl), {
            src: "https://video.example.test/master.m3u8?token=preview",
            type: "application/x-mpegurl",
          });
        }
        const request = requests[before];
        assert.equal(request.url, `https://api.example${path}`);
        assert.equal(request.method, method);
        assert.equal(request.credentials, "include");
        assert.equal(request.headers.get("x-csrf-protection"), method === "GET" ? null : "1");
        if (body) assert.deepEqual(await request.json(), body);
      }
      store.dispatch(api.util.resetApiState());
    });

    await t.test("upload reservations accept standard and legacy trailer envelopes but reject invalid responses", async () => {
      const store = makeStore();
      const reservation = { uploadId: "trailer1", uploadUrl: "https://storage.example/trailer" };
      const args = { courseId: "course1", metadata: { size: 123 } };
      try {
        for (const body of [{ success: true, data: reservation }, { success: true, ...reservation }]) {
          globalThis.fetch = async () => Response.json(body);
          const result = await store.dispatch(api.endpoints.prepareVideoUpload.initiate(args)).unwrap();
          assert.equal(result.uploadId, reservation.uploadId);
          assert.equal(result.uploadUrl, reservation.uploadUrl);
        }
        for (const body of [{ success: false, ...reservation }, { uploadId: "missing-url" }, { data: { uploadUrl: reservation.uploadUrl } }]) {
          globalThis.fetch = async () => Response.json(body);
          await assert.rejects(store.dispatch(api.endpoints.prepareVideoUpload.initiate(args)).unwrap(),
            (error) => error.status === "CUSTOM_ERROR");
        }
        globalThis.fetch = async () => Response.json({ course: { _id: "course1", title: "Flat response" } });
        await assert.rejects(store.dispatch(api.endpoints.getCourse.initiate(args)).unwrap(),
          (error) => error.status === "CUSTOM_ERROR");
      } finally {
        globalThis.fetch = normalFetch;
        store.dispatch(api.util.resetApiState());
      }
    });

    await t.test("lesson mutations invalidate the affected section and course, not unrelated lessons", async () => {
      const store = makeStore();
      const own = { courseId: "course1", sectionId: "section1" };
      const other = { courseId: "course1", sectionId: "section2" };
      const subscriptions = [
        store.dispatch(api.endpoints.getCourses.initiate({})),
        store.dispatch(api.endpoints.getCourse.initiate(own)),
        store.dispatch(api.endpoints.getLessons.initiate(own)),
        store.dispatch(api.endpoints.getLessons.initiate(other)),
      ];
      await Promise.all(subscriptions.map((sub) => sub.unwrap()));
      const before = requests.length;
      await store.dispatch(api.endpoints.createLesson.initiate({ ...own, title: "New lesson" })).unwrap();
      await waitFor(() => requests.length >= before + 4);
      const refreshed = requests.slice(before).filter((r) => r.method === "GET").map((r) => r.url);
      assert.ok(refreshed.some((url) => url.includes("/section1/lessons")));
      assert.ok(!refreshed.some((url) => url.includes("/section2/lessons")));
      assert.ok(refreshed.includes(`https://api.example${root}/course1`));
      subscriptions.forEach((sub) => sub.unsubscribe());
      store.dispatch(api.util.resetApiState());
    });

    await t.test("course deletion refreshes the list without requesting a deleted detail again", async () => {
      const store = makeStore();
      await store.dispatch(api.endpoints.getCourses.initiate({})).unwrap();
      await store.dispatch(api.endpoints.getCourse.initiate({ courseId: "course1" })).unwrap();
      const before = requests.length;
      await store.dispatch(api.endpoints.deleteCourse.initiate({ courseId: "course1" })).unwrap();
      await waitFor(() => requests.length >= before + 2);
      assert.ok(!requests.slice(before).some((r) => r.method === "GET" && new URL(r.url).pathname === `${root}/course1`));
      store.dispatch(api.util.resetApiState());
    });

    await t.test("HTTP errors and malformed payloads remain errors without automatic retry", async () => {
      const store = makeStore();
      let attempts = 0;
      globalThis.fetch = async () => { attempts++; return Response.json({ message: "Upload is no longer current" }, { status: 409 }); };
      await assert.rejects(store.dispatch(api.endpoints.processVideo.initiate({ courseId: "course1", uploadId: "old" })).unwrap(),
        (error) => error.status === 409 && readableError(error) === "This item has changed. Refresh the page before trying again.");
      assert.equal(attempts, 1);
      globalThis.fetch = async () => Response.json({ data: { items: "invalid" } });
      await assert.rejects(store.dispatch(api.endpoints.getSections.initiate({ courseId: "course1" })).unwrap(),
        (error) => error.status === "CUSTOM_ERROR");
      globalThis.fetch = normalFetch;
      store.dispatch(api.util.resetApiState());
    });

    await t.test("processing recovers one lost response with the same upload identity and stops after two failures", async () => {
      const store = makeStore();
      try {
        for (const target of [{ courseId: "course1" }, { courseId: "course1", sectionId: "section1", lessonId: "lesson1" }]) {
          const seen = [];
          globalThis.fetch = async (request) => {
            seen.push({ url: request.url, body: await request.json() });
            if (seen.length === 1) throw new TypeError("Failed to fetch");
            return Response.json({ success: true, data: { status: "QUEUED", jobId: "existing-job" } });
          };
          const result = await store.dispatch(api.endpoints.processVideo.initiate({ ...target, uploadId: "same-upload" })).unwrap();
          assert.equal(result.jobId, "existing-job");
          assert.equal(seen.length, 2);
          assert.deepEqual(seen[0], seen[1]);
          assert.deepEqual(seen[0].body, { uploadId: "same-upload" });
        }
        let attempts = 0;
        globalThis.fetch = async () => { attempts++; throw new TypeError("Failed to fetch"); };
        await assert.rejects(store.dispatch(api.endpoints.processVideo.initiate({ courseId: "course1", uploadId: "same-upload" })).unwrap(),
          error => error.status === "FETCH_ERROR");
        assert.equal(attempts, 2);
        for (const name of ["prepareVideoUpload", "createCourse", "deleteCourse"]) {
          attempts = 0;
          await assert.rejects(store.dispatch(api.endpoints[name].initiate({ courseId: "course1" })).unwrap());
          assert.equal(attempts, 1, `${name} must not be retried`);
        }
      } finally {
        globalThis.fetch = normalFetch;
        store.dispatch(api.util.resetApiState());
      }
    });

    await t.test("cancelling processing during retry backoff prevents a second request", async () => {
      const store = makeStore();
      let attempts = 0;
      globalThis.fetch = async () => { attempts++; throw new TypeError("Failed to fetch"); };
      const task = store.dispatch(api.endpoints.processVideo.initiate({ courseId: "course1", uploadId: "same-upload" }));
      await waitFor(() => attempts === 1);
      task.abort();
      await assert.rejects(task.unwrap(), error => error.name === "AbortError");
      await new Promise(resolve => setTimeout(resolve, 900));
      assert.equal(attempts, 1);
      globalThis.fetch = normalFetch;
      store.dispatch(api.util.resetApiState());
    });

    await t.test("cancellation aborts the RTK mutation without retrying", async () => {
      const store = makeStore();
      let started = false, aborted = false;
      globalThis.fetch = (request) => new Promise((_resolve, reject) => {
        started = true;
        request.signal.addEventListener("abort", () => { aborted = true; reject(new DOMException("Aborted", "AbortError")); }, { once: true });
      });
      const controller = new AbortController();
      const task = store.dispatch(api.endpoints.prepareVideoUpload.initiate({ courseId: "course1", metadata: {} }));
      const promise = unwrapAbortable(task, controller.signal);
      await waitFor(() => started);
      controller.abort();
      await assert.rejects(promise, (error) => error.name === "AbortError");
      assert.equal(aborted, true);
      globalThis.fetch = normalFetch;
      store.dispatch(api.util.resetApiState());
    });

    await t.test("account changes clear private caches and abort outstanding requests", async () => {
      const store = makeStore();
      await store.dispatch(api.endpoints.getCourse.initiate({ courseId: "private" })).unwrap();
      let started = false;
      globalThis.fetch = (request) => new Promise((_resolve, reject) => {
        started = true;
        request.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
      const pending = store.dispatch(api.endpoints.getSections.initiate({ courseId: "private" }));
      await waitFor(() => started);
      store.dispatch({ type: "user/setUser", payload: null });
      await pending;
      assert.deepEqual(store.getState()[api.reducerPath].queries, {});
      assert.deepEqual(store.getState()[api.reducerPath].mutations, {});
      globalThis.fetch = normalFetch;
    });

    await t.test("polling stops on terminal states and fatal errors and slows for transient failures", () => {
      assert.equal(pollingInterval({ course: { trailerVideo: { status: "QUEUED" } } }, null, courseIsPending), 15_000);
      assert.equal(pollingInterval({ course: { trailerVideo: { status: "COMPLETED" } } }, null, courseIsPending), 0);
      for (const status of [400, 401, 403, 404]) assert.equal(pollingInterval(null, { status }, courseIsPending), 0);
      for (const status of [429, 503, "FETCH_ERROR"]) assert.equal(pollingInterval(null, { status }, courseIsPending), 30_000);
      assert.equal(pollingInterval(null, { status: 503 }), 0);
    });
  } finally {
    globalThis.fetch = originalFetch;
    // Clear middleware timers, including active subscriptions created by assertions.
    for (const store of stores) store.dispatch({ type: "instructorCoursesApi/resetApiState" });
    await unlink(output);
  }
});
