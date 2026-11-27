import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, BookOpen, Clock3, Globe2, PlayCircle, Star } from "lucide-react";
import { useGetLearningLibraryQuery } from "@/services/api/user/paymentApi.js";
import { resolveCourseImage, formatDuration } from "../model/recordedCourseAdapter.js";
import { WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";
import LibraryCourseActions from "./LibraryCourseActions.jsx";
import CourseRating from "./CourseRating.jsx";

function LibraryCard({ course, disabled }) {
  const userId = useSelector(state => state.user.user?._id);
  const canReview = Boolean(userId) && String(course.createdBy || course.instructor?.id) !== String(userId);
  const image = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const [failed, setFailed] = useState(null);
  const progress = course.progress;
  // Let the classroom resolve the latest account destination on entry. A card
  // left open on one device must not pin a lesson last watched on another.
  const destination = `/learn/${encodeURIComponent(course.slug)}`;
  const action = progress?.completed ? "Revisit course" : progress?.started ? "Continue learning" : progress ? "Start course" : "Open course";
  return <article className="studio-course-card">
    <Link to={destination} className="studio-course-cover" aria-label={`Open ${course.title}`}>
      {image && failed !== image ? <img src={image} alt="" loading="lazy" onError={() => setFailed(image)} /> : <div className="studio-course-placeholder"><BookOpen size={42} strokeWidth={1.25} aria-hidden="true" /><span>DARSLEARN</span></div>}
      {(course.hidden || course.status === "Archived") && <span className="studio-course-status">{course.hidden ? "Hidden course" : "Archived course"}</span>}
    </Link>
    <div className="studio-course-body">
      <div className="studio-course-content">
        <div className="cw-row cw-between"><p className="studio-label">{course.level || "Recorded course"}</p><LibraryCourseActions course={course} disabled={disabled} /></div>
        <h2><Link to={destination}>{course.title}</Link></h2>
        {course.status === "Archived" && <p className="studio-course-description">Your access continues while this course is archived.</p>}
        <p className="studio-course-description"><InstructorByline instructor={course.instructor} /></p>
        <div className="library-course-rating">{course.status === "Archived" ? <CourseRating rating={course.averageRating} reviews={course.totalReviews} /> : <Link className="course-rating-link" to={`/courses/${encodeURIComponent(course.slug)}#course-reviews`} aria-label={`Read reviews for ${course.title}`}><CourseRating rating={course.averageRating} reviews={course.totalReviews} /></Link>}</div>
        <div className="studio-course-meta">
          <span><PlayCircle size={15} aria-hidden="true" />{course.totalLessons ?? 0} {course.totalLessons === 1 ? "lesson" : "lessons"}</span>
          <span><Clock3 size={15} aria-hidden="true" />{course.totalDuration > 0 ? formatDuration(course.totalDuration) : "Duration not listed"}</span>
          {course.language && <span><Globe2 size={15} aria-hidden="true" />{course.language}</span>}
        </div>
        {progress && <div className="library-course-progress">
          <div><span>{progress.completed ? "Course complete" : `${progress.completedLessons} of ${progress.totalLessons} lessons complete`}</span><strong>{progress.progressPercent}%</strong></div>
          <progress max={100} value={progress.progressPercent} aria-label={`${course.title} progress`} aria-valuetext={`${progress.completedLessons} of ${progress.totalLessons} lessons complete`} />
          {progress.continueLessonTitle && <p><span>{progress.completed ? "Revisit" : progress.started ? "Continue with" : "First lesson"}</span> {progress.continueLessonTitle}</p>}
          {progress.totalLessons === 0 && <p>Your lessons will appear here when available.</p>}
        </div>}
      </div>
      <div className="studio-course-footer"><Link className="cw-button cw-primary" to={destination} aria-label={`${action}: ${course.title}`}>{action} <ArrowRight size={16} aria-hidden="true" /></Link>{canReview && <Link className="cw-text-link library-review-link" to={`${destination}?tab=reviews`} aria-label={`Rate course: ${course.title}`}><Star size={15} aria-hidden="true" />Rate course</Link>}</div>
    </div>
  </article>;
}
// Progress filters run on the loaded page, so they only appear when the whole library fits on one page.
const PROGRESS_FILTERS = [
  { value: "all", label: "All" },
  { value: "started", label: "In progress", test: course => course.progress?.started && !course.progress?.completed },
  { value: "new", label: "Not started", test: course => !course.progress?.started && !course.progress?.completed },
  { value: "completed", label: "Completed", test: course => course.progress?.completed },
];
const VIEWS = [{ value: "active", label: "My courses" }, { value: "hidden", label: "Hidden courses" }];

export default function LearnerLibrary({ compact = false }) {
  const [page, setPage] = useState(1);
  const [view, setView] = useState("active");
  const [filter, setFilter] = useState("all");
  const query = useGetLearningLibraryQuery({ page, limit: compact ? 3 : 12, view: compact ? "active" : view }, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const data = query.currentData;
  useEffect(() => { if (!query.isFetching && !query.error && data?.courses?.length === 0 && page > 1) setPage(value => value - 1); }, [data, page, query.isFetching, query.error]);
  const courses = data?.courses || [];
  const showFilters = !compact && view === "active" && page === 1 && !data?.pagination?.hasNextPage && courses.length > 1;
  const activeFilter = showFilters ? PROGRESS_FILTERS.find(item => item.value === filter) : PROGRESS_FILTERS[0];
  const visible = activeFilter.test ? courses.filter(activeFilter.test) : courses;
  const changeView = value => { setView(value); setPage(1); setFilter("all"); };
  return <section className="learning-library" aria-label="Recorded course library">
    {!compact && <div className="library-toolbar">
      <div className="library-tabs" role="group" aria-label="Library view">
        {VIEWS.map(item => <button key={item.value} type="button" aria-pressed={view === item.value} onClick={() => changeView(item.value)}>{item.label}</button>)}
      </div>
      {showFilters && <div className="library-filters" role="group" aria-label="Filter by progress">
        {PROGRESS_FILTERS.map(item => { const count = item.test ? courses.filter(item.test).length : courses.length; return <button key={item.value} type="button" aria-pressed={activeFilter.value === item.value} disabled={item.test && count === 0} onClick={() => setFilter(item.value)}>{item.label}<span>{count}</span></button>; })}
      </div>}
    </div>}
    <QueryMessage query={{ data, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading your learning library" />
    {!query.error && data?.courses?.length === 0 && (view === "hidden" && !compact ? <WorkspaceEmpty title="No hidden courses" description="Courses you hide appear here. Restore them to return them to your main library." /> : <WorkspaceEmpty title="Your next chapter starts here" description={compact ? "Explore courses to start learning, or open your library to manage hidden courses." : "Courses you enroll in appear in your library. Courses you hide are under Hidden courses."} to="/courses" action="Explore courses" />)}
    <div className="studio-course-grid">{visible.map(course => <LibraryCard key={course._id} course={course} disabled={query.isFetching || Boolean(query.error)} />)}</div>
    {compact ? courses.length > 0 && <Link className="cw-text-link" to="/dashboard/learning">Manage your library and hidden courses</Link> : <Pagination pagination={data?.pagination} page={page} onPage={setPage} loading={query.isFetching} />}
  </section>;
}
