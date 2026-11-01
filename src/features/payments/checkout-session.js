const memory = new Map();
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const storageKey = (userId, courseId) => `qs:checkout:${userId}:${courseId}`;

// These are retry identifiers, not access tokens. Account/course scope prevents
// one account from resuming another account's checkout after signing in.
export function readCheckout(userId, courseId) {
  const key = storageKey(userId, courseId);
  let value = memory.get(key);
  try { value = JSON.parse(localStorage.getItem(key)) || value; } catch { /* Storage can be disabled. */ }
  if (!uuid.test(value?.idempotencyKey)) return null;
  return { idempotencyKey: value.idempotencyKey, ...(/^[a-f0-9]{24}$/i.test(value.intentId) ? { intentId: value.intentId } : {}) };
}
export function saveCheckout(userId, courseId, value) {
  const key = storageKey(userId, courseId);
  memory.set(key, value);
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* In-memory retry still works. */ }
  return value;
}
export function checkoutAttempt(userId, courseId, payment) {
  const stored = readCheckout(userId, courseId);
  // A terminal result may retire only its own attempt. If the replacement
  // request loses its response, the old payment must not rotate its new key.
  if (stored?.intentId && stored.intentId === payment?.intentId && ["failed", "refunded", "disputed"].includes(payment.state)) clearCheckout(userId, courseId);
  return readCheckout(userId, courseId) || saveCheckout(userId, courseId, { idempotencyKey: crypto.randomUUID() });
}
export function clearCheckout(userId, courseId) {
  const key = storageKey(userId, courseId);
  memory.delete(key);
  try { localStorage.removeItem(key); } catch { /* Nothing else to clear. */ }
}
export function hostedCheckoutUrl(checkout) {
  try {
    const url = new URL(checkout?.url);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}
