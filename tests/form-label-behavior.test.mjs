import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import React, { act } from "react";
import { JSDOM } from "jsdom";

test("ordinary labels keep their names without activating fields; controls and intentional label actions remain usable", async () => {
  const dom = new JSDOM(`<html><body><div id="root"></div>
    <label id="title-label" for="title">Course title</label><input id="title" name="title">
    <label id="wrapped-label">Description<textarea name="description"></textarea><span id="hint">Helpful text</span><button id="clear" type="button">Clear</button></label>
    <label id="select-label" for="level">Level</label><select id="level"><option>Beginner</option></select>
    <label id="category-label" for="category">Category</label><button id="category" type="button">Choose a category</button>
    <label id="checkbox-label">Agree<input id="checkbox" type="checkbox"></label>
    <label id="radio-label" for="radio">Answer</label><input id="radio" type="radio" name="answer">
    <label id="upload-label" for="upload">Choose file</label><input id="upload" type="file">
    <label id="button-label" for="action">Upload</label><input id="action" type="button">
    <label id="disabled-label">Disabled<input id="disabled" type="checkbox" disabled></label>
    </body></html>`, { url: "http://localhost:3001", pretendToBeVisual: true });
  for (const key of ["window", "document", "navigator", "Node", "Element", "HTMLElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom.window : dom.window[key] });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const file = resolve("tests", `form-label-fixture-${randomUUID()}.mjs`);
  let root;
  try {
    const compiled = await build({ entryPoints: ["src/components/forms/FormLabelBehavior.jsx"], bundle: true, write: false, format: "esm", platform: "node", packages: "external", jsx: "automatic" });
    await writeFile(file, compiled.outputFiles[0].text);
    const { default: Behavior } = await import(pathToFileURL(file));
    const { createRoot } = await import("react-dom/client");
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(React.createElement(Behavior)));
    const click = id => document.getElementById(id).dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    for (const id of ["title-label", "wrapped-label", "hint", "select-label", "category-label"]) assert.equal(click(id), false, `${id} must not activate its field`);
    assert.equal(document.getElementById("title-label").control, document.getElementById("title"));
    assert.equal(document.getElementById("title").labels[0].textContent, "Course title");
    assert.equal(click("title"), true);
    assert.equal(document.querySelector("textarea").dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })), true);
    let categoryClicks = 0, clearClicks = 0, uploadClicks = 0, actionClicks = 0;
    document.getElementById("category").addEventListener("click", () => categoryClicks++);
    document.getElementById("clear").addEventListener("click", () => clearClicks++);
    document.getElementById("upload").addEventListener("click", () => uploadClicks++);
    document.getElementById("action").addEventListener("click", () => actionClicks++);
    click("category-label"); assert.equal(categoryClicks, 0);
    click("category"); assert.equal(categoryClicks, 1);
    click("clear"); assert.equal(clearClicks, 1);
    click("checkbox-label"); assert.equal(document.getElementById("checkbox").checked, true);
    click("checkbox"); assert.equal(document.getElementById("checkbox").checked, false);
    click("radio-label"); assert.equal(document.getElementById("radio").checked, true);
    click("upload-label"); assert.equal(uploadClicks, 1);
    click("button-label"); assert.equal(actionClicks, 1);
    click("disabled-label"); assert.equal(document.getElementById("disabled").checked, false);
    await act(async () => root.unmount()); root = null;
    click("category-label"); assert.equal(categoryClicks, 2, "unmount removes the global listener");
  } finally {
    if (root) await act(async () => root.unmount());
    await unlink(file).catch(() => {}); dom.window.close();
  }
});
