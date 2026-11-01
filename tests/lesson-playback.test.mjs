import { test } from "node:test";
import assert from "node:assert/strict";
import { lessonPlaybackSource, renewLessonRequest, createPlaybackSession } from "../src/lib/lesson-playback.js";
const root = "https://quranscholar-video.iamrizwan40.workers.dev/lesson/run/";
const grant = (now, token = "header.payload.signature", remaining = 300000) => ({ playbackUrl: root + "master.m3u8", playbackToken: token, expiresAt: new Date(now + remaining).toISOString() });

test("sources accept only unexpired HTTPS header grants, never query tokens or embedded credentials", () => {
  const valid = grant(Date.now());
  assert.equal(lessonPlaybackSource(valid).type, "application/x-mpegurl");
  for (const value of ["private/master.m3u8", "http://video.test/master.m3u8", root + "master.m3u8?token=x", root + "master.m3u8#x", "https://name:password@video.test/master.m3u8"]) assert.equal(lessonPlaybackSource({ ...valid, playbackUrl: value }), null);
  assert.equal(lessonPlaybackSource({ ...valid, playbackToken: undefined }), null);
  assert.equal(lessonPlaybackSource({ ...valid, expiresAt: "invalid" }), null);
  assert.equal(lessonPlaybackSource({ ...valid, expiresAt: new Date(0).toISOString() }), null);
});

test("credentials never leave the exact origin and lesson processing directory", () => {
  assert.equal(renewLessonRequest(root + "720p/segment.ts", root + "master.m3u8"), root + "720p/segment.ts");
  for (const url of ["https://evil.test/lesson/run/segment.ts", "https://quranscholar-video.iamrizwan40.workers.dev/lesson/other/segment.ts", root + "../segment.ts", root + "720p/%2fsecret.ts", root + "segment.ts?token=old"]) assert.throws(() => renewLessonRequest(url, root + "master.m3u8"));
});

test("long playback uses fresh headers without changing the URL and coalesces simultaneous renewals", async () => {
  let now = Date.now(), current = grant(now), calls = 0;
  const session = createPlaybackSession({ now: () => now, getGrant: () => current,
    refresh: async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); current = grant(now, "new.payload.signature"); return current; } });
  assert.equal((await session.authorize(root + "720p/segment.ts")).authorization, "Bearer header.payload.signature");
  now += 280000;
  const results = await Promise.all([session.authorize(root + "720p/segment.ts"), session.authorize(root + "720p/index.m3u8"), session.authorize(root + "audio/segment.aac")]);
  assert.equal(calls, 1);
  assert(results.every(result => result.authorization === "Bearer new.payload.signature" && !result.url.includes("token=")));
  now += 600000; // Background throttling / long pause must trigger request-time renewal.
  await session.authorize(root + "720p/segment2.ts");
  assert.equal(calls, 2);
});

test("transient refresh failures use only still-valid grants and expired or revoked grants fail closed", async () => {
  let now = Date.now(), current = grant(now, undefined, 10000), calls = 0;
  const session = createPlaybackSession({ now: () => now, getGrant: () => current, refresh: async () => { calls++; throw { status: 503 }; } });
  assert((await session.authorize(root + "segment.ts")).authorization);
  await session.authorize(root + "segment2.ts");
  assert.equal(calls, 1);
  now += 11000;
  await assert.rejects(session.authorize(root + "segment3.ts"));
  const revoked = createPlaybackSession({ now: () => now, getGrant: () => grant(now, undefined, 10000), refresh: async () => { throw { status: 403 }; } });
  await assert.rejects(revoked.authorize(root + "segment.ts"));
});

test("generation changes and unmount during renewal never send a credential", async () => {
  const current = grant(Date.now(), undefined, 10000);
  const replaced = createPlaybackSession({ getGrant: () => current, refresh: async () => ({ ...grant(Date.now()), playbackUrl: root.replace('/run/', '/new-run/') + 'master.m3u8' }) });
  await assert.rejects(replaced.authorize(root + "segment.ts"));
  let finish;
  const session = createPlaybackSession({ getGrant: () => current, refresh: () => new Promise(resolve => { finish = resolve; }) });
  const pending = session.authorize(root + "segment.ts");
  await Promise.resolve(); session.dispose(); finish(grant(Date.now()));
  await assert.rejects(pending, /closed|expired/);
});
