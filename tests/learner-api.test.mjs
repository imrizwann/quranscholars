import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

test("learner API whitelists fields, rechecks access after enrollment, and clears private caches on account change", async () => {
  const output = resolve("tests", `learner-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    stdin: { contents: `export { store } from "./src/app/store.js"; export { default as learner } from "./src/services/api/user/learnerApi.js"; export { default as payment } from "./src/services/api/user/paymentApi.js";`, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external", alias: { "@": resolve("src") },
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const previousFetch = globalThis.fetch, previousStorage = globalThis.localStorage;
  let store, learner, payment;
  try {
    globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
    ({ store, learner, payment } = await import(pathToFileURL(output)));
    const requests = [];
    let canAccess = false, fail = false, accessReads = 0, libraryReads = 0, analyticsReads = 0, progressReads = 0, completed = false;
    globalThis.fetch = async request => {
      const path = new URL(request.url).pathname;
      requests.push(request);
      if (path.includes("/courses/by-slug/")) return Response.json({ success: true, data: { course: { _id: "course-1", slug: "tajweed", title: "Archived learning", status: "Archived", sections: [] }, canManage: false } });
      if (path.endsWith("/analytics")) { analyticsReads++; return Response.json({ success: true, data: { summary: { totalEnrolledCourses: canAccess ? 1 : 0, completedCourses: 0, completedLessons: 0, coursesInProgress: 0 } } }); }
      if (path.endsWith("/progress")) { progressReads++; return Response.json({ success: true, data: { lessons: [{ lessonId: "lesson-1", sectionId: "section-1", completed }], sections: [{ sectionId: "section-1", quiz: { unlocked: false } }] } }); }
      if (path.endsWith("/watch/heartbeat")) { completed = true; return Response.json({ success: true, data: { sequence: 1, lesson: { lessonId: "lesson-1", completed: true } } }); }
      if (path.endsWith("/access")) { accessReads++; return Response.json({ success: true, data: { canAccessCourse: canAccess } }); }
      if (path.endsWith("/library")) { libraryReads++; return Response.json({ success: true, data: { courses: canAccess ? [{ id: "course-1" }] : [] } }); }
      if (path.endsWith("/free")) {
        if (fail) return Response.json({ success: false }, { status: 503 });
        canAccess = true;
        return Response.json({ success: true, data: { status: "ACTIVE", enrollmentType: "FREE" } });
      }
      return Response.json({ success: true, data: { gender: null, city: "Riyadh" } });
    };
    store.dispatch({ type: "user/setUser", payload: { _id: "buyer-1", role: "user" } });
    await store.dispatch(payment.endpoints.getCourseAccess.initiate("course-1")).unwrap();
    await store.dispatch(payment.endpoints.getLearningLibrary.initiate()).unwrap();
    await store.dispatch(learner.endpoints.getLearnerProfile.initiate()).unwrap();
    const classroom = await store.dispatch(learner.endpoints.getLearningCourse.initiate("tajweed")).unwrap();
    assert.equal(classroom.title, "Archived learning"); assert.equal(classroom.canManage, false);
    const privateRead = requests.find(request => request.url.endsWith("/api/learner/courses/by-slug/tajweed"));
    assert.equal(privateRead.credentials, "include");
    await store.dispatch(learner.endpoints.getLearnerAnalytics.initiate()).unwrap();
    await store.dispatch(learner.endpoints.updateLearnerProfile.initiate({ city: "Riyadh", gender: null, name: "forged", role: "admin", studentId: "other" })).unwrap();
    const patch = requests.find(request => request.method === "PATCH");
    assert.equal(patch.credentials, "include");
    assert.equal(patch.headers.get("x-csrf-protection"), "1");
    assert.deepEqual(await patch.json(), { city: "Riyadh", gender: null });
    fail = true;
    assert.ok((await store.dispatch(learner.endpoints.enrollFreeCourse.initiate({ courseId: "course-1" }))).error);
    assert.equal(accessReads, 1, "failed mutation does not grant/invalidate access");
    fail = false;
    await store.dispatch(learner.endpoints.enrollFreeCourse.initiate({ courseId: "course-1", studentId: "other", price: 0, status: "ACTIVE" })).unwrap();
    const post = requests.filter(request => request.method === "POST").at(-1);
    assert.equal(post.url, "https://api.example/api/learner/enrollments/free");
    assert.equal(post.credentials, "include");
    assert.equal(post.headers.get("x-csrf-protection"), "1");
    assert.deepEqual(await post.json(), { courseId: "course-1" });
    await Promise.all(store.dispatch(payment.util.getRunningQueriesThunk()));
    await Promise.all(store.dispatch(learner.util.getRunningQueriesThunk()));
    assert.equal(analyticsReads, 2, "confirmed free enrollment refreshes subscribed analytics");
    assert.equal(learner.endpoints.getLearnerAnalytics.select()(store.getState()).data.summary.totalEnrolledCourses, 1);
    assert.equal(accessReads, 2);
    assert.equal(libraryReads, 2);
    assert.equal(payment.endpoints.getCourseAccess.select("course-1")(store.getState()).data.canAccessCourse, true);
    await store.dispatch(learner.endpoints.getCourseProgress.initiate("course-1")).unwrap();
    const heartbeat = { courseId: "course-1", sectionId: "section-1", lessonId: "lesson-1", watchId: randomUUID(), sequence: 1, position: 90, event: "tick" };
    await store.dispatch(learner.endpoints.recordLessonWatch.initiate(heartbeat)).unwrap();
    await Promise.all(store.dispatch(learner.util.getRunningQueriesThunk()));
    assert.equal(progressReads, 1, "completion uses the confirmed response without another progress read"); assert.equal(analyticsReads, 3);
    const confirmed = learner.endpoints.getCourseProgress.select("course-1")(store.getState()).data;
    assert.equal(confirmed.lessons[0].completed, true, "the checkbox receives the confirmed completion immediately");
    assert.equal(confirmed.completedLessons, 1); assert.equal(confirmed.progressPercent, 100);
    assert.equal(confirmed.sections[0].quiz.unlocked, true);
    await store.dispatch(learner.endpoints.recordLessonWatch.initiate({ ...heartbeat, sequence: 2, position: 95 })).unwrap();
    await Promise.all(store.dispatch(learner.util.getRunningQueriesThunk()));
    assert.equal(progressReads, 1, "post-completion resume saves must not reload the course");
    assert.equal(analyticsReads, 3);
    const resumeWrite = requests.filter(request => request.url.endsWith("/watch/heartbeat")).at(-1);
    assert.equal(resumeWrite.keepalive, true);
    assert.equal(resumeWrite.credentials, "include");
    assert.equal(resumeWrite.headers.get("x-csrf-protection"), "1");
    store.dispatch({ type: "user/setUser", payload: { _id: "buyer-2", role: "user" } });
    for (const api of [learner, payment]) {
      assert.deepEqual(store.getState()[api.reducerPath].queries, {});
      assert.deepEqual(store.getState()[api.reducerPath].mutations, {});
    }
  } finally {
    if (store) { store.dispatch(learner.util.resetApiState()); store.dispatch(payment.util.resetApiState()); }
    globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage;
    await unlink(output);
  }
});
