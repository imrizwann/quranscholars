import test from "node:test";
import assert from "node:assert/strict";
import { courseLearningLists, parseCourseMetadataLists } from "../src/features/instructor-courses/course-metadata-lists.js";

test("learning details trim pasted lines and preserve distinct list fields", () => {
  const values = Object.freeze({ outcomes: "  Read confidently  \r\n\r\nPractise Tajweed\r\n ", requirements: "  Daily practice  ", audience: " Beginners \nReturning learners" });
  const result = parseCourseMetadataLists(values, courseLearningLists);
  assert.deepEqual(result, { lists: { outcomes: ["Read confidently", "Practise Tajweed"], requirements: ["Daily practice"], audience: ["Beginners", "Returning learners"] }, errors: {} });
  assert.equal(values.outcomes, "  Read confidently  \r\n\r\nPractise Tajweed\r\n ");
});

test("draft creation can omit learning details without adding editing-only fields", () => {
  for (const values of [{}, { outcomes: " \n", requirements: "", audience: "\r\n" }]) {
    assert.deepEqual(parseCourseMetadataLists(values, courseLearningLists), { lists: { outcomes: [], requirements: [], audience: [] }, errors: {} });
  }
});

test("creation and editing enforce item counts and per-item limits consistently", () => {
  const boundary = { outcomes: Array(20).fill("a".repeat(200)).join("\n"), requirements: "b".repeat(200), audience: "c".repeat(200), tags: "d".repeat(50) };
  assert.deepEqual(parseCourseMetadataLists(boundary).errors, {});
  for (const key of ["outcomes", "requirements", "audience"]) {
    for (const value of [Array(21).fill("One item").join("\n"), "a".repeat(201)]) {
      const creation = parseCourseMetadataLists({ [key]: value }, courseLearningLists);
      const editing = parseCourseMetadataLists({ [key]: value });
      assert.ok(creation.errors[key]);
      assert.equal(creation.errors[key], editing.errors[key]);
    }
  }
  assert.ok(parseCourseMetadataLists({ tags: "a".repeat(51) }).errors.tags);
});
