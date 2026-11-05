import test from "node:test";
import assert from "node:assert/strict";
import { isModuleLoadError, recoverModuleLoad } from "../src/lib/module-load-recovery.js";

const failure = new TypeError("Failed to fetch dynamically imported module: https://www.quranscholar.in/assets/Profile-old.js");
function browser() {
  const values = new Map();
  let reloads = 0;
  return { navigator: { onLine: true }, location: { reload() { reloads++; } },
    sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    get reloads() { return reloads; } };
}

test("module errors are recognized across browsers without treating ordinary application or API failures as outdated chunks", () => {
  for (const message of [failure.message, "Importing a module script failed.", "error loading dynamically imported module: /assets/chunk.js", "Unable to preload CSS for /assets/page.css"]) assert.equal(isModuleLoadError(new TypeError(message)), true);
  for (const error of [null, {}, new TypeError("Failed to fetch"), new Error("Could not verify your account"), new TypeError("Cannot read properties of undefined"), { status: 403, data: { message: "Access denied" } }]) assert.equal(isModuleLoadError(error), false);
});

test("one refresh recovers the current URL and a persistent per-tab guard prevents repeated failures or remounts from looping", () => {
  const tab = browser();
  assert.equal(recoverModuleLoad(failure, tab, 100_000), true);
  assert.equal(tab.reloads, 1);
  assert.equal(recoverModuleLoad(failure, tab, 100_001), false);
  assert.equal(recoverModuleLoad(new Error("Unable to preload CSS for /assets/other.css"), tab, 100_002), false);
  const nextDocument = { ...tab, location: tab.location };
  assert.equal(recoverModuleLoad(failure, nextDocument, 110_000), false);
  assert.equal(tab.reloads, 1);
  assert.equal(recoverModuleLoad(failure, tab, 161_000), true);
  assert.equal(tab.reloads, 2);
  assert.equal(recoverModuleLoad(failure, browser(), 110_000), true, "another browser tab can recover independently");
});

test("offline users and ordinary route errors are left on the recovery screen without automatic reloads", () => {
  const tab = browser(); tab.navigator.onLine = false;
  assert.equal(recoverModuleLoad(failure, tab), false); assert.equal(tab.reloads, 0);
  tab.navigator.onLine = true;
  assert.equal(recoverModuleLoad(new Error("Unexpected application error"), tab), false);
  assert.equal(recoverModuleLoad(failure, tab), true, "going online allows recovery without an offline attempt spending the guard");
});

test("unavailable storage disables automatic recovery rather than risking a reload loop", () => {
  const tab = browser();
  Object.defineProperty(tab, "sessionStorage", { get() { throw new Error("Storage is blocked"); } });
  assert.equal(recoverModuleLoad(failure, tab), false); assert.equal(tab.reloads, 0);
  const writeBlocked = browser(); writeBlocked.sessionStorage.setItem = () => { throw new Error("Quota exceeded"); };
  assert.equal(recoverModuleLoad(failure, writeBlocked), false); assert.equal(writeBlocked.reloads, 0);
});
