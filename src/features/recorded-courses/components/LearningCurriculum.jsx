import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ClipboardCheck, LockKeyhole, Play, PlayCircle, Search, X } from "lucide-react";
import { completionPercentage, COURSE_COMPLETION_DESCRIPTION } from "../model/courseProgress.js";
import { formatDuration } from "../model/recordedCourseAdapter.js";
import "./learning-curriculum.css";

const clock = seconds => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), rest = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
};
const sectionSeconds = section => section.lessons.reduce((total, lesson) => total + (Number(lesson.durationSeconds) || 0), 0);

export default function LearningCurriculum({ course, sections, lesson, lessons, learningState, progressLoading, onQuiz }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(() => new Set([lesson.sectionId]));
  const id = useId();
  useEffect(() => { setOpen(previous => new Set([...previous, lesson.sectionId])); }, [lesson.sectionId]);
  const term = search.trim().toLocaleLowerCase();
  const numbers = useMemo(() => new Map(lessons.map((item, index) => [item.id, index + 1])), [lessons]);
  const lessonProgress = useMemo(() => new Map((learningState?.lessons || []).map(item => [item.lessonId, item])), [learningState]);
  const matching = sections.map(section => ({ ...section, lessons: term && !section.title.toLocaleLowerCase().includes(term)
    ? section.lessons.filter(item => item.title.toLocaleLowerCase().includes(term)) : section.lessons })).filter(section => !term || section.lessons.length);
  const count = matching.reduce((total, section) => total + section.lessons.length, 0);
  const expanded = sections.every(section => open.has(section.id));
  const courseSeconds = sections.reduce((total, section) => total + sectionSeconds(section), 0);
  const percent = learningState ? completionPercentage(learningState.completedLessons, learningState.totalLessons) : 0;

  return <>
    <div className="learning-curriculum-heading">
      <h2 id="learning-content-title">Course content</h2>
      <p>{sections.length} {sections.length === 1 ? "section" : "sections"} · {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}{courseSeconds > 0 && ` · ${formatDuration(courseSeconds)}`}</p>
    </div>
    <div className="learning-course-progress" data-complete={learningState?.completed || undefined}>{learningState ? <>
      <div className="learning-progress-summary">
        <span className="learning-progress-percent">{percent}%</span>
        <div><strong>{learningState.completedLessons} of {learningState.totalLessons} lessons complete</strong><progress value={learningState.completedLessons} max={Math.max(1, learningState.totalLessons)} aria-label="Course lesson completion" aria-valuetext={`${learningState.completedLessons} of ${learningState.totalLessons} lessons complete`} /></div>
      </div>
      <p>{learningState.completed ? "Course complete. Revisit any lesson or try the optional quizzes." : COURSE_COMPLETION_DESCRIPTION}</p>
    </> : <p role="status">{progressLoading ? "Loading your progress…" : "Progress is currently unavailable."}</p>}</div>
    <div className="learning-curriculum-tools">
      <div className="learning-search"><Search size={16} aria-hidden="true" /><label className="sr-only" htmlFor={`${id}-search`}>Search course lessons</label><input id={`${id}-search`} type="search" placeholder="Find a lesson" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} />{search && <button type="button" aria-label="Clear lesson search" onClick={() => setSearch("")}><X size={15} /></button>}</div>
      <div className="learning-curriculum-actions"><span role="status">{term ? `${count} matching ${count === 1 ? "lesson" : "lessons"}` : "Study at your own pace"}</span><button type="button" disabled={Boolean(term)} onClick={() => setOpen(expanded ? new Set() : new Set(sections.map(section => section.id)))}>{expanded ? "Collapse all" : "Expand all"}</button></div>
    </div>
    <div className="learning-curriculum-scroll">{matching.length ? matching.map(section => {
      const sectionIndex = sections.findIndex(item => item.id === section.id);
      const full = sections[sectionIndex];
      const isOpen = Boolean(term) || open.has(section.id);
      const panelId = `${id}-section-${sectionIndex}`;
      const progress = learningState?.sections.find(item => item.sectionId === section.id);
      const done = learningState ? full.lessons.filter(item => lessonProgress.get(item.id)?.completed).length : null;
      const complete = Boolean(progress?.completed) || (done !== null && full.lessons.length > 0 && done === full.lessons.length);
      const seconds = sectionSeconds(full);
      const current = section.id === lesson.sectionId;
      return <section className="learning-section" key={section.id} data-current={current || undefined} data-complete={complete || undefined}>
        <h3><button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(previous => { const next = new Set(previous); if (next.has(section.id)) next.delete(section.id); else next.add(section.id); return next; })} disabled={Boolean(term)}>
          <span className="learning-section-badge" aria-hidden="true">{complete ? <Check size={15} strokeWidth={3} /> : sectionIndex + 1}</span>
          <span className="learning-section-copy">
            <small>Section {sectionIndex + 1}{current && <span className="learning-section-here"> · You are here</span>}</small>
            <strong>{section.title}</strong>
            <span className="learning-section-meta">{complete ? "Section complete" : done !== null ? `${done} of ${full.lessons.length} lessons` : `${full.lessons.length} ${full.lessons.length === 1 ? "lesson" : "lessons"}`}{seconds > 0 && ` · ${formatDuration(seconds)}`}</span>
            {done !== null && full.lessons.length > 0 && <span className="learning-section-bar" aria-hidden="true"><span style={{ width: `${Math.round((done / full.lessons.length) * 100)}%` }} /></span>}
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button></h3>
        <div id={panelId} hidden={!isOpen}>
          <ol className="learning-lessons">{section.lessons.map(item => {
            const active = item.id === lesson.id;
            const state = lessonProgress.get(item.id);
            const completed = state?.completed;
            const preview = course.canManage === true && learningState && completed === undefined;
            const resume = !completed && !active && Number(state?.lastPosition) >= 5 ? clock(state.lastPosition) : "";
            const status = preview ? "Draft preview" : completed === undefined ? (learningState ? "Not started" : "Progress unavailable") : completed ? "Completed" : resume ? "In progress" : "Not started";
            return <li key={item.id} data-state={completed ? "done" : active ? "current" : resume ? "started" : "todo"}>
              <Link to={`/learn/${encodeURIComponent(course.slug)}/${encodeURIComponent(item.id)}`} aria-current={active ? "page" : undefined}>
                <span className="learning-lesson-node" aria-hidden="true">{completed ? <Check size={14} strokeWidth={3} /> : active ? <Play size={12} fill="currentColor" /> : numbers.get(item.id)}</span>
                <span className="learning-lesson-copy">
                  <strong>{item.title}</strong>
                  <small>{active && <span className="learning-lesson-now">Now viewing</span>}<span><PlayCircle size={14} aria-hidden="true" />Video</span>{item.durationLabel && item.durationLabel !== "Duration not listed" && <span>{item.durationLabel}</span>}{resume && <span className="learning-lesson-resume">Resume at {resume}</span>}</small>
                </span>
                {preview && <span className="cw-status" title="Draft previews are excluded from course completion">Preview</span>}
                <span className="sr-only">{`, ${status}`}</span>
              </Link>
            </li>;
          })}</ol>
          {progress?.quiz && <button type="button" className="learning-quiz-link" data-unlocked={progress.quiz.unlocked || undefined} data-passed={progress.quiz.passed || undefined} disabled={!progress.quiz.unlocked} onClick={() => onQuiz(section.id)}>
            <span className="learning-quiz-icon" aria-hidden="true">{progress.quiz.unlocked ? progress.quiz.passed ? <Check size={15} strokeWidth={3} /> : <ClipboardCheck size={16} /> : <LockKeyhole size={15} />}</span>
            <span><strong>{progress.quiz.title}</strong><small>Optional quiz · {progress.quiz.unlocked ? progress.quiz.passed ? "Passed · Review quiz" : `${progress.quiz.questionCount} questions · Take quiz` : "Finish this section's lessons to unlock"}</small></span>
          </button>}
        </div>
      </section>;
    }) : <div className="learning-search-empty"><Search size={22} aria-hidden="true" /><h3>No matching lessons</h3><p>Try a different lesson or section title.</p><button type="button" className="cw-button" onClick={() => setSearch("")}>Clear search</button></div>}</div>
  </>;
}
