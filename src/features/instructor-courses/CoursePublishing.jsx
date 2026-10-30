import { useState } from "react";
import { Check, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import { QueryMessage } from "./WorkspaceParts.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function CoursePublishing({ course, disabled, active, onBusy, onReview }) {
  const query = api.endpoints.getReadiness.useQuery({ courseId: course._id }, { skip: !active, refetchOnMountOrArgChange: true });
  const [publish, { isLoading }] = api.endpoints.publishCourse.useMutation();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const data = query.currentData;
  return <section className="cw-card"><div className="cw-row cw-between"><h2>{course.published ? "Review your published course" : "Ready to share your course?"}</h2><button type="button" className="cw-button cw-button-compact" disabled={disabled || query.isFetching || !active} onClick={query.refetch}><RefreshCw size={15} />Check again</button></div><p className="cw-muted">Complete the checklist, preview your lessons, and publish when you are ready. Lesson videos stay available only to you and enrolled learners.</p>
    <QueryMessage query={{ data, loading: query.isFetching, error: query.error, refresh: query.refetch }} label="Checking your course" />
    <ul className="cw-readiness-list">{data?.checks.map(check => <li key={check.id}><div><div className="cw-row"><strong>{check.label}</strong>{check.ready && <Check size={16} aria-label="Ready" />}</div><p className="cw-muted">{check.detail}</p></div>{check.id === "playback" ? <Link className="cw-text-link" to="/contact">Contact the team</Link> : <button type="button" className="cw-button cw-button-compact" onClick={() => onReview(check.tab || check.id)}>Review<ChevronRight size={15} /></button>}</li>)}</ul>
    {error && <p className="cw-error" role="alert">{error}</p>}{saved && <p className="cw-notice" role="status">Your course is published. Learners can now explore it in the catalogue.</p>}
    <div className="cw-row cw-between">{course.published ? <Link className="cw-text-link" to={`/courses/${course.slug}`}>View course page</Link> : <span className="cw-muted">Your trailer is optional.</span>}<AsyncButton className="cw-button cw-primary" disabled={disabled || !data?.ready || Boolean(query.error) || query.isFetching} loading={isLoading} onClick={() => setConfirm(true)}>{course.published ? "Publish course updates" : "Publish course"}</AsyncButton></div>
    <ConfirmationModal open={confirm} title={course.published ? "Publish course updates?" : "Publish this course?"} description="Your course details and trailer will be visible in the catalogue. All current lessons will become available to enrolled learners. Preview each video before continuing." confirmLabel="Publish course" busy={isLoading} onCancel={() => setConfirm(false)} onConfirm={async () => { if (isLoading) return; setError(""); onBusy(true); try { await publish({ courseId: course._id }).unwrap(); setSaved(true); setConfirm(false); } catch (failure) { setError(userMessage(failure)); setConfirm(false); } finally { onBusy(false); } }} />
  </section>;
}
