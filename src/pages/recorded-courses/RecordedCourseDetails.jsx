import AppLoader from "@/components/feedback/AppLoader.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Globe2,
  MonitorPlay,
  Play,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import CourseRating from "@/features/recorded-courses/components/CourseRating.jsx";
import CurriculumSection from "@/features/recorded-courses/components/CurriculumSection.jsx";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import { useGetRecordedCourseBySlugQuery, useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import CourseVideo from "@/features/recorded-courses/components/CourseVideo.jsx";

const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const TrailerDialog = ({ course, open, onClose }) => {
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() =>
      closeButtonRef.current?.focus({ preventScroll: true }),
    );
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')].filter((element) => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#041d1a]/80 p-4 backdrop-blur-sm"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#092f2b] text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.13em] text-[#9ed6c8]">
              Course preview
            </p>
            <h2
              id="trailer-title"
              className="mt-1 line-clamp-1 font-display text-lg font-black"
            >
              {course.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
            aria-label="Close course preview"
          >
            <X className="size-5" />
          </button>
        </div>
        <CourseVideo src={course.trailerVideo} poster={course.thumbnail} title={`${course.title} preview`} />
      </div>
    </div>
  );
};

const RecordedCourseDetails = () => {
  const { slug } = useParams();
  const location = useLocation();
  const catalogReturn = location.state?.courseCatalog;
  const catalogUrl = catalogReturn?.url?.startsWith("/courses?") || catalogReturn?.url === "/courses" ? catalogReturn.url : "/courses";
  const catalogState = catalogReturn ? { restoreScrollKey: catalogReturn.key } : undefined;
  const { currentData: course, isFetching, isError, error, refetch } = useGetRecordedCourseBySlugQuery(slug);
  const { currentData: relatedData, isFetching: relatedLoading } = useGetRecordedCoursesQuery(
    { category: course?.categorySlug || "All", limit: 4 }, { skip: !course },
  );
  const relatedCourses = (relatedData?.courses || []).filter((item) => item.id !== course?.id).slice(0, 3);
  const [previewOpen, setPreviewOpen] = useState(false);
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  useEffect(() => setPreviewOpen(false), [slug]);

  if (isFetching && !course) return <AppLoader label="Loading course details..." />;
  if (isError && error?.status !== 404) return <main className="grid min-h-[60vh] place-items-center"><div className="text-center" role="alert"><h1 className="font-display text-3xl font-black">We could not load this course</h1><button type="button" onClick={refetch} className="mt-5 font-bold text-primary">Try again</button></div></main>;
  if (!course) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#fbfcfa] px-4">
        <div className="max-w-lg text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#e8f4f0] text-primary">
            <BookOpen />
          </span>
          <h1 className="mt-5 font-display text-3xl font-black">
            Course not found
          </h1>
          <p className="mt-3 text-[#68766f]">
            This self-paced course may have moved or is not currently published.
          </p>
          <Link
            to={catalogUrl}
                state={catalogState}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white no-underline"
          >
            <ArrowLeft className="size-4" />
            Back to courses
          </Link>
        </div>
      </main>
    );
  }

  const updatedLabel = course.updatedAt
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
        new Date(course.updatedAt),
      )
    : "Not specified";

  return (
    <main className="bg-[#fbfcfa] text-[#172b24]">
      <section className="bg-[#082f2b] px-4 py-12 text-white sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
          <div>
            <nav
              className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/60"
              aria-label="Breadcrumb"
            >
              <Link
                to={catalogUrl}
                state={catalogState}
                className="text-[#a6dcd0] no-underline hover:text-white"
              >
                Courses
              </Link>
              <span>/</span>
              <Link
                to={catalogUrl}
                state={catalogState}
                className="text-[#a6dcd0] no-underline hover:text-white"
              >
                Self-paced
              </Link>
              <span>/</span>
              <span>{course.category}</span>
            </nav>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-md bg-[#f4c95d] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.09em] text-[#17372f]">
                Self-paced
              </span>
              {course.bestseller && (
                <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.09em]">
                  Bestseller
                </span>
              )}
            </div>
            <h1 className="mt-5 max-w-4xl text-balance font-display text-[clamp(2.35rem,5vw,4.4rem)] font-black leading-[1.04] tracking-[-0.045em]">
              {course.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-white/72">
              {course.shortDescription}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-bold text-white/72">
              <CourseRating
                rating={course.rating}
                reviews={course.totalReviews}
                light
              />
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 text-[#9ed6c8]" />
                {compactNumber.format(course.totalStudents)} learners
              </span>
              <span>
                Created by{" "}
                <span className="text-white">{course.instructor.name}</span>
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/58">
              <span>Updated {updatedLabel}</span>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="size-3.5" />
                {course.language}
              </span>
              <span>{course.level}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-white/15 bg-[#dfece7] shadow-[0_25px_70px_rgba(0,0,0,.25)]"
            aria-label="Preview course trailer"
          >
            <img
              src={course.thumbnail || "/courses/course-vector.svg"}
              alt=""
              className="size-full object-contain p-8 opacity-90 transition group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 grid place-items-center bg-[#052f28]/12">
              <span className="grid size-14 place-items-center rounded-full bg-white text-primary shadow-xl">
                <Play className="ml-0.5 size-5 fill-current" />
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-4 text-center text-xs font-black text-[#143c34]">
              Preview this course
            </span>
          </button>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="order-2 min-w-0 space-y-10 lg:order-1">
          <section className="rounded-2xl border border-[#dfe6e2] bg-white p-6 sm:p-8">
            <h2 className="font-display text-2xl font-black">
              What you will learn
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {course.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#53665e]"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#e5f3ee] text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {outcome}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-black">
              About this course
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-[#5f7068]">
              {course.description}
            </p>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-black">
                  Course curriculum
                </h2>
                <p className="mt-2 text-sm font-semibold text-[#718079]">
                  {course.totalSections == null ? "Section count not listed" : `${course.totalSections} sections`} · {course.totalLessons == null ? "Lesson count not listed" : `${course.totalLessons} lessons`} · {course.durationLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-black text-primary"
              >
                <Play className="size-4 fill-current" />
                Preview course
              </button>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-[#dfe6e2]">
              {!course.sections.length && <p className="p-5 text-sm text-[#718079]">The lesson outline is not available yet.</p>}
              {course.sections.map((section, index) => (
                <CurriculumSection
                  key={section.id}
                  section={section}
                  defaultOpen={index === 0}
                  locked
                  onSelectLesson={() => setPreviewOpen(true)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-black">
              Requirements and audience
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-[#dfe6e2] bg-white p-5">
                <h3 className="font-black">Before you begin</h3>
                <ul className="mt-3 grid gap-2 text-sm font-medium leading-6 text-[#5f7068]">
                  {course.requirements.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[#dfe6e2] bg-white p-5">
                <h3 className="font-black">This course is for</h3>
                <ul className="mt-3 grid gap-2 text-sm font-medium leading-6 text-[#5f7068]">
                  {course.audience.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-[#eaf4f0] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
              Your instructor
            </p>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#0b3e38] font-display text-xl font-black text-white">
                {course.instructor.name
                  .split(" ")
                  .filter((word) => !word.endsWith("."))
                  .slice(-2)
                  .map((word) => word[0])
                  .join("")}
              </span>
              <div>
                <h2 className="font-display text-2xl font-black">
                  {course.instructor.name}
                </h2>
                <p className="mt-1 text-sm font-bold text-primary">
                  {course.instructor.title}
                </p>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#5d6f67]">
                  {course.instructor.bio}
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-black">
                Learner feedback
              </h2>
              <CourseRating
                rating={course.rating}
                reviews={course.totalReviews}
              />
            </div>
            <p className="mt-5 text-sm text-[#718079]">Written reviews are not available yet.</p>
          </section>
        </div>
        <aside className="order-1 h-fit overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white text-[#172b24] shadow-[0_16px_48px_rgba(21,54,44,.1)] lg:sticky lg:top-24 lg:order-2">
          <div className="p-5 sm:p-6">
            <CoursePrice price={course.price} size="large" />
            {course.price.discounted && (
              <p className="mt-1 text-xs font-black text-[#a65b08]">
                Sale price
              </p>
            )}
            <button type="button" disabled className="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-black text-white opacity-60">
              Enrollment coming soon
            </button>
            <p className="mt-3 text-center text-xs font-semibold text-[#718079]">Enrollment is not available yet.</p>
            <div className="mt-6 border-t border-[#e8eeeb] pt-5">
              <h2 className="text-sm font-black">This course includes</h2>
              <ul className="mt-3 grid gap-2.5 text-sm font-semibold text-[#5f7068]">
                <li className="flex items-center gap-2">
                  <MonitorPlay className="size-4 text-primary" />
                  {course.durationLabel} on-demand video
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  {course.totalLessons == null ? "Lesson count not listed" : `${course.totalLessons} structured lessons`}
                </li>
                <li className="flex items-center gap-2">
                  <Smartphone className="size-4 text-primary" />
                  Mobile and desktop access
                </li>

              </ul>
            </div>
          </div>
        </aside>
      </div>

      {(relatedLoading || relatedCourses.length > 0) && <section className="border-t border-[#dfe6e2] bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl font-black tracking-[-0.035em]">
            You may also like
          </h2>
          {relatedLoading && <LoadingState variant="inline" label="Finding related courses..." className="mt-5" />}
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={relatedLoading}>
            {relatedCourses.map((item) => (
              <RecordedCourseCard key={item.id} course={item} />
            ))}
          </div>
        </div>
      </section>}
      <TrailerDialog
        course={course}
        open={previewOpen}
        onClose={closePreview}
      />
    </main>
  );
};

export default RecordedCourseDetails;
