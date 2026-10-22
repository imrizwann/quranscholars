import AppLoader from "@/components/feedback/AppLoader.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Menu,
  X,
} from "lucide-react";
import CurriculumSection from "@/features/recorded-courses/components/CurriculumSection.jsx";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { getEnrollment, subscribeToLearning, updateCourseProgress } from "@/features/recorded-courses/services/learningStorage.js";

import CourseVideo from "@/features/recorded-courses/components/CourseVideo.jsx";

const RecordedCoursePlayer = () => {
  const { courseSlug, lessonId } = useParams();
  const navigate = useNavigate();
  const { currentData: course, isFetching, isError, error, refetch } = useGetRecordedCourseBySlugQuery(courseSlug);
  const [enrollment, setEnrollment] = useState(() => (course ? getEnrollment(course.id) : null));
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);

  const currentIndex = useMemo(() => Math.max(0, course?.lessons.findIndex((lesson) => lesson.id === lessonId) ?? 0), [course, lessonId]);
  const currentLesson = course?.lessons[currentIndex];
  const previousLesson = course?.lessons[currentIndex - 1];
  const nextLesson = course?.lessons[currentIndex + 1];
  const completedIds = enrollment?.completedLessonIds || [];
  const progress = course?.totalLessons ? Math.round((completedIds.length / course.totalLessons) * 100) : 0;

  useEffect(() => {
    setEnrollment(course ? getEnrollment(course.id) : null);
    if (!course) return undefined;
    return subscribeToLearning(() => setEnrollment(getEnrollment(course.id)));
  }, [course]);

  useEffect(() => {
    if (!mobileCurriculumOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event) => event.key === "Escape" && setMobileCurriculumOpen(false);
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
    };
  }, [mobileCurriculumOpen]);

  if (isFetching && !course) return <AppLoader label="Loading your course..." />;
  if (isError && error?.status !== 404) return <main className="grid min-h-screen place-items-center"><div role="alert">We could not load this course.<button type="button" onClick={refetch} className="ml-3 font-bold text-primary">Try again</button></div></main>;
  if (!course || !currentLesson) {
    return <main className="grid min-h-screen place-items-center bg-[#071f1c] px-4 text-white"><div className="w-full max-w-3xl text-center"><h1 className="mb-6 font-display text-3xl font-black">{course ? "Lessons are not available yet" : "Course not found"}</h1>{course && <CourseVideo poster={course.thumbnail} title={course.title} unavailableMessage="Lesson playback is not available yet." />}<Link to={course ? `/courses/${course.slug}` : "/courses"} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-[#11342e] no-underline"><ArrowLeft className="size-4" />Back to courses</Link></div></main>;
  }

  if (!enrollment) {
    return <main className="grid min-h-screen place-items-center bg-[#fbfcfa] px-4"><div className="max-w-lg text-center"><h1 className="font-display text-3xl font-black">Enroll before opening lessons</h1><p className="mt-3 text-[#68766f]">This course is not in your learning library yet.</p><Link to={`/courses/${course.slug}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white no-underline">View course <ChevronRight className="size-4" /></Link></div></main>;
  }

  const openLesson = (lesson) => {
    setMobileCurriculumOpen(false);
    updateCourseProgress(course.id, lesson.id, completedIds.includes(lesson.id));
    navigate(`/learn/${course.slug}/${lesson.id}`);
  };
  const toggleComplete = () => updateCourseProgress(course.id, currentLesson.id, !completedIds.includes(currentLesson.id));
  const goToLesson = (lesson) => lesson && openLesson(lesson);

  const Curriculum = () => (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#172b24]">
      <div className="border-b border-[#dfe6e2] p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-black">Course content</h2><button type="button" onClick={() => setMobileCurriculumOpen(false)} className="grid size-9 place-items-center rounded-lg border border-[#dfe6e2] lg:hidden" aria-label="Close curriculum"><X className="size-4" /></button></div><div className="mt-3 flex items-center justify-between text-xs font-bold text-[#68766f]"><span>{completedIds.length} of {course.totalLessons} complete</span><span>{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5ece8]"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto"><div className="border-y border-[#e8eeeb]">{course.sections.map((section) => <CurriculumSection key={section.id} section={section} activeLessonId={currentLesson.id} completedLessonIds={completedIds} onSelectLesson={openLesson} />)}</div></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#061f1c] text-white">
      <header className="flex min-h-16 items-center gap-3 border-b border-white/10 bg-[#082b27] px-4 sm:px-5">
        <Link to="/my-learning" className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/12 bg-white/5 text-white no-underline transition hover:bg-white/10" aria-label="Back to My Learning"><ArrowLeft className="size-5" /></Link>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{course.title}</p><p className="mt-0.5 truncate text-xs font-semibold text-white/50">{currentLesson.title}</p></div>
        <button type="button" onClick={() => setMobileCurriculumOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 text-xs font-black text-white lg:hidden"><Menu className="size-4" />Lessons</button>
        <div className="hidden items-center gap-2 text-xs font-bold text-white/60 sm:flex"><span>{progress}% complete</span><CheckCircle2 className="size-4 text-[#f4c95d]" /></div>
      </header>

      <div className="lg:grid lg:h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 overflow-y-auto">
          <section className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#041513] shadow-[0_25px_65px_rgba(0,0,0,.3)]">
              <CourseVideo src={currentLesson.videoUrl} poster={course.thumbnail} title={currentLesson.title} unavailableMessage="Lesson playback is not available yet." />
            </div>

            <div className="mt-6 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#8dcdbd]">Lesson {currentIndex + 1} of {course.totalLessons}</p><h1 className="mt-2 font-display text-2xl font-black leading-tight sm:text-3xl">{currentLesson.title}</h1></div>
              <button type="button" onClick={toggleComplete} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${completedIds.includes(currentLesson.id) ? "border border-[#7fc5b3]/35 bg-[#7fc5b3]/10 text-[#a7dfd1]" : "bg-[#f4c95d] text-[#123a33] hover:bg-[#ffdb7d]"}`}><Check className="size-4" strokeWidth={3} />{completedIds.includes(currentLesson.id) ? "Completed" : "Mark complete"}</button>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto]">
              <div><h2 className="font-display text-xl font-black">About this lesson</h2><p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-white/62">{currentLesson.description}</p>{currentLesson.resources.length > 0 && <div className="mt-6"><h3 className="text-sm font-black">Lesson resources</h3><div className="mt-3 grid gap-2">{currentLesson.resources.map((resource) => <div key={resource.title} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"><FileText className="size-4 text-[#f4c95d]" /><span className="text-sm font-bold">{resource.title}</span><span className="ml-auto text-xs font-semibold text-white/40">{resource.type}</span></div>)}</div></div>}</div>
              <nav className="flex items-center gap-2" aria-label="Lesson navigation"><button type="button" disabled={!previousLesson} onClick={() => goToLesson(previousLesson)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="size-4" />Previous</button><button type="button" disabled={!nextLesson} onClick={() => goToLesson(nextLesson)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-black text-[#123a33] disabled:cursor-not-allowed disabled:opacity-35">Next<ChevronRight className="size-4" /></button></nav>
            </div>
          </section>
        </div>

        <aside className="hidden min-h-0 border-l border-white/10 lg:block"><Curriculum /></aside>
      </div>

      {mobileCurriculumOpen && <div className="fixed inset-0 z-50 bg-[#041513]/70 lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileCurriculumOpen(false)}><aside className="ml-auto h-full w-[min(25rem,92vw)] shadow-2xl"><Curriculum /></aside></div>}
    </main>
  );
};

export default RecordedCoursePlayer;
