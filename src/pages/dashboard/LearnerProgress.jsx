import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { WorkspaceEmpty, WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { LearnerAnalytics } from "@/components/lms/DashboardAnalytics.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import { useGetLearningLibraryQuery } from "@/services/api/user/paymentApi.js";
import { resolveCourseImage } from "@/features/recorded-courses/model/recordedCourseAdapter.js";
import "./learner-progress.css";

function CourseThumb({ course }) {
  const image = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const [failed, setFailed] = useState(null);
  return <span className="progress-thumb" aria-hidden="true">
    {image && failed !== image ? <img src={image} alt="" loading="lazy" onError={() => setFailed(image)} /> : <BookOpen size={22} strokeWidth={1.5} />}
  </span>;
}

function CourseProgressRow({ course }) {
  const progress = course.progress;
  const destination = `/learn/${encodeURIComponent(course.slug)}`;
  const state = progress?.completed ? "completed" : progress?.started ? "started" : "new";
  const action = { completed: "Revisit", started: "Continue", new: "Start" }[state];
  const status = { completed: "Completed", started: "In progress", new: "Not started" }[state];
  return <li className="progress-row" data-state={state}>
    <CourseThumb course={course} />
    <div className="progress-row-main">
      <h3><Link to={destination}>{course.title}</Link></h3>
      <p className="progress-row-meta">
        <span className="progress-state">{state === "completed" && <CheckCircle2 size={14} aria-hidden="true" />}{status}</span>
        {progress?.continueLessonTitle && <span className="progress-row-next">{state === "completed" ? "Last lesson" : state === "started" ? "Next" : "First lesson"}: {progress.continueLessonTitle}</span>}
      </p>
    </div>
    <div className="progress-row-bar">
      {progress && progress.totalLessons > 0 ? <>
        <div><span>{progress.completedLessons} of {progress.totalLessons} lessons</span><strong>{progress.progressPercent}%</strong></div>
        <progress max={100} value={progress.progressPercent} aria-label={`${course.title} progress`} aria-valuetext={`${progress.completedLessons} of ${progress.totalLessons} lessons complete`} />
      </> : <span className="progress-row-empty">Lessons coming soon</span>}
    </div>
    <Link className="cw-button" to={destination} aria-label={`${action}: ${course.title}`}>{action}<ArrowRight size={15} aria-hidden="true" /></Link>
  </li>;
}

function CourseProgressList() {
  const [page, setPage] = useState(1);
  // Same arguments as My learning, so switching between the two pages reuses the cached list.
  const query = useGetLearningLibraryQuery({ page, limit: 12, view: "active" }, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const data = query.currentData;
  return <section className="progress-courses" aria-labelledby="progress-courses-title">
    <div className="studio-section-heading">
      <div>
        <h2 id="progress-courses-title">Progress by course</h2>
        <p>Every enrolled course, how far you have come, and the lesson to open next.</p>
      </div>
    </div>
    <QueryMessage query={{ data, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading your course progress" />
    {!query.error && data?.courses?.length === 0 && <WorkspaceEmpty title="No courses to track yet" description="Enroll in a course and your progress will appear here, lesson by lesson." to="/courses" action="Explore courses" />}
    {data?.courses?.length > 0 && <ul className="progress-list">{data.courses.map(course => <CourseProgressRow key={course._id} course={course} />)}</ul>}
    <Pagination pagination={data?.pagination} page={page} onPage={setPage} loading={query.isFetching} />
  </section>;
}

export default function LearnerProgress() {
  return <WorkspacePage eyebrow="Learner workspace" title="Your progress" description="See the lessons you have completed and the courses you are continuing.">
    <LearnerAnalytics detailed />
    <CourseProgressList />
  </WorkspacePage>;
}
