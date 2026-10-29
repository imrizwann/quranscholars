import { test } from "node:test";
import assert from "node:assert/strict";
import { lessonPlaybackSource, renewLessonRequest } from "../src/lib/lesson-playback.js";

test("lesson sources require unexpired HTTPS signed grants and renew only within the lesson directory", () => {
  const playbackUrl = "https://video.example.test/lesson/run/master.m3u8?token=fresh";
  const valid = { playbackUrl, expiresAt: new Date(Date.now() + 300000).toISOString() };
  assert.equal(lessonPlaybackSource(valid).type, "application/x-mpegurl");
  for (const value of ["private/master.m3u8", "http://video.example.test/a?token=x", "https://video.example.test/a", "https://name:password@video.example.test/a?token=x"]) assert.equal(lessonPlaybackSource({ ...valid, playbackUrl: value }), null);
  assert.equal(lessonPlaybackSource({ ...valid, expiresAt: "invalid" }), null);
  assert.equal(lessonPlaybackSource({ ...valid, expiresAt: new Date(0).toISOString() }), null);
  assert.equal(renewLessonRequest("https://video.example.test/lesson/run/720p/segment.ts?token=old", playbackUrl), "https://video.example.test/lesson/run/720p/segment.ts?token=fresh");
  assert.throws(() => renewLessonRequest("https://evil.test/lesson/run/segment.ts", playbackUrl));
  assert.throws(() => renewLessonRequest("https://video.example.test/other/segment.ts", playbackUrl));
});
