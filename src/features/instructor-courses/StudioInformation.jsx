import { Link } from "react-router-dom";
import { Check, ChevronRight, Pencil } from "lucide-react";
import { courseStatusLabel } from "@/lib/user-messages.js";
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
    </>}
  </section>;
}

export function CoursePricingPanel({ course }) {
  const price = course.price || {};
  const format = (value) => typeof value === "number" && Number.isFinite(value) ? `${price.currency || "INR"} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
  return <section className="cw-card">
    <div className="cw-row cw-between"><h2>Course pricing</h2><button type="button" className="cw-button cw-button-compact" disabled aria-describedby="pricing-edit-note"><Pencil size={15} aria-hidden="true" />Edit pricing</button></div>
    <p id="pricing-edit-note" className="cw-muted">Saved pricing is shown below. Price changes are not available yet.</p>
    <dl className="cw-details-grid"><Field label="Original price">{format(price.original)}</Field><Field label="Sale price">{price.sale == null ? "No sale price" : format(price.sale)}</Field><Field label="Currency">{price.currency || "INR"}</Field><Field label="Current price">{format(price.sale ?? price.original)}</Field></dl>
  </section>;
}

export function CoursePublishPanel({ course, sectionsTotal, onReview }) {
  const checks = [
    { label: "Course information", detail: "Title, description, category, language and level.", tab: "details", ready: Boolean(course.title?.trim() && course.description?.trim() && course.category && course.language && course.level) },
    { label: "Curriculum", detail: `${sectionsTotal ?? "—"} sections · ${course.stats?.totalLessons ?? "—"} lessons. Review each lesson and its video before publishing.`, tab: "curriculum", ready: false },
    { label: "Course cover", detail: course.thumbnail ? "Cover added. Check its preview." : "Add a recognizable course cover.", tab: "media", ready: Boolean(course.thumbnail) },
    { label: "Trailer (optional)", detail: course.trailerVideo?.status === "COMPLETED" ? "Trailer is ready to preview." : "You can add a public introduction in Media.", tab: "media", ready: course.trailerVideo?.status === "COMPLETED" },
    { label: "Pricing", detail: "Review your saved price and any sale price.", tab: "pricing", ready: Number.isFinite(course.price?.original) && course.price.original >= 0 && (course.price.sale == null || (Number.isFinite(course.price.sale) && course.price.sale >= 0 && course.price.sale <= course.price.original)) },
  ];
  return <section className="cw-card">
    <div className="cw-row cw-between"><h2>Prepare to publish</h2><span className="cw-status">{courseStatusLabel(course.status)}</span></div>
    <p className="cw-muted">Use this checklist to review your saved content. Full course validation and publishing are not available yet.</p>
    <ul className="cw-readiness-list">{checks.map((item) => <li key={item.label}>
      <div><div className="cw-row"><strong>{item.label}</strong>{item.ready && <Check size={16} aria-label="Saved" />}</div><p className="cw-muted">{item.detail}</p></div>
      <button type="button" className="cw-button cw-button-compact" onClick={() => onReview(item.tab)} aria-label={`Review ${item.label.toLowerCase()}`}>Review<ChevronRight size={15} aria-hidden="true" /></button>
    </li>)}</ul>
    <div className="cw-row cw-between"><p className="cw-muted" id="publish-unavailable">Publishing controls will be available when course validation is supported.</p><button type="button" className="cw-button cw-primary" disabled aria-describedby="publish-unavailable">{course.published ? "Update publication" : "Publish course"}</button></div>
    {course.published && course.status === "Published" && <Link className="cw-text-link" to={`/courses/${course.slug}`}>View public course</Link>}
  </section>;
}
