import { useEffect, useId, useRef, useState } from "react";
import { Clock3, Download, NotebookPen } from "lucide-react";
import { NOTE_LIMIT, lessonTime, readLessonStudy, saveLessonStudy } from "../services/lessonStudyStorage.js";

export default function LessonNotes({ userId, courseId, lesson, getTime }) {
  const [notes, setNotes] = useState(() => readLessonStudy(userId, courseId, lesson.id).notes);
  const [status, setStatus] = useState("ready");
  const draft = useRef(notes);
  const input = useRef(null);
  const first = useRef(true);
  const id = useId();
  draft.current = notes;
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus("saving");
    const timer = setTimeout(() => setStatus(saveLessonStudy(userId, courseId, lesson.id, { notes }) ? "saved" : "error"), 600);
    return () => clearTimeout(timer);
  }, [notes, userId, courseId, lesson.id]);
  useEffect(() => {
    const flush = () => { saveLessonStudy(userId, courseId, lesson.id, { notes: draft.current }); };
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, [userId, courseId, lesson.id]);
  const timestamp = () => {
    const start = input.current?.selectionStart ?? notes.length;
    const end = input.current?.selectionEnd ?? start;
    const stamp = `[${lessonTime(getTime())}] `;
    const next = notes.slice(0, start) + stamp + notes.slice(end);
    if (next.length > NOTE_LIMIT) return;
    setNotes(next);
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(start + stamp.length, start + stamp.length); });
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([`${lesson.title}\n\n${notes}`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${lesson.title.replace(/[^a-z0-9 -]/gi, "").slice(0, 70) || "lesson"}-notes.txt`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="learning-notes">
    <div className="learning-notes-heading"><div><h2><NotebookPen size={19} aria-hidden="true" />Your lesson notes</h2><p>Capture a key idea or something to practice.</p></div><button type="button" className="cw-button" onClick={timestamp}><Clock3 size={15} aria-hidden="true" />Add timestamp</button></div>
    <label className="sr-only" htmlFor={id}>Notes for {lesson.title}</label><textarea ref={input} id={id} value={notes} onChange={event => setNotes(event.target.value)} maxLength={NOTE_LIMIT} placeholder="Write your notes here…" aria-describedby={`${id}-privacy`} rows={7} />
    <div className="learning-notes-footer"><p role="status">{status === "error" ? "Notes could not be saved. Download a copy to keep your work." : status === "saving" ? "Saving notes…" : status === "saved" ? "Saved in this browser" : "Notes save automatically as you write"}</p><span>{notes.length.toLocaleString()} / {NOTE_LIMIT.toLocaleString()}</span><button type="button" className="cw-button" disabled={!notes.trim()} onClick={download}><Download size={15} aria-hidden="true" />Download notes</button></div>
    <p id={`${id}-privacy`} className="learning-device-note">Saved for your account in this browser. Notes do not sync between devices; download a copy to keep them.</p>
  </div>;
}
