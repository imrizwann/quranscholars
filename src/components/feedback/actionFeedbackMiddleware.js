import { toast } from "sonner";
import { actionFeedback, actionFailure } from "../../lib/action-feedback.js";

// Whitelist user-initiated mutations. Background reads, watch heartbeats, and
// upload reservations never generate toasts. A request settles its own toast.
export function createActionFeedbackMiddleware(notify = toast) {
  return store => {
    const pending = new Map();
    return next => action => {
      const before = store.getState().user?.user?._id;
      const result = next(action);
      const userId = store.getState().user?.user?._id;
      if (before !== userId) {
        for (const item of pending.values()) notify.dismiss(item.id);
        pending.clear();
        notify.dismiss();
      }
      const [api, operation, phase] = (action.type || "").split("/");
      if (operation !== "executeMutation") return result;
      const config = actionFeedback(api, action.meta?.arg?.endpointName);
      if (!config) return result;
      const key = action.meta.requestId;
      if (phase === "pending" && userId) {
        const id = `action:${key}`;
        pending.set(key, { id, userId });
        notify.loading(config.pending, { id, duration: Infinity });
      } else if (["fulfilled", "rejected"].includes(phase)) {
        const item = pending.get(key);
        pending.delete(key);
        if (!item || item.userId !== userId) return result;
        if (action.meta.aborted || action.meta.condition) { notify.dismiss(item.id); return result; }
        const feedback = phase === "fulfilled" ? config.success(action.payload || {}) : actionFailure(config, action.payload || action.error);
        notify[feedback.type](feedback.title, { id: item.id, description: feedback.description, duration: feedback.type === "error" ? 8000 : 5000 });
      }
      return result;
    };
  };
}
export const actionFeedbackMiddleware = createActionFeedbackMiddleware();
