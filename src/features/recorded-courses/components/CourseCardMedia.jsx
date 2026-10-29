import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Play, PlayCircle } from "lucide-react";
import { trailerPlaybackSource } from "@/lib/trailer-playback.js";
import "./course-card-media.css";

const VideoPlayer = lazy(() => import("@/components/video-player/VideoPlayer.jsx"));

export default function CourseCardMedia({ course, to, linkState }) {
  const [opened, setOpened] = useState(false);
  const [failedImage, setFailedImage] = useState(null);
  const container = useRef(null);
  const source = trailerPlaybackSource(course);
  const thumbnail = course.thumbnail && course.thumbnail !== failedImage ? course.thumbnail : null;
  const showPlayer = source && (opened || !thumbnail);
  const cover = thumbnail ? <img src={thumbnail} alt="" loading="lazy" decoding="async" onError={() => setFailedImage(course.thumbnail)} /> : <span className="catalogue-cover-placeholder"><BookOpen size={38} strokeWidth={1.25} aria-hidden="true" /><strong>Start a new chapter</strong><span>Explore the course curriculum</span></span>;

  function pauseOtherPreviews() {
    setOpened(true);
    document.querySelectorAll(".catalogue-course-media video").forEach((video) => {
      if (!container.current?.contains(video)) video.pause();
    });
  }

  return <div ref={container} className="catalogue-course-media" aria-label={`${course.title} course preview`}>
    {showPlayer ? <Suspense fallback={<div className="catalogue-trailer-loading" role="status">Loading trailer…</div>}><VideoPlayer src={source} poster={thumbnail || undefined} title={`${course.title} — trailer`} className="catalogue-trailer-player" autoPlay={opened} onPlay={pauseOtherPreviews} errorMessage="The trailer could not load. Try again, or open the course details to learn more." /></Suspense> : source ? <button type="button" className="catalogue-cover catalogue-cover-play" aria-label={`Play trailer for ${course.title}`} onClick={() => setOpened(true)}>{cover}<span className="catalogue-play-overlay"><span className="catalogue-play-icon"><Play size={24} fill="currentColor" aria-hidden="true" /></span><span>Watch trailer</span></span></button> : <Link to={to} state={linkState} className="catalogue-cover" aria-label={`View course: ${course.title}`}>{cover}</Link>}
    {!showPlayer && <span className="catalogue-media-label"><PlayCircle size={13} aria-hidden="true" />Self-paced</span>}
    {!showPlayer && (course.bestseller || course.featured) && <span className="catalogue-media-featured">{course.bestseller ? "Bestseller" : "Featured"}</span>}
  </div>;
}
