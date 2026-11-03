import { courseMetadataLists } from "./course-metadata-lists.js";

export default function CourseMetadataLists({ values, onChange, disabled, errors = {}, fields = courseMetadataLists, idPrefix = "metadata", wideFields = [] }) {
  return <div className="cw-form-grid">{fields.map(({ key, label, limit, placeholder, requiredForPublish = false }) => {
    const id = `${idPrefix}-${key}`;
    return <label key={key} htmlFor={id} className={wideFields.includes(key) ? "cw-field-wide" : undefined}>
      {label}
      <textarea id={id} name={key} value={values[key] || ""} onChange={event => onChange(key, event.target.value)} disabled={disabled} rows={3} maxLength={20 * (limit + 2)} placeholder={placeholder} aria-invalid={Boolean(errors[key])} aria-describedby={`${id}-help${errors[key] ? ` ${id}-error` : ""}`} />
      <span id={`${id}-help`} className="cw-field-hint">{requiredForPublish ? "Required before publishing; you can leave this blank in a draft." : "Optional."} One item per line. Up to 20 items, {limit} characters each.</span>
      {errors[key] && <span id={`${id}-error`} className="cw-field-error" role="alert">{errors[key]}</span>}
    </label>;
  })}</div>;
}
