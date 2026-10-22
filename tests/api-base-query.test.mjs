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
