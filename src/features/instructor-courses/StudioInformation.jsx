import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import CourseMetadataEditor from "./CourseMetadataEditor.jsx";

function Field({ label, children, wide = false }) {
  return <div className={wide ? "cw-field-wide" : undefined}><dt className="cw-muted">{label}</dt><dd>{children || "Not added"}</dd></div>;
}

export function CourseDetailsPanel({ course, disabled, onBusy, onEditing }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  function close() { setEditing(false); onEditing(false); }
  return <section className="cw-card">
    <div className="cw-row cw-between"><h2>Course details</h2>{!editing && <button type="button" className="cw-button cw-button-compact" disabled={disabled} onClick={() => { setEditing(true); setSaved(false); onEditing(true); }}><Pencil size={15} aria-hidden="true" />Edit details</button>}</div>
    {saved && <p className="cw-notice" role="status">Course details saved.</p>}
    {editing ? <CourseMetadataEditor course={course} disabled={disabled} onBusy={onBusy} onCancel={close} onSaved={() => { close(); setSaved(true); }} /> : <>
    <dl className="cw-details-grid">
      <Field label="Course title">{course.title}</Field><Field label="Category">{course.category?.name}</Field>
      <Field label="Language">{course.language}</Field><Field label="Level">{course.level}</Field>
      <Field wide label="Short description">{course.shortDescription}</Field>
      <Field wide label="Description">{course.description}</Field>
      <Field wide label="Tags">{course.tags?.length ? course.tags.join(", ") : null}</Field>
    </dl>
    <div className="cw-detail-lists">{[["Learning outcomes", course.outcomes], ["Requirements", course.requirements], ["Who this course is for", course.audience]].map(([label, items]) => <div key={label}><h3>{label}</h3>{items?.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="cw-muted">Not added</p>}</div>)}</div>
    <Link className="cw-text-link" to={`/instructor/students?courseId=${course._id}`}>View enrolled learners</Link>
    </>}
  </section>;
}
