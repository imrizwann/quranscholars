import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ClipboardCheck, ListVideo, LockKeyhole, Play, Search, X } from "lucide-react";

export default function LearningCurriculum({ course, sections, lesson, lessons, learningState, progressLoading, onQuiz }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(() => new Set([lesson.sectionId]));
  const id = useId();
  useEffect(() => { setOpen(previous => new Set([...previous, lesson.sectionId])); }, [lesson.sectionId]);
  const term = search.trim().toLocaleLowerCase();
  const numbers = useMemo(() => new Map(lessons.map((item, index) => [item.id, index + 1])), [lessons]);
  const matching = sections.map(section => ({ ...section, lessons: term && !section.title.toLocaleLowerCase().includes(term)
    ? section.lessons.filter(item => item.title.toLocaleLowerCase().includes(term)) : section.lessons })).filter(section => !term || section.lessons.length);
  const count = matching.reduce((total, section) => total + section.lessons.length, 0);
  const expanded = sections.every(section => open.has(section.id));
  return <>
    <div className="learning-curriculum-heading"><div><span className="studio-label">Your learning path</span><h2 id="learning-content-title">Course content</h2><p>{sections.length} sections · {lessons.length} lessons</p></div><ListVideo size={22} aria-hidden="true" /></div>
    <div className="learning-course-progress">{learningState ? <><div><strong>{learningState.completedLessons} of {learningState.totalLessons} lessons complete</strong><span>{learningState.totalLessons ? Math.round(learningState.completedLessons * 100 / learningState.totalLessons) : 0}%</span></div><progress value={learningState.completedLessons} max={Math.max(1, learningState.totalLessons)} aria-label="Course lesson completion" /><p>Lessons are marked complete automatically as you watch.</p></> : <p role="status">{progressLoading ? "Loading your progress…" : "Progress is currently unavailable."}</p>}</div>
    <div className="learning-curriculum-tools">
      <div className="learning-search"><Search size={16} aria-hidden="true" /><label className="sr-only" htmlFor={`${id}-search`}>Search course lessons</label><input id={`${id}-search`} type="search" placeholder="Find a lesson" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} />{search && <button type="button" aria-label="Clear lesson search" onClick={() => setSearch("")}><X size={15} /></button>}</div>
      <div className="learning-curriculum-actions"><span role="status">{term ? `${count} matching ${count === 1 ? "lesson" : "lessons"}` : "Study at your own pace"}</span><button type="button" disabled={Boolean(term)} onClick={() => setOpen(expanded ? new Set() : new Set(sections.map(section => section.id)))}>{expanded ? "Collapse all" : "Expand all"}</button></div>
    </div>
    <div className="learning-curriculum-scroll">{matching.length ? matching.map(section => {
      const sectionIndex = sections.findIndex(item => item.id === section.id);
      const expanded = Boolean(term) || open.has(section.id);
      const panelId = `${id}-section-${sectionIndex}`;
      const progress = learningState?.sections.find(item => item.sectionId === section.id);
      return <section className="learning-section" key={section.id}>
        <h3><button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpen(previous => { const next = new Set(previous); if (next.has(section.id)) next.delete(section.id); else next.add(section.id); return next; })} disabled={Boolean(term)}><span><small>Section {sectionIndex + 1}</small><strong>{section.title}</strong><small>{section.lessons.length} {section.lessons.length === 1 ? "lesson" : "lessons"}</small></span><ChevronDown size={17} aria-hidden="true" /></button></h3>
        <ol id={panelId} hidden={!expanded}>{section.lessons.map(item => {
          const active = item.id === lesson.id;
          const completed = learningState?.lessons.find(lesson => lesson.lessonId === item.id)?.completed;
          return <li key={item.id}><Link to={`/learn/${encodeURIComponent(course.slug)}/${encodeURIComponent(item.id)}`} aria-current={active ? "page" : undefined}><span className="learning-lesson-number" aria-hidden="true">{active ? <Play size={13} fill="currentColor" /> : numbers.get(item.id)}</span><span className="learning-lesson-copy"><strong>{item.title}</strong><small>{active && <span>Now viewing · </span>}{item.durationLabel}{completed && " · Completed"}</small></span><span className="learning-completion-check" role="checkbox" aria-checked={completed === undefined ? "mixed" : completed} aria-readonly="true" aria-label={`${item.title}: ${completed === undefined ? "progress unavailable" : completed ? "completed" : "incomplete"}`}>{completed && <Check size={16} strokeWidth={2.75} aria-hidden="true" />}</span></Link></li>;
        })}</ol>
        {progress?.quiz && <button type="button" className="learning-quiz-link" disabled={!progress.quiz.unlocked} onClick={() => onQuiz(section.id)}>{progress.quiz.unlocked ? <ClipboardCheck size={18} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}<span><strong>{progress.quiz.title}</strong><small>{progress.quiz.unlocked ? progress.quiz.passed ? "Passed · Review section quiz" : `${progress.quiz.questionCount} questions · Start quiz` : `Complete ${progress.totalLessons - progress.completedLessons} remaining lessons to unlock`}</small></span>{progress.quiz.unlocked && progress.quiz.passed && <Check size={16} aria-hidden="true" />}</button>}
      </section>;
    }) : <div className="learning-search-empty"><Search size={22} aria-hidden="true" /><h3>No matching lessons</h3><p>Try a different lesson or section title.</p><button type="button" className="cw-button" onClick={() => setSearch("")}>Clear search</button></div>}</div>
  </>;
}
