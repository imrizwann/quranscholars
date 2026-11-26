import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import CourseLearningLink from "@/features/recorded-courses/components/CourseLearningLink.jsx";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import HeroCopy from "./HeroCopy.jsx";
import { CourseInfoBar, HeroBackdrop, HeroEmptyState, HeroErrorState } from "./HeroParts.jsx";
import { buildMilestones, easeOut, plural } from "../homeUtils.js";

function PathTrack({ course, details }) {
  const reduce = useReducedMotion();
  const milestones = buildMilestones(details);
  if (!milestones.length) return <CourseInfoBar course={course} tone="dark" />;

  const sections = (details.sections || []).filter(section => section.lessons.length);
  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const summary = [plural(sections.length, "section"), plural(totalLessons, "lesson"), details.totalDurationSeconds > 0 && details.durationLabel].filter(Boolean).join(" · ");

  return (
    <>
      <div className="home-path-head">
        <div>
          <p className="home-featured-label">Your learning path</p>
          <h2 className="home-path-course">{course.title}</h2>
        </div>
        <p className="home-path-summary">{summary}</p>
      </div>
      <div className="home-path-body">
        <ol className="home-path-track" style={{ "--steps": milestones.length + 1 }}>
          {milestones.map((milestone, index) => (
            <motion.li
              key={milestone.id}
              className="home-path-node"
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: easeOut, delay: reduce ? 0 : 0.5 + index * 0.12 }}
            >
              <span className="home-path-dot" aria-hidden="true">{index + 1}</span>
              <span className="home-path-kicker">{milestone.kicker}</span>
              <strong>{milestone.title}</strong>
              {milestone.meta && <small>{milestone.meta}</small>}
            </motion.li>
          ))}
          <motion.li
            className="home-path-node home-path-node--goal"
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: easeOut, delay: reduce ? 0 : 0.5 + milestones.length * 0.12 }}
          >
            <span className="home-path-dot" aria-hidden="true"><Star size={18} fill="currentColor" /></span>
            <span className="home-path-kicker">Your goal</span>
            <strong>Recite with confidence</strong>
          </motion.li>
        </ol>
        <div className="home-path-enroll">
          <div className="home-path-teacher"><InstructorByline instructor={course.instructor} prefix="Taught by" /></div>
          <CoursePrice price={course.price} size="large" />
          <p>Learn at your own pace. Your progress is saved.</p>
          <CourseLearningLink course={course} label="Start the course" className="home-btn home-btn--gold" />
        </div>
      </div>
    </>
  );
}

// Option B: the course drawn as a journey through its real sections, ending at the goal.
export default function HeroLearningPath({ course, loading, error, retry }) {
  const reduce = useReducedMotion();
  const { data: details, isLoading: detailsLoading } = useGetRecordedCourseBySlugQuery(course?.slug, { skip: !course?.slug });
  const busy = loading || (course && detailsLoading);
  return (
    <section id="main" className="home-hero home-hero--path" aria-labelledby="home-hero-title">
      <HeroBackdrop />
      <div className="home-shell home-path-shell">
        <HeroCopy course={course} />
        <motion.div
          className="home-path"
          aria-busy={busy}
          initial={{ opacity: 0, y: reduce ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.8, ease: easeOut, delay: reduce ? 0 : 0.2 }}
        >
          {busy ? <div className="home-path-skeleton" role="status"><span className="sr-only">Loading the course path</span></div>
            : error ? <HeroErrorState retry={retry} />
              : !course ? <HeroEmptyState />
                : details ? <PathTrack course={course} details={details} />
                  : <CourseInfoBar course={course} tone="dark" />}
        </motion.div>
      </div>
    </section>
  );
}
