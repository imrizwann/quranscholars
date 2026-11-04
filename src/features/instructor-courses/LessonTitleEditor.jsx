import { useState } from "react";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function LessonTitleEditor({ target, lesson, editing, disabled, onBusy, onEditing }) {
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || "");
  const [error, setError] = useState("");
  const [save, { isLoading }] = api.endpoints.updateLesson.useMutation();
  const close = () => { onEditing(false); setError(""); };
  if (!editing) return <div className="cw-lesson-metadata"><span className="cw-status cw-publication-status" data-status={lesson.published ? "Published" : "Draft"}>{lesson.published ? "Published lesson" : "Draft lesson"}</span>{lesson.description && <p className="cw-muted cw-lesson-description">{lesson.description}</p>}</div>;
  return <form className="cw-stack cw-lesson-metadata" onSubmit={async event => {
    event.preventDefault(); if (isLoading || disabled) return;
    setError(""); onBusy(true);
    try { await save({ ...target, title: title.trim(), description: description.trim() }).unwrap(); close(); }
    catch (failure) { setError(userMessage(failure)); }
    finally { onBusy(false); }
  }}><label>Lesson title<input name="title" value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={150} required disabled={isLoading || disabled} autoFocus /></label><label>Description (optional)<textarea name="description" value={description} onChange={event => setDescription(event.target.value)} maxLength={300} rows={2} disabled={isLoading || disabled} /><span className="cw-field-hint">Up to 300 characters.</span></label>{error && <p className="cw-error" role="alert">{error}</p>}<div className="cw-row"><AsyncButton className="cw-button cw-primary" type="submit" loading={isLoading} disabled={disabled || title.trim().length < 3}>Save lesson</AsyncButton><button type="button" className="cw-button" disabled={isLoading} onClick={() => { setTitle(lesson.title); setDescription(lesson.description || ""); close(); }}>Cancel</button></div></form>;
}
