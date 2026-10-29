import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import { useUpdateCourseMutation } from "@/services/api/instructor/recordedCoursesApi.js";
import useCourseQuery from "./useCourseQuery.js";
import { Pagination, QueryMessage } from "./WorkspaceParts.jsx";
import { readableError } from "./courseApi.js";

const listFields = [["tags", "Tags", 50], ["outcomes", "Learning outcomes", 200], ["requirements", "Requirements", 200], ["audience", "Who this course is for", 200]];
const textFields = ["title", "shortDescription", "description", "language", "level"];

export default function CourseMetadataEditor({ course, disabled, onBusy, onCancel, onSaved }) {
  // Snapshot only when editing starts. Background polling must not replace a draft.
  const [initial] = useState(() => Object.fromEntries([
    ...textFields.map((key) => [key, course[key] || ""]),
    ["category", course.category?._id || course.category || ""],
    ...listFields.map(([key]) => [key, course[key] || []]),
  ]));
  const [values, setValues] = useState(() => ({ ...initial, ...Object.fromEntries(listFields.map(([key]) => [key, initial[key].join("\n")])) }));
  const [category, setCategory] = useState(course.category);
  const [page, setPage] = useState(1);
  const categories = useCourseQuery("getCategories", { page });
  const [updateCourse, { isLoading }] = useUpdateCourseMutation();
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const busy = disabled || isLoading;
  const options = (categories.data?.items || []).map((item) => ({ value: item._id, label: item.name }));
  if (values.category && !options.some((item) => item.value === values.category)) options.unshift({ value: values.category, label: category?.name || "Current category" });
  function change(key, value) { setValues((previous) => ({ ...previous, [key]: value })); }
  function feedback(key) {
    return fieldErrors[key] ? <span id={`metadata-${key}-error`} className="cw-field-error" role="alert">{fieldErrors[key]}</span> : null;
  }
  function inputProps(key) {
    return { name: key, value: values[key], disabled: busy, onChange: (event) => change(key, event.target.value), "aria-invalid": Boolean(fieldErrors[key]), "aria-describedby": fieldErrors[key] ? `metadata-${key}-error` : undefined };
  }
  async function submit(event) {
    event.preventDefault();
    if (saving.current || busy) return;
    const next = Object.fromEntries(textFields.map((key) => [key, values[key].trim()]));
    next.category = values.category;
    const errors = {};
    if (next.title.length < 3) errors.title = "Enter a title with at least 3 characters.";
    if (next.description.length < 30) errors.description = "Enter a description with at least 30 characters.";
    if (next.language.length < 2) errors.language = "Enter a language with at least 2 characters.";
    if (!next.category) errors.category = "Choose a category.";
    for (const [key, label, limit] of listFields) {
      next[key] = values[key].split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      if (next[key].length > 20 || next[key].some((item) => item.length > limit)) errors[key] = `${label}: use up to 20 lines, with no more than ${limit} characters per line.`;
    }
    setFieldErrors(errors); setError("");
    if (Object.keys(errors).length) return;
    const changes = Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(initial[key])));
    if (!Object.keys(changes).length) { onCancel(); return; }
    saving.current = true; onBusy(true);
    try {
      await updateCourse({ courseId: course._id, changes }).unwrap();
      onSaved();
    } catch (failure) {
      setError(readableError(failure));
      if (Array.isArray(failure.data?.errors)) setFieldErrors(Object.fromEntries(failure.data.errors.map((item) => [item.field?.split(".")[0], item.message])));
    } finally { saving.current = false; onBusy(false); }
  }
  return <form className="cw-stack" onSubmit={submit} aria-label="Edit course details">
    <label>Course title<input {...inputProps("title")} required minLength={3} maxLength={150} autoFocus />{feedback("title")}</label>
    <label>Short description<textarea {...inputProps("shortDescription")} maxLength={300} rows={2} /><span className="cw-field-hint">Optional, up to 300 characters.</span>{feedback("shortDescription")}</label>
    <label>Description<textarea {...inputProps("description")} required minLength={30} maxLength={300} rows={4} /><span className="cw-field-hint">30 to 300 characters.</span>{feedback("description")}</label>
    <div className="cw-form-grid">
      <div><SelectField label="Category" name="category" value={values.category || null} options={options} required disabled={busy || Boolean(categories.error)} loading={categories.loading} error={fieldErrors.category} onChange={(value) => { change("category", value); setCategory(categories.data?.items.find((item) => item._id === value) || category); }} />
        {categories.error && <QueryMessage query={categories} compact />}
        <Pagination pagination={categories.data?.pagination} page={page} onPage={setPage} disabled={busy} loading={categories.loading} />
      </div>
      <SelectField label="Level" name="level" value={values.level || null} options={["Beginner", "Intermediate", "Advanced"]} required disabled={busy} error={fieldErrors.level} onChange={(value) => change("level", value)} />
      <label>Language<input {...inputProps("language")} required minLength={2} maxLength={50} />{feedback("language")}</label>
    </div>
    <div className="cw-form-grid">{listFields.map(([key, label, limit]) => <label key={key}>{label}<textarea {...inputProps(key)} rows={3} maxLength={20 * (limit + 2)} /><span className="cw-field-hint">One item per line. Up to 20 items, {limit} characters each.</span>{feedback(key)}</label>)}</div>
    {error && <p className="cw-error" role="alert">{error}</p>}
    <div className="cw-row">
      <AsyncButton type="submit" className="cw-button cw-primary" loading={isLoading} loadingLabel="Saving details" disabled={busy}><Check size={16} aria-hidden="true" />Save details</AsyncButton>
      <button type="button" className="cw-button" disabled={isLoading} onClick={onCancel}><X size={16} aria-hidden="true" />Cancel</button>
    </div>
  </form>;
}
