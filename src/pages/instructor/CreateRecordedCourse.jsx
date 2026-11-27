import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateCourseMutation } from "@/services/api/instructor/recordedCoursesApi.js";
import { readableError } from "@/features/instructor-courses/courseApi.js";
import { ArrowLeft, BookOpen, Check, Circle, ClipboardCheck, Image, Layers, Lock, Plus } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import CourseCategorySelect from "@/features/instructor-courses/CourseCategorySelect.jsx";
import { coursePrice } from "@/features/instructor-courses/course-price.js";
import CourseMetadataLists from "@/features/instructor-courses/CourseMetadataLists.jsx";
import { courseLearningLists, parseCourseMetadataLists } from "@/features/instructor-courses/course-metadata-lists.js";
import "@/features/instructor-courses/course-workspace.css";
import "./create-course.css";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

// Live price summary: what learners will pay, the discount, or why the prices do not work yet.
function pricePreview(priceText, saleText) {
  const price = Number(priceText), sale = saleText === "" ? null : Number(saleText);
  if (!priceText || !Number.isFinite(price) || price <= 0) return { ok: false, text: "Enter an original price to see what learners will pay." };
  if (sale !== null && (!Number.isFinite(sale) || sale < 0)) return { ok: false, text: "Enter a valid sale price, or leave it empty." };
  if (sale !== null && sale > price) return { ok: false, warning: true, text: "The sale price must not be higher than the original price." };
  if (sale === null || sale === price) return { ok: true, pay: inr.format(price) };
  return { ok: true, pay: inr.format(sale), original: inr.format(price), saving: Math.round((1 - sale / price) * 100) };
}

function SectionHead({ number, title, description }) {
  return <div className="create-section-head"><span className="create-section-number" aria-hidden="true">{number}</span><div><h2>{title}</h2><p className="cw-muted">{description}</p></div></div>;
}

export default function CreateRecordedCourse() {
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [error, setError] = useState("");
  const [learningDetails, setLearningDetails] = useState({ outcomes: "", requirements: "", audience: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [createCourse, { isLoading: busy }] = useCreateCourseMutation();
  const saving = useRef(false);
  const preview = pricePreview(price, salePrice);
  const checklist = [
    { label: "Course title", done: title.trim().length >= 3 },
    { label: "Description (30+ characters)", done: description.trim().length >= 30 },
    { label: "Category", done: Boolean(category) },
    { label: "Price", done: preview.ok },
  ];
  const doneCount = checklist.filter(item => item.done).length;

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

  return <main className="course-workspace create-course">
    <Link className="cw-back" to="/instructor/courses"><ArrowLeft size={16} aria-hidden="true" />Back to courses</Link>
    <header className="cw-heading"><p className="cw-eyebrow">Course studio</p><h1>Create a recorded course</h1><p className="cw-muted">Save the essentials as a private draft. Continue in Course Studio to add lessons and media, refine pricing, and prepare to publish.</p></header>

    <form className="create-layout" onSubmit={submit}>
      <div className="create-sections">
        <section className="cw-card create-section" aria-labelledby="create-basics">
          <SectionHead number={1} title={<span id="create-basics">Basics</span>} description="What your course is called and what learners will get from it." />
          <div className="cw-stack">
            <label>Course title<input name="title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Tajweed Foundations" required minLength={3} maxLength={150} disabled={busy} aria-describedby="create-course-title-help" /><span id="create-course-title-help" className="cw-field-hint create-count">{title.length}/150 characters</span></label>
            <label>Subtitle (optional)<input name="shortDescription" value={subtitle} onChange={event => setSubtitle(event.target.value)} placeholder="e.g. Build confidence in recitation with guided Tajweed practice" maxLength={200} aria-describedby="create-course-subtitle-help" disabled={busy} /><span id="create-course-subtitle-help" className="cw-field-hint">Summarize what learners will gain. {subtitle.length}/200 characters.</span></label>
            <label>Description<textarea name="description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Introduce your course, explain your approach, and describe what learners can expect." required minLength={30} maxLength={10000} rows={7} aria-describedby="create-course-description-help" disabled={busy} /><span id="create-course-description-help" className="cw-field-hint">Use paragraphs for a clear course introduction. At least 30 characters. {description.length.toLocaleString("en")}/10,000 characters.</span></label>
          </div>
        </section>

        <section className="cw-card create-section" aria-labelledby="create-classification">
          <SectionHead number={2} title={<span id="create-classification">Category and level</span>} description="Helps learners find your course and know if it is right for them." />
          <div className="cw-form-grid create-grid-3">
            <CourseCategorySelect value={category} onChange={setCategory} disabled={busy} />
            <SelectField label="Level" name="level" value={level} onChange={setLevel} options={["Beginner", "Intermediate", "Advanced"]} disabled={busy} required />
            <label>Language<input name="language" defaultValue="English" required minLength={2} maxLength={50} disabled={busy} /></label>
          </div>
        </section>

        <section className="cw-card create-section" aria-labelledby="create-pricing">
          <SectionHead number={3} title={<span id="create-pricing">Pricing</span>} description="Prices are in INR and include 18% GST. You can change them later." />
          <div className="cw-form-grid">
            <label>Original price (INR)<input name="price" value={price} onChange={event => setPrice(event.target.value)} placeholder="e.g. 1500" type="number" min="0.01" step="0.01" required disabled={busy} /><span className="cw-field-hint">Enter an amount greater than zero.</span></label>
            <label>Sale price (INR, optional)<input name="salePrice" value={salePrice} onChange={event => setSalePrice(event.target.value)} placeholder="e.g. 1200" type="number" min="0" step="0.01" disabled={busy} /><span className="cw-field-hint">Leave empty for no discount. Must not exceed the original price.</span></label>
          </div>
          <p className="create-price-preview" data-state={preview.ok ? "ok" : preview.warning ? "warning" : "empty"} role="status">
            {preview.ok ? <>Learners pay <strong>{preview.pay}</strong>{preview.original && <> <s>{preview.original}</s><span className="create-saving">Save {preview.saving}%</span></>}</> : preview.text}
          </p>
        </section>

        <section className="cw-card create-section" aria-labelledby="create-learning">
          <SectionHead number={4} title={<span id="create-learning">Learning details</span>} description="Add these now or finish them later in Course Details. You can save a draft without them, but at least one learning outcome is required before publishing." />
          <CourseMetadataLists values={learningDetails} onChange={(key, value) => setLearningDetails(previous => ({ ...previous, [key]: value }))} disabled={busy} errors={fieldErrors} fields={courseLearningLists} idPrefix="create-course" wideFields={["outcomes"]} />
        </section>

      </div>

      <aside className="create-aside" aria-label="Draft preview and checklist">
        <section className="cw-card create-preview" aria-label="Course card preview">
          <p className="create-aside-label">Preview</p>
          <div className="create-preview-cover"><BookOpen size={28} strokeWidth={1.5} aria-hidden="true" /><span>Cover image is added in Media</span></div>
          <p className="create-preview-meta">{[category?.name, level].filter(Boolean).join(" · ") || "Category · Level"}</p>
          <h3 className="create-preview-title">{title.trim() || "Your course title"}</h3>
          <p className="create-preview-subtitle">{subtitle.trim() || "Your subtitle appears here."}</p>
          <p className="create-preview-price">{preview.ok ? <>{preview.pay}{preview.original && <s>{preview.original}</s>}</> : <span>Price not set</span>}</p>
        </section>

        <section className="cw-card create-checklist" aria-labelledby="create-checklist-title">
          <div className="create-checklist-head"><h3 id="create-checklist-title">Ready to create</h3><span>{doneCount} of {checklist.length}</span></div>
          <ul>{checklist.map(item => <li key={item.label} data-done={item.done || undefined}>{item.done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}{item.label}<span className="sr-only">{item.done ? ": done" : ": to do"}</span></li>)}</ul>
          <AsyncButton type="submit" className="cw-button cw-primary create-aside-submit" loading={busy} loadingLabel="Creating draft" disabled={!category}><Plus size={16} aria-hidden="true" />Create draft</AsyncButton>
          <p className="create-private"><Lock size={13} aria-hidden="true" />Drafts stay private until you publish.</p>
        </section>

        <section className="cw-card create-next" aria-labelledby="create-next-title">
          <h3 id="create-next-title">After you create it</h3>
          <ol>
            <li><Layers size={15} aria-hidden="true" /><span><strong>Curriculum</strong> Add sections, lessons and lesson videos.</span></li>
            <li><Image size={15} aria-hidden="true" /><span><strong>Media</strong> Add your course cover and trailer.</span></li>
            <li><ClipboardCheck size={15} aria-hidden="true" /><span><strong>Publish</strong> Review readiness and go live.</span></li>
          </ol>
        </section>
      </aside>

      {/* After the side panel in the page order, so phones see the checklist before this button. */}
      <div className="create-submit">
        {error && <p className="cw-error" role="alert">{error}</p>}
        <div className="cw-card create-footer"><span className="cw-muted">Next, add sections and lessons in the Curriculum tab. Your draft stays private until published.</span><AsyncButton type="submit" className="cw-button cw-primary" loading={busy} loadingLabel="Creating draft" disabled={!category}><Plus size={16} aria-hidden="true" />Create draft</AsyncButton></div>
      </div>
    </form>
  </main>;
}
