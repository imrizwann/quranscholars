import { Captions, CircleCheck, Circle, ListChecks, Maximize, Play, RotateCcw, Settings } from "lucide-react";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { experienceFeatures } from "../homeContent.js";
import { Reveal, SectionIntro } from "./HomeShared.jsx";

const PLAYED = 0.38; // How far through the "current" lesson the illustration is.

function clock(seconds) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Real lesson titles from the featured course when available, generic ones otherwise.
function previewLessons(details) {
  const section = details?.sections?.find(item => item.lessons.length >= 2);
  const lessons = section?.lessons.slice(0, 3) || [];
  const fallback = ["Introduction", "Lesson 2", "Lesson 3"];
  return {
    sectionTitle: section?.title || "Section 1",
    items: fallback.map((title, index) => ({
      title: lessons[index]?.title || title,
      duration: lessons[index]?.durationSeconds || null,
    })),
  };
}

// Illustration of the lesson player. Decorative only: hidden from assistive technology.
function PlayerPreview({ course }) {
  const { data: details } = useGetRecordedCourseBySlugQuery(course?.slug, { skip: !course?.slug });
  const { sectionTitle, items } = previewLessons(details);
  const current = items[1];
  const length = current.duration || 665;
  const lessons = [
    { ...items[0], state: "done" },
    { ...current, state: "current" },
    { ...items[2], state: "next" },
    { title: "Section review quiz", state: "quiz" },
  ];

  return (
    <div className="home-player" aria-hidden="true">
      <div className="home-player-bar">
        <span className="home-player-dots"><i /><i /><i /></span>
        <span className="home-player-title">{course?.title || "Your course"}</span>
      </div>

      <div className="home-player-video">
        {course?.thumbnail && <img src={course.thumbnail} alt="" loading="lazy" decoding="async" />}
        <span className="home-player-play"><Play size={22} fill="currentColor" /></span>
        <div className="home-player-controls">
          <span className="home-player-track"><span style={{ width: `${PLAYED * 100}%` }} /></span>
          <div className="home-player-buttons">
            <Play size={14} fill="currentColor" />
            <span className="home-player-time">{clock(length * PLAYED)} / {clock(length)}</span>
            <span className="home-player-spacer" />
            <Captions size={16} />
            <Settings size={15} />
            <Maximize size={15} />
          </div>
        </div>
      </div>

      <div className="home-player-panel">
        <div className="home-player-summary">
          <p className="home-player-kicker">Now playing</p>
          <p className="home-player-lesson">{current.title}</p>
          <p className="home-player-section">{sectionTitle}</p>
          <div className="home-player-progress">
            <span>Course progress</span><strong>40%</strong>
            <span className="home-player-progress-bar"><span /></span>
          </div>
        </div>
        <ol className="home-player-lessons">
          {lessons.map(({ title, duration, state }) => (
            <li key={state} data-state={state}>
              {state === "done" ? <CircleCheck size={16} /> : state === "current" ? <Play size={13} fill="currentColor" /> : state === "quiz" ? <ListChecks size={16} /> : <Circle size={16} />}
              <span>{title}</span>
              {duration && <small>{clock(duration)}</small>}
            </li>
          ))}
        </ol>
      </div>

      <div className="home-player-toast">
        <span><RotateCcw size={16} /></span>
        <div><strong>Progress saved</strong><small>Continue from {clock(length * PLAYED)}</small></div>
      </div>
    </div>
  );
}

export default function HomeExperience({ course }) {
  return (
    <section className="home-section home-experience" aria-labelledby="home-experience-title">
      <div className="home-shell home-experience-grid">
        <Reveal>
          <SectionIntro id="home-experience-title" eyebrow="The learning experience" title="Everything you need to learn, in one place.">
            Each lesson focuses on one idea, so you can watch, practise and understand it before moving on.
          </SectionIntro>
          <ul className="home-feature-list">
            {experienceFeatures.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="home-feature-icon"><Icon size={20} aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="home-experience-visual">
          <PlayerPreview course={course} />
        </Reveal>
      </div>
    </section>
  );
}
