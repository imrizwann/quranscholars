import TableScroll from "@/components/ui/TableScroll.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Users, Search, RefreshCw, ChevronDown, X, Check, Lock } from "lucide-react";
import { WorkspacePage, WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import "../admissions/admin-admissions.css";
import "./instructor-students.css";

function Timestamp({ value, includeTime = false }) {
  if (!value || !Number.isFinite(Date.parse(value))) return <span>Not recorded</span>;
  const date = new Date(value);
  return <time dateTime={date.toISOString()} title={date.toLocaleString()}>{date.toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric", ...(includeTime && { hour: "numeric", minute: "2-digit" }),
  })}</time>;
}

// Expanded quiz results for one enrollment: a summary, then one row per published quiz.
function QuizResults({ id, item, quizzes }) {
  const results = quizzes.results || [];
  const scored = results.filter(quiz => quiz.bestScore != null);
  const average = scored.length ? Math.round(scored.reduce((sum, quiz) => sum + quiz.bestScore, 0) / scored.length) : null;
  const name = item.name || "Learner";
  return <section id={id} className="roster-quiz-details" aria-label={`Quiz results for ${name} in ${item.courseTitle}`}>
    <div className="quiz-results-head">
      <div>
        <h3>Quiz results</h3>
        <p className="roster-note">Published quizzes in {item.courseTitle}. Quizzes are optional and do not affect course completion.</p>
      </div>
      <ul className="quiz-results-summary" aria-label="Quiz summary">
        <li><strong>{quizzes.passed} of {quizzes.total}</strong><span>passed</span></li>
        <li><strong>{quizzes.attempted} of {quizzes.total}</strong><span>attempted</span></li>
        <li><strong>{average == null ? "-" : `${average}%`}</strong><span>average best score</span></li>
      </ul>
    </div>
    <ol className="quiz-results-list">{results.map((quiz, index) => {
      const state = quiz.passed ? "passed" : quiz.attempts ? "retry" : quiz.available ? "ready" : "locked";
      const label = { passed: "Passed", retry: "Not passed yet", ready: "Not attempted", locked: "Locked" }[state];
      return <li key={quiz.quizId} data-state={state}>
        <span className="quiz-index" aria-hidden="true">{state === "passed" ? <Check size={14} strokeWidth={3} /> : state === "locked" ? <Lock size={13} /> : index + 1}</span>
        <div className="quiz-name">
          <h4>{quiz.title}</h4>
          <p className="roster-note">{quiz.sectionTitle}</p>
        </div>
        <dl className="quiz-scores">
          <div className="quiz-best"><dt>Best score</dt><dd>{quiz.bestScore == null ? "-" : `${quiz.bestScore}%`}</dd>{quiz.bestScore != null && <span className="quiz-bar" style={{ "--score": `${Math.max(0, Math.min(100, quiz.bestScore))}%` }} aria-hidden="true" />}</div>
          <div><dt>Latest</dt><dd>{quiz.latestScore == null ? "-" : `${quiz.latestScore}%`}</dd></div>
          <div><dt>Attempts</dt><dd>{quiz.attempts}</dd></div>
        </dl>
        <div className="quiz-status">
          <span className="cw-status" data-passed={quiz.passed} data-state={state}>{label}</span>
          <p className="roster-note">{quiz.lastSubmittedAt ? <>Last submitted <Timestamp value={quiz.lastSubmittedAt} includeTime /></> : quiz.available ? "Ready to attempt" : "Unlocks after this section's lessons"}</p>
        </div>
      </li>;
    })}</ol>
  </section>;
}

function LearnerRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const learning = item.learning;
  const quizzes = learning?.quizzes;
  const activity = learning?.lastActivity;
  const progressLabel = !learning?.totalLessons ? "No published lessons" : learning.completed ? "Completed" : learning.started ? "In progress" : "Not started";
  return <>
    <tr>
      <td data-label="Learner"><div className="roster-learner"><ProfileAvatar name={item.name || "Learner"} src={item.avatar || null} size={36} /><div><strong>{item.name || "Learner"}</strong><p className="cw-muted break-all">{item.email}</p></div></div></td>
      <td data-label="Course"><Link className="cw-text-link" to={`/instructor/courses/${encodeURIComponent(item.courseId)}`}>{item.courseTitle}</Link><p className="roster-note">Enrolled <Timestamp value={item.enrolledAt} /></p></td>
      <td data-label="Progress">{learning ? <div className="roster-progress">
        <div><strong>{learning.progressPercent}%</strong><span>{progressLabel}</span></div>
        <progress max={100} value={learning.progressPercent} aria-label={`${item.name || "Learner"}: ${item.courseTitle} completion`} aria-valuetext={`${learning.completedLessons} of ${learning.totalLessons} lessons completed`} />
        <p className="roster-note">{learning.completedLessons} of {learning.totalLessons} lessons completed</p>
      </div> : <span className="cw-muted">Progress unavailable</span>}</td>
      <td data-label="Recent activity">{activity ? <><Timestamp value={activity.at} includeTime /><p className="roster-note">{activity.type === "quiz" ? "Quiz" : "Lesson"}: {activity.title}</p></> : <span className="cw-muted">{learning ? "No learning activity yet" : "Activity unavailable"}</span>}</td>
      <td data-label="Quizzes">{quizzes?.total > 0 ? <><p>{quizzes.passed} of {quizzes.total} passed</p><p className="roster-note">{quizzes.attempted} attempted</p><button type="button" className="cw-text-link roster-results-toggle" aria-label={`${expanded ? "Hide" : "View"} quiz results for ${item.name || "Learner"} in ${item.courseTitle}`} aria-expanded={expanded} aria-controls={expanded ? detailsId : undefined} onClick={() => setExpanded(value => !value)}>{expanded ? "Hide results" : "View results"}<ChevronDown size={14} aria-hidden="true" /></button></> : <span className="cw-muted">{quizzes ? "No published quizzes" : "Results unavailable"}</span>}</td>
      <td data-label="Access"><span className="cw-status roster-access" data-access={item.status}>{({ active: "Active", expired: "Expired", cancelled: "Cancelled", refunded: "Refunded" })[item.status] || "Unavailable"}</span></td>
    </tr>
    {expanded && quizzes?.total > 0 && <tr className="roster-details-row"><td colSpan={6}>
      <QuizResults id={detailsId} item={item} quizzes={quizzes} />
    </td></tr>}
  </>;
}

export default function InstructorStudents() {
  const [params, setParams] = useSearchParams();
  const courseId = params.get("courseId");
  const [page, setPage] = useState(1), [input, setInput] = useState(""), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  useEffect(() => { setPage(1); }, [courseId]);
  const query = api.endpoints.getStudents.useQuery({ page, limit: 20, ...(courseId ? { courseId } : {}), ...(search ? { search } : {}), ...(status ? { status } : {}) }, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const data = query.currentData;
  // Course filter options: the instructor's courses (the API returns at most 50 per page).
  const courses = api.endpoints.getCourses.useQuery({ page: 1, limit: 50 }).currentData?.courses || [];
  const courseOptions = [{ value: "all", label: "All courses" }, ...courses.map(course => ({ value: String(course._id), label: course.title }))];
  if (courseId && !courses.some(course => String(course._id) === courseId)) courseOptions.push({ value: courseId, label: data?.course?.title || "Selected course" });
  return <WorkspacePage eyebrow="Teaching workspace" title="Your learners" description="Follow your learners’ progress, recent activity, and quiz results across your courses." action={<AsyncButton className="cw-button" loading={query.isFetching} loadingLabel="Refreshing" onClick={query.refetch}><RefreshCw size={16} aria-hidden="true" />Refresh</AsyncButton>}>
    <form className="roster-toolbar" role="search" onSubmit={event => { event.preventDefault(); setSearch(input.trim()); setPage(1); }}>
      <div className="roster-search">
        <label><span className="sr-only">Find a learner</span><Search size={17} aria-hidden="true" /><input name="search" value={input} onChange={event => setInput(event.target.value)} maxLength={100} placeholder="Search by name or email" type="search" />{(input || search) && <button type="button" className="roster-search-clear" aria-label="Clear search" onClick={() => { setInput(""); setSearch(""); setPage(1); }}><X size={15} aria-hidden="true" /></button>}</label>
        <button className="cw-button" type="submit">Search</button>
      </div>
      <div className="roster-filters">
        {courseOptions.length > 1 && <SelectField name="courseFilter" aria-label="Course" value={courseId || "all"} onChange={(value) => { setParams(value === "all" ? {} : { courseId: value }); setPage(1); }} options={courseOptions} />}
        <SelectField name="enrollmentStatus" aria-label="Enrollment status" value={status || "all"} onChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }} options={[{ value: "all", label: "All enrollments" }, { value: "active", label: "Active" }, { value: "expired", label: "Expired" }, { value: "cancelled", label: "Cancelled" }, { value: "refunded", label: "Refunded" }]} />
        {courseId && <button type="button" className="cw-button" onClick={() => { setParams({}); setPage(1); }}>Show all courses</button>}
      </div>
    </form>
    <QueryMessage query={{ data, loading: query.isFetching, error: query.error, refresh: query.refetch }} label="Loading your learners and progress" />
    {!query.error && data?.items.length === 0 && <WorkspaceEmpty icon={Users} title={search || status ? "No matching learners" : "Your learners will appear here"} description={search || status ? "Try another name or choose all enrollments." : "When someone enrolls in one of your courses, you can follow their progress here."} />}
    {!query.error && Boolean(data?.items.length) && <div className="admin-admissions studio-panel instructor-roster mt-5"><p className="cw-muted">{data.pagination.total} {data.pagination.total === 1 ? "enrollment" : "enrollments"}. Progress reflects the course’s current published lessons.</p><TableScroll label="Learner records" className="admissions-results"><table className="admissions-table w-full text-left text-sm" aria-label="Course enrollments and learning progress"><thead><tr>{["Learner", "Course", "Progress", "Recent activity", "Quizzes", "Access"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{data.items.map(item => <LearnerRow key={item._id} item={item} />)}</tbody></table></TableScroll></div>}
    {!query.error && <Pagination pagination={data?.pagination} page={page} onPage={setPage} loading={query.isFetching} />}
  </WorkspacePage>;
}
