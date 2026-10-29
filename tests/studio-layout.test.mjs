import test from "node:test";
import assert from "node:assert/strict";
import { curriculumOrder } from "../src/features/instructor-courses/studio-layout.js";

test("curriculum uses stored ordering without modifying records or presenting order gaps as numbering", () => {
  const records = Object.freeze([Object.freeze({ _id: "c", order: 40 }), Object.freeze({ _id: "b", order: 10 }), Object.freeze({ _id: "a", order: 10 })]);
  const sorted = curriculumOrder(records);
  assert.deepEqual(sorted.map((item) => item._id), ["a", "b", "c"]);
  assert.deepEqual(sorted.map((item, index) => ({ number: index + 1, order: item.order })), [
    { number: 1, order: 10 }, { number: 2, order: 10 }, { number: 3, order: 40 },
  ]);
  assert.deepEqual(records.map((item) => item._id), ["c", "b", "a"]);
  assert.deepEqual(curriculumOrder(), []);
});
