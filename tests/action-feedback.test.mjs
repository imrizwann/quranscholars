import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import { createActionFeedbackMiddleware } from "../src/components/feedback/actionFeedbackMiddleware.js";
import { notificationPresentation, notificationDate } from "../src/realtime/notification-presentation.js";

function setup() {
  const calls = [];
  const notify = Object.fromEntries(["loading", "success", "error", "info", "dismiss"].map(type => [type, (...args) => { calls.push({ type, args }); }]));
  const store = configureStore({ reducer: { user: (state = { user: { _id: "first" } }, action) => action.type === "user/setUser" ? { user: action.payload } : state }, middleware: defaults => defaults().concat(createActionFeedbackMiddleware(notify)) });
  const action = (phase, endpointName, payload, { api = "instructorCoursesApi", requestId = "one", ...meta } = {}) => store.dispatch({ type: `${api}/executeMutation/${phase}`, payload, meta: { requestId, arg: { endpointName }, ...meta } });
  return { calls, store, action };
}
test("mutations replace their loading toast with action-specific success or safe error feedback", () => {
  const { calls, action } = setup();
  action("pending", "createCourse");
  action("fulfilled", "createCourse", { courseId: "course" });
  assert.deepEqual(calls.map(item => item.type), ["loading", "success"]);
  assert.equal(calls[0].args[1].id, calls[1].args[1].id);
  assert.equal(calls[1].args[0], "Course created");
  action("pending", "createLesson", undefined, { requestId: "two" });
  action("rejected", "createLesson", { status: 500, data: { stack: "PRIVATE DATABASE CREDENTIALS", message: "secret internals" } }, { requestId: "two" });
  assert.equal(calls.at(-1).type, "error");
  assert.match(calls.at(-1).args[0], /Adding lesson/);
  assert.doesNotMatch(JSON.stringify(calls), /CREDENTIALS|internals/);
});
test("background writes, aborted requests, late account responses and duplicate completion actions never toast success", () => {
  const { calls, action, store } = setup();
  action("pending", "recordLessonWatch", undefined, { api: "learnerApi" });
  action("fulfilled", "recordLessonWatch", {}, { api: "learnerApi" });
  assert.equal(calls.length, 0);
  action("pending", "createSection");
  action("rejected", "createSection", {}, { aborted: true });
  assert.equal(calls.at(-1).type, "dismiss");
  action("pending", "publishCourse");
  store.dispatch({ type: "user/setUser", payload: { _id: "second" } });
  action("fulfilled", "publishCourse", {});
  assert.equal(calls.filter(item => item.type === "success").length, 0);
  action("pending", "publishCourse", undefined, { requestId: "new" });
  action("fulfilled", "publishCourse", {}, { requestId: "new" });
  action("fulfilled", "publishCourse", {}, { requestId: "new" });
  assert.equal(calls.filter(item => item.type === "success").length, 1);
});
test("application resubmission and checkout feedback reflect confirmed server outcomes", () => {
  const { calls, action } = setup();
  action("pending", "submitInstructorApplication", undefined, { api: "instructorApplicationApi" });
  action("fulfilled", "submitInstructorApplication", { application: { status: "pending", revision: 2 } }, { api: "instructorApplicationApi" });
  assert.equal(calls.at(-1).args[0], "Application resubmitted");
  action("pending", "createCourseCheckout", undefined, { api: "paymentApi" });
  action("fulfilled", "createCourseCheckout", { state: "pending" }, { api: "paymentApi" });
  assert.equal(calls.at(-1).type, "info");
  assert.doesNotMatch(calls.at(-1).args[0], /enrolled|confirmed|completed/i);
  action("pending", "createCourseCheckout", undefined, { api: "paymentApi" });
  action("fulfilled", "createCourseCheckout", { state: "paid", isMockPayment: true }, { api: "paymentApi" });
  assert.equal(calls.at(-1).args[0], "Test purchase completed");
});
test("notification links are kind-specific local routes and never accept external URLs or malformed dates", () => {
  for (const kind of ["instructor.approved", "instructor.rejected"]) assert.equal(notificationPresentation({ kind }).to, "/instructor/application");
  assert.equal(notificationPresentation({ kind: "enrollment.active", courseSlug: "tajweed-basics" }).to, "/learn/tajweed-basics");
  for (const courseSlug of ["https://evil.example", "//evil.example", "../admin", "a?token=secret", "a%2fb"]) assert.equal(notificationPresentation({ kind: "enrollment.active", courseSlug }).to, "/dashboard/learning");
  assert.equal(notificationPresentation({ kind: "video.failed", courseId: "invalid" }).to, "/instructor/courses");
  assert.equal(notificationPresentation({ kind: "unknown", url: "https://evil.example" }).to, "/dashboard/learning");
  assert.equal(notificationDate("invalid"), "Recent update");
});
