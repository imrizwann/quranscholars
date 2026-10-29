import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, CheckCircle2, Download, FileText, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { WorkspacePage } from "../../components/lms/WorkspaceUI.jsx";
import ConfirmationModal from "../../components/ui/ConfirmationModal.jsx";
import { useGetAdminInstructorApplicationQuery, useReviewInstructorApplicationMutation, useAccessInstructorCertificateMutation } from "../../services/api/admin/instructorApplicationsApi.js";
import { userMessage } from "../../lib/user-messages.js";
import { ReviewError, ReviewStatus } from "./InstructorReviewUI.jsx";
import { reviewDate } from "./review-format.js";
import "./instructor-review.css";

function Certificate({ id, document, index }) {
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
  return <li><FileText size={20} aria-hidden="true" /><div className="review-document-name"><strong>{document.name}</strong><p>{(document.size / 1024 / 1024).toFixed(1)} MB &middot; Private certificate</p>{error && <p className="review-error-text" role="alert">{error}</p>}{link && <p>Download link expires in one minute.</p>}</div>
    {link ? <a href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="cw-button cw-primary"><Download size={16} aria-hidden="true" />Download certificate</a> : <button type="button" className="cw-button" disabled={request.isLoading} onClick={prepare}><Download size={16} aria-hidden="true" />{request.isLoading ? "Preparing..." : "Prepare download"}</button>}
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
  const admin = useSelector(state => state.user.user);
  const location = useLocation();
  const from = location.state?.from;
  const back = typeof from === "string" && /^\/admin\/instructor-applications(?:\?[^#]*)?$/.test(from) ? from : "/admin/instructor-applications";
  const application = mutation.data?.application || query.currentData?.application;
  const canReview = application?.status === "pending" && query.currentData?.applicantRole === "user" && id !== admin?._id && application.documents.length > 0;
  const busy = mutation.isLoading;
  function confirm(status) {
    if (!checked || !canReview || busy) return;
    if (status === "rejected" && reason.trim().length < 10) { setError("Explain the rejection in at least 10 characters so the applicant knows why."); return; }
    setError(""); setDecision(status);
  }
  async function decide() {
    if (busy || !decision) return;
    try { await review({ id, status: decision, reason: reason.trim() }).unwrap(); setError(""); setDecision(null); }
    catch (cause) { setError(userMessage(cause)); setDecision(null); }
  }
  return <WorkspacePage eyebrow="Administration" title={application?.fullName || "Review application"} description="Check the applicant's teaching background and supporting certificates before recording your decision." action={<button type="button" className="cw-button" disabled={query.isFetching || busy} onClick={query.refetch}><RefreshCw size={16} aria-hidden="true" />Refresh</button>}>
    <Link className="public-back" to={back}><ArrowLeft size={16} aria-hidden="true" />All instructor applications</Link>
    {query.isError ? <ReviewError error={query.error} retry={query.refetch} busy={query.isFetching} /> : !application ? <div className="studio-panel" role="status">Loading application...</div> : <>
      <div className="review-overview" role="status"><ReviewStatus status={application.status} /><span>Submitted {reviewDate(application.submittedAt)}</span></div>
      <div className="studio-split review-layout"><div className="review-main">
        <section className="studio-panel"><div className="studio-section-title"><ShieldCheck size={20} /><h2>Teaching background</h2></div><dl className="application-summary-grid"><div><dt>Full name</dt><dd>{application.fullName}</dd></div><div><dt>Account email</dt><dd>{application.email}</dd></div><div><dt>Specialization</dt><dd>{application.specialization}</dd></div><div><dt>Teaching experience</dt><dd>{application.experienceYears} years</dd></div><div><dt>Teaching languages</dt><dd>{application.languages}</dd></div><div className="application-wide"><dt>Biography</dt><dd className="whitespace-pre-wrap">{application.biography}</dd></div></dl></section>
        <section className="studio-panel"><div className="studio-section-title"><FileText size={20} /><h2>Supporting certificates</h2></div><p>Download certificates to review them. Access is restricted to administrators; public course links cannot serve these documents.</p><ul className="review-documents">{application.documents.map((document, index) => <Certificate key={index} id={id} document={document} index={index} />)}</ul>{!application.documents.length && <p>No certificates were submitted.</p>}</section>
      </div><aside className="studio-panel review-decision" aria-label="Application decision">
        <h2>{application.status === "pending" ? "Review decision" : "Decision recorded"}</h2>
        {application.status === "pending" ? <>
          <p>Approval grants access to Course Studio. The applicant can continue learning with the same account.</p>
          {!canReview && <p className="review-error-text" role="alert">This application cannot be reviewed because the account changed, is unavailable, belongs to you, or has no certificates. Refresh to check its current state.</p>}
          <label className="review-reason" htmlFor="review-reason">Reason or feedback<span>Required for rejection. Visible to the applicant.</span><textarea id="review-reason" rows={5} maxLength={1000} value={reason} disabled={busy || !canReview} onChange={event => setReason(event.target.value)} placeholder="Explain your decision clearly..." /></label>
          <label className="review-check"><input type="checkbox" checked={checked} disabled={busy || !canReview} onChange={event => setChecked(event.target.checked)} /><span>I have reviewed the teaching details and supporting certificates.</span></label>
          <div className="public-actions"><button type="button" className="cw-button cw-primary" disabled={!canReview || !checked || busy} onClick={() => confirm("approved")}><CheckCircle2 size={16} />Approve instructor</button><button type="button" className="cw-button cw-danger" disabled={!canReview || !checked || busy} onClick={() => confirm("rejected")}><XCircle size={16} />Reject application</button></div>
        </> : <><p>{application.status === "approved" ? "Instructor access was granted when this application was approved." : "This application was rejected. This decision did not grant instructor access."}</p><dl className="application-summary-grid"><div><dt>Reviewed by</dt><dd>{application.reviewedBy?.name || "Administrator"}</dd></div><div><dt>Reviewed on</dt><dd>{reviewDate(application.review?.reviewedAt)}</dd></div><div className="application-wide"><dt>Feedback to applicant</dt><dd className="whitespace-pre-wrap">{application.review?.reason || "No additional feedback."}</dd></div></dl><p>Completed decisions cannot be changed here.</p></>}
        {error && <p className="review-error-text" role="alert">{error}</p>}
      </aside></div>
    </>}
    <ConfirmationModal open={Boolean(decision)} title={decision === "approved" ? "Approve this instructor?" : "Reject this application?"} description={decision === "approved" ? "This will grant the applicant instructor access and record your approval." : "The applicant will see your reason. Instructor access will not be granted."} confirmLabel={busy ? "Saving decision..." : decision === "approved" ? "Approve instructor" : "Reject application"} danger={decision === "rejected"} busy={busy} onConfirm={decide} onCancel={() => setDecision(null)} />
  </WorkspacePage>;
}
