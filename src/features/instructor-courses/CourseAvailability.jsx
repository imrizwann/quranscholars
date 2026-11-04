import { useState } from "react";
import { Archive, Pause, Play, RotateCcw } from "lucide-react";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

const actions = {
  pause_enrollments: { title: "Pause new enrollments?", label: "Pause enrollments", description: "Your course stays in the catalog. New learners cannot enroll; existing learners keep their access. Payments already started may still complete." },
  resume_enrollments: { title: "Reopen enrollment?", label: "Reopen enrollment", description: "New learners will be able to enroll again. Your published course must pass the readiness checks." },
  archive: { title: "Archive this course?", label: "Archive course", description: "Your course will leave the public catalog and stop accepting new enrollments. Existing learners keep their lessons, quizzes and saved progress. Payments already started may still complete." },
  restore: { title: "Restore this course?", label: "Restore course", description: "Your course returns to the catalog with enrollment paused. Review your published lessons before reopening enrollment." },
};

export default function CourseAvailability({ course, disabled, onBusy }) {
  const [update, state] = api.endpoints.updateAvailability.useMutation();
  const [action, setAction] = useState(null), [error, setError] = useState(""), [message, setMessage] = useState("");
  if (!course.published) return null;
  const archived = course.status === "Archived", open = !archived && course.enrollmentOpen !== false;
  const config = actions[action];
  return <section className="cw-card"><h2>Course availability</h2><p className="cw-muted">Control new enrollments while preserving access and progress for existing learners.</p>
    <div className="cw-availability-row"><div><strong>{archived ? "Archived" : "Catalog visibility"}</strong><p className="cw-muted">{archived ? "Hidden from the public catalog. Enrolled learners can continue studying." : "Your course is visible in the catalog."}</p></div><button type="button" className="cw-button cw-button-compact" disabled={disabled || state.isLoading} onClick={() => { setError(""); setAction(archived ? "restore" : "archive"); }}>{archived ? <RotateCcw size={15} aria-hidden="true" /> : <Archive size={15} aria-hidden="true" />}{archived ? "Restore course" : "Archive course"}</button></div>
    {!archived && <div className="cw-availability-row"><div><strong>{open ? "Enrollment is open" : "Enrollment is paused"}</strong><p className="cw-muted">{open ? "New learners can enroll in this course." : "Existing learners keep access. New enrollments are paused."}</p></div><AsyncButton className="cw-button cw-button-compact" disabled={disabled || state.isLoading} onClick={() => { setError(""); setAction(open ? "pause_enrollments" : "resume_enrollments"); }}>{open ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{open ? "Pause enrollments" : "Reopen enrollment"}</AsyncButton></div>}
    {message && <p className="cw-notice" role="status">{message}</p>}
    <ConfirmationModal open={Boolean(action)} title={config?.title} description={config?.description} confirmLabel={config?.label} busy={state.isLoading} busyLabel="Saving availability" onCancel={() => setAction(null)} onConfirm={async () => {
      if (!action || state.isLoading || disabled) return;
      onBusy(true); setError(""); setMessage("");
      try { await update({ courseId: course._id, action }).unwrap(); setMessage(({ archive: "Course archived. Your learners keep their access.", restore: "Course restored. Enrollment remains paused.", pause_enrollments: "New enrollments are paused. Existing learners keep access.", resume_enrollments: "Enrollment is open again." })[action]); setAction(null); }
      catch (failure) { setError(userMessage(failure)); }
      finally { onBusy(false); }
    }}>{error && <><p className="qs-confirm-error" role="alert">{error}</p>{action === "resume_enrollments" && <a className="cw-text-link" href="#course-publish-checklist" onClick={() => setAction(null)}>Review course checklist</a>}</>}</ConfirmationModal>
  </section>;
}
