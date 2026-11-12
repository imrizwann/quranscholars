import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import { useUpdateCourseMutation } from "@/services/api/instructor/recordedCoursesApi.js";
import CourseCategorySelect from "./CourseCategorySelect.jsx";
import { readableError } from "./courseApi.js";
import CourseMetadataLists from "./CourseMetadataLists.jsx";
import { courseMetadataLists, parseCourseMetadataLists } from "./course-metadata-lists.js";

const textFields = ["title", "shortDescription", "description", "language", "level"];

export default function CourseMetadataEditor({ course, disabled, onBusy, onCancel, onSaved }) {
  // Snapshot only when editing starts. Background polling must not replace a draft.
  const [initial] = useState(() => Object.fromEntries([
    ...textFields.map((key) => [key, course[key] || ""]),
    ["category", course.category?._id || course.category || ""],
    ...courseMetadataLists.map(({ key }) => [key, course[key] || []]),
  ]));
  const [values, setValues] = useState(() => ({ ...initial, ...Object.fromEntries(courseMetadataLists.map(({ key }) => [key, initial[key].join("\n")])) }));
  const [category, setCategory] = useState(course.category);
  const [updateCourse, { isLoading }] = useUpdateCourseMutation();
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const busy = disabled || isLoading;
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
    const { lists, errors } = parseCourseMetadataLists(values);
    Object.assign(next, lists);
    if (next.title.length < 3) errors.title = "Enter a title with at least 3 characters.";
    if (next.shortDescription.length > 200 && next.shortDescription !== initial.shortDescription) errors.shortDescription = "Keep your course subtitle within 200 characters.";
    if (next.description.length < 30 || next.description.length > 10000) errors.description = "Enter a description between 30 and 10,000 characters.";
    if (next.language.length < 2) errors.language = "Enter a language with at least 2 characters.";
    if (!next.category) errors.category = "Choose a category.";
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
    <label>Subtitle (optional)<input {...inputProps("shortDescription")} maxLength={200} placeholder="Summarize what learners will gain" aria-describedby={["metadata-subtitle-help", fieldErrors.shortDescription && "metadata-shortDescription-error"].filter(Boolean).join(" ")} /><span id="metadata-subtitle-help" className="cw-field-hint">Shown below the course title and on course cards. {values.shortDescription.length}/200 characters.</span>{feedback("shortDescription")}</label>
    <label>Description<textarea {...inputProps("description")} required minLength={30} maxLength={10000} rows={6} aria-describedby={["metadata-description-help", fieldErrors.description && "metadata-description-error"].filter(Boolean).join(" ")} /><span id="metadata-description-help" className="cw-field-hint">Use paragraphs for a clear course introduction. At least 30 characters. {values.description.length.toLocaleString("en")}/10,000 characters.</span>{feedback("description")}</label>
    <div className="cw-form-grid">
      <CourseCategorySelect value={category || values.category} disabled={busy} error={fieldErrors.category} onChange={item => { change("category", item?._id || ""); setCategory(item); }} />
      <SelectField label="Level" name="level" value={values.level || null} options={["Beginner", "Intermediate", "Advanced"]} required disabled={busy} error={fieldErrors.level} onChange={(value) => change("level", value)} />
      <label>Language<input {...inputProps("language")} required minLength={2} maxLength={50} />{feedback("language")}</label>
    </div>
    <CourseMetadataLists values={values} onChange={change} disabled={busy} errors={fieldErrors} />
    {error && <p className="cw-error" role="alert">{error}</p>}
    <div className="cw-row">
      <AsyncButton type="submit" className="cw-button cw-primary" loading={isLoading} loadingLabel="Saving details" disabled={busy}><Check size={16} aria-hidden="true" />Save details</AsyncButton>
      <button type="button" className="cw-button" disabled={isLoading} onClick={onCancel}><X size={16} aria-hidden="true" />Cancel</button>
    </div>
  </form>;
}
