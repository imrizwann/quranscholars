import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateCourseMutation } from "@/services/api/instructor/recordedCoursesApi.js";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import { readableError } from "@/features/instructor-courses/courseApi.js";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import { ArrowLeft, BookOpen, Check, FileText, Layers, Plus } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import { coursePrice } from "@/features/instructor-courses/course-price.js";
import "@/features/instructor-courses/course-workspace.css";

export default function CreateRecordedCourse() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const categories = useCourseQuery("getCategories", { page });
  const [category, setCategory] = useState(null);
  const [error, setError] = useState("");
  const [createCourse, { isLoading: busy }] = useCreateCourseMutation();
  const saving = useRef(false);
  const categoryOptions = (categories.data?.items || []).map((item) => ({ value: item._id, label: item.name }));
  if (category && !categoryOptions.some((item) => item.value === category._id)) categoryOptions.unshift({ value: category._id, label: category.name });
  async function submit(event) {
    event.preventDefault();
    if (saving.current) return;
    const form = new FormData(event.currentTarget);
    if (!category) { setError("Choose a course category."); return; }
    saving.current = true; setError("");
    try {
      const data = await createCourse({
        title: form.get("title").trim(), description: form.get("description").trim(), category: category._id,
        language: form.get("language").trim(), level: form.get("level"), price: coursePrice(form.get("price"), form.get("salePrice")), tags: [],
      }).unwrap();
      navigate(`/instructor/courses/${data.courseId}`, { replace: true });
    } catch (failure) { setError(readableError(failure)); }
    finally { saving.current = false; }
  }
  return <main className="course-workspace">
    <Link className="cw-back" to="/instructor/courses"><ArrowLeft size={16} aria-hidden="true" />Back to courses</Link>
    <header className="cw-heading"><p className="cw-eyebrow">Course studio</p><h1>Create a recorded course</h1><p className="cw-muted">Start with the essentials. Add your curriculum and videos after saving your draft.</p></header>
    <ol className="cw-steps" aria-label="Course setup"><li aria-current="step"><span>1</span>Course details</li><li><span>2</span>Sections & lessons</li><li><span>3</span>Upload videos</li></ol>
    <div className="cw-create-grid">
      <form className="cw-card cw-create-form" onSubmit={submit}>
        <div className="cw-card-heading"><span className="cw-heading-icon"><FileText size={21} aria-hidden="true" /></span><div><h2>Course details</h2><p className="cw-muted">Help learners understand what your course offers.</p></div></div>
        <div className="cw-stack">
          <label>Course title<input name="title" placeholder="e.g. Tajweed Foundations" required minLength={3} maxLength={150} disabled={busy} /></label>
          <label>Description<textarea name="description" placeholder="What will learners study, and who is this course for?" required minLength={30} maxLength={300} rows={4} disabled={busy} /><span className="cw-field-hint">30 to 300 characters. Keep it clear and focused.</span></label>
          <div className="cw-form-grid">
            <div><SelectField label="Category" name="category" value={category?._id || null} options={categoryOptions} placeholder="Choose a category" loading={categories.loading} disabled={busy || Boolean(categories.error)} onChange={(value) => setCategory(categories.data?.items.find((item) => item._id === value) || (category?._id === value ? category : null))} required />
              {categories.error && <QueryMessage query={categories} compact />}
              {categories.data?.items.length === 0 && <p className="cw-notice">No active categories are available. An administrator needs to add a category before a course can be created.</p>}
              <Pagination pagination={categories.data?.pagination} page={page} onPage={setPage} disabled={busy} loading={categories.loading} />
            </div>
            <SelectField label="Level" name="level" defaultValue="Beginner" options={["Beginner", "Intermediate", "Advanced"]} disabled={busy} required />
            <label>Language<input name="language" defaultValue="English" required minLength={2} maxLength={50} disabled={busy} /></label>
            <label>Original price (INR)<input name="price" placeholder="e.g. 1500" type="number" min="0.01" step="0.01" required disabled={busy} /><span className="cw-field-hint">Enter an amount greater than zero.</span></label>
            <label>Sale price (INR, optional)<input name="salePrice" placeholder="e.g. 1200" type="number" min="0" step="0.01" disabled={busy} /><span className="cw-field-hint">Leave empty for no discount. Must not exceed the original price.</span></label>
          </div>
          {error && <p className="cw-error" role="alert">{error}</p>}
        </div>
        <div className="cw-form-footer"><span className="cw-muted">Your course will be saved as a draft.</span><AsyncButton type="submit" className="cw-button cw-primary" loading={busy} loadingLabel="Creating course" disabled={!category}><Plus size={16} aria-hidden="true" />Create course</AsyncButton></div>
      </form>
      <aside className="cw-card cw-guide"><span className="cw-heading-icon"><BookOpen size={22} aria-hidden="true" /></span><h2>A strong start</h2><p className="cw-muted">A clear outline makes a course easier to follow.</p><ul><li><Check size={16} aria-hidden="true" /><span>Choose a specific, easy-to-understand title.</span></li><li><Check size={16} aria-hidden="true" /><span>Describe what learners will be able to do.</span></li><li><Layers size={16} aria-hidden="true" /><span>Next, organize your lessons into sections and upload your videos.</span></li></ul><p className="cw-guide-note">Creating a draft does not publish your course.</p></aside>
    </div>
  </main>;
}
