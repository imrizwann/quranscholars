import test from "node:test";
import assert from "node:assert/strict";
import { parseDateOnly, formatDateOnly } from "../src/lib/date-only.js";

test("birth dates round-trip as local calendar dates", () => {
  for (const value of ["1900-01-01", "2000-02-29", "2024-12-31"]) {
    const date = parseDateOnly(value);
    assert.ok(date instanceof Date);
    assert.equal(formatDateOnly(date), value);
    assert.equal(date.getHours(), 0);
  }
});

test("invalid dates cannot roll into a different month", () => {
  for (const value of ["1900-02-29", "2023-02-29", "2024-02-30", "2024-13-01", "2024-00-01", "2024-01-00", "2024-1-1", "invalid", "", null]) {
    assert.equal(parseDateOnly(value), undefined);
  }
});
