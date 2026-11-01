import { userMessage } from "../../lib/user-messages.js";

export function enrollmentFailureMessage(error) {
  let message;
  if (error?.status === 404) message = "This course is not open for enrollment yet.";
  else if (error?.status === 503 && !error?.data?.code) {
    // Compatibility with APIs that do not yet distinguish setup failures.
    message = "Enrollment is temporarily unavailable. Please try again later. If you already started payment, retry here to resume the same checkout.";
  } else message = userMessage(error);
  const requestId = error?.data?.requestId;
  // Only display the API's generated correlation ID, never response internals.
  return typeof requestId === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)
    ? `${message} Support reference: ${requestId}.` : message;
}
