import { motion, useReducedMotion } from "framer-motion";
import HeroCopy from "./HeroCopy.jsx";
import { CourseInfoBar, HeroBackdrop, HeroEmptyState, HeroErrorState, TrailerPlayer } from "./HeroParts.jsx";
import { easeOut } from "../homeUtils.js";

// Option A: centred headline above a large stage that plays the real course trailer.
export default function HeroVideoStage({ course, loading, error, retry }) {
  const reduce = useReducedMotion();
  return (
    <section id="main" className="home-hero home-hero--stage" aria-labelledby="home-hero-title">
      <HeroBackdrop />
      <div className="home-shell home-stage-intro">
        <HeroCopy course={course} align="center" />
      </div>
      <div className="home-shell">
        <motion.div
          className="home-stage"
          aria-busy={loading}
          initial={{ opacity: 0, y: reduce ? 0 : 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: easeOut, delay: reduce ? 0 : 0.25 }}
        >
          {loading ? (
            <div className="home-stage-skeleton" role="status"><span className="sr-only">Loading featured course</span></div>
          ) : error ? <div className="home-stage-state"><HeroErrorState retry={retry} /></div>
            : course ? (
              <>
                <div className="home-stage-media"><TrailerPlayer course={course} /></div>
                <CourseInfoBar course={course} />
              </>
            ) : <div className="home-stage-state"><HeroEmptyState /></div>}
        </motion.div>
      </div>
    </section>
  );
}
