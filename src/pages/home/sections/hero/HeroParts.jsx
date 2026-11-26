import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Play, X } from "lucide-react";
import CourseLearningLink from "@/features/recorded-courses/components/CourseLearningLink.jsx";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";
import { courseFacts } from "../homeUtils.js";

// The video player is loaded only when someone presses play, keeping the home page light.
const VideoPlayer = lazy(() => import("@/components/video-player/VideoPlayer.jsx"));

export function HeroBackdrop() {
  return (
    <div className="home-hero-backdrop" aria-hidden="true">
      <span className="home-hero-glow home-hero-glow--teal" />
      <span className="home-hero-glow home-hero-glow--gold" />
      <span className="home-hero-pattern" />
    </div>
  );
}

export function HeroErrorState({ retry }) {
  return (
    <div className="home-featured-state" role="alert">
      <h3>We couldn’t load the course just now</h3>
      <p>Please check your connection and try again.</p>
      <button type="button" className="cw-button" onClick={retry}>Try again</button>
    </div>
  );
}

export function HeroEmptyState() {
  return (
    <div className="home-featured-state">
      <h3>Our first course is almost ready</h3>
      <p>Send us a message and we will let you know as soon as enrollment opens.</p>
      <Link to="/contact" className="cw-button">Contact us<ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  );
}

// Poster with a play button that turns into the real trailer player on click.
export function TrailerPlayer({ course, autoStart = false, label = "Watch the course trailer" }) {
  const [playing, setPlaying] = useState(autoStart);
  const source = useMemo(() => (course?.trailerVideo ? { src: course.trailerVideo, type: "application/x-mpegurl" } : null), [course?.trailerVideo]);

  if (playing && source) {
    return (
      <div className="home-trailer home-trailer--playing">
        <Suspense fallback={<div className="home-trailer-loading" role="status"><span className="sr-only">Loading trailer</span></div>}>
          <VideoPlayer src={source} poster={course.thumbnail} title={`${course.title} — course trailer`} autoPlay />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="home-trailer">
      {course?.thumbnail && <img src={course.thumbnail} alt="" loading="eager" decoding="async" />}
      {source ? (
        <button type="button" className="home-trailer-play" onClick={() => setPlaying(true)}>
          <span className="home-trailer-play-icon"><Play size={26} fill="currentColor" aria-hidden="true" /></span>
          <span className="home-trailer-play-label">{label}</span>
        </button>
      ) : (
        <Link to={`/courses/${course.slug}`} className="home-trailer-play">
          <span className="home-trailer-play-icon"><BookOpen size={24} aria-hidden="true" /></span>
          <span className="home-trailer-play-label">Explore the course</span>
        </Link>
      )}
    </div>
  );
}

// Modal trailer used by the editorial hero.
export function TrailerDialog({ course, open, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <dialog ref={dialog} className="home-trailer-dialog" aria-label={`${course.title} — course trailer`} onClose={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}>
      <button type="button" className="home-trailer-dialog-close" onClick={onClose} aria-label="Close trailer"><X size={20} aria-hidden="true" /></button>
      {open && <TrailerPlayer course={course} autoStart />}
    </dialog>
  );
}

// Course title, teacher, facts, price and the main action in one horizontal bar.
export function CourseInfoBar({ course, tone = "light", label = "Featured course" }) {
  const facts = courseFacts(course);
  return (
    <div className={`home-infobar home-infobar--${tone}`}>
      <div className="home-infobar-course">
        <p className="home-infobar-label">{label}</p>
        <h2 className="home-infobar-title"><Link to={`/courses/${course.slug}`}>{course.title}</Link></h2>
        <div className="home-infobar-byline"><InstructorByline instructor={course.instructor} /></div>
      </div>
      {facts.length > 0 && (
        <ul className="home-infobar-facts" aria-label="Course details">
          {facts.map(({ icon: Icon, label: fact }) => <li key={fact}><Icon size={16} aria-hidden="true" />{fact}</li>)}
        </ul>
      )}
      <div className="home-infobar-action">
        <CoursePrice price={course.price} light={tone === "dark"} />
        <CourseLearningLink course={course} className={`home-btn ${tone === "dark" ? "home-btn--gold" : "home-btn--primary"}`} />
      </div>
    </div>
  );
}
