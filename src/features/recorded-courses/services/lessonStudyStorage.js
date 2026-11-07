// Device preferences only. These records never establish enrollment or access.
const prefix = "qs:lesson-study:v1";
export const NOTE_LIMIT = 10000;
const keyFor = (userId, courseId, lessonId) => [prefix, userId, courseId, lessonId].map(encodeURIComponent).join(":");
const read = key => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};
const scoped = (userId, courseId) => typeof userId === "string" && Boolean(userId) && typeof courseId === "string" && Boolean(courseId);

export function readLastLesson(userId, courseId, lessons) {
  if (!scoped(userId, courseId)) return null;
  const id = read(keyFor(userId, courseId, "last"));
  return lessons.find(lesson => lesson.id === id)?.id || null;
}
export function saveLastLesson(userId, courseId, lessonId) {
  return scoped(userId, courseId) && typeof lessonId === "string" && write(keyFor(userId, courseId, "last"), lessonId);
}
export function readLessonStudy(userId, courseId, lessonId) {
  if (!scoped(userId, courseId) || !lessonId) return { notes: "", position: 0 };
  const data = read(keyFor(userId, courseId, lessonId));
  return {
    notes: typeof data?.notes === "string" ? data.notes.slice(0, NOTE_LIMIT) : "",
    position: Number.isFinite(data?.position) && data.position >= 0 && data.position <= 86400 ? data.position : 0,
  };
}
export function saveLessonStudy(userId, courseId, lessonId, patch) {
  if (!scoped(userId, courseId) || typeof lessonId !== "string" || !lessonId) return false;
  const data = readLessonStudy(userId, courseId, lessonId);
  // Explicitly select device-preference fields; never persist playback grants.
  if (typeof patch.notes === "string") data.notes = patch.notes.slice(0, NOTE_LIMIT);
  if (Number.isFinite(patch.position) && patch.position >= 0 && patch.position <= 86400) data.position = patch.position;
  return write(keyFor(userId, courseId, lessonId), data);
}

// Server positions are scoped to the signed-in learner and current video. Keep
// the browser copy as a fallback when progress cannot be loaded, never as proof
// that any part of a lesson has been watched.
export function lessonResumePosition(userId, courseId, lessonId, learningState) {
  const progress = learningState?.lessons?.find(lesson => lesson.lessonId === lessonId);
  if (!progress) return learningState ? 0 : readLessonStudy(userId, courseId, lessonId).position;
  return Number.isFinite(progress.lastPosition) && progress.lastPosition >= 0
    ? Math.min(progress.lastPosition, Number.isFinite(progress.duration) && progress.duration > 0 ? progress.duration : 86400) : 0;
}

export function orderedLearningSections(sections) {
  const ordered = items => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return ordered(sections).map(section => ({ ...section, lessons: ordered(section.lessons) }));
}
export function lessonTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(value / 3600);
  return [hours || null, Math.floor(value / 60) % 60, value % 60].filter(value => value !== null).map((value, index) => index ? String(value).padStart(2, "0") : String(value)).join(":");
}
