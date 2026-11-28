import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, CircleAlert, ClipboardList, Copy, CreditCard, DatabaseBackup, ExternalLink, Mail, RefreshCw, ShieldCheck, Video, XCircle } from "lucide-react";
import { toast } from "sonner";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
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
const REHEARSAL_KEY = "darslearn:operations-rehearsal";
const reviewReasons = { duplicate_purchase: "The learner already has access.", course_unavailable: "The original course is unavailable.", buyer_unavailable: "The learner account is unavailable.", own_course: "The buyer owns this course." };
const stateLabels = { paid: "Paid", pending: "Still unpaid", failed: "Closed, not paid", refunded: "Refunded", disputed: "Disputed", review_required: "Needs review" };

const dateTime = value => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "";
function ago(value, now = Date.now()) {
  if (!value) return "";
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of units) if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  return format.format(seconds, "second");
}
function money(item) {
  if (!Number.isFinite(item?.amountMinor) || !item.currency) return null;
  const exponent = Number.isFinite(item.currencyExponent) ? item.currencyExponent : 2;
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency }).format(item.amountMinor / 10 ** exponent); }
  catch { return `${item.amountMinor / 10 ** exponent} ${item.currency}`; }
}

function Reference({ label, value }) {
  if (!value) return null;
  async function copy() {
    try { await navigator.clipboard.writeText(String(value)); toast.success(`${label} copied`); }
    catch { toast.error("Copy failed", { description: "Select the reference and copy it manually." }); }
  }
  return <span className="ops-reference"><span>{label}</span><code>{String(value)}</code><button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`} title={`Copy ${label.toLowerCase()}`}><Copy size={13} aria-hidden="true" /></button></span>;
}
function CourseLine({ course, fallbackId }) {
  if (!course) return <span className="ops-course">Course {fallbackId ? <code>{String(fallbackId)}</code> : "unavailable"}</span>;
  return <span className="ops-course">{course.slug ? <Link to={`/courses/${encodeURIComponent(course.slug)}`}>{course.title}<ArrowUpRight size={13} aria-hidden="true" /></Link> : course.title}{course.instructorName && <span> · {course.instructorName}</span>}</span>;
}
function SectionHeading({ id, icon: Icon, title, count, total, description, action }) {
  return <div className="ops-section-head">
    <span className="ops-section-icon" aria-hidden="true"><Icon size={18} /></span>
    <div><h2 id={id}>{title}{Number.isFinite(count) && <span className="ops-count" data-zero={count === 0 || undefined}>{total > count ? `${count} of ${total}` : count}</span>}</h2>{description && <p>{description}</p>}</div>
    {action}
  </div>;
}
function Empty({ children }) { return <p className="ops-empty"><CheckCircle2 size={16} aria-hidden="true" />{children}</p>; }

function Rehearsal() {
  const [done, setDone] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(REHEARSAL_KEY)) || []); } catch { return new Set(); } });
  useEffect(() => { try { localStorage.setItem(REHEARSAL_KEY, JSON.stringify([...done])); } catch { /* Storage can be unavailable. */ } }, [done]);
  const toggle = index => setDone(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else next.add(index); return next; });
  return <details className="studio-panel ops-panel operations-rehearsal">
    <summary><span className="ops-section-icon" aria-hidden="true"><ClipboardList size={18} /></span><span><strong>Pre-launch rehearsal</strong><small>{done.size} of {checks.length} checked on this browser</small></span></summary>
    <p>Manual checks for your team. These boxes are a checklist for this visit, not an automated certification of the live site. Progress is saved in this browser only.</p>
    <progress className="ops-progress" value={done.size} max={checks.length} aria-label="Rehearsal checks completed" />
    <div>{checks.map((check, index) => <label key={check}><input type="checkbox" name={`release-check-${index}`} checked={done.has(index)} onChange={() => toggle(index)} /><span>{check}</span></label>)}</div>
    {done.size > 0 && <button type="button" className="cw-button cw-button-compact ops-reset" onClick={() => setDone(new Set())}>Clear checklist</button>}
  </details>;
}

export default function AdminOperations() {
  const query = useGetOperationsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [run, mutation] = useRunOperationMutation();
  const [verified, setVerified] = useState({});
  const [, setTick] = useState(0);
  useEffect(() => { const timer = setInterval(() => setTick(value => value + 1), 30_000); return () => clearInterval(timer); }, []);
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
      if (action === "payment") setVerified(previous => ({ ...previous, [id]: result.state }));
      toast.success(action === "emails" ? "Email delivery checked" : "Payment status checked", { description: action === "emails" ? `${result.sent} sent; ${result.pending} pending; ${result.uncertain} need delivery review.` : `The verified order status is ${result.state.replaceAll("_", " ")}.` });
    } catch (error) { toast.error("The check could not finish", { description: userMessage(error) }); }
  }

  const totals = data ? { payments: data.totals?.payments ?? data.payments.length, exceptions: data.totals?.exceptions ?? data.exceptions.length, lessons: data.totals?.failedLessons ?? data.failedLessons.length, trailers: data.totals?.failedTrailers ?? data.failedTrailers.length } : null;
  const services = [
    { label: "Database", ok: data?.databaseReady, good: "Connected", bad: "Unavailable", icon: Activity, note: "Application database connection" },
    { label: "Email delivery", ok: data?.emailConfigured, good: "Configured", bad: "Setup needed", icon: Mail, note: "Configuration only; delivery is checked separately" },
    { label: "Online checkout", ok: data?.checkoutConfigured, good: "Configured", bad: "Setup needed", icon: ShieldCheck, note: "Configuration only; no payment is attempted" },
  ];
  const attention = data ? [
    { id: "ops-payments", label: "Unconfirmed checkouts", value: totals.payments, icon: CreditCard },
    { id: "ops-payments", label: "Payments to review", value: totals.exceptions, icon: AlertTriangle, critical: true },
    { id: "ops-videos", label: "Failed videos", value: totals.lessons + totals.trailers, icon: Video },
    { id: "ops-emails", label: "Emails on hold", value: data.uncertainEmails, icon: Mail, critical: true },
  ] : [];
  const servicesDown = data ? services.filter(service => !service.ok).length : 0;
  const issueCount = attention.reduce((sum, item) => sum + item.value, 0);
  const tone = !data ? null : !data.databaseReady || totals.exceptions > 0 ? "critical" : servicesDown || issueCount ? "warning" : "ok";
  const videos = data ? [...data.failedLessons.map(item => ({ ...item, kind: "Lesson" })), ...data.failedTrailers.map(item => ({ ...item, kind: "Trailer" }))] : [];

  return <WorkspacePage eyebrow="Administration" title="Operations" description="Service readiness and the items that may need your attention." action={<div className="ops-header-action">{data && <span className="ops-checked" title={dateTime(data.checkedAt)}>Checked {ago(data.checkedAt)}</span>}<AsyncButton className="cw-button" loading={query.isFetching} loadingLabel="Refreshing" onClick={query.refetch}><RefreshCw size={16} aria-hidden="true" />Refresh</AsyncButton></div>}>
    {data && <section className="ops-banner" data-tone={tone} role="status" aria-label="Overall status">
      {tone === "ok" ? <CheckCircle2 size={22} aria-hidden="true" /> : tone === "critical" ? <XCircle size={22} aria-hidden="true" /> : <CircleAlert size={22} aria-hidden="true" />}
      <div>
        <strong>{tone === "ok" ? "All clear" : !data.databaseReady ? "The database is unavailable" : `${issueCount + servicesDown} ${issueCount + servicesDown === 1 ? "item needs" : "items need"} attention`}</strong>
        <p>{tone === "ok" ? "Services are configured and nothing is waiting for review." : "Work through the sections below. Unconfirmed orders may include abandoned checkouts; this does not mean money was captured."}</p>
      </div>
    </section>}

    <div className="ops-services">{services.map(({ label, ok, good, bad, icon: Icon, note }) => {
      const value = data ? (ok ? good : bad) : query.isError ? "Not checked" : null;
      return <div className="ops-service" key={label} data-state={data ? (ok ? "ok" : "bad") : "unknown"}>
        <span className="ops-service-icon" aria-hidden="true"><Icon size={18} /></span>
        <div><span className="ops-service-label">{label}</span>{value ? <strong><span className="ops-dot" aria-hidden="true" />{value}</strong> : <span className="ops-skeleton" aria-hidden="true" />}<small>{query.isError ? "Status could not be retrieved" : note}</small></div>
      </div>;
    })}</div>

    <QueryMessage query={{ data, error: queryError, loading: !data && !query.isError, refresh: query.refetch }} label="Checking operations" />
    {query.isError && <div className="public-actions mt-4">{accessDenied && <Link className="cw-button" to="/login" state={{ from: "/admin/operations" }}>Sign in again</Link>}{query.error?.data?.requestId && <p className="cw-muted">Support reference: {query.error.data.requestId}</p>}</div>}

    {data && <>
      <nav className="ops-attention" aria-label="Items needing attention">{attention.map(item => <a key={item.label} href={`#${item.id}`} data-state={item.value === 0 ? "clear" : item.critical ? "critical" : "warning"}>
        <item.icon size={17} aria-hidden="true" /><strong>{item.value}</strong><span>{item.label}</span>
      </a>)}</nav>

      <section className="studio-panel ops-panel" aria-labelledby="ops-payments">
        <SectionHeading id="ops-payments" icon={CreditCard} title="Payments" count={data.payments.length + data.exceptions.length} total={totals.payments + totals.exceptions} description="Expired checkouts whose Razorpay order was never confirmed, and verified payments that need a decision. Checking asks Razorpay for the authoritative status." action={<Link to="/admin/revenue" className="cw-button cw-button-compact">Sales & payouts<ArrowUpRight size={15} aria-hidden="true" /></Link>} />
        {!data.payments.length && !data.exceptions.length ? <Empty>No expired, unconfirmed checkouts or payment exceptions.</Empty> : <ul className="ops-rows">
          {data.exceptions.map(item => <li key={item._id} data-tone="critical">
            <div className="ops-row-main"><span className="ops-tag" data-tone="critical">Payment needs review</span><strong>{reviewReasons[item.reviewReason] || "Review the verified payment and enrollment records."}</strong><CourseLine course={item.course} fallbackId={item.courseId} /></div>
            <div className="ops-row-meta">{money(item) && <span className="ops-amount">{money(item)}</span>}{item.updatedAt && <span title={dateTime(item.updatedAt)}>Updated {ago(item.updatedAt)}</span>}<Reference label="Reference" value={item._id} /><Reference label="Payment" value={item.providerPaymentId} /></div>
          </li>)}
          {data.payments.map(item => <li key={item._id}>
            <div className="ops-row-main"><span className="ops-tag">Unconfirmed checkout</span><CourseLine course={item.course} fallbackId={item.courseId} /></div>
            <div className="ops-row-meta">{money(item) && <span className="ops-amount">{money(item)}</span>}{item.createdAt && <span title={dateTime(item.createdAt)}>Started {ago(item.createdAt)}</span>}<span title={dateTime(item.expiresAt)}>Expired {ago(item.expiresAt)}</span><Reference label="Reference" value={item._id} /><Reference label="Order" value={item.providerOrderId} /></div>
            <div className="ops-row-action">{verified[item._id] && <span className="ops-verified" data-state={verified[item._id]}>{stateLabels[verified[item._id]] || verified[item._id].replaceAll("_", " ")}</span>}<AsyncButton className="cw-button cw-button-compact" disabled={mutation.isLoading} loading={mutation.isLoading && mutation.originalArgs?.id === item._id} loadingLabel="Checking" onClick={() => act("payment", item._id)}>Check payment</AsyncButton></div>
          </li>)}
        </ul>}
        {totals.payments + totals.exceptions > data.payments.length + data.exceptions.length && <p className="ops-more">Showing the oldest {data.payments.length + data.exceptions.length} of {totals.payments + totals.exceptions}. Resolve these and refresh to see the rest.</p>}
      </section>

      <section className="studio-panel ops-panel" aria-labelledby="ops-videos">
        <SectionHeading id="ops-videos" icon={Video} title="Video preparation" count={videos.length} total={totals.lessons + totals.trailers} description="Videos that failed to prepare for playback. The course's instructor can retry or replace them in Course Studio." />
        {!videos.length ? <Empty>No failed lesson or trailer videos.</Empty> : <ul className="ops-rows">{videos.map(item => <li key={`${item.kind}-${item._id}`}>
          <div className="ops-row-main"><span className="ops-tag">{item.kind} video failed</span><strong>{item.kind === "Trailer" ? "Course trailer" : item.title}</strong><CourseLine course={item.course} fallbackId={item.courseId || item._id} /></div>
          <div className="ops-row-meta">{item.updatedAt && <span title={dateTime(item.updatedAt)}>Last change {ago(item.updatedAt)}</span>}</div>
        </li>)}</ul>}
        {totals.lessons + totals.trailers > videos.length && <p className="ops-more">Showing {videos.length} of {totals.lessons + totals.trailers}.</p>}
      </section>

      <section className="studio-panel ops-panel" aria-labelledby="ops-emails">
        <SectionHeading id="ops-emails" icon={Mail} title="Purchase confirmation emails" description="Retry checks up to three due emails. A sent confirmation is never sent again; ambiguous deliveries outside the provider's retry window stay on hold to prevent duplicates." action={<AsyncButton className="cw-button cw-button-compact" disabled={!data.emailConfigured || mutation.isLoading} loading={mutation.isLoading && mutation.originalArgs?.action === "emails"} loadingLabel="Checking delivery" onClick={() => act("emails")}>Retry pending emails</AsyncButton>} />
        <div className="ops-stats"><div><strong>{data.pendingEmails}</strong><span>Waiting to send</span></div><div data-state={data.uncertainEmails ? "critical" : undefined}><strong>{data.uncertainEmails}</strong><span>On hold for delivery review</span></div></div>
        {data.emailReviews?.length > 0 && <ul className="ops-rows">{data.emailReviews.map(item => <li key={item._id} data-tone="critical">
          <div className="ops-row-main"><span className="ops-tag" data-tone="critical">Check the provider delivery logs</span><strong>Confirm whether the original email was delivered before considering a manual message.</strong><CourseLine course={item.course} fallbackId={item.courseId} /></div>
          <div className="ops-row-meta">{item.purchaseEmail?.firstAttemptAt && <span title={dateTime(item.purchaseEmail.firstAttemptAt)}>First attempt {ago(item.purchaseEmail.firstAttemptAt)}</span>}<Reference label="Order" value={item._id} /><Reference label="Delivery key" value={`purchase-${item._id}`} /></div>
        </li>)}</ul>}
      </section>

      <section className="studio-panel ops-panel" aria-labelledby="ops-backups">
        <SectionHeading id="ops-backups" icon={DatabaseBackup} title="Backups & recovery" description="Atlas Flex provides daily snapshots. The application cannot verify backup success or a completed restore from its database connection." action={<a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="cw-button cw-button-compact">Open MongoDB Atlas<ExternalLink size={14} aria-hidden="true" /></a>} />
        <ol className="ops-steps"><li>Open Atlas, choose your cluster, then Backups, and check the latest snapshot.</li><li>Restore a snapshot into a separate test cluster. Never overwrite the live cluster for a rehearsal.</li><li>Check accounts, courses, enrollments, purchases, and progress in the restored copy. Keep outgoing payments and emails disabled there.</li></ol>
      </section>
    </>}
    <Rehearsal />
  </WorkspacePage>;
}
