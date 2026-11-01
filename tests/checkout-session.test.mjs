import test from "node:test";
import assert from "node:assert/strict";
import { checkoutAttempt, readCheckout, saveCheckout, clearCheckout, hostedCheckoutUrl } from "../src/features/payments/checkout-session.js";

test("checkout retries preserve one key across reloads and stay scoped to account/course", async () => {
  const previous = globalThis.localStorage;
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  try {
    const attempt = checkoutAttempt("buyer-1", "course-1");
    assert.deepEqual(checkoutAttempt("buyer-1", "course-1"), attempt, "network retry reuses key");
    saveCheckout("buyer-1", "course-1", { ...attempt, intentId: "a".repeat(24) });
    const reloaded = await import(`../src/features/payments/checkout-session.js?reload=${Date.now()}`);
    assert.equal(reloaded.checkoutAttempt("buyer-1", "course-1").intentId, "a".repeat(24));
    assert.equal(reloaded.checkoutAttempt("buyer-1", "course-1").idempotencyKey, attempt.idempotencyKey);
    assert.notEqual(checkoutAttempt("buyer-2", "course-1").idempotencyKey, attempt.idempotencyKey);
    assert.notEqual(checkoutAttempt("buyer-1", "course-2").idempotencyKey, attempt.idempotencyKey);
    clearCheckout("buyer-1", "course-1");
    assert.equal(readCheckout("buyer-1", "course-1"), null);
    assert.notEqual(checkoutAttempt("buyer-1", "course-1").idempotencyKey, attempt.idempotencyKey);
    storage.set("qs:checkout:bad:bad", JSON.stringify({ idempotencyKey: "unsafe", intentId: "../admin" }));
    assert.equal(readCheckout("bad", "bad"), null);
    storage.set("qs:checkout:bad:bad", JSON.stringify({ ...attempt, intentId: "../admin" }));
    assert.deepEqual(readCheckout("bad", "bad"), attempt);
  } finally { globalThis.localStorage = previous; }
});

test("disabled storage still supports safe retries during the current session", () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw Error("disabled"); }, setItem() { throw Error("disabled"); }, removeItem() { throw Error("disabled"); } };
  try {
    const attempt = checkoutAttempt("private-user", "course");
    assert.deepEqual(checkoutAttempt("private-user", "course"), attempt);
    clearCheckout("private-user", "course");
    assert.equal(readCheckout("private-user", "course"), null);
  } finally { globalThis.localStorage = previous; }
});

test("hosted checkout accepts only an HTTPS destination without URL credentials", () => {
  assert.equal(hostedCheckoutUrl({ url: "https://checkout.example/pay?id=abc" }), "https://checkout.example/pay?id=abc");
  for (const url of ["javascript:alert(1)", "http://checkout.example", "//checkout.example", "https://user:pass@checkout.example", null]) assert.equal(hostedCheckoutUrl({ url }), null);
});

test("a failed payment retires only its own retry key, including after a replacement response is lost", () => {
  const original = checkoutAttempt("retry-user", "course");
  const intentId = "b".repeat(24);
  saveCheckout("retry-user", "course", { ...original, intentId });
  assert.equal(checkoutAttempt("retry-user", "course", { intentId, state: "pending" }).idempotencyKey, original.idempotencyKey);
  const failed = { intentId, state: "failed" };
  const replacement = checkoutAttempt("retry-user", "course", failed);
  assert.notEqual(replacement.idempotencyKey, original.idempotencyKey);
  assert.equal(checkoutAttempt("retry-user", "course", failed).idempotencyKey, replacement.idempotencyKey, "retry after lost replacement response keeps its key");
  saveCheckout("retry-user", "course", { ...replacement, intentId: "c".repeat(24) });
  assert.equal(checkoutAttempt("retry-user", "course", failed).idempotencyKey, replacement.idempotencyKey, "stale status cannot retire a different intent");
  clearCheckout("retry-user", "course");
});
