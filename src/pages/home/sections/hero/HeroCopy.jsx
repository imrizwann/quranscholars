import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, GraduationCap } from "lucide-react";
import CourseLearningLink from "@/features/recorded-courses/components/CourseLearningLink.jsx";
import { isFeaturedCatalogue } from "@/lib/course-presentation.js";
import { heroContent } from "../../homeContent.js";
import { easeOut } from "../homeUtils.js";

// Headline, intro, actions and highlights shared by every hero layout.
export default function HeroCopy({ course, align = "start", secondaryAction, className = "" }) {
  const reduce = useReducedMotion();
  const content = isFeaturedCatalogue ? heroContent.featured : heroContent.full;
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.7, ease: easeOut } },
  };

  return (
    <motion.div
      className={`home-hero-copy home-hero-copy--${align} ${className}`.trim()}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
    >
      <motion.p variants={item} className="home-hero-eyebrow"><span className="home-hero-eyebrow-dot" aria-hidden="true" />{content.eyebrow}</motion.p>
      <motion.h1 variants={item} id="home-hero-title">{content.titleLead} <span>{content.titleAccent}</span></motion.h1>
      <motion.p variants={item} className="home-hero-lead">{content.lead}</motion.p>

      <motion.div variants={item} className="home-hero-actions">
        {isFeaturedCatalogue ? (
          <>
            {course
              ? <CourseLearningLink course={course} label="Explore the course" className="home-btn home-btn--gold" />
              : <Link to="/courses" className="home-btn home-btn--gold">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link>}
            {secondaryAction || <a href="#how-it-works" className="home-btn home-btn--ghost">How it works</a>}
          </>
        ) : (
          <>
            <Link to="/courses" className="home-btn home-btn--gold">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link>
            <Link to="/get-started" className="home-btn home-btn--ghost"><GraduationCap size={17} aria-hidden="true" />Get started</Link>
            <Link to="/instructor/application" className="home-mobile-instructor-link">Become an instructor<ArrowRight size={15} aria-hidden="true" /></Link>
          </>
        )}
      </motion.div>

      <motion.ul variants={item} className="home-hero-points" aria-label="Highlights">
        {content.points.map(point => <li key={point}><span aria-hidden="true"><Check size={12} strokeWidth={3} /></span>{point}</li>)}
      </motion.ul>
    </motion.div>
  );
}
