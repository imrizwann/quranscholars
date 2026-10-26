import { useId, useState } from "react";
import { ChevronDown, Layers3, LockKeyhole, PlayCircle } from "lucide-react";
import { formatDuration } from "../model/recordedCourseAdapter.js";

function SyllabusSection({ section, index, open, onToggle }) {
  const panelId = useId();
  const duration = section.lessons.reduce((total, lesson) => total + (lesson.durationSeconds || 0), 0);
  const hasAllDurations = section.lessons.length > 0 && section.lessons.every((lesson) => lesson.durationSeconds > 0);
  return <section className="cd-syllabus-section">
    <h3><button type="button" className="cd-section-toggle" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
      <span className="cd-section-number">{String(index + 1).padStart(2, "0")}</span>
      <span className="cd-section-name"><strong>{section.title}</strong><span>{section.lessons.length} {section.lessons.length === 1 ? "lesson" : "lessons"}{hasAllDurations && ` · ${formatDuration(duration)}`}</span></span>
      <ChevronDown className={open ? "cd-chevron-open" : ""} aria-hidden="true" />
    </button></h3>
    <div id={panelId} hidden={!open}>
      {section.description && <p className="cd-section-description">{section.description}</p>}
      {section.lessons.length ? <ol className="cd-lessons">
        {section.lessons.map((lesson) => <li key={lesson.id}>
          <LockKeyhole aria-hidden="true" />
          <span className="cd-lesson-name">{lesson.title}<span className="cd-lesson-access">Locked lesson</span></span>
          {lesson.durationSeconds > 0 && <span className="cd-lesson-duration">{lesson.durationLabel}</span>}
        </li>)}
      </ol> : <p className="cd-section-description">Lessons for this section have not been listed yet.</p>}
    </div>
  </section>;
}

export default function PublicCourseCurriculum({ course }) {
  const [expanded, setExpanded] = useState(() => new Set(course.sections.slice(0, 1).map((section) => section.id)));
  const allExpanded = course.sections.length > 0 && course.sections.every((section) => expanded.has(section.id));
  const toggleSection = (id) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return <section id="course-curriculum" className="cd-content-section" aria-labelledby="curriculum-heading">
    <div className="cd-section-heading">
      <div><p className="cd-eyebrow">Your learning path</p><h2 id="curriculum-heading">Course curriculum</h2></div>
      {course.sections.length > 0 && <button type="button" className="cd-text-button" onClick={() => setExpanded(allExpanded ? new Set() : new Set(course.sections.map((section) => section.id)))}>{allExpanded ? "Collapse all" : "Expand all"}</button>}
    </div>
    <p className="cd-muted cd-curriculum-summary">{course.totalSections == null ? "Section count not listed" : `${course.totalSections} sections`} · {course.totalLessons == null ? "Lesson count not listed" : `${course.totalLessons} lessons`}{course.totalDurationSeconds > 0 && ` · ${course.durationLabel} total`}</p>
    <div className="cd-syllabus">
      {course.trailerVideo && <a className="cd-trailer-lesson" href="#course-preview"><PlayCircle aria-hidden="true" /><span><strong>Course introduction</strong><span>Meet the course before you begin</span></span><span className="cd-preview-label">Free trailer</span></a>}
      {course.sections.length ? course.sections.map((section, index) => <SyllabusSection key={section.id} section={section} index={index} open={expanded.has(section.id)} onToggle={() => toggleSection(section.id)} />) : <div className="cd-empty-curriculum"><Layers3 aria-hidden="true" /><strong>The lesson outline is not available yet.</strong><p>You can explore the course overview{course.trailerVideo ? " and watch the introduction above" : " above"} in the meantime.</p></div>}
    </div>
    {course.lessons.length > 0 && <p className="cd-access-note"><LockKeyhole aria-hidden="true" />Lesson videos are locked.{course.trailerVideo ? " Watch the free trailer for an introduction to the course." : " Explore the overview to learn more about this course."}</p>}
  </section>;
}
