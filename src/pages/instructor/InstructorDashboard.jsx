import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, Check, Circle, Plus, UsersRound } from "lucide-react";
import { WorkspacePage, WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import { InstructorAnalytics } from "@/components/lms/DashboardAnalytics.jsx";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import InstructorCourseCard from "@/features/instructor-courses/InstructorCourseCard.jsx";
import useCourseEnrollments from "@/features/instructor-courses/useCourseEnrollments.js";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import instructorApi from "@/services/api/instructor/recordedCoursesApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import "./instructor-dashboard.css";

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function timeAgo(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  if (days > -1) return "Today";
  if (days > -30) return relative.format(days, "day");
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/* ---------- Recent enrollments: newest first, from the students endpoint ---------- */

function RecentEnrollments() {
  const query = instructorApi.endpoints.getStudents.useQuery({ page: 1, limit: 5 }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const items = query.currentData?.items;
  return <section className="studio-panel overview-panel" aria-labelledby="recent-enrollments-title">
    <div className="overview-panel-head">
      <div><h2 id="recent-enrollments-title">Recent enrollments</h2><p>The newest learners across your courses.</p></div>
      <Link className="analytics-panel-link" to="/instructor/students">All students<ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
    {query.isError ? <div className="overview-note" role="alert"><p>Recent enrollments could not be loaded.</p><AsyncButton className="cw-button" loading={query.isFetching} loadingLabel="Retrying" onClick={query.refetch}>Try again</AsyncButton></div>
      : !items ? <ul className="overview-skeleton" role="status" aria-label="Loading recent enrollments">{[1, 2, 3].map(row => <li key={row} />)}</ul>
      : !items.length ? <div className="overview-note"><UsersRound size={22} aria-hidden="true" /><p>No enrollments yet. Learners appear here as soon as they join one of your courses.</p></div>
      : <ul className="enrollment-list">{items.map(item => {
        const percent = item.learning?.progressPercent ?? 0;
        return <li key={item._id}>
          {/* item.avatar is optional: shown when the students API includes a signed photo URL, initials otherwise. */}
          <ProfileAvatar name={item.name || "Learner"} src={item.avatar || null} size={36} />
          <div className="enrollment-main">
            <p className="enrollment-name">{item.name || "Learner"}</p>
            <p className="enrollment-course">{item.courseTitle}</p>
          </div>
          <div className="enrollment-meta">
            <span>{timeAgo(item.enrolledAt)}</span>
            {item.learning && <span className="enrollment-progress" title={`${percent}% complete`}><span style={{ "--share": `${percent}%` }} aria-hidden="true" />{percent}%</span>}
          </div>
        </li>;
      })}</ul>}
  </section>;
}

/* ---------- Course checklist: what each recent course still needs ---------- */

function checklist(course) {
  return [
    { label: "Cover image", done: Boolean(course.thumbnailUrl || course.thumbnail) },
    { label: "Trailer", done: course.trailerVideo?.status === "COMPLETED" },
    { label: "Lessons", done: Number(course.stats?.totalLessons) > 0 },
    { label: "Published", done: course.published === true && course.status === "Published" },
  ];
}

function CourseChecklist({ courses }) {
  return <section className="studio-panel overview-panel" aria-labelledby="course-checklist-title">
    <div className="overview-panel-head">
      <div><h2 id="course-checklist-title">Course checklist</h2><p>What your recently updated courses still need.</p></div>
    </div>
    {!courses ? <ul className="overview-skeleton" role="status" aria-label="Loading course checklist">{[1, 2].map(row => <li key={row} />)}</ul>
      : <ul className="checklist-list">{courses.map(course => {
        const items = checklist(course);
        const done = items.filter(item => item.done).length;
        const ready = done === items.length;
        return <li key={course._id}>
          <div className="checklist-head">
            <Link to={`/instructor/courses/${course._id}`} className="checklist-title">{course.title}</Link>
            <span className="checklist-count" data-ready={ready || undefined}>{ready ? "Ready" : `${done} of ${items.length}`}</span>
          </div>
          <ul className="checklist-items" aria-label={`${course.title} checklist`}>
            {items.map(item => <li key={item.label} data-done={item.done || undefined}>
              {item.done ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
              {item.label}<span className="sr-only">{item.done ? ": done" : ": to do"}</span>
            </li>)}
          </ul>
        </li>;
      })}</ul>}
  </section>;
}

export default function InstructorDashboard() {
  const user = useSelector((state) => state.user.user);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const query = useCourseQuery("getCourses", { limit: 3 });
  const noCourses = !query.error && query.data?.courses?.length === 0;
  const { counts: enrollments } = useCourseEnrollments();
  return (
    <WorkspacePage
      eyebrow="Overview"
      title={firstName ? `Welcome back, ${firstName}.` : "Your teaching workspace"}
      description="How your courses are doing, and what to work on next."
      action={
        !noCourses && (
          <Link to="/instructor/courses/new" className="cw-button cw-primary">
            <Plus size={16} aria-hidden="true" />
            Create course
          </Link>
        )
      }
    >
      {noCourses ? (
        <WorkspaceEmpty
          title="Create your first course"
          description="Start with a draft. Add sections, lessons and a trailer at your own pace, then publish when it is ready."
          to="/instructor/courses/new"
          action="Create a course"
        />
      ) : <>
        <InstructorAnalytics />
        <div className="overview-grid">
          <RecentEnrollments />
          <CourseChecklist courses={query.error ? [] : query.data?.courses} />
        </div>
        <div className="studio-section-heading">
          <div>
            <h2>Recently updated courses</h2>
            <p>Pick up where you left off in the course studio.</p>
          </div>
          <Link to="/instructor/courses">
            All courses <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <QueryMessage query={query} label="Loading your courses" />
        <div className="studio-course-grid">
          {query.data?.courses?.map((course) => (
            <InstructorCourseCard key={course._id} course={course} enrollments={enrollments?.get(String(course._id))} />
          ))}
        </div>
      </>}
    </WorkspacePage>
  );
}
