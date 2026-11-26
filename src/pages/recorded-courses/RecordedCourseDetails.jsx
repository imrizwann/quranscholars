import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import AppLoader from "@/components/feedback/AppLoader.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import CourseReviews from "@/features/recorded-courses/components/CourseReviews.jsx";
import PublicCourseCurriculum from "@/features/recorded-courses/components/PublicCourseCurriculum.jsx";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import CourseDescription from "@/features/recorded-courses/components/CourseDescription.jsx";
import { useGetRecordedCourseBySlugQuery, useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { CourseFaq, CourseHero, EnrollCard, GlanceStrip, InstructorSection, MobileEnrollBar, Outcomes, Readiness, SectionNav } from "./CourseDetailParts.jsx";
import "./course-detail.css";

function CourseDetailsContent({ course, catalogUrl, catalogState, relatedCourses, relatedLoading, relatedError }) {
  const trailerSource = useMemo(() => course.trailerVideo ? { src: course.trailerVideo, type: "application/x-mpegurl" } : null, [course.trailerVideo]);
  const date = course.updatedAt ? new Date(course.updatedAt) : null;
  const updated = date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date) : null;
  const hasOutcomes = course.outcomes.length > 0;

  return <main className="course-detail">
    <div className="cd-page">
      <div className="cd-hero-bg" aria-hidden="true"><span className="cd-hero-pattern" /></div>
      <CourseHero course={course} catalogUrl={catalogUrl} catalogState={catalogState} updated={updated} />
      <EnrollCard course={course} trailerSource={trailerSource} />

      <div className="cd-main">
        <GlanceStrip course={course} />
        <SectionNav />
        <section id="course-overview" className="cd-section" aria-labelledby="overview-heading">
          <p className="cd-eyebrow">Course overview</p>
          <h2 id="overview-heading">{hasOutcomes ? "What you will learn" : "About this course"}</h2>
          {hasOutcomes && <Outcomes outcomes={course.outcomes} />}
          <div className={hasOutcomes ? "cd-about" : undefined}>
            {hasOutcomes && <h3>About this course</h3>}
            <CourseDescription key={course.id || course.slug} text={course.description} />
          </div>
          {course.tags.length > 0 && <ul className="cd-tags" aria-label="Course topics">{course.tags.map((tag, index) => <li key={index}>{tag}</li>)}</ul>}
        </section>
        <PublicCourseCurriculum course={course} />
        <Readiness course={course} />
        <InstructorSection instructor={course.instructor} />
        <section id="course-reviews" className="cd-section" aria-labelledby="reviews-heading"><CourseReviews key={course.id} course={course} /></section>
        <CourseFaq course={course} />
      </div>

      {!relatedError && (relatedLoading || relatedCourses.length > 0) && <section className="cd-related" aria-labelledby="related-heading">
        <div className="cd-section-heading"><div><p className="cd-eyebrow">Keep exploring</p><h2 id="related-heading">More courses you may like</h2></div><Link className="cd-text-button" to={catalogUrl} state={catalogState}>All courses<ArrowUpRight aria-hidden="true" /></Link></div>
        {relatedLoading ? <LoadingState variant="inline" label="Finding related courses..." /> : <div className="cd-related-grid">{relatedCourses.map((item) => <RecordedCourseCard key={item.id} course={item} />)}</div>}
      </section>}
    </div>
    <MobileEnrollBar course={course} />
  </main>;
}

export default function RecordedCourseDetails() {
  const { slug } = useParams();
  const location = useLocation();
  const catalogReturn = location.state?.courseCatalog;
  const catalogUrl = catalogReturn?.url?.startsWith("/courses?") || catalogReturn?.url === "/courses" ? catalogReturn.url : "/courses";
  const catalogState = catalogReturn ? { restoreScrollKey: catalogReturn.key } : undefined;
  const { currentData: course, isFetching, isError, error, refetch } = useGetRecordedCourseBySlugQuery(slug);
  const { currentData: relatedData, isFetching: relatedLoading, isError: relatedError } = useGetRecordedCoursesQuery({ category: course?.categorySlug || "All", limit: 4 }, { skip: !course });
  if (isFetching && !course) return <AppLoader label="Loading course details..." />;
  if (isError && error?.status !== 404) return <main className="course-detail cd-page-state" role="alert"><BookOpen aria-hidden="true" /><h1>We could not load this course</h1><p>Please check your connection and try again.</p><button type="button" className="cd-text-button" onClick={refetch}>Try again</button><Link to={catalogUrl} state={catalogState}>Back to courses</Link></main>;
  if (!course) return <main className="course-detail cd-page-state"><BookOpen aria-hidden="true" /><h1>Course not found</h1><p>This course may have moved or is not currently published.</p><Link to={catalogUrl} state={catalogState}><ArrowLeft aria-hidden="true" />Back to courses</Link></main>;
  return <CourseDetailsContent key={course.id || slug} course={course} catalogUrl={catalogUrl} catalogState={catalogState} relatedCourses={(relatedData?.courses || []).filter((item) => item.id !== course.id).slice(0, 3)} relatedLoading={relatedLoading} relatedError={relatedError} />;
}
