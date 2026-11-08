import { NOTE_LIMIT, readLessonStudy, saveLessonStudy } from "./lessonStudyStorage.js";

const key = (userId, courseId, lessonId) => ["qs:lesson-note-draft:v1", userId, courseId, lessonId].map(encodeURIComponent).join(":");
const valid = args => args.every(value => typeof value === "string" && value.length > 0);
export function readNoteDraft(userId, courseId, lessonId) {
  if (!valid([userId, courseId, lessonId])) return null;
  try {
    const value = JSON.parse(localStorage.getItem(key(userId, courseId, lessonId)));
    if (typeof value?.content === "string" && value.content.length <= NOTE_LIMIT && Number.isSafeInteger(value.revision) && value.revision >= 0) return value;
  } catch { /* Fall back to notes written before account synchronization. */ }
  const notes = readLessonStudy(userId, courseId, lessonId).notes;
  return notes ? { content: notes, revision: 0 } : null;
}
export function writeNoteDraft(userId, courseId, lessonId, draft) {
  if (!valid([userId, courseId, lessonId]) || typeof draft?.content !== "string" || draft.content.length > NOTE_LIMIT || !Number.isSafeInteger(draft.revision) || draft.revision < 0) return false;
  try { localStorage.setItem(key(userId, courseId, lessonId), JSON.stringify({ content: draft.content, revision: draft.revision })); return true; }
  catch { return false; }
}
export function clearLegacyNotes(userId, courseId, lessonId, content) {
  const legacy = readLessonStudy(userId, courseId, lessonId).notes;
  return !legacy || legacy !== content || saveLessonStudy(userId, courseId, lessonId, { notes: "" });
}
export function clearNoteDraft(userId, courseId, lessonId, expected) {
  let removed = true;
  try {
    let stored;
    try { stored = JSON.parse(localStorage.getItem(key(userId, courseId, lessonId))); } catch { /* Corrupt drafts can be removed. */ }
    // A save acknowledgment must not erase a newer draft written in another tab.
    if (expected && stored && (stored.content !== expected.content || stored.revision !== expected.revision)) return true;
    localStorage.removeItem(key(userId, courseId, lessonId));
  } catch { removed = false; }
  if (expected) return clearLegacyNotes(userId, courseId, lessonId, expected.content) && removed;
  return saveLessonStudy(userId, courseId, lessonId, { notes: "" }) && removed;
}
