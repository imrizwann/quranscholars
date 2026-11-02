import { test } from "node:test";
import assert from "node:assert/strict";
import { videoProgressState, videoFileSize } from "../src/features/instructor-courses/video-progress.js";

test("upload progress is real and bounded; 100% upload never claims playback is ready", () => {
  assert.equal(videoProgressState({ phase: "Uploading", progress: 53.6 }).percent, 54);
  assert.equal(videoProgressState({ phase: "Uploading", progress: -10 }).percent, 0);
  const finishing = videoProgressState({ phase: "Uploading", progress: 200 });
  assert.equal(finishing.percent, 100); assert.equal(finishing.complete, undefined); assert.equal(finishing.stage, 0);
  assert.equal(videoProgressState({ phase: "Uploading", progress: NaN }).percent, 0);
});
test("queued, encoding and finalizing states never invent a preparation percentage", () => {
  for (const status of ["QUEUED", "PROCESSING", "PROCESSED"]) {
    const state = videoProgressState({ status });
    assert.equal(state.stage, 1); assert.equal(state.indeterminate, true); assert.equal(state.percent, undefined); assert.equal(state.complete, undefined);
  }
  const requesting = videoProgressState({ phase: "Preparing video" });
  assert.equal(requesting.stage, 1); assert.equal(requesting.percent, undefined);
});
test("choosing a replacement shows an unuploaded selection rather than the old video's ready/failed state", () => {
  for (const status of ["COMPLETED", "FAILED", "UPLOADING", "NOT_UPLOADED"]) {
    const state = videoProgressState({ status, hasFile: true });
    assert.equal(state.stage, 0); assert.equal(state.title, "Ready to upload"); assert.equal(state.complete, undefined);
  }
});
test("authoritative failures take priority over old success notices; completed video marks every stage done", () => {
  const failed = videoProgressState({ status: "FAILED", accepted: true });
  assert.equal(failed.failed, true); assert.equal(failed.active, undefined);
  const ready = videoProgressState({ status: "COMPLETED" });
  assert.equal(ready.complete, true); assert.equal(ready.stage, 2);
});
test("a confirmed transfer with a lost processing response can continue without another upload", () => {
  const interrupted = videoProgressState({ status: "UPLOADING", unconfirmed: true });
  assert.equal(interrupted.stage, 1); assert.equal(interrupted.complete, undefined); assert.equal(interrupted.indeterminate, undefined);
  assert.match(interrupted.description, /without uploading again/);
  assert.equal(videoProgressState({ status: "UPLOADING" }).stage, 0);
});
test("initial empty video stays compact and file sizes handle small clips and large uploads", () => {
  assert.equal(videoProgressState({}), null);
  assert.equal(videoFileSize(0), ""); assert.equal(videoFileSize(Infinity), "");
  assert.equal(videoFileSize(512), "1 KB"); assert.equal(videoFileSize(1024 ** 2), "1.0 MB"); assert.equal(videoFileSize(2.5 * 1024 ** 3), "2.50 GB");
});
