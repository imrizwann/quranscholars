import test from "node:test";
import assert from "node:assert/strict";
import { enrollmentFailureMessage } from "../src/features/payments/enrollment-feedback.js";

test("checkout respects reviewed setup messages instead of hiding every 503", () => {
  const requestId = "3d6cae63-3eb0-4baf-bf8a-e6f5ac4f164e";
  for (const [code, userMessage] of [
    ["PAYMENTS_NOT_CONFIGURED", "Purchases are not enabled on this site yet. Please contact our team."],
    ["PAYMENT_STORAGE_NOT_READY", "Enrollment setup is incomplete. Please contact our team before trying again."],
    ["DATABASE_UNAVAILABLE", "This service is temporarily unavailable. Please try again shortly."],
  ]) {
    assert.equal(enrollmentFailureMessage({ status: 503, data: { code, userMessage, requestId } }), `${userMessage} Support reference: ${requestId}.`);
  }
});

test("legacy checkout failures stay safe and do not expose arbitrary diagnostics", () => {
  assert.match(enrollmentFailureMessage({ status: 503 }), /resume the same checkout/);
  assert.match(enrollmentFailureMessage({ status: 404 }), /not open for enrollment/);
  const error = { status: 500, data: { message: "private stack trace", requestId: "private-token-value" } };
  assert.doesNotMatch(enrollmentFailureMessage(error), /private|stack|token/);
});
