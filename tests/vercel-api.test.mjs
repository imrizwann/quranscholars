import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

test("same-origin Vercel API requests preserve cookies, CSRF, paths, and playback authorization", async () => {
  const output = resolve("tests", `vercel-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    entryPoints: ["src/services/api/base-query.js"], bundle: true, write: false,
    format: "esm", platform: "node", packages: "external",
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "/" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const originalFetch = globalThis.fetch, OriginalRequest = globalThis.Request;
  const origin = "https://www.quranscholar.in";
  const requests = [];
  try {
    // Browser Request resolves relative URLs against the current page's origin.
    globalThis.Request = class extends OriginalRequest {
      constructor(input, init) { super(typeof input === "string" ? new URL(input, origin) : input, init); }
    };
    globalThis.fetch = async req => { requests.push(req); return Response.json({ success: true }); };
    const { apiBaseQuery } = await import(pathToFileURL(output));
    const api = { signal: new AbortController().signal, getState: () => ({}) };
    await apiBaseQuery({ url: "api/auth/login", method: "POST", body: { email: "test@example.com", password: "test-password" } }, api, {});
    await apiBaseQuery({ url: "/api/auth/refresh", method: "POST" }, api, {});
    await apiBaseQuery("/api/learning/courses/course/sections/section/lessons/lesson/playback", api, {});
    assert.equal(requests[0].url, `${origin}/api/auth/login`);
    assert.equal(requests[1].url, `${origin}/api/auth/refresh`);
    assert.equal(requests[2].url, `${origin}/api/learning/courses/course/sections/section/lessons/lesson/playback`);
    for (const req of requests) {
      assert.equal(req.credentials, "include");
      assert.equal(req.headers.get("x-playback-service"), null, "server secret is never a browser header");
    }
    assert.equal(requests[0].headers.get("x-csrf-protection"), "1");
    assert.equal(requests[1].headers.get("x-csrf-protection"), "1");
    const config = JSON.parse(await readFile("vercel.json", "utf8"));
    assert.equal(config.rewrites[0].source, "/api/:path*");
    assert.equal(config.rewrites[0].destination, "https://quranscholars-apis.vercel.app/api/:path*");
    assert.equal(config.rewrites.at(-1).destination, "/index.html", "SPA fallback follows the API rewrite");
    const headers = Object.fromEntries(config.headers.find(rule => rule.source === "/api/:path*").headers.map(({ key, value }) => [key, value]));
    assert.equal(headers["x-vercel-enable-rewrite-caching"], "0");
    assert.match(headers["Cache-Control"], /no-store/);
    assert.equal(headers["Vercel-CDN-Cache-Control"], "no-store");
  } finally { globalThis.fetch = originalFetch; globalThis.Request = OriginalRequest; await unlink(output); }
});
