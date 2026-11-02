import test from "node:test";
import assert from "node:assert/strict";
import { createLearningWatch } from "../src/lib/learning-watch.js";
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const lesson = completed => ({ lessonId: "lesson", completed });

test("watch reporting starts on play, serializes heartbeat sequences, and stops after server completion", async () => {
  const starts = [], beats = [], states = [], received = [];
  const watch = createLearningWatch({ start: async body => { starts.push(body); return { watchId: "watch", sequence: 0, lesson: lesson(false) }; }, heartbeat: async body => { beats.push(body); return { sequence: body.sequence, lesson: lesson(body.sequence === 2) }; }, onStatus: state => states.push(state), onLesson: value => received.push(value) });
  watch.update(5); watch.tick(); await settle(); assert.equal(starts.length, 0);
  watch.play(5); await settle(); watch.play(5); assert.equal(starts.length, 1);
  watch.update(15); watch.tick(); await settle(); watch.update(25); watch.tick(); await settle();
  watch.update(35); watch.tick(); await settle();
  assert.deepEqual(beats.map(body => [body.sequence, body.position]), [[1, 15], [2, 25]]);
  assert.equal(received.at(-1).completed, true); assert.equal(states.at(-1), "complete"); watch.dispose();
});
test("seeks are sent as baseline resets after an in-flight heartbeat, without overlapping requests", async () => {
  let release; const beats = [];
  const watch = createLearningWatch({ start: async () => ({ watchId: "watch", sequence: 0, lesson: lesson(false) }), heartbeat: body => { beats.push(body); return beats.length === 1 ? new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }) : Promise.resolve({ sequence: body.sequence, lesson: lesson(false) }); }, onStatus() {}, onLesson() {} });
  watch.play(0); await settle(); watch.update(10); watch.tick(); watch.seek(90); watch.update(91);
  assert.equal(beats.length, 1); release(); await settle();
  assert.equal(beats[1].event, "seek"); assert.equal(beats[1].position, 91); assert.equal(beats[1].sequence, 2); watch.dispose();
});
test("pause and resume during a pending request creates a fresh baseline after that request finishes", async () => {
  let release; let starts = 0;
  const watch = createLearningWatch({ start: async () => ({ watchId: `watch-${++starts}`, sequence: 0, lesson: lesson(false) }), heartbeat: body => new Promise(resolve => { release = () => resolve({ sequence: body.sequence, lesson: lesson(false) }); }), onStatus() {}, onLesson() {} });
  watch.play(0); await settle(); watch.update(10); watch.tick(); watch.pause(10); watch.play(10); release(); await settle();
  assert.equal(starts, 2); watch.dispose();
});
test("failed saving pauses reporting, explicit retry reconnects, and unmounted lessons ignore late results", async () => {
  const states = []; let attempts = 0, starts = 0;
  const watch = createLearningWatch({ start: async () => ({ watchId: `watch-${++starts}`, sequence: 0, lesson: lesson(false) }), heartbeat: async body => { attempts++; if (attempts === 1) throw { status: 503 }; return { sequence: body.sequence, lesson: lesson(false) }; }, onStatus: state => states.push(state), onLesson() {} });
  watch.play(0); await settle(); watch.update(10); watch.tick(); await settle(); assert.equal(states.at(-1), "error");
  watch.tick(); await settle(); assert.equal(attempts, 1);
  watch.retry(); await settle(); assert.equal(starts, 2); watch.update(20); watch.tick(); await settle(); assert.equal(states.at(-1), "saved");
  let release;
  const stale = createLearningWatch({ start: () => new Promise(resolve => { release = resolve; }), heartbeat() {}, onLesson() { assert.fail("unmounted lesson updated"); }, onStatus() {} });
  stale.play(0); stale.dispose(); release({ watchId: "late", sequence: 0, lesson: lesson(false) }); await settle(); watch.dispose();
});
