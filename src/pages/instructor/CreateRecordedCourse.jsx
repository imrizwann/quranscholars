import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateCourseMutation } from "@/services/api/instructor/recordedCoursesApi.js";
import { readableError } from "@/features/instructor-courses/courseApi.js";
import { ArrowLeft, BookOpen, ClipboardCheck, FileText, Image, Layers, Plus } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import CourseCategorySelect from "@/features/instructor-courses/CourseCategorySelect.jsx";
import { coursePrice } from "@/features/instructor-courses/course-price.js";
import CourseMetadataLists from "@/features/instructor-courses/CourseMetadataLists.jsx";
import { courseLearningLists, parseCourseMetadataLists } from "@/features/instructor-courses/course-metadata-lists.js";
import "@/features/instructor-courses/course-workspace.css";

export default function CreateRecordedCourse() {
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [error, setError] = useState("");
  const [learningDetails, setLearningDetails] = useState({ outcomes: "", requirements: "", audience: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [createCourse, { isLoading: busy }] = useCreateCourseMutation();
  const saving = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (saving.current) return;
    const form = new FormData(event.currentTarget);
    if (!category) { setError("Choose a course category."); return; }
    const { lists, errors } = parseCourseMetadataLists(learningDetails, courseLearningLists);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("");
      event.currentTarget.elements.namedItem(Object.keys(errors)[0])?.focus();
      return;
    }
    saving.current = true; setError("");
    try {
      const data = await createCourse({
        title: form.get("title").trim(), shortDescription: subtitle.trim(), description: description.trim(), category: category._id,
        language: form.get("language").trim(), level: form.get("level"), price: coursePrice(form.get("price"), form.get("salePrice")), tags: [], ...lists,
      }).unwrap();
      navigate(`/instructor/courses/${data.courseId}`, { replace: true, state: { startWithCurriculum: true } });
    } catch (failure) { setError(readableError(failure)); }
    finally { saving.current = false; }
  }
  return <main className="course-workspace">
    <Link className="cw-back" to="/instructor/courses"><ArrowLeft size={16} aria-hidden="true" />Back to courses</Link>
    <header className="cw-heading"><p className="cw-eyebrow">Course studio</p><h1>Create a recorded course</h1><p className="cw-muted">Save the essentials as a private draft. Continue in Course Studio to add lessons and media, refine pricing, and prepare to publish.</p></header>
    <div className="cw-create-grid">
      <form className="cw-card cw-create-form" onSubmit={submit}>
        <div className="cw-card-heading"><span className="cw-heading-icon"><FileText size={21} aria-hidden="true" /></span><div><h2>Course details</h2><p className="cw-muted">Help learners understand what your course offers.</p></div></div>
        <div className="cw-stack">
          <label>Course title<input name="title" placeholder="e.g. Tajweed Foundations" required minLength={3} maxLength={150} disabled={busy} /></label>
          <label>Subtitle (optional)<input name="shortDescription" value={subtitle} onChange={event => setSubtitle(event.target.value)} placeholder="e.g. Build confidence in recitation with guided Tajweed practice" maxLength={200} aria-describedby="create-course-subtitle-help" disabled={busy} /><span id="create-course-subtitle-help" className="cw-field-hint">Summarize what learners will gain. {subtitle.length}/200 characters.</span></label>
          <label>Description<textarea name="description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Introduce your course, explain your approach, and describe what learners can expect." required minLength={30} maxLength={10000} rows={6} aria-describedby="create-course-description-help" disabled={busy} /><span id="create-course-description-help" className="cw-field-hint">Use paragraphs for a clear course introduction. At least 30 characters. {description.length.toLocaleString("en")}/10,000 characters.</span></label>
          <div className="cw-form-grid">
            <CourseCategorySelect value={category} onChange={setCategory} disabled={busy} />
            <SelectField label="Level" name="level" defaultValue="Beginner" options={["Beginner", "Intermediate", "Advanced"]} disabled={busy} required />
            <label>Language<input name="language" defaultValue="English" required minLength={2} maxLength={50} disabled={busy} /></label>
            <label>Original price (INR)<input name="price" placeholder="e.g. 1500" type="number" min="0.01" step="0.01" required disabled={busy} /><span className="cw-field-hint">Enter an amount greater than zero.</span></label>
            <label>Sale price (INR, optional)<input name="salePrice" placeholder="e.g. 1200" type="number" min="0" step="0.01" disabled={busy} /><span className="cw-field-hint">Leave empty for no discount. Must not exceed the original price.</span></label>
          </div>
          <div><h3>Learning details</h3><p className="cw-field-hint">Add these now or finish them later in Course Details. You can save a draft without them, but at least one learning outcome is required before publishing.</p></div>
          <CourseMetadataLists values={learningDetails} onChange={(key, value) => setLearningDetails(previous => ({ ...previous, [key]: value }))} disabled={busy} errors={fieldErrors} fields={courseLearningLists} idPrefix="create-course" wideFields={["outcomes"]} />
          {error && <p className="cw-error" role="alert">{error}</p>}
        </div>
        <div className="cw-form-footer"><span className="cw-muted">Next, add sections and lessons in the Curriculum tab. Your draft stays private until published.</span><AsyncButton type="submit" className="cw-button cw-primary" loading={busy} loadingLabel="Creating draft" disabled={!category}><Plus size={16} aria-hidden="true" />Create draft</AsyncButton></div>
      </form>
      <aside className="cw-card cw-guide" aria-labelledby="course-studio-guide"><span className="cw-heading-icon"><BookOpen size={22} aria-hidden="true" /></span><h2 id="course-studio-guide">Continue in Course Studio</h2><p className="cw-muted">Your draft opens in Curriculum. Use the tabs to build and review your course at your own pace.</p><ul>
        <li><Layers size={16} aria-hidden="true" /><span><strong className="block font-semibold text-foreground">Curriculum</strong>Create sections, add lessons, and upload lesson videos.</span></li>
        <li><Image size={16} aria-hidden="true" /><span><strong className="block font-semibold text-foreground">Media</strong>Add your course cover and trailer.</span></li>
        <li><FileText size={16} aria-hidden="true" /><span><strong className="block font-semibold text-foreground">Course Details & Pricing</strong>Refine your course information and adjust prices.</span></li>
        <li><ClipboardCheck size={16} aria-hidden="true" /><span><strong className="block font-semibold text-foreground">Publish</strong>Review course readiness before making it available to learners.</span></li>
      </ul><p className="cw-guide-note">You can return to your draft from your course list.</p></aside>
    </div>
  </main>;
}
