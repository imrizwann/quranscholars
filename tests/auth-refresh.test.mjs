import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const waitFor = async (condition) => {
  for (let i = 0; i < 100; i++) { if (condition()) return; await new Promise((done) => setTimeout(done, 5)); }
  assert.fail("Request did not reach expected state");
};
test("shared session renewal", async (t) => {
  const file = resolve("tests", `auth-refresh-fixture-${randomUUID()}.mjs`);
  const compiled = await build({ entryPoints: ["src/services/api/base-query.js"], bundle: true, write: false, format: "esm", platform: "node", packages: "external", define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
  await writeFile(file, compiled.outputFiles[0].text);
  const originalFetch = globalThis.fetch;
  try {
    const { apiBaseQuery, renewSession, invalidateAuthRequests } = await import(pathToFileURL(file));
    const user = { _id: "owner", name: "Instructor", role: "instructor", expires: Date.now() + 3600_000 };
    const context = () => { const actions = []; return { actions, api: { signal: new AbortController().signal, endpoint: "test", type: "query", dispatch: (action) => actions.push(action), getState: () => ({ user: { user } }) } }; };

    await t.test("initial account verification recovers from a connection failure followed by database unavailability", async () => {
      const { api } = context(); let attempts = 0;
      globalThis.fetch = async (request) => {
        assert.equal(new URL(request.url).pathname, "/api/auth/me");
        attempts++;
        if (attempts === 1) throw new TypeError("Failed to fetch");
        if (attempts === 2) return Response.json({}, { status: 503 });
        return Response.json(user);
      };
      assert.equal((await apiBaseQuery("/api/auth/me", api)).data._id, user._id);
      assert.equal(attempts, 3);
    });

    await t.test("persistent account outages stop after three attempts without signing out", async () => {
      const { api, actions } = context(); let attempts = 0;
      globalThis.fetch = async () => { attempts++; return Response.json({}, { status: 503 }); };
      assert.equal((await apiBaseQuery("/api/auth/me", api)).error.status, 503);
      assert.equal(attempts, 3);
      assert.deepEqual(actions, []);
    });

    await t.test("login connection failures are not replayed", async () => {
      const { api } = context(); let attempts = 0;
      globalThis.fetch = async () => { attempts++; throw new TypeError("Failed to fetch"); };
      assert.equal((await apiBaseQuery({ url: "/api/auth/login", method: "POST", body: {} }, api)).error.status, "FETCH_ERROR");
      assert.equal(attempts, 1);
    });

    await t.test("concurrent expired API requests share one renewal and retry their original bodies once", async () => {
      const { api, actions } = context(); let renewed = false, refreshes = 0;
      const attempts = [];
      globalThis.fetch = async (request) => {
        const path = new URL(request.url).pathname;
        assert.equal(request.credentials, "include");
        if (path === "/api/auth/refresh") {
          assert.equal(request.headers.get("x-csrf-protection"), "1");
          refreshes++; renewed = true; return Response.json(user);
        }
        if (path === "/api/auth/me") return Response.json({}, { status: 401 });
        attempts.push(await request.json());
        return Response.json(renewed ? { success: true } : {}, { status: renewed ? 200 : 401 });
      };
      const results = await Promise.all(Array.from({ length: 6 }, (_, i) => apiBaseQuery({ url: "/api/instructor/recorded-courses/course/trailer/process", method: "POST", body: { uploadId: `upload-${i}` } }, api)));
      assert.equal(refreshes, 1);
      assert.ok(results.every((result) => result.data.success));
      assert.equal(attempts.length, 12);
      for (let i = 0; i < 6; i++) assert.equal(attempts.filter((body) => body.uploadId === `upload-${i}`).length, 2);
      assert.equal(actions.filter((action) => action.type === "user/setUser").length, 1);
    });

    await t.test("a temporary renewal failure preserves the user and never replays the write", async () => {
      const { api, actions } = context(); let writes = 0;
      globalThis.fetch = async (request) => {
        const path = new URL(request.url).pathname;
        if (path.endsWith("/refresh")) return Response.json({}, { status: 503 });
        if (!path.endsWith("/me")) writes++;
        return Response.json({}, { status: 401 });
      };
      const result = await apiBaseQuery({ url: "/api/course", method: "PATCH", body: { title: "Changed" } }, api);
      assert.equal(result.error.status, 503); assert.equal(writes, 1); assert.deepEqual(actions, []);
    });

    await t.test("a definitively expired refresh session clears authentication", async () => {
      const { api, actions } = context();
      globalThis.fetch = async () => Response.json({}, { status: 401 });
      const result = await apiBaseQuery("/api/course", api);
      assert.equal(result.error.status, 401);
      assert.deepEqual(actions, [{ type: "user/setUser", payload: null }]);
    });

    await t.test("invalid login and delete-profile passwords never trigger refresh or request replay", async () => {
      const { api, actions } = context(); const paths = [];
      globalThis.fetch = async (request) => { paths.push(new URL(request.url).pathname); return Response.json({}, { status: 401 }); };
      for (const path of ["login", "delete_profile"]) await apiBaseQuery({ url: `/api/auth/${path}`, method: "POST", body: { password: "wrong" } }, api);
      assert.deepEqual(paths, ["/api/auth/login", "/api/auth/delete_profile"]); assert.deepEqual(actions, []);
    });

    await t.test("cancelled consumers do not cancel a shared refresh", async () => {
      const one = context(), two = context(); const controller = new AbortController(); one.api.signal = controller.signal;
      let resolveRefresh, refreshSignal;
      globalThis.fetch = async (request) => {
        if (new URL(request.url).pathname.endsWith("/refresh")) {
          refreshSignal = request.signal;
          return new Promise((done) => { resolveRefresh = () => done(Response.json(user)); });
        }
        return Response.json({}, { status: 401 });
      };
      const first = renewSession(one.api); await waitFor(() => resolveRefresh);
      const second = renewSession(two.api); controller.abort();
      assert.equal(refreshSignal.aborted, false);
      resolveRefresh();
      assert.equal((await first).data._id, user._id); assert.equal((await second).data._id, user._id);
    });

    await t.test("logout waits for pending renewal and prevents that renewal from restoring user state", async () => {
      const { api, actions } = context(); let resolveRefresh; const paths = [];
      globalThis.fetch = async (request) => {
        const path = new URL(request.url).pathname; paths.push(path);
        if (path.endsWith("/refresh")) return new Promise((done) => { resolveRefresh = () => done(Response.json(user)); });
        return Response.json({}, { status: path.endsWith("/me") ? 401 : 200 });
      };
      const pending = renewSession(api); await waitFor(() => resolveRefresh);
      const logout = apiBaseQuery({ url: "/api/auth/logout", method: "POST" }, api);
      resolveRefresh(); await pending; await logout;
      assert.equal(paths.at(-1), "/api/auth/logout"); assert.deepEqual(actions, []);
    });

    await t.test("a session renewed by another tab is reused without rotating again", async () => {
      const { api } = context(); const paths = [];
      globalThis.fetch = async (request) => { paths.push(new URL(request.url).pathname); return Response.json(user); };
      assert.equal((await renewSession(api)).data._id, user._id);
      assert.deepEqual(paths, ["/api/auth/me"]);
    });

    await t.test("a late account response cannot restore a session after another tab signs out", async () => {
      const { api, actions } = context(); let complete;
      globalThis.fetch = async () => new Promise((done) => { complete = () => done(Response.json(user)); });
      const pending = apiBaseQuery("/api/auth/me", api);
      await waitFor(() => complete);
      invalidateAuthRequests(); complete();
      assert.equal((await pending).error.status, 401);
      assert.deepEqual(actions, []);
    });
  } finally { globalThis.fetch = originalFetch; await unlink(file); }
});
