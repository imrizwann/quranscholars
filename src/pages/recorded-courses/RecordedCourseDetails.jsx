import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronRight, Clock3, Globe2, GraduationCap, Layers3, MessageCircle, MonitorPlay, PlayCircle, Signal, Users, VideoOff } from "lucide-react";
import AppLoader from "@/components/feedback/AppLoader.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import CourseEnrollment from "@/features/recorded-courses/components/CourseEnrollment.jsx";
import CourseShareButton from "@/features/recorded-courses/components/CourseShareButton.jsx";
// import CourseRating from "@/features/recorded-courses/components/CourseRating.jsx";
import CourseVideo from "@/features/recorded-courses/components/CourseVideo.jsx";
import PublicCourseCurriculum from "@/features/recorded-courses/components/PublicCourseCurriculum.jsx";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import CourseDescription from "@/features/recorded-courses/components/CourseDescription.jsx";
import { useGetRecordedCourseBySlugQuery, useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import "./course-detail.css";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { instructorProfileUrl } from "@/features/profile/instructor-link.js";

const number = new Intl.NumberFormat("en-IN");

function CourseDetailsContent({ course, catalogUrl, catalogState, relatedCourses, relatedLoading, relatedError }) {
  const trailerSource = useMemo(() => course.trailerVideo ? { src: course.trailerVideo, type: "application/x-mpegurl" } : null, [course.trailerVideo]);
  const date = course.updatedAt ? new Date(course.updatedAt) : null;
  const updated = date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date) : null;
  const lessonCount = course.totalLessons == null ? "Lesson count not listed" : `${number.format(course.totalLessons)} lessons`;

  return <main className="course-detail">
    <div className="cd-container">
      <nav className="cd-breadcrumbs" aria-label="Breadcrumb">
        <Link to={catalogUrl} state={catalogState}><ArrowLeft aria-hidden="true" />All courses</Link><ChevronRight aria-hidden="true" /><span>{course.category}</span>
      </nav>
      <header className="cd-hero">
        <div className="cd-badges"><span className="cd-badge"><MonitorPlay aria-hidden="true" />Self-paced course</span>{course.level !== "Not specified" && <span className="cd-level">{course.level}</span>}</div>
        <h1>{course.title}</h1>
        {course.shortDescription && <p className="cd-intro">{course.shortDescription}</p>}
        <div className="cd-hero-meta">
          <a href="#course-instructor" className="cd-instructor-link"><GraduationCap aria-hidden="true" /><span>With <strong>{course.instructor.name}</strong></span></a>
          <span><Globe2 aria-hidden="true" />{course.language}</span>
          {/* Learner ratings are deferred until the review workflow is available. */}
          {course.totalStudents > 0 && <span><Users aria-hidden="true" />{number.format(course.totalStudents)} learners</span>}
          {updated && <span className="cd-updated">Updated {updated}</span>}
        </div>
        <div className="cd-course-actions"><a className="cw-button cw-primary cd-mobile-enrollment-link" href="#course-enrollment">View enrollment options<ChevronRight size={16} aria-hidden="true" /></a><CourseShareButton course={course} /></div>
      </header>

      <div className="cd-layout">
        <div className="cd-main">
          <section id="course-preview" className="cd-preview" aria-labelledby="preview-heading" tabIndex={-1}>
            {trailerSource ? <>
              <div className="cd-video-stage"><CourseVideo src={trailerSource} poster={course.thumbnail} title={`${course.title} — course trailer`} /></div>
              <div className="cd-preview-caption"><span className="cd-preview-icon"><PlayCircle aria-hidden="true" /></span><div><h2 id="preview-heading">A first look at your course</h2><p>Watch the introduction and discover what you will learn.</p></div><span className="cd-free-label">Free preview</span></div>
            </> : <div className="cd-no-trailer">
              {course.thumbnail && <img src={course.thumbnail} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
              <div className="cd-no-trailer-content"><span className="cd-preview-icon"><VideoOff aria-hidden="true" /></span><p className="cd-eyebrow">Explore the course</p><h2 id="preview-heading">No trailer available</h2><p>Get to know the course through its overview, learning outcomes, and lesson outline.</p><a href="#course-curriculum">Explore the curriculum<ChevronRight aria-hidden="true" /></a></div>
            </div>}
          </section>
          <nav className="cd-section-nav" aria-label="Course sections"><a href="#course-overview">Overview</a><a href="#course-curriculum">Curriculum</a><a href="#course-instructor">Instructor</a></nav>
          <section id="course-overview" className="cd-content-section" aria-labelledby="overview-heading">
            <p className="cd-eyebrow">Build your understanding</p><h2 id="overview-heading">About this course</h2>
            <CourseDescription key={course.id || course.slug} text={course.description} />
            {course.outcomes.length > 0 && <div className="cd-outcomes"><h3>What you will learn</h3><ul>{course.outcomes.map((outcome, index) => <li key={index}><span><Check aria-hidden="true" /></span>{outcome}</li>)}</ul></div>}
            {course.tags.length > 0 && <ul className="cd-tags" aria-label="Course topics">{course.tags.map((tag, index) => <li key={index}>{tag}</li>)}</ul>}
          </section>
          <PublicCourseCurriculum course={course} />
          {(course.requirements.length > 0 || course.audience.length > 0) && <section className="cd-content-section cd-readiness" aria-label="Requirements and audience">
            {course.requirements.length > 0 && <div><span className="cd-small-icon"><BookOpen aria-hidden="true" /></span><h2>Before you begin</h2><ul>{course.requirements.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
            {course.audience.length > 0 && <div><span className="cd-small-icon"><Users aria-hidden="true" /></span><h2>Who this course is for</h2><ul>{course.audience.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
          </section>}
          <section id="course-instructor" className="cd-content-section" aria-labelledby="instructor-heading">
            <p className="cd-eyebrow">Learn with guidance</p><h2 id="instructor-heading">Meet your instructor</h2>
            <div className="cd-instructor-card"><ProfileAvatar name={course.instructor.name} src={course.instructor.avatar} size={56} /><div><h3>{course.instructor.name}</h3><p className="cd-instructor-role">{course.instructor.title}</p>{course.instructor.bio && <p className="cd-description">{course.instructor.bio}</p>}{instructorProfileUrl(course.instructor) && <Link className="cw-button mt-4" to={instructorProfileUrl(course.instructor)}>View instructor profile<ArrowUpRight size={16} aria-hidden="true" /></Link>}</div></div>
          </section>
          {/* Post-MVP: publish this section when learners can submit real reviews.
          <section id="course-reviews" className="cd-content-section" aria-labelledby="reviews-heading">
            <div className="cd-section-heading"><div><p className="cd-eyebrow">The learner perspective</p><h2 id="reviews-heading">Learner feedback</h2></div>{course.totalReviews > 0 && <CourseRating rating={course.rating} reviews={course.totalReviews} />}</div>
            <div className="cd-reviews-empty"><MessageCircle aria-hidden="true" /><div><h3>{course.totalReviews > 0 ? `${number.format(course.totalReviews)} learner ratings` : "No reviews yet"}</h3><p>{course.totalReviews > 0 ? "Written reviews are not available yet." : "Learner reviews will help you discover more about this course as they become available."}</p></div></div>
          </section>
          */}
        </div>
        <aside className="cd-sidebar" aria-label="Course enrollment and details">
          <div className="cd-enrollment" id="course-enrollment" tabIndex={-1}>
            <p className="cd-eyebrow">Your next chapter</p><h2>Start learning at your pace</h2>
            <div className="cd-price"><CoursePrice price={course.price} size="large" />{course.price.discounted && <span className="cd-sale-label">Sale price</span>}</div>
            <div className="cd-purchase-includes"><h3>Included with enrollment</h3><ul><li><Check size={16} aria-hidden="true" /><span>{course.totalLessons > 0 ? `${number.format(course.totalLessons)} recorded lessons` : "Recorded course lessons"}</span></li><li><Check size={16} aria-hidden="true" /><span>Saved progress across your devices</span></li></ul><p>Downloadable materials are available on lessons where your instructor provides them.</p></div>
            <CourseEnrollment course={course} />
            <p className="cd-purchase-terms">Before enrolling, review our <Link to="/course-policy">course access and refund policy</Link>. Questions about access or refunds? <Link to="/contact">Contact our team.</Link></p>
            {trailerSource && <a className="cd-preview-link" href="#course-preview"><PlayCircle aria-hidden="true" />Watch the course trailer</a>}
            <div className="cd-facts"><h3>Course at a glance</h3><dl>
              <div><dt><MonitorPlay aria-hidden="true" />Format</dt><dd>Recorded lessons</dd></div>
              <div><dt><Clock3 aria-hidden="true" />Duration</dt><dd>{course.totalDurationSeconds > 0 ? course.durationLabel : "Duration not listed"}</dd></div>
              <div><dt><Layers3 aria-hidden="true" />Curriculum</dt><dd>{lessonCount}</dd></div>
              <div><dt><Signal aria-hidden="true" />Level</dt><dd>{course.level}</dd></div>
              <div><dt><Globe2 aria-hidden="true" />Language</dt><dd>{course.language}</dd></div>
            </dl></div>
            <a href="#course-curriculum" className="cd-outline-link">View the lesson outline<ChevronRight aria-hidden="true" /></a>
          </div>
          <div className="cd-help"><span className="cd-small-icon"><MessageCircle aria-hidden="true" /></span><div><h3>Is this course right for you?</h3><p>Talk to our team if you need help choosing.</p><Link to="/contact">Ask a question<ArrowUpRight aria-hidden="true" /></Link></div></div>
        </aside>
      </div>
      {!relatedError && (relatedLoading || relatedCourses.length > 0) && <section className="cd-related" aria-labelledby="related-heading"><div className="cd-section-heading"><div><p className="cd-eyebrow">Keep exploring</p><h2 id="related-heading">Continue your learning journey</h2></div><Link className="cd-text-button" to={catalogUrl} state={catalogState}>All courses<ArrowUpRight aria-hidden="true" /></Link></div>{relatedLoading ? <LoadingState variant="inline" label="Finding related courses..." /> : <div className="cd-related-grid">{relatedCourses.map((item) => <RecordedCourseCard key={item.id} course={item} />)}</div>}</section>}
    </div>
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
