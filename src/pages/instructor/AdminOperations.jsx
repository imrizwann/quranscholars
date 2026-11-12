import { Link } from "react-router-dom";
import { Activity, AlertCircle, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { DashboardMetrics } from "@/components/lms/DashboardParts.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { useGetOperationsQuery, useRunOperationMutation } from "@/services/api/operationsApi.js";
import { userMessage } from "@/lib/user-messages.js";
import "./admin-operations.css";

const checks = [
  "A fresh learner can register, verify email, sign in, and reset a forgotten password.",
  "A hosted test purchase confirms access and sends one confirmation email; an interrupted checkout recovers the same order.",
  "On a real phone, a learner can play and resume lessons, download resources, and complete an optional quiz.",
  "A different, unenrolled account receives 403 for private lessons and resources.",
  "Atlas shows a recent successful backup; a snapshot has been restored and checked in a separate test cluster.",
  "The frontend and API health checks are monitored, and the team knows where to find request-reference error logs.",
];
export default function AdminOperations() {
  const query = useGetOperationsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [run, mutation] = useRunOperationMutation();
  const data = !query.isError ? query.currentData : null;
  const status = Number(query.error?.originalStatus || query.error?.status);
  const accessDenied = status === 401 || status === 403;
  const queryError = query.error ? { ...query.error, userMessage: status === 404
    ? "The Operations API is not available on this deployment. Update the API before using this page."
    : status === 403 ? "Administrator access could not be verified. Sign in with an administrator account. If other admin pages work, share the support reference with the team."
      : userMessage(query.error) } : undefined;
  async function act(action, id) {
    try {
      const result = await run({ action, id }).unwrap();
      toast.success(action === "emails" ? "Email delivery checked" : "Payment status checked", { description: action === "emails" ? `${result.sent} sent; ${result.pending} pending; ${result.uncertain} need delivery review.` : `The verified order status is ${result.state.replaceAll("_", " ")}.` });
    } catch (error) { toast.error("The check could not finish", { description: userMessage(error) }); }
  }
  return <WorkspacePage eyebrow="Administration" title="Operations" description="Check service readiness and the items that may need attention. Refresh for the latest status." action={<AsyncButton className="cw-button" loading={query.isFetching} loadingLabel="Refreshing" onClick={query.refetch}><RefreshCw size={16} aria-hidden="true" />Refresh</AsyncButton>}>
    <DashboardMetrics items={[
      { label: "Database", value: data ? data.databaseReady ? "Connected" : "Unavailable" : undefined, icon: Activity, note: "Application database connection" },
      { label: "Email delivery", value: data ? data.emailConfigured ? "Configured" : "Setup needed" : undefined, icon: Mail, note: "Configuration only; delivery is checked separately" },
      { label: "Online checkout", value: data ? data.checkoutConfigured ? "Configured" : "Setup needed" : undefined, icon: ShieldCheck, note: "Configuration only; no payment is attempted" },
    ].map(item => ({ ...item, value: item.value ?? (query.isError ? "Not checked" : undefined), loading: !data && !query.isError, note: query.isError ? "Status could not be retrieved" : item.note }))} />
    <QueryMessage query={{ data, error: queryError, loading: !data && !query.isError, refresh: query.refetch }} label="Checking operations" />
    {query.isError && <div className="public-actions mt-4">{accessDenied && <Link className="cw-button" to="/login" state={{ from: "/admin/operations" }}>Sign in again</Link>}{query.error?.data?.requestId && <p className="cw-muted">Support reference: {query.error.data.requestId}</p>}</div>}
    {data && <>
      <p className="cw-muted mt-4">Checked {new Date(data.checkedAt).toLocaleString()}. Each list shows up to {data.listLimit} items. Unconfirmed orders may include abandoned checkouts; this does not mean money was captured.</p>
      <div className="operations-grid">
        <section className="studio-panel"><h2><AlertCircle size={19} aria-hidden="true" />Payment attention</h2>
          {!data.payments.length && !data.exceptions.length ? <p>No expired, unconfirmed checkouts or payment exceptions were found.</p> : <ul className="operations-list">
            {data.payments.map(item => <li key={item._id}><div><strong>Unconfirmed checkout</strong><p className="operations-reference">Reference: {item._id}</p><p>Expired {new Date(item.expiresAt).toLocaleDateString()}</p></div><AsyncButton className="cw-button" disabled={mutation.isLoading} loading={mutation.isLoading && mutation.originalArgs?.id === item._id} loadingLabel="Checking" onClick={() => act("payment", item._id)}>Check payment</AsyncButton></li>)}
            {data.exceptions.map(item => <li key={item._id}><div><strong>Payment needs review</strong><p className="operations-reference">Reference: {item._id}</p><p>{({ duplicate_purchase: "The learner already has access.", course_unavailable: "The original course is unavailable.", buyer_unavailable: "The learner account is unavailable.", own_course: "The buyer owns this course." })[item.reviewReason] || "Review the verified payment and enrollment records."}</p></div></li>)}
          </ul>}
          <Link to="/admin/revenue" className="cw-button mt-4">Open sales & payouts</Link>
        </section>
        <section className="studio-panel"><h2>Video preparation</h2><p>These failures belong to existing course media. The instructor can retry or replace the video in Course Studio.</p>
          {!data.failedLessons.length && !data.failedTrailers.length ? <p>No failed lesson or trailer videos were found.</p> : <ul className="operations-list">{[...data.failedLessons.map(item => ({ ...item, kind: "Lesson" })), ...data.failedTrailers.map(item => ({ ...item, kind: "Trailer" }))].map(item => <li key={`${item.kind}-${item._id}`}><div><strong>{item.title}</strong><p>{item.kind} video needs attention</p><p className="operations-reference">Course: {item.courseId || item._id}</p></div></li>)}</ul>}
        </section>
        <section className="studio-panel"><h2>Purchase confirmation emails</h2><p>{data.pendingEmails} pending · {data.uncertainEmails} need delivery review.</p><p>Retry checks up to three due emails. A sent confirmation is not sent again. Ambiguous deliveries outside the provider&apos;s retry window stay on hold to prevent duplicates.</p>
          {data.emailReviews?.length > 0 && <ul className="operations-list">{data.emailReviews.map(item => <li key={item._id}><div><strong>Check the provider delivery logs</strong><p className="operations-reference">Order: {item._id}</p><p className="operations-reference">Delivery key: purchase-{item._id}</p><p>Confirm whether the original email was delivered before considering a manual message.</p></div></li>)}</ul>}
          <AsyncButton className="cw-button mt-4" disabled={!data.emailConfigured || mutation.isLoading} loading={mutation.isLoading && mutation.originalArgs?.action === "emails"} loadingLabel="Checking delivery" onClick={() => act("emails")}>Retry pending emails</AsyncButton>
        </section>
        <section className="studio-panel"><h2>Backups & recovery</h2><p>Atlas Flex provides daily snapshots. The application cannot verify backup success or a completed restore from its database connection.</p><ol className="operations-steps"><li>Open Atlas → your cluster → Backups and check the latest snapshot.</li><li>Restore a snapshot into a separate test cluster. Never overwrite the live cluster for a rehearsal.</li><li>Check accounts, courses, enrollments, purchases, and progress in the restored copy. Keep outgoing payments and emails disabled there.</li></ol><a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="cw-button mt-4">Open MongoDB Atlas</a>
        </section>
      </div>
    </>}
    <details className="studio-panel mt-6 operations-rehearsal"><summary>Pre-launch rehearsal</summary><p>Manual checks for your team. These boxes are a checklist for this visit, not an automated certification of the live site.</p><div>{checks.map((check, index) => <label key={check}><input type="checkbox" name={`release-check-${index}`} /><span>{check}</span></label>)}</div></details>
  </WorkspacePage>;
}
