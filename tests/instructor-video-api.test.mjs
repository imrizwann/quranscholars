import test from "node:test";
import assert from "node:assert/strict";
import { uploadVideoFile, videoMetadata, videoIsPending, processingWasAccepted, localVideoSource, deletionIsPending } from "../src/features/instructor-courses/courseApi.js";
import { loginDestination } from "../src/components/guards/loginDestination.js";

test("polling confirms processing only for the exact upload whose response was lost", () => {
  for (const status of ["QUEUED", "PROCESSING", "PROCESSED", "COMPLETED"]) {
    assert.equal(processingWasAccepted({ uploadId: "current", status }, "current"), true);
    assert.equal(processingWasAccepted({ uploadId: "different", status }, "current"), false);
  }
  for (const status of ["NOT_UPLOADED", "UPLOADING", "UPLOADED", "FAILED", "DELETING"])
    assert.equal(processingWasAccepted({ uploadId: "current", status }, "current"), false);
  assert.equal(processingWasAccepted(undefined, "current"), false);
  assert.equal(processingWasAccepted({ status: "PROCESSING" }, undefined), false);
});

test("instructor sign-in returns to known local workspace pages only", () => {
  const instructor = { role: "instructor" };
  assert.equal(loginDestination(instructor, "/instructor/courses/new"), "/instructor/courses/new");
  for (const path of ["https://example.test", "//example.test", "/instructor/courses/../..", undefined]) assert.equal(loginDestination(instructor, path), "/instructor/courses");
  assert.equal(loginDestination({ role: "user" }, "/instructor/courses"), "/admission");
});

test("video metadata matches the server formats and rejects empty, disguised and unsafe files", () => {
  assert.deepEqual(videoMetadata({ name: "recitation.MP4", type: "video/mp4", size: 100 }), { fileName: "recitation.MP4", contentType: "video/mp4", size: 100 });
  assert.equal(videoMetadata({ name: "lesson.mkv", type: "", size: 100 }).contentType, "video/x-matroska");
  for (const file of [null, { name: "a.mp4", size: 0 }, { name: "a.exe", size: 10 }, { name: "a.mp4", type: "text/html", size: 10 }, { name: "../a.mp4", size: 10 }, { name: "a\n.mp4", size: 10 }]) assert.throws(() => videoMetadata(file));
});

test("local preview supplies real media types even when the file picker omits its MIME type", () => {
  const url = "blob:http://localhost:5173/local-preview";
  for (const [name, expected] of [["clip.mp4", "video/mp4"], ["clip.WEBM", "video/webm"], ["clip.mov", "video/quicktime"], ["clip.mkv", "video/x-matroska"]]) {
    for (const type of ["", "application/octet-stream", expected]) {
      assert.deepEqual(localVideoSource({ name, size: 100, type }, url), { src: url, type: expected });
    }
  }
  assert.throws(() => localVideoSource({ name: "clip.mp4", size: 100, type: "text/html" }, url));
});

test("storage PUT has no app credentials, tracks progress and propagates failures and cancellation", async () => {
  const previous = globalThis.XMLHttpRequest;
  let current;
  class FakeXHR {
    upload = {}; headers = {};
    constructor() { current = this; }
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(key, value) { this.headers[key] = value; }
    send(file) { this.file = file; }
    abort() { this.onabort(); }
  }
  globalThis.XMLHttpRequest = FakeXHR;
  try {
    const progress = [];
    const file = { size: 20 };
    const pending = uploadVideoFile("https://storage.example/video?signature=test", file, "video/mp4", { onProgress: (value) => progress.push(value) });
    assert.equal(current.method, "PUT");
    assert.equal(current.file, file);
    assert.equal(current.withCredentials, false);
    assert.deepEqual(current.headers, { "Content-Type": "video/mp4" });
    current.upload.onprogress({ lengthComputable: true, loaded: 10, total: 20 });
    current.status = 200; current.onload(); await pending;
    assert.deepEqual(progress, [50]);
    const failure = uploadVideoFile("https://storage.example/video", file, "video/mp4");
    current.status = 403; current.onload(); await assert.rejects(failure, /Storage upload failed/);
    const controller = new AbortController();
    const cancelled = uploadVideoFile("https://storage.example/video", file, "video/mp4", { signal: controller.signal });
    controller.abort(); await assert.rejects(cancelled, { name: "AbortError" });
    assert.throws(() => uploadVideoFile("http://storage.example/video", file, "video/mp4"), /invalid storage URL/);
  } finally { globalThis.XMLHttpRequest = previous; }
});

test("only unfinished video states require polling", () => {
  for (const status of ["UPLOADING", "UPLOADED", "QUEUED", "PROCESSING", "PROCESSED", "DELETING"]) assert.equal(videoIsPending({ status }), true);
  for (const status of ["NOT_UPLOADED", "COMPLETED", "FAILED"]) assert.equal(videoIsPending({ status }), false);
});

test("deletion polling stops when cleanup needs administrator attention", () => {
  for (const status of ["pending", "retrying"]) assert.equal(deletionIsPending({ status, storageCleanupPending: true }), true);
  assert.equal(deletionIsPending({ status: "blocked", storageCleanupPending: true }), false);
  assert.equal(deletionIsPending({ status: "completed", storageCleanupPending: false }), false);
  assert.equal(deletionIsPending(undefined), false);
});
