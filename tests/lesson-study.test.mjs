import test from "node:test";
import assert from "node:assert/strict";
import { NOTE_LIMIT, lessonResumePosition, lessonTime, orderedLearningSections, readLastLesson, readLessonStudy, saveLastLesson, saveLessonStudy } from "../src/features/recorded-courses/services/lessonStudyStorage.js";

test("lesson notes and resume positions stay scoped to account, course and lesson without persisting grants", t => {
  const previous = globalThis.localStorage;
  const data = new Map();
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  t.after(() => { globalThis.localStorage = previous; });
  assert.equal(saveLessonStudy("learner", "course", "lesson", { notes: "Practice [2:03]", position: 123, playbackToken: "private-grant", canAccessCourse: true }), true);
  assert.deepEqual(readLessonStudy("learner", "course", "lesson"), { notes: "Practice [2:03]", position: 123 });
  for (const scope of [["other", "course", "lesson"], ["learner", "other", "lesson"], ["learner", "course", "other"]]) {
    assert.deepEqual(readLessonStudy(...scope), { notes: "", position: 0 });
  }
  saveLessonStudy("learner", "course", "lesson", { position: 130 });
  assert.equal(readLessonStudy("learner", "course", "lesson").notes, "Practice [2:03]");
  saveLessonStudy("learner", "course", "lesson", { notes: "Updated" });
  assert.equal(readLessonStudy("learner", "course", "lesson").position, 130);
  saveLessonStudy("learner", "course", "lesson", { position: 0 });
  assert.equal(readLessonStudy("learner", "course", "lesson").position, 0, "completed playback can restart");
  assert.doesNotMatch(JSON.stringify([...data.values()]), /private-grant|playbackToken|canAccessCourse/);
  saveLastLesson("learner", "course", "lesson");
  assert.equal(readLastLesson("learner", "course", [{ id: "lesson" }]), "lesson");
  assert.equal(readLastLesson("learner", "course", [{ id: "replacement" }]), null, "deleted lessons cannot remain a resume destination");
  assert.equal(readLastLesson("other", "course", [{ id: "lesson" }]), null);
});

test("corrupt and unavailable browser storage never prevents learning or claims a successful save", t => {
  const previous = globalThis.localStorage;
  t.after(() => { globalThis.localStorage = previous; });
  for (const value of ["invalid JSON", "null", "[]", '{"notes":{},"position":-3}', '{"notes":false,"position":1e99}']) {
    globalThis.localStorage = { getItem: () => value };
    assert.deepEqual(readLessonStudy("u", "c", "l"), { notes: "", position: 0 });
  }
  let stored;
  globalThis.localStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  saveLessonStudy("u", "c", "l", { notes: "x".repeat(NOTE_LIMIT + 500), position: Infinity });
  assert.equal(readLessonStudy("u", "c", "l").notes.length, NOTE_LIMIT);
  assert.equal(readLessonStudy("u", "c", "l").position, 0);
  globalThis.localStorage = { getItem() { throw Error("blocked"); }, setItem() { throw Error("quota exceeded"); } };
  assert.deepEqual(readLessonStudy("u", "c", "l"), { notes: "", position: 0 });
  assert.equal(saveLessonStudy("u", "c", "l", { notes: "keep this draft" }), false);
  assert.equal(saveLessonStudy(null, "c", "l", { notes: "no account" }), false);
});

test("resume uses account progress on a fresh device and respects server resets instead of stale local positions", t => {
  const previous = globalThis.localStorage;
  const data = new Map();
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  t.after(() => { globalThis.localStorage = previous; });
  const state = position => ({ lessons: [{ lessonId: "lesson", duration: 300, lastPosition: position }] });
  assert.equal(lessonResumePosition("learner", "course", "lesson", state(120)), 120, "resume works without any browser history");
  saveLessonStudy("learner", "course", "lesson", { position: 180 });
  assert.equal(lessonResumePosition("learner", "course", "lesson", state(120)), 120);
  assert.equal(lessonResumePosition("learner", "course", "lesson", state(0)), 0, "replaced videos reset resume to zero");
  assert.equal(lessonResumePosition("learner", "course", "lesson", state(999)), 300);
  assert.equal(lessonResumePosition("learner", "course", "lesson", state(-10)), 0);
  assert.equal(lessonResumePosition("learner", "course", "lesson", { lessons: [] }), 0, "an authoritative empty response cannot revive stale browser progress");
  assert.equal(lessonResumePosition("learner", "course", "lesson"), 180, "local resume remains a fallback when progress cannot load");
  assert.equal(lessonResumePosition("other", "course", "lesson"), 0);
});

test("learning order follows database order without mutating metadata; timestamps include hours", () => {
  const sections = [{ id: "second", order: 9, lessons: [{ id: "b", order: 8 }, { id: "a", order: 2 }] }, { id: "first", order: 2, lessons: [] }];
  const original = JSON.stringify(sections);
  const sorted = orderedLearningSections(sections);
  assert.deepEqual(sorted.map(section => section.id), ["first", "second"]);
  assert.deepEqual(sorted[1].lessons.map(lesson => lesson.id), ["a", "b"]);
  assert.equal(JSON.stringify(sections), original);
  assert.equal(lessonTime(0), "0:00");
  assert.equal(lessonTime(123.9), "2:03");
  assert.equal(lessonTime(3723), "1:02:03");
  assert.equal(lessonTime(NaN), "0:00");
});
