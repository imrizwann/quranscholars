import test from "node:test";
import assert from "node:assert/strict";
import { userMessage, userFacingError, videoErrorMessage, courseStatusLabel, videoPreparationMessage } from "../src/lib/user-messages.js";

test("network and gateway failures have usable messages without leaking technical details", () => {
  for (const error of [new Error("TypeError: fetch failed"), { status: "PARSING_ERROR", originalStatus: 504, data: "<html>Vercel stack trace</html>" }, { status: 400, data: { message: "BSON cast failed" } }]) {
    assert.doesNotMatch(userMessage(error), /TypeError|fetch|Vercel|html|BSON|cast|stack/);
  }
  assert.match(userMessage({ status: "FETCH_ERROR" }), /reach the server.*try again/i);
  assert.match(userMessage({ status: 429 }), /wait a few minutes/);
  assert.match(userMessage({ status: 403, data: { code: "CSRF_REJECTED" } }), /Refresh the page/);
  assert.match(userMessage({ status: 401, data: { message: "Invalid email or password" } }), /email or password is incorrect/);
});

test("video feedback distinguishes completion, waiting and failure", () => {
  assert.equal(videoPreparationMessage({ status: "COMPLETED" }), "Your video is ready to watch.");
  assert.match(videoPreparationMessage({ status: "QUEUED", waitingForQueue: true }), /waiting to be prepared/);
  assert.throws(() => videoPreparationMessage({ status: "FAILED", lastError: { message: "ffmpeg trace", code: "UNSUPPORTED_MEDIA" } }), error => {
    assert.match(userMessage(error), /supported video file/);
    assert.doesNotMatch(userMessage(error), /ffmpeg|trace/);
    return true;
  });
});

test("reviewed API and file validation messages remain actionable", () => {
  assert.equal(userMessage({ status: 400, data: { userMessage: "Check your details.", code: "VALIDATION_ERROR", errors: [{ field: "title", message: "Title must contain at least 3 characters." }] } }), "Title must contain at least 3 characters.");
  assert.equal(userMessage(userFacingError("Please choose an MP4 video.")), "Please choose an MP4 video.");
  assert.doesNotMatch(videoErrorMessage({ message: "ffmpeg worker stack", code: "PROCESSING_FAILED" }), /ffmpeg|worker|stack/);
  assert.equal(courseStatusLabel("DRAFT"), "Draft");
  assert.equal(courseStatusLabel("INTERNAL_UNKNOWN"), "Not published");
});
