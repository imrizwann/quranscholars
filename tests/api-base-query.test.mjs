import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

test("shared API requests include cookies and CSRF headers without breaking multipart uploads", async () => {
  const output = resolve("tests", `api-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    entryPoints: ["src/services/api/base-query.js"], bundle: true, write: false,
    format: "esm", platform: "node", packages: "external",
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const originalFetch = globalThis.fetch;
  const requests = [];
  try {
    globalThis.fetch = async req => { requests.push(req); return Response.json({ ok: true }); };
    const { apiBaseQuery } = await import(pathToFileURL(output));
    const api = { signal: new AbortController().signal, getState: () => ({}) };
    await apiBaseQuery("/api/auth/me", api, {});
    await apiBaseQuery({ url: "/api/auth/login", method: "POST", body: { email: "test@example.com", password: "example-password" } }, api, {});
    const form = new FormData();
    form.append("file", new Blob(["image"], { type: "image/png" }), "avatar.png");
    await apiBaseQuery({ url: "/api/upload/avatar", method: "POST", body: form }, api, {});
    assert.equal(requests.length, 3);
    for (const req of requests) { assert.equal(req.credentials, "include"); assert.equal(new URL(req.url).origin, "https://api.example"); }
    assert.equal(requests[0].headers.get("x-csrf-protection"), null);
    assert.equal(requests[1].headers.get("x-csrf-protection"), "1");
    assert.equal(requests[2].headers.get("x-csrf-protection"), "1");
    assert.match(requests[2].headers.get("content-type"), /^multipart\/form-data; boundary=/);
  } finally { globalThis.fetch = originalFetch; await unlink(output); }
});

test("temporary course/playback reads retry, while failed writes and permission denials are never replayed", async () => {
  const output = resolve("tests", `retry-fixture-${randomUUID()}.mjs`);
  const compiled = await build({ entryPoints: ["src/services/api/base-query.js"], bundle: true, write: false, format: "esm", platform: "node", packages: "external", define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example" }) } });
  await writeFile(output, compiled.outputFiles[0].text);
  const previousFetch = globalThis.fetch;
  try {
    const { apiBaseQuery } = await import(pathToFileURL(output));
    const api = { signal: new AbortController().signal, getState: () => ({}), dispatch() {} };
    for (const url of ["/api/public/recorded-courses", "/api/recorded-courses/course/sections/section/lessons/lesson/playback"]) {
      let attempts = 0;
      globalThis.fetch = async () => ++attempts === 1 ? Response.json({ code: "DATABASE_UNAVAILABLE" }, { status: 503 }) : Response.json({ success: true, data: {} });
      const result = await apiBaseQuery(url, api, { retryTransientRead: true });
      assert(result.data); assert.equal(attempts, 2);
    }
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      let attempts = 0;
      globalThis.fetch = async () => { attempts++; return Response.json({ code: "DATABASE_UNAVAILABLE" }, { status: 503 }); };
      const result = await apiBaseQuery({ url: "/api/payments/checkout", method, body: {} }, api, { retryTransientRead: true });
      assert.equal(result.error.status, 503); assert.equal(attempts, 1);
    }
    for (const status of [403, 404]) {
      let attempts = 0;
      globalThis.fetch = async () => { attempts++; return Response.json({}, { status }); };
      assert.equal((await apiBaseQuery("/api/learner/courses/course", api, { retryTransientRead: true })).error.status, status);
      assert.equal(attempts, 1);
    }
    let attempts = 0;
    globalThis.fetch = async () => { attempts++; return Response.json({}, { status: 503 }); };
    assert.equal((await apiBaseQuery("/api/public/recorded-courses", api, { retryTransientRead: true })).error.status, 503);
    assert.equal(attempts, 3, "an ongoing outage is surfaced after bounded retries");
  } finally { globalThis.fetch = previousFetch; await unlink(output); }
});
