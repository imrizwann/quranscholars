import test from "node:test";
import assert from "node:assert/strict";
import { coursePrice } from "../src/features/instructor-courses/course-price.js";

test("course creation preserves optional and zero sale prices", () => {
  assert.deepEqual(coursePrice("1500", ""), { original: 1500 });
  assert.deepEqual(coursePrice("1500", "  "), { original: 1500 });
  assert.deepEqual(coursePrice("1500", "1200.50"), { original: 1500, sale: 1200.5 });
  assert.deepEqual(coursePrice("1500", "0"), { original: 1500, sale: 0 });
  assert.deepEqual(coursePrice("1500", "1500"), { original: 1500, sale: 1500 });
});

test("course creation rejects invalid or inverted prices before submitting", () => {
  for (const original of ["", "0", "-1", "bad", "Infinity"]) {
    assert.throws(() => coursePrice(original), /original price greater than zero/);
  }
  for (const sale of ["-1", "1500.01", "bad", "Infinity"]) {
    assert.throws(() => coursePrice("1500", sale), /Sale price must be between/);
  }
});
