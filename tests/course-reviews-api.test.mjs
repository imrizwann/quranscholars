import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

test("review writes whitelist fields, update only confirmed account data, refresh public reviews and clear on logout", async () => {
  const output = resolve("tests", `review-fixture-${randomUUID()}.mjs`);
  const compiled = await build({ stdin: { contents: 'export { store } from "./src/app/store.js"; export { default as learner } from "./src/services/api/user/learnerApi.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", alias: { "@": resolve("src") }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example" }) } });
  await writeFile(output, compiled.outputFiles[0].text);
  const previousFetch = globalThis.fetch, previousStorage = globalThis.localStorage;
  let store, learner;
  try {
    globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
    ({ store, learner } = await import(pathToFileURL(output)));
    let current = { review: null, revision: 0 }, fail = false, listReads = 0;
    const requests = [];
    globalThis.fetch = async request => {
      requests.push(request.clone());
      if (request.url.includes("/api/public/")) { listReads++; return Response.json({ success: true, data: { summary: { count: current.review ? 1 : 0 }, reviews: [] } }); }
      if (request.method !== "GET") {
        if (fail) return Response.json({ message: "Changed on another device" }, { status: 409 });
        const body = await request.json();
        current = { revision: current.revision + 1, review: request.method === "DELETE" ? null : { rating: body.rating, comment: body.comment } };
      }
      return Response.json({ success: true, data: current });
    };
    store.dispatch({ type: "user/setUser", payload: { _id: "learner-1", role: "user" } });
    await store.dispatch(learner.endpoints.getMyCourseReview.initiate("course-1")).unwrap();
    await store.dispatch(learner.endpoints.getCourseReviews.initiate({ slug: "test-course", page: 1 })).unwrap();
    await store.dispatch(learner.endpoints.saveCourseReview.initiate({ courseId: "course-1", rating: 4, comment: "Helpful course", revision: 0, userId: "forged", hiddenAt: null, approved: true })).unwrap();
    const put = requests.find(request => request.method === "PUT");
    assert.deepEqual(await put.clone().json(), { rating: 4, comment: "Helpful course", revision: 0 });
    assert.equal(put.credentials, "include"); assert.equal(put.headers.get("x-csrf-protection"), "1");
    const selected = () => learner.endpoints.getMyCourseReview.select("course-1")(store.getState()).data;
    assert.equal(selected().review.rating, 4); assert.equal(selected().revision, 1);
    await Promise.all(store.dispatch(learner.util.getRunningQueriesThunk())); assert.equal(listReads, 2);
    fail = true;
    assert((await store.dispatch(learner.endpoints.saveCourseReview.initiate({ courseId: "course-1", rating: 1, comment: "Other draft", revision: 0 }))).error);
    assert.equal(selected().review.rating, 4, "a failed write must not alter the confirmed review");
    assert.equal(listReads, 2, "a failed write must not invalidate public reviews");
    fail = false;
    await store.dispatch(learner.endpoints.deleteCourseReview.initiate({ courseId: "course-1", revision: 1, confirm: true, userId: "forged" })).unwrap();
    assert.equal(selected().review, null); assert.equal(selected().revision, 2);
    assert.deepEqual(await requests.find(request => request.method === "DELETE").clone().json(), { revision: 1, confirm: true });
    store.dispatch({ type: "user/setUser", payload: { _id: "learner-2", role: "user" } });
    assert.deepEqual(store.getState()[learner.reducerPath].queries, {});
  } finally {
    if (store) store.dispatch(learner.util.resetApiState());
    globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage;
    await unlink(output);
  }
});
