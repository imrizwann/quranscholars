import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, LockKeyhole, PlayCircle } from "lucide-react";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { useGetCourseAccessQuery } from "@/services/api/user/paymentApi.js";
import ProtectedLessonVideo from "@/features/recorded-courses/components/ProtectedLessonVideo.jsx";
import { WorkspaceEmpty, WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";

export default function RecordedCoursePlayer() {
  const { courseSlug, lessonId } = useParams();
  const query = useGetRecordedCourseBySlugQuery(courseSlug);
  const course = query.currentData;
  const access = useGetCourseAccessQuery(course?.id, { skip: !course?.id, refetchOnMountOrArgChange: true, refetchOnFocus: true, pollingInterval: 60_000 });
  const lesson = lessonId ? course?.lessons.find((item) => item.id === lessonId) : course?.lessons[0];
  const index = course?.lessons.indexOf(lesson) ?? -1;
  const previous = course?.lessons[index - 1];
  const next = course?.lessons[index + 1];
  const allowed = access.currentData?.canAccessCourse === true && !access.error;
  return <WorkspacePage eyebrow="Your classroom" title={course?.title || "Course lessons"} description="Give yourself time to listen, practice, and understand." action={<Link to="/dashboard/learning" className="cw-button"><ArrowLeft size={16} aria-hidden="true" />My learning</Link>}>
    <QueryMessage query={{ data: course, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading your course" />
    {course && <QueryMessage query={{ data: access.currentData, error: access.error, loading: access.isFetching, refresh: access.refetch }} label="Checking course access" />}
    {course && !access.isFetching && !access.error && !allowed && <WorkspaceEmpty icon={LockKeyhole} title="Course access required" description="An active purchase is required to watch these lessons. You can still explore the course outline and watch its public trailer." to={`/courses/${course.slug}`} action="View course details" />}
    {allowed && !lesson && <WorkspaceEmpty icon={BookOpen} title={lessonId ? "Lesson not found" : "Lessons are being prepared"} description={lessonId ? "This lesson is no longer available. Open the course to find the latest curriculum." : "Your instructor has not added lesson details yet. Please check back soon."} to={lessonId ? `/learn/${course.slug}` : `/courses/${course.slug}`} action="View course" />}
    {allowed && lesson && <div className="studio-classroom"><div className="studio-lesson-main"><section className="studio-lesson-player"><ProtectedLessonVideo key={`${course.id}/${lesson.id}`} target={{ courseId: course.id, sectionId: lesson.sectionId, lessonId: lesson.id }} title={lesson.title} poster={course.thumbnail} /></section><section className="studio-panel"><p className="studio-label">Lesson {index + 1} of {course.lessons.length}</p><h2>{lesson.title}</h2><p>{lesson.durationLabel} · Take your time and revisit the video whenever you need.</p><nav className="studio-lesson-navigation" aria-label="Lesson navigation">{previous ? <Link className="cw-button" to={`/learn/${course.slug}/${previous.id}`}><ArrowLeft size={16} />Previous lesson</Link> : <span />}{next && <Link className="cw-button cw-primary" to={`/learn/${course.slug}/${next.id}`}>Next lesson <ArrowRight size={16} /></Link>}</nav></section></div><aside className="studio-curriculum" aria-label="Course curriculum"><div className="studio-panel"><span className="studio-label">Course contents</span><h2>Your learning path</h2><p>{course.sections.length} sections · {course.lessons.length} lessons</p></div>{course.sections.map((section) => <details key={section.id} open={section.lessons.some((item) => item.id === lesson.id)}><summary>{section.title}<span>{section.lessons.length} lessons</span></summary><ol>{section.lessons.map((item) => <li key={item.id}><Link to={`/learn/${course.slug}/${item.id}`} aria-current={item.id === lesson.id ? "page" : undefined}><PlayCircle size={18} aria-hidden="true" /><span>{item.title}<small>{item.durationLabel}</small></span></Link></li>)}</ol></details>)}</aside></div>}
  </WorkspacePage>;
}
