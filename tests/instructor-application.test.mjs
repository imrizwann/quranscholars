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

test("rejected application UI exposes revisions and multipart resubmission reconciles the private cache", async () => {
  const output = resolve("tests", `application-fixture-${randomUUID()}.mjs`);
  const compiled = await build({
    stdin: { contents: `export { default as api } from './src/services/api/user/instructorApplicationApi.js'; export { default as Application } from './src/pages/instructor/InstructorApplication.jsx';`, resolveDir: process.cwd() },
    bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") },
    loader: { ".css": "empty" },
    define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) },
  });
  await writeFile(output, compiled.outputFiles[0].text);
  const previousFetch = globalThis.fetch;
  let api, store;
  try {
    const module = await import(pathToFileURL(output));
    api = module.api;
    store = configureStore({ reducer: { [api.reducerPath]: api.reducer, user: (state = { user: { _id: "applicant", role: "user", name: "Amina", email: "amina@example.test" } }) => state }, middleware: defaults => defaults().concat(api.middleware) });
    let application = { id: "applicant", fullName: "Amina", email: "amina@example.test", specialization: "Tajweed", experienceYears: 0, languages: "English", biography: "A teaching background that the applicant can revise after a review.", revision: 1, status: "rejected", submittedAt: "2026-11-01T12:00:00Z", review: { reason: "Please provide a readable certificate." }, documents: [{ name: "certificate.pdf", size: 1000 }] };
    const requests = [];
    let fail = false;
    globalThis.fetch = async request => {
      requests.push(request.clone());
      if (request.method === "POST") {
        if (fail) return Response.json({ userMessage: "Please try again." }, { status: 503 });
        application = { ...application, revision: 2, status: "pending", review: null, specialization: "Quran reading" };
        return Response.json({ application });
      }
      return Response.json({ application, submissionEnabled: true, submissionInProgress: false });
    };
    await store.dispatch(api.endpoints.getMyInstructorApplication.initiate()).unwrap();
    const render = () => renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(module.Application))));
    const rejected = render();
    assert.match(rejected, /Revise application/);
    assert.match(rejected, /data-file-kind="pdf"/);
    assert.match(rejected, /Please provide a readable certificate/);
    assert.doesNotMatch(rejected, /application-form/);
    const body = new FormData();
    for (const [key, value] of Object.entries({ fullName: "Amina", specialization: "Quran reading", experienceYears: "0", languages: "English", biography: application.biography, revision: "1", retainedDocuments: "[0]" })) body.append(key, value);
    fail = true;
    assert.ok((await store.dispatch(api.endpoints.submitInstructorApplication.initiate(body))).error);
    await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()));
    assert.match(render(), /Revise application/);
    assert.equal(requests.filter(request => request.method === "POST").length, 1, "failed uploads are never replayed automatically");
    fail = false;
    await store.dispatch(api.endpoints.submitInstructorApplication.initiate(body)).unwrap();
    await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()));
    const post = requests.filter(request => request.method === "POST").at(-1);
    assert.equal(post.url, "https://api.example.test/api/instructor-applications/me");
    assert.equal(post.credentials, "include");
    assert.equal(post.headers.get("x-csrf-protection"), "1");
    const submitted = await post.formData();
    assert.equal(submitted.get("revision"), "1");
    assert.equal(submitted.get("retainedDocuments"), "[0]");
    assert.equal(submitted.get("status"), null);
    const pending = render();
    assert.match(pending, /Pending review/);
    assert.match(pending, /Quran reading/);
    assert.doesNotMatch(pending, /Revise application|Please provide a readable certificate/);
    assert.equal(api.endpoints.getMyInstructorApplication.select()(store.getState()).data.application.revision, 2);
  } finally {
    if (store) store.dispatch(api.util.resetApiState());
    globalThis.fetch = previousFetch;
    await unlink(output);
  }
});
