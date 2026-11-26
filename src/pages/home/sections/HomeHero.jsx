import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, CirclePlay, GraduationCap, UsersRound } from "lucide-react";
import CourseCardMedia from "@/features/recorded-courses/components/CourseCardMedia.jsx";
import CourseLearningLink from "@/features/recorded-courses/components/CourseLearningLink.jsx";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import RecordedCourseSkeleton from "@/features/recorded-courses/components/RecordedCourseSkeleton.jsx";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";
import { isFeaturedCatalogue } from "@/lib/course-presentation.js";
import HeroCopy from "./hero/HeroCopy.jsx";
import { HeroBackdrop, HeroEmptyState, HeroErrorState } from "./hero/HeroParts.jsx";
import { courseFacts, easeOut } from "./homeUtils.js";

function HeroCourseCard({ course }) {
  const facts = courseFacts(course);
  return (
    <article className="home-course-card">
      <div className="home-course-card-media">
        <CourseCardMedia course={course} to={`/courses/${course.slug}`} />
        {course.trailerVideo && <span className="home-course-card-chip"><CirclePlay size={14} aria-hidden="true" />Free preview</span>}
      </div>
      <div className="home-course-card-body">
        <p className="home-course-card-meta">
          <span>{course.category}</span>
          {course.level && course.level !== "Not specified" && <span>{course.level}</span>}
        </p>
        <h3><Link to={`/courses/${course.slug}`}>{course.title}</Link></h3>
        <div className="home-course-card-byline"><InstructorByline instructor={course.instructor} /></div>
        {facts.length > 0 && (
          <ul className="home-course-card-facts" aria-label="Course details">
            {facts.map(({ icon: Icon, label }) => <li key={label}><Icon size={15} aria-hidden="true" />{label}</li>)}
          </ul>
        )}
        <div className="home-course-card-footer">
          <CoursePrice price={course.price} />
          <CourseLearningLink course={course} className="home-btn home-btn--primary home-btn--sm" />
        </div>
      </div>
    </article>
  );
}

function FeaturedCourse({ course, loading, error, retry }) {
  const reduce = useReducedMotion();
  return (
    <motion.aside
      className="home-featured-course"
      aria-labelledby="home-featured-title"
      aria-busy={loading}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.8, ease: easeOut, delay: reduce ? 0 : 0.2 }}
    >
      <h2 id="home-featured-title" className="home-featured-label">Featured course</h2>
      {loading ? <><span role="status" className="sr-only">Loading featured course</span><RecordedCourseSkeleton featured /></>
        : error ? <HeroErrorState retry={retry} />
          : course ? <HeroCourseCard course={course} />
            : <HeroEmptyState />}
    </motion.aside>
  );
}

// Full catalogue only: a quick way into the main areas of the site.
function StartPanel() {
  const reduce = useReducedMotion();
  return (
    <motion.aside className="home-start-panel" initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.5, ease: easeOut }} aria-labelledby="home-start-title">
      <p className="home-featured-label">A place to begin</p>
      <h2 id="home-start-title">Make room for meaningful learning.</h2>
      <p>Choose your next step. You can always explore the other paths later.</p>
      <div className="home-start-links">{[
        { to: "/courses", title: "Explore courses", detail: "Find a subject and level that fit you.", icon: BookOpen },
        { to: "/dashboard/learning", title: "My learning", detail: "Return to your courses and saved progress.", icon: GraduationCap },
        { to: "/get-started/instructor", title: "Become an instructor", detail: "Share your knowledge with learners.", icon: UsersRound },
      ].map(({ to, title, detail, icon: Icon }) => <Link key={to} to={to}><span className="home-start-icon"><Icon size={19} aria-hidden="true" /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div>
    </motion.aside>
  );
}

// Current layout: text on the left, featured course card on the right.
export default function HomeHero({ course, loading, error, retry }) {
  return (
    <section id="main" className={`home-hero ${isFeaturedCatalogue ? "home-hero--featured" : "home-hero--full"}`} aria-labelledby="home-hero-title">
      <HeroBackdrop />
      <div className="home-shell home-hero-grid">
        <HeroCopy course={course} />
        {isFeaturedCatalogue ? <FeaturedCourse course={course} loading={loading} error={error} retry={retry} /> : <StartPanel />}
      </div>
    </section>
  );
}
