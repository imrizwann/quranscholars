import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Check, CheckCircle2, Download, FileText, History, Info, RefreshCw, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { WorkspacePage } from "../../components/lms/WorkspaceUI.jsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.jsx";
import { useGetAdminInstructorApplicationQuery, useReviewInstructorApplicationMutation, useAccessInstructorCertificateMutation } from "../../services/api/admin/instructorApplicationsApi.js";
import { userMessage } from "../../lib/user-messages.js";
import { ApplicantAvatar, ReviewError, ReviewStatus } from "./InstructorReviewUI.jsx";
import { reviewAge, reviewDate, yearsLabel } from "./review-format.js";
import "./instructor-review.css";
import "./instructor-review-refresh.css";
import FileTypeIcon, { FileTypeLabel } from "@/components/files/FileTypeIcon.jsx";
import { filePresentation } from "@/components/files/file-types.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";

const REASON_LIMIT = 1000, REASON_MIN = 10;
// One-click starters for common rejection reasons; the admin can edit them before saving.
const reasonStarters = [
  ["Unreadable certificate", "The certificate is unclear or unreadable. Please upload a clearer scan or photo of the original document."],
  ["Cannot verify", "We could not verify the certificate. Please upload an official, signed document from the issuing institution."],
  ["Contact details in biography", "Your biography includes personal contact details. Please remove them, as the biography is shown publicly, and apply again."],
  ["More experience detail", "Please add more detail about your teaching experience, the subjects you teach and who you have taught."],
];

function Certificate({ id, document, index, opened, onOpened }) {
  const [access, request] = useAccessInstructorCertificateMutation();
  const [link, setLink] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!link) return;
    const timer = setTimeout(() => setLink(null), Math.max(0, Date.parse(link.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [link]);
  async function prepare() {
    setError("");
    try { setLink(await access({ id, index }).unwrap()); }
    catch (cause) { setError(userMessage(cause)); }
    finally { request.reset(); }
  }
  return <li className="qs-file-surface" data-file-kind={filePresentation(document).kind} data-opened={opened || undefined}><FileTypeIcon name={document.name} contentType={document.contentType} /><div className="review-document-name"><strong>{document.name}</strong><p><FileTypeLabel name={document.name} contentType={document.contentType} /> &middot; {(document.size / 1024 / 1024).toFixed(1)} MB &middot; Private certificate{opened && <span className="review-opened"><Check size={12} strokeWidth={3} aria-hidden="true" />Opened</span>}</p>{error && <p className="review-error-text" role="alert">{error}</p>}{link && <p>Download link expires in one minute.</p>}</div>
    {link ? <a href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="cw-button cw-primary" onClick={() => onOpened(index)}><Download size={16} aria-hidden="true" />Download certificate</a> : <button type="button" className="cw-button" disabled={request.isLoading} onClick={prepare}><Download size={16} aria-hidden="true" />{request.isLoading ? "Preparing..." : "Prepare download"}</button>}
  </li>;
}

export default function AdminInstructorApplication() {
  const { id } = useParams();
  return <ApplicationReview key={id} id={id} />;
}

function ApplicationReview({ id }) {
  const query = useGetAdminInstructorApplicationQuery(id, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const [review, mutation] = useReviewInstructorApplicationMutation();
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState(false);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(() => new Set());
  const admin = useSelector(state => state.user.user);
  const location = useLocation();
  const from = location.state?.from;
  const back = typeof from === "string" && /^\/admin\/instructor-applications(?:\?[^#]*)?$/.test(from) ? from : "/admin/instructor-applications";
  const application = query.currentData?.application;
  useEffect(() => { setReason(""); setChecked(false); setDecision(null); setError(""); setOpened(new Set()); }, [application?.revision]);
  const canReview = application?.status === "pending" && query.currentData?.applicantRole === "user" && id !== admin?._id && application.documents.length > 0;
  const busy = mutation.isLoading;
  const documents = application?.documents || [];
  const allOpened = documents.length > 0 && opened.size >= documents.length;
  const lastReview = application?.reviewHistory?.length ? [...application.reviewHistory].sort((a, b) => (b.revision || 0) - (a.revision || 0))[0] : null;
  const waiting = application?.status === "pending" ? reviewAge(application.submittedAt) : null;
  const trimmed = reason.trim();
  function confirm(status) {
    if (!checked || !canReview || busy || query.isFetching) return;
    if (status === "rejected" && trimmed.length < REASON_MIN) { setError("Explain the rejection in at least 10 characters so the applicant knows why."); return; }
    setError(""); setDecision({ status, revision: application.revision || 1 });
  }
  async function decide() {
    if (busy || !decision) return;
    try { await review({ id, ...decision, reason: trimmed }).unwrap(); setError(""); setDecision(null); }
    catch (cause) { setError(userMessage(cause)); setDecision(null); }
  }
  function applyStarter(text) {
    setError("");
    setReason(previous => (previous.trim() ? `${previous.trim()}\n\n${text}` : text).slice(0, REASON_LIMIT));
  }
  const decisionLocked = !canReview || busy || query.isFetching;

  return <WorkspacePage eyebrow="Administration" title={application?.fullName || "Review application"} description={!application || application.status === "pending" ? "Check the applicant's teaching background and supporting certificates before recording your decision." : "This application has been decided. Its details and certificates are kept for your records."} action={<button type="button" className="cw-button" disabled={query.isFetching || busy} onClick={query.refetch}><RefreshCw size={16} aria-hidden="true" />Refresh</button>}>
    <Link className="public-back" to={back}><ArrowLeft size={16} aria-hidden="true" />All instructor applications</Link>
    {query.isError ? <ReviewError error={query.error} retry={query.refetch} busy={query.isFetching} /> : !application ? <div className="studio-panel"><LoadingState variant="inline" label="Loading application" /></div> : <>
      <div className="review-overview" role="status">
        <ApplicantAvatar name={application.fullName} size="lg" />
        <div className="review-overview-copy">
          <div className="review-overview-line"><ReviewStatus status={application.status} />{application.revision > 1 && <span className="review-resubmitted"><RotateCcw size={12} aria-hidden="true" />Submission {application.revision}</span>}</div>
          <span>Submitted {reviewDate(application.submittedAt)}{waiting && <> · <span className="review-waiting" data-overdue={waiting.days >= 3 || undefined}>waiting {waiting.label}</span></>}</span>
        </div>
      </div>

      {lastReview && application.status === "pending" && <div className="review-resubmission" role="note">
        <History size={18} aria-hidden="true" />
        <div><strong>Resubmitted after feedback</strong><p>Check that this submission addresses the last review by {lastReview.reviewerName || "an administrator"} on {reviewDate(lastReview.reviewedAt)}:</p><blockquote className="whitespace-pre-wrap">{lastReview.reason}</blockquote></div>
      </div>}

      <div className="studio-split review-layout"><div className="review-main">
        <section className="studio-panel"><div className="studio-section-title"><ShieldCheck size={20} /><h2>Teaching background</h2></div><p className="review-public-note"><Info size={14} aria-hidden="true" />{application.status === "approved" ? "Name, specialization, experience, languages and biography are shown on the public instructor profile." : application.status === "rejected" ? "These details were not published because the application was rejected." : "Name, specialization, experience, languages and biography become public when approved."}</p><dl className="application-summary-grid"><div><dt>Full name</dt><dd>{application.fullName}</dd></div><div><dt>Account email</dt><dd>{application.email}</dd></div><div><dt>Specialization</dt><dd>{application.specialization}</dd></div><div><dt>Teaching experience</dt><dd>{yearsLabel(application.experienceYears)}</dd></div><div><dt>Teaching languages</dt><dd>{application.languages}</dd></div><div className="application-wide"><dt>Biography</dt><dd className="whitespace-pre-wrap review-biography">{application.biography}</dd></div></dl></section>
        <section className="studio-panel"><div className="studio-section-title"><FileText size={20} /><h2>Supporting certificates</h2>{documents.length > 0 && application.status === "pending" && <span className="review-opened-count" data-done={allOpened || undefined}>{opened.size} of {documents.length} opened</span>}</div><p>{application.status === "pending" ? "Review each certificate before deciding. These documents are private and available only to administrators." : "Private documents submitted with this application. Only administrators can open them."}</p><ul className="review-documents">{documents.map((document, index) => <Certificate key={`${application.revision || 1}-${index}`} id={id} document={document} index={index} opened={opened.has(index)} onOpened={value => setOpened(previous => new Set(previous).add(value))} />)}</ul>{!documents.length && <p>No certificates were submitted.</p>}</section>
        {application.reviewHistory?.length > 0 && <details className="studio-panel review-history"><summary>Previous reviews ({application.reviewHistory.length})</summary>{application.reviewHistory.map(entry => <div className="review-history-entry" key={entry.revision}><h3>Submission {entry.revision}</h3><p>{entry.reviewerName || "Administrator"} · {reviewDate(entry.reviewedAt)}</p><p className="whitespace-pre-wrap">{entry.reason}</p></div>)}</details>}
      </div><aside className="studio-panel review-decision" aria-label="Application decision" data-status={application.status}>
        <h2>{application.status === "pending" ? "Review decision" : "Decision recorded"}</h2>
        {application.status === "pending" ? <>
          <p>Approve the applicant to grant instructor access and publish their professional profile.</p>
          <ol className="review-steps">
            <li data-done={allOpened || undefined}><span className="review-step-mark" aria-hidden="true">{allOpened ? <Check size={13} strokeWidth={3} /> : 1}</span><span>Open each certificate <small>{documents.length ? `${opened.size} of ${documents.length} opened` : "None submitted"}</small></span></li>
            <li data-done={checked || undefined}><span className="review-step-mark" aria-hidden="true">{checked ? <Check size={13} strokeWidth={3} /> : 2}</span><span>Confirm your review <small>Tick the confirmation below</small></span></li>
            <li><span className="review-step-mark" aria-hidden="true">3</span><span>Approve, or reject with a reason</span></li>
          </ol>
          <details className="review-guidance"><summary>What approval makes public</summary><p>The instructor&apos;s name, photo, and teaching background become public. Check that the biography contains no personal contact details or sensitive information. Certificates and review feedback stay private.</p></details>
          {!canReview && <p className="review-error-text" role="alert">This application cannot be reviewed because the account changed, is unavailable, belongs to you, or has no certificates. Refresh to check its current state.</p>}
          <label className="review-check"><input name="teachingDetailsReviewed" type="checkbox" checked={checked} disabled={busy || !canReview} onChange={event => setChecked(event.target.checked)} /><span>I have reviewed the teaching details for public display and checked the supporting certificates.</span></label>
          <label className="review-reason" htmlFor="review-reason">Feedback to applicant<span id="review-reason-help">Optional for approval. Required for rejection (at least 10 characters). The applicant sees this.</span></label>
          <div className="review-starters" role="group" aria-label="Rejection reason starters">{reasonStarters.map(([label, text]) => <button key={label} type="button" disabled={decisionLocked} onClick={() => applyStarter(text)}>{label}</button>)}</div>
          <textarea id="review-reason" className="review-reason-input" name="reason" aria-describedby="review-reason-help review-reason-count" rows={3} maxLength={REASON_LIMIT} value={reason} disabled={decisionLocked} onChange={event => { setReason(event.target.value); if (error) setError(""); }} placeholder="Explain your decision clearly..." />
          <p id="review-reason-count" className="review-reason-count" data-short={(trimmed.length > 0 && trimmed.length < REASON_MIN) || undefined}>{trimmed.length > 0 && trimmed.length < REASON_MIN ? `${REASON_MIN - trimmed.length} more characters needed to reject` : `${reason.length} / ${REASON_LIMIT}`}</p>
          <div className="review-actions"><button type="button" className="cw-button cw-primary" disabled={!canReview || !checked || busy || query.isFetching} onClick={() => confirm("approved")}><CheckCircle2 size={16} />Approve instructor</button><button type="button" className="cw-button cw-danger" disabled={!canReview || !checked || busy || query.isFetching} onClick={() => confirm("rejected")}><XCircle size={16} />Reject application</button></div>
          {canReview && !checked && <p className="review-actions-hint">Tick the confirmation above to enable a decision.</p>}
        </> : <>
          <div className="review-outcome" data-status={application.status}>{application.status === "approved" ? <CheckCircle2 size={20} aria-hidden="true" /> : <XCircle size={20} aria-hidden="true" />}<p>{application.status === "approved" ? "Instructor access was granted when this application was approved." : "This application was rejected. This decision did not grant instructor access."}</p></div>
          <dl className="application-summary-grid"><div><dt>Reviewed by</dt><dd>{application.reviewedBy?.name || "Administrator"}</dd></div><div><dt>Reviewed on</dt><dd>{reviewDate(application.review?.reviewedAt)}</dd></div><div className="application-wide"><dt>Feedback to applicant</dt><dd className="whitespace-pre-wrap">{application.review?.reason || "No additional feedback."}</dd></div></dl><p className="review-final-note">Completed decisions cannot be changed here.</p>
        </>}
        {error && <p className="review-error-text" role="alert">{error}</p>}
      </aside></div>
    </>}
    <ConfirmationModal open={Boolean(decision)} title={decision?.status === "approved" ? "Approve this instructor?" : "Reject this application?"} description={decision?.status === "approved" ? "This will grant instructor access, publish the instructor's professional profile, and record your approval. Certificates and review feedback stay private." : "The applicant will see your reason. Instructor access will not be granted."} confirmLabel={busy ? "Saving decision..." : decision?.status === "approved" ? "Approve instructor" : "Reject application"} danger={decision?.status === "rejected"} busy={busy} onConfirm={decide} onCancel={() => setDecision(null)} />
  </WorkspacePage>;
}
