import { useState } from "react";
import { Play } from "lucide-react";
import HeroCopy from "./HeroCopy.jsx";
import { CourseInfoBar, HeroEmptyState, HeroErrorState, TrailerDialog } from "./HeroParts.jsx";

// Option C: magazine-style hero with the course image as a full-bleed backdrop.
export default function HeroEditorial({ course, loading, error, retry }) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const watchTrailer = course?.trailerVideo
    ? <button type="button" className="home-btn home-btn--ghost" onClick={() => setTrailerOpen(true)}><Play size={16} fill="currentColor" aria-hidden="true" />Watch trailer</button>
    : null;

  return (
    <section id="main" className="home-hero home-hero--editorial" aria-labelledby="home-hero-title">
      <div className="home-editorial-media" aria-hidden="true">
        {course?.thumbnail && <img src={course.thumbnail} alt="" decoding="async" />}
        <span className="home-editorial-shade" />
        <span className="home-hero-pattern" />
      </div>

      <div className="home-shell home-editorial-shell">
        <HeroCopy course={course} secondaryAction={watchTrailer} className="home-hero-copy--editorial" />
      </div>

      <div className="home-editorial-ticket" aria-busy={loading}>
        <div className="home-shell">
          {loading ? <div className="home-editorial-skeleton" role="status"><span className="sr-only">Loading featured course</span></div>
            : error ? <HeroErrorState retry={retry} />
              : course ? <CourseInfoBar course={course} tone="dark" />
                : <HeroEmptyState />}
        </div>
      </div>

      {course?.trailerVideo && <TrailerDialog course={course} open={trailerOpen} onClose={() => setTrailerOpen(false)} />}
    </section>
  );
}
