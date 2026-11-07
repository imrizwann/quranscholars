import test from "node:test";
import assert from "node:assert/strict";
import { filePresentation } from "../src/components/files/file-types.js";

test("file metadata resolves formats consistently for stored documents and browser uploads", () => {
  for (const [name, kind] of [["notes.PDF", "pdf"], ["certificate.webp", "image"], ["lesson.mp4", "video"], ["recitation.mp3", "audio"], ["practice.docx", "document"], ["scores.xlsx", "spreadsheet"], ["recap.pptx", "presentation"], ["lesson-notes.txt", "text"], ["materials.zip", "archive"]]) {
    assert.equal(filePresentation({ name }).kind, kind);
  }
  assert.equal(filePresentation({ name: "certificate", contentType: "application/pdf" }).kind, "pdf");
  assert.equal(filePresentation({ name: "certificate", type: "image/jpeg" }).kind, "image");
  assert.equal(filePresentation({ contentType: "application/pdf; charset=binary" }).label, "PDF");
});

test("known MIME metadata takes precedence over misleading file names", () => {
  assert.equal(filePresentation({ name: "scan.pdf", contentType: "image/webp" }).kind, "image");
  assert.equal(filePresentation({ name: "scan.jpg", contentType: "application/pdf" }).kind, "pdf");
  assert.equal(filePresentation({ name: "notes.pdf", contentType: "application/octet-stream" }).kind, "pdf");
  assert.equal(filePresentation({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }).kind, "spreadsheet");
});

test("shared resource metadata supports format labels without inventing a file type", () => {
  assert.equal(filePresentation({ type: "PDF" }).kind, "pdf");
  assert.equal(filePresentation({ type: "MP3" }).kind, "audio");
  assert.equal(filePresentation({ type: "Slides" }).kind, "presentation");
  assert.equal(filePresentation({ kind: "notes" }).label, "Notes");
  assert.equal(filePresentation({ name: "myworksheet" }).kind, "file");
  assert.equal(filePresentation({ name: "worksheet.pdf.exe" }).kind, "file");
});

test("unknown and prototype-like values stay neutral rather than becoming icons or CSS selectors", () => {
  for (const input of [{}, { type: "constructor" }, { name: "file.__proto__" }, { contentType: "toString" }, { kind: "constructor" }, { type: '<img src=x onerror="alert(1)">' }]) {
    assert.deepEqual(filePresentation(input), { kind: "file", label: "File" });
  }
});
