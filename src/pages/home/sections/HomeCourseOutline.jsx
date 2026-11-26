import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CirclePlay, Lock } from "lucide-react";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import { Reveal } from "./HomeShared.jsx";
import { plural } from "./homeUtils.js";

const MAX_OUTCOMES = 6;

// Tracks whether a scroll area has more content below, to show or hide the bottom fade.
function useScrollEnd(content) {
  const ref = useRef(null);
  const [atEnd, setAtEnd] = useState(true);
  const update = useCallback(() => {
    const el = ref.current;
    if (el) setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
  }, []);
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, content]);
  return { ref, atEnd, onScroll: update };
}

// The featured course's outcomes and its complete curriculum (every section and lesson).
// Hidden while loading or when the course has no published lessons.
export default function HomeCourseOutline({ course }) {
  const { data: details } = useGetRecordedCourseBySlugQuery(course?.slug, { skip: !course?.slug });
  const sections = details?.sections?.filter(section => section.lessons.length) || [];
  const scroll = useScrollEnd(details);
  if (!details || !sections.length) return null;

  const outcomes = details.outcomes.filter(Boolean).slice(0, MAX_OUTCOMES);
  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const previewCount = sections.reduce((sum, section) => sum + section.lessons.filter(lesson => lesson.previewable).length, 0);
  const courseLink = `/courses/${details.slug}`;
  const summary = [plural(sections.length, "section"), plural(totalLessons, "lesson"), details.totalDurationSeconds > 0 && `${details.durationLabel} total`].filter(Boolean).join(" · ");

  return (
    <section className="home-section home-outline" aria-labelledby="home-outline-title">
      <div className="home-shell home-outline-grid">
        <Reveal className="home-outline-copy">
          <p className="home-eyebrow">Course outline</p>
          <h2 id="home-outline-title">{outcomes.length ? "What you will learn" : "What the course covers"}</h2>
          <p className="home-outline-course">{details.title}</p>
          {outcomes.length > 0 ? (
            <ul className="home-outcomes">
              {outcomes.map(outcome => <li key={outcome}><span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>{outcome}</li>)}
            </ul>
          ) : details.shortDescription && <p className="home-outline-description">{details.shortDescription}</p>}
          <Link to={courseLink} className="home-btn home-btn--primary">See the full course<ArrowRight size={16} aria-hidden="true" /></Link>
        </Reveal>

        <Reveal delay={0.08} className="home-outline-side">
          <div className="home-curriculum">
            <div className="home-curriculum-head">
              <h3 id="home-curriculum-title">Course content</h3>
              <p>{summary}</p>
            </div>

            <div
              ref={scroll.ref}
              onScroll={scroll.onScroll}
              className="home-curriculum-scroll"
              data-at-end={scroll.atEnd}
              role="region"
              aria-labelledby="home-curriculum-title"
              tabIndex={0}
            >
              <ol className="home-curriculum-sections">
                {sections.map((section, sectionIndex) => (
                  <li key={section.id}>
                    <div className="home-curriculum-section">
                      <span className="home-curriculum-index" aria-hidden="true">{sectionIndex + 1}</span>
                      <div>
                        <h4>{section.title}</h4>
                        <p>{plural(section.lessons.length, "lesson")}</p>
                      </div>
                    </div>
                    <ul className="home-curriculum-lessons">
                      {section.lessons.map(lesson => (
                        <li key={lesson.id}>
                          {lesson.previewable ? <CirclePlay size={16} aria-hidden="true" className="is-preview" /> : <Lock size={14} aria-hidden="true" />}
                          <span className="home-curriculum-lesson-title">{lesson.title}</span>
                          {lesson.previewable && <span className="home-curriculum-badge">Free preview</span>}
                          {lesson.durationSeconds && <span className="home-curriculum-duration">{lesson.durationLabel}</span>}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>

            <div className="home-curriculum-foot">
              <p>{previewCount > 0 ? `${plural(previewCount, "free preview lesson")} available` : "Enroll to unlock every lesson"}</p>
              <Link to={courseLink} className="home-text-link">Open course page<ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
