import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, FileText, Info, Presentation, Trash2, UserRound } from "lucide-react";
import { useGetMyInstructorApplicationQuery, useSubmitInstructorApplicationMutation } from "../../services/api/user/instructorApplicationApi.js";
import { userMessage } from "../../lib/user-messages.js";

const applicationReturn = { from: "/instructor/application" };
const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const fileSize = bytes => (bytes / 1024 / 1024).toFixed(1) + " MB";

export default function InstructorApplication() {
  const user = useSelector(state => state.user.user);
  // Clear local form state if another account signs in on this tab.
  return <ApplicationPage key={user?._id || "guest"} user={user} />;
}

function ApplicationPage({ user }) {
  const instructor = user?.role === "instructor";
  const eligible = user?.role === "user";
  const query = useGetMyInstructorApplicationQuery(undefined, { skip: !eligible, refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const [submit, submission] = useSubmitInstructorApplicationMutation();
  const application = query.currentData?.application || submission.data?.application;
  const inProgress = query.currentData?.submissionInProgress;
  const available = eligible && query.currentData?.submissionEnabled && !query.isError && !inProgress;
  const [files, setFiles] = useState([]);
  const [formError, setFormError] = useState("");
  const errorRef = useRef(null);
  const fileRef = useRef(null);
  const busy = submission.isLoading;

  function showError(message) {
    setFormError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  function selectFiles(event) {
    const selected = [...event.target.files];
    event.target.value = "";
    const combined = [...files, ...selected];
    if (combined.length > 3 || combined.some(file => !allowedTypes.includes(file.type) || !file.size || file.size > 5 * 1024 * 1024)) {
      showError("Choose up to 3 PDF, JPG, PNG or WebP certificates, no larger than 5 MB each.");
      return;
    }
    setFiles(combined);
    setFormError("");
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (!available || busy) return;
    if (!files.length) { showError("Add at least one certificate to support your application."); return; }
    setFormError("");
    const body = new FormData(event.currentTarget);
    files.forEach(file => body.append("documents", file));
    try { await submit(body).unwrap(); }
    catch (error) { showError(userMessage(error)); }
  }

  return <main className="public-page">
    <Link to="/get-started/instructor" className="public-back"><ArrowLeft size={16} aria-hidden="true" />About teaching on QuranScholar</Link>
    <header className="public-heading">
      <p className="public-eyebrow">Instructor application</p>
      <h1>{instructor ? "Your teaching workspace is ready." : application ? application.status === "pending" ? "Your application is submitted." : "Your application has been reviewed." : "Share your knowledge. Help others grow."}</h1>
      <p>{instructor ? "Open Course Studio to manage your courses and lessons." : application ? application.status === "pending" ? "Your teaching background and certificates have been saved for review. You can continue learning with the same account." : "See the team's decision and feedback below. Your access to learning remains available." : "Tell us about your teaching background, the subjects you teach, and the experience you bring to your learners."}</p>
    </header>
    {instructor ? <section className="public-panel" aria-label="Instructor access">
      <span className="public-icon"><CheckCircle2 size={22} aria-hidden="true" /></span>
      <h2 className="mt-4">You already have instructor access</h2><p className="mt-2">You do not need to complete another application.</p>
      <div className="public-actions"><Link to="/instructor/courses" className="cw-button cw-primary">Open Course Studio<ArrowRight size={16} aria-hidden="true" /></Link><Link to="/dashboard/learning" className="cw-button">My learning</Link></div>
    </section> : user && !eligible ? <section className="public-panel"><h2>This application is for learner accounts</h2><p className="mt-2">Your current account does not need an instructor application.</p><div className="public-actions"><Link to="/courses" className="cw-button">Explore courses</Link></div></section> : application ? <ApplicationSummary application={application} /> : <>
      {!user ? <section className="application-notice" aria-labelledby="application-signin">
        <Info size={20} aria-hidden="true" /><div><h2 id="application-signin">Sign in to apply</h2><p>You can learn and explore teaching with the same account. Sign in to submit your background and certificates securely.</p></div>
        <div className="public-actions !mt-0"><Link to="/login" state={applicationReturn} className="cw-button cw-primary">Sign in</Link><Link to="/register" state={applicationReturn} className="cw-button">Create an account</Link></div>
      </section> : query.isLoading ? <p className="mb-6" role="status">Checking your application...</p> : query.isError ? <section className="application-notice" role="alert"><div><h2>We could not check your application</h2><p>{userMessage(query.error)}</p></div><button type="button" className="cw-button" disabled={query.isFetching} onClick={query.refetch}>Try again</button></section> : inProgress ? <section className="application-notice" role="status"><Clock3 size={20} aria-hidden="true" /><div><h2>Your submission is being resolved</h2><p>An upload is already in progress or recovering from an interruption. Check its status before submitting again. If an interrupted upload does not clear within an hour, contact the team.</p></div><button type="button" className="cw-button" disabled={query.isFetching} onClick={query.refetch}>Check status</button></section> : !available ? <section className="application-notice"><Info size={20} aria-hidden="true" /><div><h2>Applications are temporarily unavailable</h2><p>Secure document uploads are being prepared. Please check back later or contact our team.</p></div><Link to="/contact" className="cw-button">Contact the team</Link></section> : null}
      <div className="application-layout">
        <form className="public-panel application-form" aria-label="Instructor application" aria-busy={busy} onSubmit={handleSubmit}>
          <fieldset disabled={!available || busy}>
            <legend className="application-section-title"><UserRound size={20} aria-hidden="true" />Your details</legend>
            <div className="application-fields">
              <label htmlFor="application-name">Full name<input id="application-name" name="fullName" required minLength={2} maxLength={100} autoComplete="name" defaultValue={user?.name || ""} placeholder="Your full name" /></label>
              <label htmlFor="application-email">Account email<input id="application-email" type="email" autoComplete="email" value={user?.email || ""} readOnly placeholder="Your account email" /></label>
            </div>
          </fieldset>
          <fieldset disabled={!available || busy}>
            <legend className="application-section-title"><Presentation size={20} aria-hidden="true" />Teaching background</legend>
            <div className="application-fields">
              <label htmlFor="application-subject">Primary specialization<input id="application-subject" name="specialization" required minLength={2} maxLength={150} placeholder="For example, Tajweed or Quran reading" /></label>
              <label htmlFor="application-experience">Years of teaching experience<input id="application-experience" name="experienceYears" type="number" required min="0" max="80" step="1" placeholder="Years of experience" /></label>
              <label htmlFor="application-languages" className="application-wide">Teaching languages<input id="application-languages" name="languages" required minLength={2} maxLength={200} placeholder="Languages you can teach in" /></label>
              <label htmlFor="application-bio" className="application-wide">Teaching biography<textarea id="application-bio" name="biography" required minLength={50} maxLength={3000} rows={5} aria-describedby="biography-help" placeholder="Your background, teaching approach, and the learners you support" /><span id="biography-help" className="application-help">50 to 3,000 characters.</span></label>
            </div>
          </fieldset>
          <fieldset disabled={!available || busy}>
            <legend className="application-section-title"><FileText size={20} aria-hidden="true" />Qualifications</legend>
            <p id="application-document-help">Add 1 to 3 relevant certificates. PDF, JPG, PNG or WebP, up to 5 MB each. Documents are stored privately for application review. Please do not upload identity documents.</p>
            <input ref={fileRef} className="sr-only" tabIndex={-1} aria-label="Choose supporting certificates" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple onChange={selectFiles} />
            <div className="public-actions"><button type="button" className="cw-button" disabled={files.length >= 3} aria-describedby="application-document-help" onClick={() => fileRef.current?.click()}><FileText size={16} aria-hidden="true" />Add certificates</button><span className="application-help">{files.length} of 3 selected</span></div>
            {files.length > 0 && <ul className="application-documents" aria-label="Selected certificates">{files.map((file, index) => <li key={index}><FileText size={18} aria-hidden="true" /><div><span>{file.name}</span><small>{fileSize(file.size)}</small></div><button type="button" className="cw-button cw-icon-button" aria-label={"Remove " + file.name} onClick={() => setFiles(files.filter((_, position) => position !== index))}><Trash2 size={16} aria-hidden="true" /></button></li>)}</ul>}
          </fieldset>
          {formError && <p ref={errorRef} tabIndex={-1} className="application-error" role="alert">{formError}</p>}
          <div className="public-actions"><button type="submit" className="cw-button cw-primary" disabled={!available || busy}>{busy ? "Uploading and submitting..." : "Submit application"}<ArrowRight size={16} aria-hidden="true" /></button><Link to="/courses" className="cw-button">Explore courses</Link></div>
          <p className="mt-4" role={busy ? "status" : undefined}>{busy ? "Keep this page open until your application is submitted." : "Submitting an application does not grant instructor access or change your access to learning."}</p>
        </form>
        <aside className="public-panel application-guide" aria-labelledby="application-guide-title">
          <span className="public-icon"><BookOpen size={22} aria-hidden="true" /></span><h2 id="application-guide-title" className="mt-4">Prepare your introduction</h2>
          <ul className="public-access-note">
            <li><CheckCircle2 size={18} aria-hidden="true" /><div><h3>Your strengths</h3><p>Choose the subjects and learner levels you teach confidently.</p></div></li>
            <li><CheckCircle2 size={18} aria-hidden="true" /><div><h3>Your experience</h3><p>Describe how you help learners understand and practise.</p></div></li>
            <li><CheckCircle2 size={18} aria-hidden="true" /><div><h3>Your qualifications</h3><p>Provide readable certificates that support your teaching background.</p></div></li>
          </ul>
          <p className="mt-6 border-t border-border pt-5">Your application will remain pending until the team reviews it. You can continue exploring courses while you wait.</p>
          {user && <div className="public-actions"><Link to="/dashboard" className="cw-button">Back to my dashboard</Link></div>}
        </aside>
      </div>
    </>}
  </main>;
}

function ApplicationSummary({ application }) {
  return <section className="public-panel application-summary" aria-label="Submitted application">
    <div className="application-notice" role="status"><Clock3 size={20} aria-hidden="true" /><div><h2>{({ pending: "Pending review", approved: "Application approved", rejected: "Application not approved" })[application.status]}</h2><p>Submitted on {new Date(application.submittedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}. {application.status === "approved" ? "You can now open Course Studio." : application.status === "rejected" ? "Instructor access has not been granted." : "Instructor access is granted only after approval."}</p></div></div>
    {application.review && <div className="application-notice"><div><h2>Review feedback</h2><p className="whitespace-pre-wrap">{application.review.reason || "Your application was approved."}</p></div></div>}
    {application.status === "approved" && <div className="public-actions mb-6"><Link to="/instructor/courses" className="cw-button cw-primary">Open Course Studio<ArrowRight size={16} aria-hidden="true" /></Link></div>}
    <h2>Your teaching background</h2>
    <dl className="application-summary-grid"><div><dt>Full name</dt><dd>{application.fullName}</dd></div><div><dt>Account email</dt><dd>{application.email}</dd></div><div><dt>Specialization</dt><dd>{application.specialization}</dd></div><div><dt>Teaching experience</dt><dd>{application.experienceYears} years</dd></div><div><dt>Teaching languages</dt><dd>{application.languages}</dd></div><div className="application-wide"><dt>Biography</dt><dd className="whitespace-pre-wrap">{application.biography}</dd></div></dl>
    <h2 className="mt-6">Submitted certificates</h2><ul className="application-documents">{application.documents.map((file, index) => <li key={index}><FileText size={18} aria-hidden="true" /><div><span>{file.name}</span><small>{fileSize(file.size)} &middot; Stored privately</small></div></li>)}</ul>
    <p className="mt-5">Need to correct something in your submitted application? Contact our team.</p>
    <div className="public-actions"><Link to="/courses" className="cw-button cw-primary">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link><Link to="/contact" className="cw-button">Contact the team</Link><Link to="/dashboard/learning" className="cw-button">My learning</Link></div>
  </section>;
}
