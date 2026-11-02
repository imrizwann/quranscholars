import { useState } from "react";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function LessonTitleEditor({ target, lesson, editing, disabled, onBusy, onEditing }) {
  const [title, setTitle] = useState(lesson.title);
  const [error, setError] = useState("");
  const [save, { isLoading }] = api.endpoints.updateLesson.useMutation();
  const close = () => { onEditing(false); setError(""); };
  if (!editing) return <div className="cw-lesson-metadata"><span className="cw-field-hint">{lesson.published ? "Available to enrolled learners" : "Draft lesson"}</span></div>;
  return <form className="cw-stack cw-lesson-metadata" onSubmit={async event => {
    event.preventDefault(); if (isLoading || disabled) return;
    setError(""); onBusy(true);
    try { await save({ ...target, title: title.trim() }).unwrap(); close(); }
    catch (failure) { setError(userMessage(failure)); }
    finally { onBusy(false); }
  }}><label>Lesson title<input value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={150} required disabled={isLoading || disabled} autoFocus /></label>{error && <p className="cw-error" role="alert">{error}</p>}<div className="cw-row"><AsyncButton className="cw-button cw-primary" type="submit" loading={isLoading} disabled={disabled || title.trim().length < 3}>Save title</AsyncButton><button type="button" className="cw-button" disabled={isLoading} onClick={() => { setTitle(lesson.title); close(); }}>Cancel</button></div></form>;
}
