import { useId, useRef, useState } from "react";
import { Eye, EyeOff, LogOut } from "lucide-react";
import learnerApi from "@/services/api/user/learnerApi.js";
import CurriculumActions from "@/features/instructor-courses/CurriculumActions.jsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "@/features/instructor-courses/course-workspace.css";

export default function LibraryCourseActions({ course, disabled }) {
  const [update, state] = learnerApi.endpoints.updateLearningLibrary.useMutation();
  const [action, setAction] = useState(null), [title, setTitle] = useState(""), [error, setError] = useState("");
  const titleId = useId(), pending = useRef(false);
  const leaving = action === "leave";
  const choose = value => { setTitle(""); setError(""); setAction(value); };
  async function confirm() {
    if (!action || pending.current || disabled || (leaving && title.trim() !== course.title.trim())) return;
    pending.current = true; setError("");
    try { await update({ courseId: course._id, action, ...(leaving && { confirmationTitle: title }) }).unwrap(); setAction(null); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  return <>
    <CurriculumActions label={`Course options: ${course.title}`} disabled={disabled} loading={state.isLoading} items={[
      { label: course.hidden ? "Restore to My learning" : "Hide from My learning", icon: course.hidden ? Eye : EyeOff, onClick: () => choose(course.hidden ? "restore" : "hide") },
      course.canLeave && { label: "Leave free course", icon: LogOut, danger: true, onClick: () => choose("leave") },
    ]} />
    <ConfirmationModal open={Boolean(action)} title={leaving ? "Leave this course?" : action === "restore" ? "Restore this course?" : "Hide this course?"} description={leaving ? `You will lose lesson access to “${course.title}”. Your progress and quiz results are saved. Rejoining depends on course availability and current enrollment options.` : action === "restore" ? `“${course.title}” will return to your main learning library. Your access and progress stay the same.` : `“${course.title}” will move to Hidden courses. You can restore it at any time. Your access, progress and purchase remain unchanged.`} confirmLabel={leaving ? "Leave course" : action === "restore" ? "Restore course" : "Hide course"} danger={leaving} busy={state.isLoading} busyLabel="Updating library" confirmDisabled={disabled || (leaving && title.trim() !== course.title.trim())} onConfirm={confirm} onCancel={() => setAction(null)}>
      {leaving && <form className="cw-field" onSubmit={event => { event.preventDefault(); confirm(); }}><label htmlFor={titleId}>Type the course title to confirm</label><p className="cw-muted">{course.title}</p><input id={titleId} name="confirmationTitle" className="cw-input" autoComplete="off" maxLength={150} value={title} onChange={event => setTitle(event.target.value)} disabled={state.isLoading} aria-invalid={Boolean(error)} aria-describedby={error ? `${titleId}-error` : undefined} /><button type="submit" hidden tabIndex={-1}>Confirm leaving</button></form>}
      {error && <p id={`${titleId}-error`} className="qs-confirm-error" role="alert">{error}</p>}
    </ConfirmationModal>
  </>;
}
