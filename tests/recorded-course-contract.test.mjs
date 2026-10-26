import test from "node:test";
import assert from "node:assert/strict";
import { adaptRecordedCourse, formatDuration, resolveCourseImage } from "../src/features/recorded-courses/model/recordedCourseAdapter.js";
import { buildRecordedCourseQuery, normalizeRecordedCourseList, normalizeRecordedCourseDetail } from "../src/features/recorded-courses/services/recordedCourseContract.js";
import { trailerPlaybackSource } from "../src/lib/trailer-playback.js";

test("public and instructor trailers use the sibling playback URL without modifying signed queries", () => {
  const url = "https://video.example.test/course/trailer/master.m3u8?token=abc%2F123&expires=999";
  const course = { _id: "course-1", trailerVideo: { status: "COMPLETED", hls: { masterKey: "private/master.m3u8" } } };
  assert.equal(normalizeRecordedCourseDetail({ data: { course, trailerPlaybackUrl: url } }).trailerVideo, url);
  assert.deepEqual(trailerPlaybackSource(course, url), { src: url, type: "application/x-mpegurl" });
  assert.equal(normalizeRecordedCourseDetail({ data: { course, trailerPlaybackUrl: null } }).trailerVideo, null);
  assert.equal(normalizeRecordedCourseDetail({ data: { course: { ...course, trailerPlaybackUrl: url }, trailerPlaybackUrl: null } }).trailerVideo, null);
  assert.throws(() => normalizeRecordedCourseDetail({ data: {} }), /Invalid course response/);
});

test("unready, removed and invalid trailer sources never become playable", () => {
  const url = "https://video.example.test/master.m3u8";
  for (const status of ["NOT_UPLOADED", "UPLOADING", "UPLOADED", "QUEUED", "PROCESSING", "PROCESSED", "FAILED", "DELETING"]) {
    assert.equal(trailerPlaybackSource({ trailerVideo: { status } }, url), null);
  }
  for (const value of [null, "", "private/master.m3u8", "javascript:alert(1)", "https://", {}, "https://user:password@example.test/master.m3u8"]) {
    assert.equal(trailerPlaybackSource({}, value), null);
  }
  // Public responses can omit internal processing status.
  assert.deepEqual(trailerPlaybackSource({}, url), { src: url, type: "application/x-mpegurl" });
  assert.equal(trailerPlaybackSource({ trailerVideo: { playbackUrl: url } }, null), null);
});

test("public query includes server pagination and only supported filters", () => {
  assert.deepEqual(buildRecordedCourseQuery({ page: 3, limit: 8, search: "  Quran  ", category: "ISLAMIC-STUDIES", level: "Beginner", language: "Urdu", sort: "popular", featured: true }), {
    page: 3, limit: 8, search: "Quran", category: "islamic-studies", level: "Beginner", language: "Urdu",
  });
});

test("All, blank search and unsupported levels never reach strict query validation", () => {
  assert.deepEqual(buildRecordedCourseQuery({ search: "   ", category: "All", level: "All levels", language: "All", page: -1, limit: 100 }), { page: 1, limit: 50 });
  assert.equal(buildRecordedCourseQuery({ search: "x".repeat(101) }).search.length, 100);
});

test("DTO maps populated objects, zero sale price and preserves omitted list statistics", () => {
  const course = adaptRecordedCourse({ _id: "course-id", category: { _id: "category-id", name: "Quran", slug: "quran" }, instructor: { _id: "instructor-id", name: "Example instructor", avatar: "https://example.test/avatar.webp" }, price: { original: 299.5, sale: 0, currency: "INR" } });
  assert.equal(course.category, "Quran");
  assert.equal(course.categorySlug, "quran");
  assert.equal(course.instructor.id, "instructor-id");
  assert.equal(course.price.current, 0);
  assert.equal(course.price.discounted, true);
  assert.equal(course.totalLessons, null);
  assert.equal(course.totalDurationSeconds, null);
  assert.deepEqual(course.sections, []);
});

test("detail statistics come from stats rather than an absent curriculum", () => {
  const course = adaptRecordedCourse({ totalDuration: 3599, stats: { totalLessons: 8, totalSections: 2 }, category: null, instructor: null, price: { original: 200 } });
  assert.equal(course.totalLessons, 8);
  assert.equal(course.totalSections, 2);
  assert.equal(course.durationLabel, "1h");
  assert.equal(course.price.current, 200);
  assert.equal(course.instructor.name, "Instructor not listed");
  assert.equal(formatDuration(0), "0 min");
});

test("processing objects and storage keys are never playback URLs", () => {
  const course = adaptRecordedCourse({ trailerVideo: { status: "COMPLETED", hls: { masterKey: "private/master.m3u8" } } });
  assert.equal(course.trailerVideo, null);
  assert.equal(adaptRecordedCourse({ trailerVideo: "private/master.m3u8" }).trailerVideo, null);
  assert.equal(adaptRecordedCourse({ trailerPlaybackUrl: "https://example.test/master.m3u8" }).trailerVideo, "https://example.test/master.m3u8");
});

test("thumbnail keys require a configured public media base", () => {
  assert.equal(resolveCourseImage("courses/id/thumbnail.webp", ""), null);
  assert.equal(resolveCourseImage("courses/id/thumbnail.webp", "https://media.example.test/"), "https://media.example.test/courses/id/thumbnail.webp");
  assert.equal(resolveCourseImage("https://example.test/image.webp", ""), "https://example.test/image.webp");
});

test("pagination totals use the server envelope and do not slice or reorder its page", () => {
  const result = normalizeRecordedCourseList({ success: true, data: { courses: [{ _id: "b" }, { _id: "a" }], pagination: { page: 2, limit: 2, skip: 2, totalCourses: 33, totalPages: 17 }, filters: { language: "English" } } });
  assert.deepEqual(result.courses.map((course) => course.id), ["b", "a"]);
  assert.equal(result.pagination.totalCourses, 33);
  assert.equal(result.pagination.page, 2);
});

test("empty pages preserve zero totals and malformed envelopes fail visibly", () => {
  assert.equal(normalizeRecordedCourseList({ data: { courses: [], pagination: { totalCourses: 0, totalPages: 0 } } }).pagination.totalPages, 0);
  assert.throws(() => normalizeRecordedCourseList({ data: [] }), /Invalid course list response/);
});
