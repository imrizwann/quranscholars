import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { userMessage } from "../../lib/user-messages.js";

export function ReviewStatus({ status }) {
  const [label, Icon] = { pending: ["Pending review", Clock3], approved: ["Approved", CheckCircle2], rejected: ["Rejected", XCircle] }[status] || ["Unknown", Clock3];
  return <span className={`review-status review-status-${status}`}><Icon size={15} aria-hidden="true" />{label}</span>;
}
export function ReviewError({ error, retry, busy }) {
  return <div className="studio-panel review-error" role="alert"><h2>We could not load applications</h2><p>{userMessage(error)}</p><button className="cw-button" type="button" disabled={busy} onClick={retry}>Try again</button></div>;
}
