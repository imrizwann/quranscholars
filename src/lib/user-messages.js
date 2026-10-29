const fallbackMessage = "We could not complete this action. Please try again shortly.";
const statuses = {
  400: "Please check the information you entered and try again.",
  401: "Please sign in again to continue.",
  403: "You do not have permission to perform this action.",
  404: "This item is no longer available. Refresh the page to see the latest information.",
  409: "This item has changed. Refresh the page before trying again.",
  413: "The file is too large. Please choose a smaller file.",
  429: "Please wait a few minutes before trying again.",
  501: "This feature is not available yet.",
  502: "We are having trouble connecting. Please try again shortly.",
  503: "This service is temporarily unavailable. Please try again shortly.",
  504: "This is taking longer than expected. Refresh the page to check before trying again.",
};

// Never render arbitrary exception messages, response HTML, or library details.
// userMessage is produced by the API's reviewed response boundary, or locally
// by userFacingError. Older deployments fall back to status-based wording.
export function userMessage(error, fallback = fallbackMessage) {
  if (typeof error?.data?.userMessage === "string" && error.data.userMessage.trim()) {
    const fields = error.data.code === "VALIDATION_ERROR" ? error.data.errors : null;
    const messages = Array.isArray(fields)
      ? [...new Set(fields.map(field => field.message).filter(message => typeof message === "string"))].slice(0, 3)
      : [];
    return messages.length ? messages.join(" ") : error.data.userMessage;
  }
  if (typeof error?.userMessage === "string" && error.userMessage.trim()) return error.userMessage;
  if (error?.status === "FETCH_ERROR") return "We could not reach the server. Please try again shortly.";
  if (error?.status === "TIMEOUT_ERROR" || error?.name === "AbortError") return "This action was interrupted. Refresh the page to check before trying again.";
  if (error?.data?.code === "CSRF_REJECTED") return "We could not verify this action. Refresh the page and try again. If it continues, contact support.";
  const status = Number(error?.originalStatus || error?.status);
  // Compatibility with the previous API while the deployments are updated.
  if (status === 401 && error?.data?.message === "Invalid email or password") return "The email or password is incorrect. Please check your details and try again.";
  if (status === 409 && error?.data?.message === "User already exists") return "An account with this email already exists. Please sign in instead.";
  return statuses[status] || fallback;
}

export function userFacingError(message) {
  return Object.assign(new Error(message), { userMessage: message });
}

export function videoErrorMessage(error) {
  if (["INVALID_VIDEO", "INVALID_MEDIA", "UNSUPPORTED_VIDEO", "UNSUPPORTED_MEDIA", "INVALID_INPUT"].includes(error?.code))
    return "We could not read this video. Check that it plays on your device, then upload a supported video file.";
  return "We could not prepare this video. Please try again. If it continues, contact support.";
}

export function courseStatusLabel(status) {
  return { DRAFT: "Draft", Draft: "Draft", PUBLISHED: "Published", Published: "Published", ARCHIVED: "Archived", Archived: "Archived" }[status] || "Not published";
}

export function videoPreparationMessage(result) {
  if (result?.status === "FAILED") throw userFacingError(videoErrorMessage(result.lastError));
  if (result?.status === "COMPLETED") return "Your video is ready to watch.";
  if (result?.waitingForQueue) return "Your video is waiting to be prepared. You can leave this page.";
  return "Your video is being prepared for playback. You can leave this page.";
}
