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
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { validatePublicEnvironment } from "../scripts/public-environment.mjs";

test("local paid course controls open the design preview without payment requests", async t => {
  const file = resolve("tests", `preview-fixture-${randomUUID()}.mjs`);
  t.after(() => unlink(file));
  const compiled = await build({ entryPoints: ["src/features/recorded-courses/components/CourseEnrollment.jsx"], bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ DEV: true, VITE_PAYMENT_CHECKOUT: "preview" }) } });
  await writeFile(file, compiled.outputFiles[0].text);
  const { default: Enrollment } = await import(pathToFileURL(file));
  t.mock.method(globalThis, "fetch", () => { assert.fail("Preview must not call payment APIs"); });
  for (const user of [null, { _id: "learner" }]) {
    const store = configureStore({ reducer: { user: () => ({ user }) } });
    const html = renderToStaticMarkup(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(Enrollment, { course: { price: { current: 1499 } } }))));
    assert.match(html, /href="\/checkout-preview.html"/);
    assert.match(html, /Preview checkout/);
    assert.match(html, /No order, payment, or enrollment/);
    assert.doesNotMatch(html, /Buy course|Sign in to enroll/);
  }
});

test("preview mode cannot be configured in a production build", () => {
  assert.throws(() => validatePublicEnvironment({ VITE_API_URL: "/", VITE_PUBLIC_SITE_URL: "https://lms.example.test", VITE_PAYMENT_CHECKOUT: "preview" }), /must be standard or custom/);
});
