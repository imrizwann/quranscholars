import test from "node:test";
import assert from "node:assert/strict";
import { createLearningWatch } from "../src/lib/learning-watch.js";
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const lesson = completed => ({ lessonId: "lesson", completed });

test("timer and media events share a five-second reporting budget", async () => {
  let now = 0; const beats = [];
  const watch = createLearningWatch({ now: () => now, start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: async body => { beats.push(body); return { sequence: body.sequence, lesson: lesson(false) }; }, onStatus() {} });
  watch.play(0); await settle();
  now = 4999; watch.update(4.999); watch.tick(); await settle(); assert.equal(beats.length, 0);
  now = 5000; watch.update(5); watch.tick(); await settle(); assert.equal(beats.length, 1);
  now = 10000; watch.tick(); watch.update(10); await settle(); assert.equal(beats.length, 2);
  watch.pause(10.5); await settle(); assert.equal(beats.at(-1).position, 10.5, "pause flushes immediately");
  now = 20000; watch.tick(); await settle(); assert.equal(beats.length, 3);
  watch.dispose();
});

test("seeking preserves the last watched frame and never credits a pre-seeked time update", async () => {
  let now = 0; const beats = [];
  const watch = createLearningWatch({ now: () => now, start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: async body => { beats.push(body); return { sequence: body.sequence, lesson: lesson(false) }; }, onStatus() {} });
  watch.play(0); await settle();
  now = 4000; watch.update(4); watch.seeking(); await settle();
  now = 5000; watch.update(9); watch.tick(); await settle();
  assert.deepEqual(beats.map(({ event, position }) => [event, position]), [["tick", 4]]);
  watch.seek(9); await settle();
  now = 6000; watch.update(10); watch.pause(10); await settle();
  assert.deepEqual(beats.map(({ event, position }) => [event, position]), [["tick", 4], ["seek", 9], ["tick", 10]]);
  watch.dispose();
});

test("rapid seeks and pausing at the destination cannot turn the skipped interval into coverage", async () => {
  let release; const beats = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: body => { beats.push(body); return beats.length === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(false) }); }, onStatus() {} });
  watch.play(0); await settle(); watch.update(4); watch.seeking();
  watch.update(95); watch.pause(95); watch.seek(95);
  watch.seeking(); watch.update(30); watch.seek(30); watch.flush();
  release(); await settle(); await settle();
  assert.deepEqual(beats.map(({ event, position }) => [event, position]), [["tick", 4], ["seek", 30], ["tick", 30]]);
  watch.dispose();
});

test("watch reporting starts on play, serializes heartbeat sequences, and keeps resume positions active after completion", async () => {
  const starts = [], beats = [], states = [], received = [];
  const watch = createLearningWatch({ start: async body => { starts.push(body); return { watchId: "watch", sequence: 0, lesson: lesson(false) }; }, heartbeat: async body => { beats.push(body); return { sequence: body.sequence, lesson: lesson(body.sequence >= 2) }; }, onStatus: state => states.push(state), onLesson: value => received.push(value) });
  watch.update(5); watch.flush(); await settle(); assert.equal(starts.length, 0);
  watch.play(5); await settle(); watch.play(5); assert.equal(starts.length, 1);
  watch.update(15); watch.flush(); await settle(); watch.update(25); watch.flush(); await settle();
  watch.update(35); watch.flush(); await settle();
  assert.deepEqual(beats.map(body => [body.sequence, body.position]), [[1, 15], [2, 25], [3, 35]]);
  assert.equal(received.at(-1).completed, true); assert.equal(states.at(-1), "complete"); watch.dispose();
});
test("seeks are sent as baseline resets after an in-flight heartbeat, without overlapping requests", async () => {
  let release; const beats = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: body => { beats.push(body); return beats.length === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(false) }); }, onStatus() {}, onLesson() {} });
  watch.play(0); await settle(); watch.update(10); watch.flush(); watch.seek(90); watch.update(91);
  assert.equal(beats.length, 1); release(); await settle();
  assert.equal(beats[1].event, "seek"); assert.equal(beats[1].position, 90); assert.equal(beats[1].sequence, 2); watch.dispose();
});
test("pause and resume during a pending request creates a fresh baseline after that request finishes", async () => {
  let release; let starts = 0, beats = 0;
  const watch = createLearningWatch({ start: async () => ({ watchId: `watch-${++starts}`, sequence: 0, lesson: lesson(false) }), heartbeat: body => ++beats === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(false) }), onStatus() {}, onLesson() {} });
  watch.play(0); await settle(); watch.update(10); watch.flush(); watch.pause(10); watch.play(10); release(); await settle();
  assert.equal(starts, 2); watch.dispose();
});

test("pause, resume and ending during a pending save preserves the final coverage", async () => {
  let release; const beats = [], received = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: body => { beats.push(body); return beats.length === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(body.position === 100) }); }, onStatus() {}, onLesson: value => received.push(value) });
  watch.play(0); await settle(); watch.update(80); watch.flush(); watch.pause(80); watch.play(80); watch.pause(100); release(); await settle();
  assert.equal(beats.at(-1).position, 100); assert.equal(received.at(-1).completed, true); watch.dispose();
});
test("failed saving pauses reporting, retries the same heartbeat, and unmounted lessons ignore late results", async () => {
  const states = []; let attempts = 0, starts = 0;
  const watch = createLearningWatch({ start: async () => ({ watchId: `watch-${++starts}`, sequence: 0, lesson: lesson(false) }), heartbeat: async body => { attempts++; if (attempts === 1) throw { status: 503 }; return { sequence: body.sequence, lesson: lesson(false) }; }, onStatus: state => states.push(state), onLesson() {} });
  watch.play(0); await settle(); watch.update(10); watch.flush(); await settle(); assert.equal(states.at(-1), "error");
  watch.flush(); await settle(); assert.equal(attempts, 1);
  watch.retry(); await settle(); assert.equal(starts, 1); watch.update(20); watch.flush(); await settle(); assert.equal(states.at(-1), "saved");
  let release;
  const stale = createLearningWatch({ start: () => new Promise(resolve => { release = resolve; }), heartbeat() {}, onLesson() { assert.fail("unmounted lesson updated"); }, onStatus() {} });
  stale.play(0); stale.dispose(); release({ watchId: "late", sequence: 0, lesson: lesson(false) }); await settle(); watch.dispose();
});

test("a failed final save can be retried after the video has ended", async () => {
  const beats = [], received = []; let fail = true;
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: async body => { beats.push(body); if (fail) { fail = false; throw { status: 503 }; } return { sequence: body.sequence, lesson: lesson(true) }; }, onStatus() {}, onLesson: value => received.push(value) });
  watch.play(0); await settle(); watch.pause(100); await settle(); watch.update(0); watch.retry(); await settle();
  assert.deepEqual(beats, [{ watchId: "watch", sequence: 1, position: 100, event: "tick" }, { watchId: "watch", sequence: 1, position: 100, event: "tick" }]);
  assert.equal(received.at(-1).completed, true); watch.dispose();
});

test("media updates keep reporting when background timers are throttled", async () => {
  let now = 0; const beats = [];
  const watch = createLearningWatch({ now: () => now, start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: async body => { beats.push(body); return { sequence: body.sequence, lesson: lesson(body.position >= 90) }; }, onStatus() {}, onLesson() {} });
  watch.play(0); await settle();
  for (let position = 1; position <= 100; position++) { now = position * 1000; watch.update(position); await settle(); }
  assert.deepEqual(beats.map(body => body.position), [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
  watch.dispose();
});

test("resuming an already-completed lesson still saves its position on pause and page exit", async () => {
  const beats = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "replay", sequence: 0, lesson: lesson(true) }), heartbeat: async body => { beats.push(body); return { sequence: body.sequence, lesson: lesson(true) }; }, onStatus() {}, onLesson() {} });
  watch.play(120); await settle();
  watch.update(130); watch.flush(); await settle();
  watch.pause(135); await settle();
  assert.deepEqual(beats.map(body => body.position), [130, 135]);
  watch.tick(); await settle(); assert.equal(beats.length, 2, "a paused video does not keep polling");
  watch.dispose(); await settle(); assert.equal(beats.at(-1).position, 135);
});

test("the final position is saved even if playback resets while a heartbeat is pending", async () => {
  let release; const beats = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: body => { beats.push(body); return beats.length === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(body.position === 100) }); }, onStatus() {}, onLesson() {} });
  watch.play(0); await settle(); watch.update(80); watch.flush(); watch.pause(100); watch.update(0);
  release(); await settle();
  assert.deepEqual(beats.map(body => body.position), [80, 100]);
  watch.dispose();
});

test("seek baselines retain their position while later playback waits for a response", async () => {
  let release; const beats = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: body => { beats.push(body); return beats.length === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(false) }); }, onStatus() {}, onLesson() {} });
  watch.play(0); await settle(); watch.update(10); watch.flush(); watch.seek(50); watch.update(60); watch.flush(); release(); await settle(); await settle();
  assert.deepEqual(beats.map(body => [body.event, body.position]), [["tick", 10], ["seek", 50], ["tick", 60]]);
  watch.dispose();
});

test("leaving a lesson drains its final pending save without updating the departed UI", async () => {
  let release; const beats = [], received = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: body => { beats.push(body); return beats.length === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(true) }); }, onStatus() {}, onLesson: value => received.push(value) });
  watch.play(0); await settle(); watch.update(80); watch.flush(); watch.update(100); watch.dispose(); release(); await settle(); await settle();
  assert.deepEqual(beats.map(body => body.position), [80, 100]);
  assert.equal(received.length, 1);
});
