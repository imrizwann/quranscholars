import test from "node:test";
import assert from "node:assert/strict";
import { loginDestination } from "../src/components/guards/loginDestination.js";

test("sign-in returns learners and instructors to supported shared destinations", () => {
  for (const role of ["user", "instructor"]) {
    for (const path of ["/instructor/application", "/dashboard/learning?type=live-classes", "/dashboard/progress", "/get-started/instructor", "/profile", "/courses/tajweed", "/learn/tajweed/507f1f77bcf86cd799439011", "/learn/tajweed/lesson/507f1f77bcf86cd799439011#video"]) {
      assert.equal(loginDestination({ role }, path), path);
    }
  }
});

test("sign-in rejects external, malformed, unsupported and unauthorized private destinations", () => {
  const invalid = ["https://example.test", "//example.test", "/\\example.test", "/courses/../admin", "/courses/%2e%2e/admin", "/dashboard\n", "/admin/admissions", "javascript:alert(1)", null, {}, undefined];
  for (const path of invalid) {
    assert.equal(loginDestination({ role: "user" }, path), "/dashboard/learning");
    assert.equal(loginDestination({ role: "instructor" }, path), "/instructor/courses");
  }
  assert.equal(loginDestination({ role: "user" }, "/instructor/courses/new"), "/dashboard/learning");
  assert.equal(loginDestination({ role: "instructor" }, "/instructor/courses/new"), "/instructor/courses/new");
  assert.equal(loginDestination({ role: "instructor" }, "/instructor/dashboard"), "/instructor/dashboard");
  for (const path of ["/instructor/earnings", "/instructor/analytics"]) {
    assert.equal(loginDestination({ role: "instructor" }, path), path);
    assert.equal(loginDestination({ role: "user" }, path), "/dashboard/learning");
  }
});


test("admin review links survive login without exposing admin destinations to other roles", () => {
  const path = "/admin/instructor-applications/507f1f77bcf86cd799439011";
  assert.equal(loginDestination({ role: "admin" }, path), path);
  assert.equal(loginDestination({ role: "admin" }), "/admin/instructor-applications");
  assert.equal(loginDestination({ role: "user" }, path), "/dashboard/learning");
  assert.equal(loginDestination({ role: "instructor" }, path), "/instructor/courses");
});

test("retired admission destinations redirect to enrollment and instructor review", () => {
  for (const role of ["user", "instructor", "admin"]) {
    assert.equal(loginDestination({ role }, "/admission"), "/courses");
    assert.equal(loginDestination({ role }, "/admission/?form=open"), "/courses");
    assert.equal(loginDestination({ role }, "//example.test/admission"), role === "admin" ? "/admin/instructor-applications" : role === "instructor" ? "/instructor/courses" : "/dashboard/learning");
  }
  assert.equal(loginDestination({ role: "admin" }, "/admin/admissions?status=pending"), "/admin/instructor-applications");
  assert.equal(loginDestination({ role: "user" }, "/admin/admissions"), "/dashboard/learning");
});
