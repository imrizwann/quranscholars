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

test("account header uses session identity; logout preserves failed sessions and clears private caches after server success", async () => {
  const output = resolve("tests", `account-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    stdin: { contents: `
      export { default as AccountMenu } from './src/layouts/WorkspaceAccountMenu.jsx';
      export { store } from './src/app/store.js';
      export { setUser } from './src/store/slices/userSlice.js';
      export { logoutSession } from './src/features/auth/logout.js';
      export { default as authApi } from './src/services/api/user/userAuthApis.js';
      export { default as avatarApi } from './src/services/api/user/fileUploadApis.js';
      export { default as applicationApi } from './src/services/api/user/instructorApplicationApi.js';
      export { default as adminApplicationsApi } from './src/services/api/admin/instructorApplicationsApi.js';
    `, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic",
    alias: { "@": resolve("src") }, loader: { ".css": "empty" },
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const previousFetch = globalThis.fetch;
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const saved = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => saved.get(key) || null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: (key) => saved.delete(key),
  } });
  let mod;
  try {
    mod = await import(pathToFileURL(output));
    const { store, setUser, authApi, avatarApi, applicationApi, adminApplicationsApi, AccountMenu, logoutSession } = mod;
    const user = { _id: "instructor-1", name: "Amina Siddiqui", email: "amina@example.test", role: "instructor" };
    store.dispatch(setUser(user));
    await store.dispatch(authApi.util.upsertQueryData("me", undefined, user));
    await store.dispatch(avatarApi.util.upsertQueryData("getAvatarUrl", user._id, { url: "https://media.example.test/avatar.webp", smallUrl: "https://media.example.test/avatar-small.webp" }));
    await store.dispatch(applicationApi.util.upsertQueryData("getMyInstructorApplication", undefined, { application: { fullName: user.name, status: "pending", documents: [{ name: "private-certificate.pdf" }] } }));
    await store.dispatch(adminApplicationsApi.util.upsertQueryData("getAdminInstructorApplication", "applicant", { application: { fullName: "Private applicant", status: "pending" } }));
    const html = renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(AccountMenu, { type: "instructor" }))));
    assert.match(html, /Account menu for Amina Siddiqui/);
    assert.match(html, /aria-haspopup="menu"/);
    assert.match(html, /avatar-small.webp/);

    let status = 503;
    globalThis.fetch = async (request) => {
      assert.equal(request.method, "POST");
      assert.equal(new URL(request.url).pathname, "/api/auth/logout");
      assert.equal(request.credentials, "include");
      assert.equal(request.headers.get("X-CSRF-Protection"), "1");
      assert.equal(store.getState().user.user._id, user._id, "identity remains until the server responds");
      return new Response(JSON.stringify({ success: status === 200 }), { status, headers: { "Content-Type": "application/json" } });
    };
    const logout = () => store.dispatch(authApi.endpoints.logout.initiate());
    await assert.rejects(logoutSession(logout, store.dispatch), { status: 503 });
    assert.equal(store.getState().user.user._id, user._id);
    assert.ok(saved.has("user"));
    assert.equal(avatarApi.endpoints.getAvatarUrl.select(user._id)(store.getState()).data.url, "https://media.example.test/avatar.webp");
    assert.equal(applicationApi.endpoints.getMyInstructorApplication.select()(store.getState()).data.application.fullName, user.name);
    status = 200;
    await logoutSession(logout, store.dispatch);
    assert.equal(store.getState().user.user, null);
    assert.equal(saved.has("user"), false);
    for (const key of ["userAuthApi", "fileUploadApi", "admissionApis", "adminAdmissionApis", "instructorCoursesApi", "paymentApi", "instructorApplicationApi", "adminInstructorApplicationsApi"]) {
      if (store.getState()[key]?.queries) assert.deepEqual(store.getState()[key].queries, {});
    }
  } finally {
    if (mod) {
      mod.store.dispatch(mod.authApi.util.resetApiState());
      mod.store.dispatch(mod.avatarApi.util.resetApiState());
      mod.store.dispatch(mod.applicationApi.util.resetApiState());
      mod.store.dispatch(mod.adminApplicationsApi.util.resetApiState());
    }
    globalThis.fetch = previousFetch;
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
    await unlink(output);
  }
});
