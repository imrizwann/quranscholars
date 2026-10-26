import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { configureStore } from "@reduxjs/toolkit";

test("payment hooks use authenticated backend contracts and clear data across accounts", async () => {
  const output = resolve("tests", `payment-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    stdin: { contents: `export { default as api } from "./src/services/api/user/paymentApi.js";
      export { paymentSessionMiddleware } from "./src/features/payments/paymentSessionMiddleware.js";`, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external",
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const previousFetch = globalThis.fetch;
  let store;
  try {
    const { api, paymentSessionMiddleware } = await import(pathToFileURL(output));
    const requests = [];
    globalThis.fetch = async (request) => {
      requests.push(request);
      return Response.json({ success: true, data: request.method === "POST" ? { intentId: "intent-1", state: "pending" } : { canAccessCourse: false } });
    };
    store = configureStore({
      reducer: { [api.reducerPath]: api.reducer, user: (state = { user: { _id: "buyer-1", role: "user" } }, action) => action.type === "user/setUser" ? { user: action.payload } : state },
      middleware: (defaults) => defaults().concat(paymentSessionMiddleware, api.middleware),
    });
    const idempotencyKey = randomUUID();
    const checkout = await store.dispatch(api.endpoints.createCourseCheckout.initiate({ courseId: "course-1", idempotencyKey, amountMinor: 1, userId: "attacker", paymentStatus: "completed" })).unwrap();
    assert.equal(checkout.state, "pending");
    assert.equal(checkout.canAccessCourse, undefined);
    assert.equal(requests[0].url, "https://api.example/api/payments/checkout");
    assert.equal(requests[0].credentials, "include");
    assert.equal(requests[0].headers.get("x-csrf-protection"), "1");
    assert.deepEqual(await requests[0].json(), { courseId: "course-1", idempotencyKey });
    await store.dispatch(api.endpoints.getCoursePaymentStatus.initiate("intent-1")).unwrap();
    await store.dispatch(api.endpoints.getCourseAccess.initiate("course-1")).unwrap();
    assert.equal(requests[1].url, "https://api.example/api/payments/intent-1");
    assert.equal(requests[2].url, "https://api.example/api/purchases/course-1/access");
    assert.equal(Object.keys(store.getState()[api.reducerPath].queries).length, 2);
    store.dispatch({ type: "user/setUser", payload: { _id: "buyer-2", role: "user" } });
    assert.equal(Object.keys(store.getState()[api.reducerPath].queries).length, 0);
    assert.equal(Object.keys(store.getState()[api.reducerPath].mutations).length, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (store) store.dispatch({ type: "paymentApi/resetApiState" });
    await unlink(output);
  }
});
