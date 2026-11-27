import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, PlayCircle } from "lucide-react";
import { useGetLearningLibraryQuery } from "@/services/api/user/paymentApi.js";
import { resolveCourseImage, formatDuration } from "../model/recordedCourseAdapter.js";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";

// Same arguments as the compact library on the overview, so both share one request.
const LIBRARY_ARGS = { page: 1, limit: 3, view: "active" };

// The course to resume: one in progress first, then one not yet started, then any.
function pickCourse(courses = []) {
  return courses.find(course => course.progress?.started && !course.progress?.completed)
    || courses.find(course => !course.progress?.completed)
    || courses[0];
}

export default function ContinueLearning() {
  const query = useGetLearningLibraryQuery(LIBRARY_ARGS, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const [failed, setFailed] = useState(null);
  const courses = query.currentData?.courses;

  if (!courses && query.isFetching && !query.error) return <div className="continue-card continue-card--loading" role="status"><span className="sr-only">Loading your next lesson</span><span /><div><span /><span /><span /></div></div>;
  const course = query.error ? null : pickCourse(courses);
  if (!course) return null;

  const progress = course.progress;
  const destination = `/learn/${encodeURIComponent(course.slug)}`;
  const image = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const state = progress?.completed ? "complete" : progress?.started ? "continue" : "start";
  const label = { complete: "Course complete", continue: "Continue learning", start: "Ready to start" }[state];
  const action = { complete: "Revisit course", continue: "Continue learning", start: "Start course" }[state];
  const lessonLabel = { complete: "Revisit", continue: "Next lesson", start: "First lesson" }[state];

  return <section className="continue-card" aria-labelledby="continue-title">
    <Link to={destination} className="continue-cover" tabIndex={-1} aria-hidden="true">
      {image && failed !== image
        ? <img src={image} alt="" onError={() => setFailed(image)} />
        : <span className="continue-placeholder"><BookOpen size={40} strokeWidth={1.25} /></span>}
      <span className="continue-play"><PlayCircle size={44} strokeWidth={1.25} /></span>
    </Link>
    <div className="continue-body">
      <p className="continue-label">{state === "complete" ? <CheckCircle2 size={15} aria-hidden="true" /> : <PlayCircle size={15} aria-hidden="true" />}{label}</p>
      <h2 id="continue-title"><Link to={destination}>{course.title}</Link></h2>
      <p className="continue-byline"><InstructorByline instructor={course.instructor} /></p>
      {progress?.continueLessonTitle && <p className="continue-lesson"><span>{lessonLabel}</span>{progress.continueLessonTitle}</p>}
      {progress && progress.totalLessons > 0 && <div className="continue-progress">
        <div><span>{progress.completedLessons} of {progress.totalLessons} lessons complete</span><strong>{progress.progressPercent}%</strong></div>
        <progress max={100} value={progress.progressPercent} aria-label={`${course.title} progress`} aria-valuetext={`${progress.completedLessons} of ${progress.totalLessons} lessons complete`} />
      </div>}
      <div className="continue-actions">
        <Link className="cw-button cw-primary" to={destination}>{action}<ArrowRight size={16} aria-hidden="true" /></Link>
        {course.totalDuration > 0 && <span className="continue-meta"><Clock3 size={15} aria-hidden="true" />{formatDuration(course.totalDuration)} of video</span>}
      </div>
    </div>
  </section>;
}
