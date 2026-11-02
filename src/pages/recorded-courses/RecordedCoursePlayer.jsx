import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Clock3, ClipboardCheck, Globe2, GraduationCap, ListVideo, LockKeyhole, NotebookPen, PanelRightClose, PanelRightOpen, Signal } from "lucide-react";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { useGetCourseAccessQuery } from "@/services/api/user/paymentApi.js";
import ProtectedLessonVideo from "@/features/recorded-courses/components/ProtectedLessonVideo.jsx";
import LearningCurriculum from "@/features/recorded-courses/components/LearningCurriculum.jsx";
import LessonNotes from "@/features/recorded-courses/components/LessonNotes.jsx";
import SectionQuizPanel from "@/features/recorded-courses/components/SectionQuizPanel.jsx";
import useLessonWatch from "@/features/recorded-courses/useLessonWatch.js";
import { useGetCourseProgressQuery } from "@/services/api/user/learnerApi.js";
import { orderedLearningSections, readLastLesson, readLessonStudy, saveLastLesson, saveLessonStudy } from "@/features/recorded-courses/services/lessonStudyStorage.js";
import { WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import WorkspaceAccountMenu from "@/layouts/WorkspaceAccountMenu.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import "@/layouts/workspace.css";
import "./course-learning.css";

function ClassroomSkeleton({ label }) {
  return <div className="learning-skeleton" role="status" aria-busy="true"><span className="sr-only">{label}</span><div className="learning-skeleton-stage"><div className="learning-skeleton-line" /><div className="learning-skeleton-video" /><div className="learning-skeleton-line" /></div><div className="learning-skeleton-content">{Array.from({ length: 7 }, (_, index) => <div className="learning-skeleton-line" key={index} />)}</div></div>;
}

function CourseOverview({ course, lesson, section }) {
  return <div className="learning-overview">
    {lesson.description && <section><h2>About this lesson</h2><p className="learning-description">{lesson.description}</p></section>}
    {section.description && <section><h2>In this section</h2><p className="learning-description">{section.description}</p></section>}
    <section><h2>About this course</h2><p className="learning-description">{course.description || "Work through the lessons in order and return to any topic whenever you need to practice."}</p><dl className="learning-course-facts"><div><dt><Globe2 size={16} aria-hidden="true" />Language</dt><dd>{course.language}</dd></div><div><dt><Signal size={16} aria-hidden="true" />Level</dt><dd>{course.level}</dd></div>{course.totalDurationSeconds > 0 && <div><dt><Clock3 size={16} aria-hidden="true" />Duration</dt><dd>{course.durationLabel}</dd></div>}</dl></section>
    {course.outcomes.length > 0 && <section><h2>What you’ll learn</h2><ul className="learning-outcomes">{course.outcomes.map((outcome, index) => <li key={index}><Check size={16} aria-hidden="true" /><span>{outcome}</span></li>)}</ul></section>}
    {course.requirements.length > 0 && <section><h2>Before you begin</h2><ul className="learning-requirements">{course.requirements.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
    <section className="learning-instructor"><span className="learning-instructor-icon"><GraduationCap size={23} aria-hidden="true" /></span><div><span className="studio-label">Your instructor</span><h2>{course.instructor.name}</h2>{course.instructor.bio && <p>{course.instructor.bio}</p>}<Link to={`/courses/${encodeURIComponent(course.slug)}#course-instructor`}>View course and instructor<ChevronRight size={15} aria-hidden="true" /></Link></div></section>
  </div>;
}

function LearningWorkspace({ course, userId, lessonId }) {
  const sections = useMemo(() => orderedLearningSections(course.sections), [course.sections]);
  const lessons = useMemo(() => sections.flatMap(section => section.lessons), [sections]);
  const [lastLesson] = useState(() => readLastLesson(userId, course.id, lessons));
  const lesson = lessonId ? lessons.find(item => item.id === lessonId) : lessons.find(item => item.id === lastLesson) || lessons[0];
  const [contentOpen, setContentOpen] = useState(true);
  const [finished, setFinished] = useState(false);
  const [tab, setTab] = useState("overview");
  const [quizSectionId, setQuizSectionId] = useState(null);
  const details = useRef(null);
  const heading = useRef(null);
  const lastViewed = useRef(lesson?.id);
  const playback = useRef({ lessonId: lesson?.id, time: 0, saved: 0 });
  const section = sections.find(item => item.id === lesson?.sectionId);
  const index = lessons.findIndex(item => item.id === lesson?.id);
  const previous = lessons[index - 1], next = lessons[index + 1];
  const startTime = readLessonStudy(userId, course.id, lesson?.id).position;
  const activeLessonId = lesson?.id;
  const activeLessonTitle = lesson?.title;
  const progress = useGetCourseProgressQuery(course.id, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const watch = useLessonWatch({ courseId: course.id, sectionId: lesson?.sectionId, lessonId: lesson?.id });
  const { update: updateWatch, pause: pauseWatch } = watch;
  useEffect(() => {
    if (!activeLessonId) return;
    saveLastLesson(userId, course.id, activeLessonId);
    setFinished(false);
    setTab("overview"); setQuizSectionId(null);
    const time = readLessonStudy(userId, course.id, activeLessonId).position;
    playback.current = { lessonId: activeLessonId, time, saved: time };
    if (lastViewed.current !== activeLessonId) heading.current?.focus({ preventScroll: true });
    lastViewed.current = activeLessonId;
  }, [activeLessonId, userId, course.id]);
  useEffect(() => {
    if (!activeLessonTitle) return;
    const title = document.title;
    document.title = `${activeLessonTitle} · ${course.title} | QuranScholar`;
    return () => { document.title = title; };
  }, [activeLessonTitle, course.title]);
  const remember = useCallback(({ currentTime }) => {
    if (playback.current.lessonId !== lesson?.id || !Number.isFinite(currentTime)) return;
    playback.current.time = currentTime;
    updateWatch({ currentTime });
    if (Math.abs(currentTime - playback.current.saved) >= 15) {
      saveLessonStudy(userId, course.id, lesson?.id, { position: currentTime });
      playback.current.saved = currentTime;
    }
  }, [userId, course.id, lesson?.id, updateWatch]);
  const flush = useCallback(() => { if (playback.current.lessonId === lesson?.id) saveLessonStudy(userId, course.id, lesson?.id, { position: playback.current.time }); }, [userId, course.id, lesson?.id]);
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVisibility);
    const position = playback.current;
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      saveLessonStudy(userId, course.id, lesson?.id, { position: position.time });
    };
  }, [flush, userId, course.id, lesson?.id]);
  const end = useCallback(data => { pauseWatch(data); playback.current.time = 0; flush(); setFinished(true); }, [flush, pauseWatch]);
  function openQuiz(sectionId) {
    document.querySelector(".learning-video video")?.pause();
    setQuizSectionId(sectionId); setTab("quiz");
    requestAnimationFrame(() => { details.current?.scrollIntoView({ behavior: "instant", block: "start" }); details.current?.focus({ preventScroll: true }); });
  }
  if (!lesson) return <WorkspaceEmpty icon={BookOpen} title={lessonId ? "Lesson not found" : "Lessons are being prepared"} description={lessonId ? "This lesson may have moved. Return to the course to find the current lessons." : "Your course lessons will appear here when they are available."} to={lessonId ? `/learn/${encodeURIComponent(course.slug)}` : `/courses/${encodeURIComponent(course.slug)}`} action={lessonId ? "Open course" : "View course details"} />;
  return <>
    <div className="learning-course-heading"><div><p className="studio-label">Your classroom</p><h1>{course.title}</h1><p>{course.instructor.name}<span aria-hidden="true"> · </span>{lessons.length} lessons{course.totalDurationSeconds > 0 && <><span aria-hidden="true"> · </span>{course.durationLabel}</>}</p></div><button type="button" className="cw-button" onClick={() => setContentOpen(value => !value)} aria-expanded={contentOpen} aria-controls="learning-course-content">{contentOpen ? <PanelRightClose size={17} aria-hidden="true" /> : <PanelRightOpen size={17} aria-hidden="true" />}<span>{contentOpen ? "Hide course content" : "Show course content"}</span></button></div>
    <div className={`learning-grid${contentOpen ? "" : " learning-focus"}`}>
      <section className="learning-stage" aria-labelledby="learning-lesson-title">
        <div className="learning-video"><ProtectedLessonVideo key={`${course.id}/${lesson.id}`} target={{ courseId: course.id, sectionId: lesson.sectionId, lessonId: lesson.id }} title={lesson.title} poster={course.thumbnail} startTime={startTime} onPlaybackProgress={remember} onPlaybackPlay={watch.play} onPlaybackPause={data => { flush(); watch.pause(data); }} onPlaybackSeek={watch.seek} onEnded={end} /></div>
        <div className="learning-lesson-heading"><p className="studio-label">Section {sections.indexOf(section) + 1}<span aria-hidden="true"> / </span>{section.title}</p><h2 id="learning-lesson-title" tabIndex={-1} ref={heading}>{lesson.title}</h2><div className="learning-lesson-meta"><span><ListVideo size={15} aria-hidden="true" />Lesson {index + 1} of {lessons.length}</span>{lesson.durationSeconds > 0 && <span><Clock3 size={15} aria-hidden="true" />{lesson.durationLabel}</span>}</div></div>
        <nav className="learning-lesson-navigation" aria-label="Lesson navigation">{previous ? <Link className="cw-button" to={`/learn/${encodeURIComponent(course.slug)}/${encodeURIComponent(previous.id)}`}><ArrowLeft size={16} aria-hidden="true" />Previous lesson</Link> : <span className="learning-first-lesson">Your first lesson</span>}{next ? <Link className="cw-button cw-primary" to={`/learn/${encodeURIComponent(course.slug)}/${encodeURIComponent(next.id)}`}>Next lesson<ArrowRight size={16} aria-hidden="true" /></Link> : <Link className="cw-button cw-primary" to="/dashboard/learning">Back to My learning<ArrowRight size={16} aria-hidden="true" /></Link>}</nav>
        {finished && <div className="learning-finished" role="status"><Check size={18} aria-hidden="true" /><p>{next ? "You’ve reached the end of this lesson. Continue when you’re ready." : "You’ve reached the end of the final lesson. You can revisit any lesson to keep practicing."}</p></div>}
        {(watch.status === "error" || progress.error) && <div className="learning-progress-error" role="alert"><p>{watch.error || "We could not load your saved progress. You can still watch this lesson."}</p><button type="button" className="cw-button" onClick={() => { watch.retry(); progress.refetch(); }}>Retry progress</button></div>}
        {watch.status === "saving" && <p className="learning-save-status" role="status">Saving lesson progress…</p>}
      </section>
      <aside id="learning-course-content" className="learning-curriculum" aria-labelledby="learning-content-title" hidden={!contentOpen}><LearningCurriculum course={course} sections={sections} lesson={lesson} lessons={lessons} learningState={!progress.error ? progress.currentData : undefined} progressLoading={progress.isLoading} onQuiz={openQuiz} /></aside>
      <section className="learning-details" aria-label="Lesson information and notes" ref={details} tabIndex={-1}><Tabs.Root value={tab} onValueChange={setTab}><Tabs.List className="learning-tabs" aria-label="Lesson tools"><Tabs.Tab value="overview"><BookOpen size={16} aria-hidden="true" />Overview</Tabs.Tab><Tabs.Tab value="notes"><NotebookPen size={16} aria-hidden="true" />My notes</Tabs.Tab>{quizSectionId && <Tabs.Tab value="quiz"><ClipboardCheck size={16} aria-hidden="true" />Section quiz</Tabs.Tab>}</Tabs.List><Tabs.Panel value="overview"><CourseOverview course={course} lesson={lesson} section={section} /></Tabs.Panel><Tabs.Panel value="notes" keepMounted><LessonNotes key={`${userId}/${course.id}/${lesson.id}`} userId={userId} courseId={course.id} lesson={lesson} getTime={() => playback.current.time} /></Tabs.Panel>{quizSectionId && <Tabs.Panel value="quiz"><SectionQuizPanel key={quizSectionId} courseId={course.id} sectionId={quizSectionId} onDone={() => setTab("overview")} /></Tabs.Panel>}</Tabs.Root></section>
    </div>
    <footer className="learning-footer"><p>Playback position is saved in this browser.</p><Link to="/contact"><CircleHelp size={16} aria-hidden="true" />Get help with this course</Link></footer>
  </>;
}

export default function RecordedCoursePlayer() {
  const { courseSlug, lessonId } = useParams();
  const user = useSelector(state => state.user.user);
  const query = useGetRecordedCourseBySlugQuery(courseSlug, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const course = query.currentData;
  const access = useGetCourseAccessQuery(course?.id, { skip: !course?.id, refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true, pollingInterval: 60_000, skipPollingIfUnfocused: true });
  const owner = user?.role === "instructor" && String(course?.instructor.id) === String(user?._id);
  const allowed = !access.error && (access.currentData?.canAccessCourse === true || owner);
  const pending = (!query.error && !course) || (course && !access.currentData && !access.error);
  return <div className="learning-room">
    <a href="#learning-main" className="workspace-skip-link">Skip to lesson</a>
    <header className="learning-topbar"><Link to="/dashboard/learning" className="learning-back"><ArrowLeft size={17} aria-hidden="true" /><span>My learning</span></Link><Link className="learning-brand" to="/" aria-label="QuranScholar home"><BookOpen size={20} aria-hidden="true" /><span>QuranScholar</span></Link><WorkspaceAccountMenu type={user?.role === "instructor" ? "instructor" : user?.role === "admin" ? "admin" : "student"} /></header>
    <main id="learning-main" className="learning-main" tabIndex={-1}>
      {pending ? <ClassroomSkeleton label={course ? "Checking course access" : "Loading your classroom"} /> : query.error ? <div className="learning-page-state"><QueryMessage query={{ error: query.error, refresh: query.refetch }} /><Link className="cw-button" to="/dashboard/learning">Return to My learning</Link></div> : access.error ? <div className="learning-page-state"><QueryMessage query={{ error: access.error, refresh: access.refetch }} /><Link className="cw-button" to="/dashboard/learning">Return to My learning</Link></div> : course && !allowed ? <WorkspaceEmpty icon={LockKeyhole} title="Course access required" description="Enroll in this course to watch its lessons. You can review the course outline and watch the trailer before joining." to={`/courses/${encodeURIComponent(course.slug)}`} action="View course details" /> : course && allowed ? <LearningWorkspace key={`${user?._id}/${course.id}`} course={course} userId={user?._id} lessonId={lessonId} /> : <WorkspaceEmpty title="Course not found" description="This course may have moved or is no longer available." to="/dashboard/learning" action="My learning" />}
    </main>
  </div>;
}
