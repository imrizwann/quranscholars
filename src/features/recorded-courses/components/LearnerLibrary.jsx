import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { useGetLearningLibraryQuery } from "@/services/api/user/paymentApi.js";
import { resolveCourseImage, formatDuration } from "../model/recordedCourseAdapter.js";
import { WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import LibraryCourseActions from "./LibraryCourseActions.jsx";

function LibraryCard({ course, disabled }) {
  const image = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const [failed, setFailed] = useState(null);
  const progress = course.progress;
  // Let the classroom resolve the latest account destination on entry. A card
  // left open on one device must not pin a lesson last watched on another.
  const destination = `/learn/${encodeURIComponent(course.slug)}`;
  const action = progress?.completed ? "Review course" : progress?.started ? "Continue learning" : progress ? "Start course" : "Open course";
  return <article className="studio-course-card">
    <Link to={destination} className="studio-course-cover" aria-label={`Open ${course.title}`}>
      {image && failed !== image ? <img src={image} alt="" loading="lazy" onError={() => setFailed(image)} /> : <div className="studio-course-placeholder"><BookOpen size={42} strokeWidth={1.25} aria-hidden="true" /><span>QURANSCHOLAR</span></div>}
      <span className="studio-course-status">{course.hidden ? "Hidden course" : course.status === "Archived" ? "Archived course" : "In your library"}</span>
    </Link>
    <div className="studio-course-body">
      <div className="studio-course-content">
        <div className="cw-row cw-between"><p className="studio-label">{course.level || "Recorded course"}</p><LibraryCourseActions course={course} disabled={disabled} /></div>
        <h2><Link to={destination}>{course.title}</Link></h2>
        {course.status === "Archived" && <p className="studio-course-description">Your access continues while this course is archived.</p>}
        <p className="studio-course-description"><InstructorByline instructor={course.instructor} /></p>
        <p className="studio-course-description">{course.totalLessons ?? 0} lessons{course.language ? ` · ${course.language}` : ""}</p>
        <p className="studio-course-duration"><Clock3 size={14} aria-hidden="true" />{course.totalDuration > 0 ? formatDuration(course.totalDuration) : "Duration not listed"}</p>
        {progress && <div className="library-course-progress">
          <div><span>{progress.completed ? "Course complete" : `${progress.completedLessons} of ${progress.totalLessons} lessons complete`}</span><strong>{progress.progressPercent}%</strong></div>
          <progress max={100} value={progress.progressPercent} aria-label={`${course.title} progress`} aria-valuetext={`${progress.completedLessons} of ${progress.totalLessons} lessons complete`} />
          {progress.continueLessonTitle && <p><span>{progress.completed ? "Revisit" : progress.started ? "Continue with" : "First lesson"}</span> {progress.continueLessonTitle}</p>}
          {progress.totalLessons === 0 && <p>Your lessons will appear here when available.</p>}
        </div>}
      </div>
      <div className="studio-course-footer"><Link className="cw-button cw-primary" to={destination} aria-label={`${action}: ${course.title}`}>{action} <ArrowRight size={16} aria-hidden="true" /></Link></div>
    </div>
  </article>;
}
export default function LearnerLibrary({ compact = false }) {
  const [page, setPage] = useState(1);
  const [view, setView] = useState("active");
  const query = useGetLearningLibraryQuery({ page, limit: compact ? 3 : 12, view: compact ? "active" : view }, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const data = query.currentData;
  useEffect(() => { if (!query.isFetching && !query.error && data?.courses?.length === 0 && page > 1) setPage(value => value - 1); }, [data, page, query.isFetching, query.error]);
  return <section className="learning-library" aria-label="Recorded course library">
    {!compact && <div className="cw-row learning-library-filter"><SelectField label="Library view" name="libraryView" labelPlacement="inline" value={view} onChange={value => { setView(value); setPage(1); }} options={[{ value: "active", label: "My courses" }, { value: "hidden", label: "Hidden courses" }]} /></div>}
    <QueryMessage query={{ data, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading your learning library" />
    {!query.error && data?.courses?.length === 0 && (view === "hidden" && !compact ? <WorkspaceEmpty title="No hidden courses" description="Courses you hide appear here. Restore them to return them to your main library." /> : <WorkspaceEmpty title="Your next chapter starts here" description={compact ? "Explore courses to start learning, or open your library to manage hidden courses." : "Courses you enroll in appear in your library. You can find hidden courses using the library view above."} to="/courses" action="Explore courses" />)}
    <div className="studio-course-grid">{data?.courses?.map(course => <LibraryCard key={course._id} course={course} disabled={query.isFetching || Boolean(query.error)} />)}</div>
    {compact ? <Link className="cw-text-link" to="/dashboard/learning">Manage your library and hidden courses</Link> : <Pagination pagination={data?.pagination} page={page} onPage={setPage} loading={query.isFetching} />}
  </section>;
}
