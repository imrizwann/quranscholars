import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { Provider, useSelector } from "react-redux";
import { readNoteDraft, writeNoteDraft, clearNoteDraft } from "../src/features/recorded-courses/services/lessonNoteDraft.js";
import { readLessonStudy, saveLessonStudy } from "../src/features/recorded-courses/services/lessonStudyStorage.js";

async function fixture(run) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "https://frontend.example.test", pretendToBeVisual: true });
  const globals = ["window", "document", "navigator", "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "HTMLButtonElement", "Document", "ShadowRoot", "MutationObserver", "FormData", "Event", "MouseEvent", "localStorage"];
  const previousGlobals = new Map(globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of globals) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window); globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = query => ({ matches: query.includes("prefers-reduced-motion"), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.HTMLElement.prototype.getAnimations = () => [];
  const { createRoot } = await import("react-dom/client");
  const { MemoryRouter } = await import("react-router-dom");
  const output = resolve("tests", `lesson-notes-fixture-${randomUUID()}.mjs`), previousFetch = globalThis.fetch;
  let root, store, api;
  try {
    const built = await build({ stdin: { contents: `export {default as Notes} from './src/features/recorded-courses/components/LessonNotes.jsx'; export {default as api} from './src/services/api/user/learnerApi.js'; export {store} from './src/app/store.js';`, resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic", alias: { "@": resolve("src") }, loader: { ".css": "empty" }, define: { "import.meta.env": JSON.stringify({ VITE_API_URL: "https://api.example.test" }) } });
    await writeFile(output, built.outputFiles[0].text); const mod = await import(pathToFileURL(output)); store = mod.store; api = mod.api;
    const remote = new Map(), requests = [], holds = [];
    const empty = () => ({ content: "", revision: 0, updatedAt: null, deleted: false });
    const key = (account, lesson = "lesson-one") => `${account}/${lesson}`;
    let hold = false, drop = false, deny = false;
    const writes = () => requests.filter(item => item.method !== "GET");
    globalThis.fetch = async request => {
      const path = new URL(request.url).pathname, lesson = path.split("/").at(-2), account = store.getState().user.user?._id;
      const body = request.method === "GET" ? null : await request.json(); requests.push({ method: request.method, path, body, account, csrf: request.headers.get("X-CSRF-Protection") });
      if (deny) return Response.json({ userMessage: "Course access could not be verified." }, { status: 403 });
      if (request.method !== "GET" && hold) { hold = false; await new Promise(done => holds.push(done)); }
      let value = remote.get(key(account, lesson)) || empty();
      if (request.method !== "GET") {
        const deleting = request.method === "DELETE";
        if (value.revision !== body.revision && !(deleting ? value.deleted : !value.deleted && value.content === body.content)) return Response.json({ userMessage: "These notes were updated on another device. Load the latest copy before saving again." }, { status: 409 });
        if (!(deleting ? value.deleted : !value.deleted && value.content === body.content)) {
          value = { content: deleting ? "" : body.content, revision: value.revision + 1, updatedAt: new Date().toISOString(), deleted: deleting }; remote.set(key(account, lesson), value);
        }
        if (drop) { drop = false; throw new TypeError("Network response lost after commit"); }
      }
      return Response.json({ success: true, data: value });
    };
    await act(async () => { store.dispatch({ type: "user/setUser", payload: { _id: "learner-one", role: "user" } }); });
    const Harness = ({ lesson = "lesson-one", active = true }) => {
      const user = useSelector(state => state.user.user);
      return React.createElement(mod.Notes, { userId: user?._id, courseId: "course", lesson: { id: lesson, sectionId: "section", title: `Title ${lesson}` }, active, getTime: () => 123 });
    };
    const mount = async (props = {}) => {
      if (!root) root = createRoot(document.getElementById("root"));
      await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, null, React.createElement(Harness, props)))));
    };
    const unmount = async () => { if (root) { await act(async () => root.unmount()); root = null; } };
    const settle = async predicate => { for (let attempt = 0; attempt < 250; attempt++) { await act(async () => { await new Promise(done => setTimeout(done, 10)); }); if (predicate()) return; } assert.fail(document.body.textContent); };
    const editor = () => document.querySelector('textarea[name="lesson-notes"]');
    const input = async text => act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set.call(editor(), text); editor().dispatchEvent(new dom.window.Event("input", { bubbles: true })); });
    const click = async (text, dialog = false) => {
      const parent = dialog ? document.querySelector('[role="dialog"]') : document;
      const button = [...parent.querySelectorAll("button")].find(node => node.textContent.trim() === text); assert.ok(button, `Missing ${text}`);
      await act(async () => button.click());
    };
    const confirm = async text => { await settle(() => document.querySelector('[role="dialog"]')); await click(text, true); };
    await run({ dom, store, api, remote, key, requests, writes, holds, empty, editor, input, click, confirm, mount, unmount, settle, setHold: () => { hold = true; }, dropNext: () => { drop = true; }, setDeny: value => { deny = value; } });
  } finally {
    if (root) await act(async () => root.unmount()); if (store && api) store.dispatch(api.util.resetApiState());
    globalThis.fetch = previousFetch; await unlink(output).catch(() => {}); dom.window.close();
    for (const [key, descriptor] of previousGlobals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
}

test("account notes recover browser text explicitly, serialize autosaves, retry lost responses, handle conflicts and confirm deletion", { timeout: 30_000 }, async () => fixture(async t => {
  const actor = "learner-one", scope = [actor, "course", "lesson-one"];
  t.remote.set(t.key(actor), { content: "Account copy", revision: 2, updatedAt: null, deleted: false });
  saveLessonStudy(...scope, { notes: "Old browser copy", position: 30 });
  await t.mount(); await t.settle(() => document.body.textContent.includes("Browser notes found"));
  assert.equal(t.editor().value, "Account copy"); assert.equal(t.editor().disabled, true); assert.equal(t.writes().length, 0);
  await t.click("Use browser copy"); await t.confirm("Use browser copy");
  await t.settle(() => t.editor().value === "Old browser copy");
  t.setHold(); await t.click("Save now"); await t.settle(() => t.holds.length === 1);
  assert.match(document.body.textContent, /Saving notes/);
  await t.input("Old browser copy with more detail");
  await act(async () => t.holds.shift()());
  await t.settle(() => t.remote.get(t.key(actor)).content === "Old browser copy with more detail" && document.body.textContent.includes("Saved to your account"));
  assert.deepEqual(t.writes().slice(0, 2).map(item => item.body.revision), [2, 3]);
  assert.ok(t.writes().every(item => item.csrf === "1" && Object.keys(item.body).sort().join() === "content,revision"));
  assert.equal(readNoteDraft(...scope), null); assert.equal(readLessonStudy(...scope).position, 30);
  await t.unmount(); localStorage.clear(); await t.mount();
  await t.settle(() => t.editor().value === "Old browser copy with more detail"); assert.doesNotMatch(document.body.textContent, /Browser notes found/);

  t.dropNext(); await t.input("A save whose response is lost"); await t.click("Save now");
  await t.settle(() => document.body.textContent.includes("Retry save"));
  assert.equal(readNoteDraft(...scope).content, "A save whose response is lost");
  const committedRevision = t.remote.get(t.key(actor)).revision;
  await t.click("Retry save"); await t.settle(() => document.body.textContent.includes("Saved to your account"));
  assert.equal(t.remote.get(t.key(actor)).revision, committedRevision, "retry acknowledges the same write without another version");

  await t.input("My unconfirmed draft");
  const previous = t.remote.get(t.key(actor)); t.remote.set(t.key(actor), { ...previous, content: "Changed on another device", revision: previous.revision + 1 });
  await t.click("Save now"); await t.settle(() => document.body.textContent.includes("Load latest notes"));
  assert.equal(t.editor().value, "My unconfirmed draft"); assert.equal(readNoteDraft(...scope).content, "My unconfirmed draft");
  await t.click("Load latest notes"); await t.confirm("Load latest notes");
  await t.settle(() => t.editor().value === "Changed on another device");

  await t.click("Delete notes"); await t.confirm("Cancel"); assert.equal(t.writes().filter(item => item.method === "DELETE").length, 0);
  await t.click("Delete notes");
  const beforeDelete = t.remote.get(t.key(actor));
  t.remote.set(t.key(actor), { ...beforeDelete, content: "Edited while deletion was being confirmed", revision: beforeDelete.revision + 1 });
  await act(async () => { await t.store.dispatch(t.api.endpoints.getLessonNote.initiate({ courseId: "course", sectionId: "section", lessonId: "lesson-one", accountId: actor }, { forceRefetch: true, subscribe: false })).unwrap(); });
  await t.settle(() => t.editor().value === "Edited while deletion was being confirmed");
  await t.confirm("Delete notes"); await t.settle(() => document.body.textContent.includes("another device"));
  assert.equal(t.remote.get(t.key(actor)).deleted, false, "confirmation cannot silently delete a newer edit");
  await t.click("Cancel", true);
  await t.click("Delete notes"); t.setHold(); await t.confirm("Delete notes"); await t.settle(() => t.holds.length === 1);
  assert.match(document.body.textContent, /Deleting notes/); await act(async () => t.holds.shift()());
  await t.settle(() => document.body.textContent.includes("Notes deleted from your account") && !document.querySelector('[role="dialog"]'));
  assert.equal(t.editor().value, ""); assert.equal(readNoteDraft(...scope), null);
  assert.equal(t.remote.get(t.key(actor)).deleted, true);
  const writesBefore = t.writes().length;
  await t.unmount(); saveLessonStudy(...scope, { notes: "Outdated notes from an older device" }); await t.mount();
  await t.settle(() => document.body.textContent.includes("Your account notes were deleted"));
  assert.equal(t.editor().value, ""); assert.equal(t.writes().length, writesBefore, "a deleted note is never reimported automatically");
  await t.click("Keep account notes"); await t.confirm("Keep account notes");
  await t.settle(() => !document.body.textContent.includes("Browser notes found")); assert.equal(readNoteDraft(...scope), null);
}));

test("notes load on demand, flush lesson changes, isolate accounts and keep failed local-storage saves visible", { timeout: 20_000 }, async () => fixture(async t => {
  await t.mount({ active: false }); assert.equal(t.requests.length, 0);
  await t.mount(); await t.settle(() => !t.editor().disabled);
  await t.click("Add timestamp"); assert.equal(t.editor().value, "[2:03] ");
  t.setHold(); await t.click("Save now"); await t.settle(() => t.holds.length === 1);
  t.remote.set(t.key("learner-two"), { content: "Account two private notes", revision: 1, updatedAt: null, deleted: false });
  await act(async () => t.store.dispatch({ type: "user/setUser", payload: { _id: "learner-two", role: "user" } }));
  await t.settle(() => t.editor().value === "Account two private notes");
  await act(async () => t.holds.shift()());
  assert.equal(t.editor().value, "Account two private notes");
  assert.ok(!t.writes().some(item => item.account === "learner-two" && item.body.content === "[2:03] "));
  await t.input("Saved when I switch lessons"); await t.mount({ lesson: "lesson-two" });
  await t.settle(() => t.remote.get(t.key("learner-two"))?.content === "Saved when I switch lessons" && !t.editor().disabled);
  assert.equal(t.editor().value, "");
  t.setDeny(true); await t.mount({ lesson: "lesson-three" });
  await t.settle(() => document.querySelector('[role="alert"]')); assert.equal(t.editor().disabled, true);
  t.setDeny(false); await t.click("Try again"); await t.settle(() => !t.editor().disabled);
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null, setItem() { throw new Error("Storage unavailable"); }, removeItem() { throw new Error("Storage unavailable"); } };
  try {
    await t.input("Account save works without browser storage"); assert.match(document.body.textContent, /browser backup is unavailable/);
    await t.click("Save now"); await t.settle(() => document.body.textContent.includes("Saved to your account"));
    assert.equal(t.remote.get(t.key("learner-two", "lesson-three")).content, "Account save works without browser storage");
  } finally { globalThis.localStorage = previous; }
}));

test("recovering browser notes cannot replace an account edit made while confirmation is open", { timeout: 15_000 }, async () => fixture(async t => {
  t.remote.set(t.key("learner-one"), { content: "Account copy", revision: 1, updatedAt: null, deleted: false });
  saveLessonStudy("learner-one", "course", "lesson-one", { notes: "Recovered browser copy" });
  await t.mount(); await t.settle(() => document.body.textContent.includes("Browser notes found"));
  await t.click("Use browser copy");
  t.remote.set(t.key("learner-one"), { content: "Newer account copy", revision: 2, updatedAt: null, deleted: false });
  await act(async () => { await t.store.dispatch(t.api.endpoints.getLessonNote.initiate({ courseId: "course", sectionId: "section", lessonId: "lesson-one", accountId: "learner-one" }, { forceRefetch: true, subscribe: false })).unwrap(); });
  await t.settle(() => t.editor().value === "Newer account copy");
  await t.confirm("Use browser copy"); await t.settle(() => !document.querySelector('[role="dialog"]'));
  assert.equal(t.writes().length, 0); assert.equal(t.remote.get(t.key("learner-one")).content, "Newer account copy");
  assert.match(document.body.textContent, /changed while you were reviewing/);
  await t.click("Keep account notes"); await t.confirm("Keep account notes");
  assert.equal(t.editor().value, "Newer account copy"); assert.doesNotMatch(document.body.textContent, /changed while you were reviewing/);
}));

test("draft storage is scoped, rejects unsupported values, and clearing notes preserves video resume data", t => {
  const previous = globalThis.localStorage, values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  t.after(() => { globalThis.localStorage = previous; });
  saveLessonStudy("a", "c", "l", { notes: "Legacy copy", position: 120 }); assert.equal(readNoteDraft("a", "c", "l").content, "Legacy copy");
  assert.equal(writeNoteDraft("a", "c", "l", { content: "New draft", revision: 3, playbackToken: "never-store" }), true);
  assert.deepEqual(readNoteDraft("a", "c", "l"), { content: "New draft", revision: 3 }); assert.equal(readNoteDraft("b", "c", "l"), null);
  assert.doesNotMatch([...values.values()].join(), /never-store/);
  assert.equal(clearNoteDraft("a", "c", "l", { content: "An older save", revision: 2 }), true);
  assert.equal(readNoteDraft("a", "c", "l").content, "New draft", "acknowledging an old save cannot erase a newer browser draft");
  assert.equal(writeNoteDraft("a", "c", "l", { content: "x".repeat(10001), revision: 0 }), false);
  assert.equal(clearNoteDraft("a", "c", "l"), true); assert.equal(readNoteDraft("a", "c", "l"), null); assert.equal(readLessonStudy("a", "c", "l").position, 120);
});
