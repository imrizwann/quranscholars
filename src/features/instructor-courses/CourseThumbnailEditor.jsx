import { useEffect, useId, useRef, useState } from "react";
import { Image, Upload, X } from "lucide-react";
import instructorCoursesApi from "@/services/api/instructor/recordedCoursesApi.js";
import { resolveCourseImage } from "@/features/recorded-courses/model/recordedCourseAdapter.js";
import { readableError } from "./courseApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";

export default function CourseThumbnailEditor({ course, disabled, onBusy }) {
  const [upload, result] = instructorCoursesApi.endpoints.uploadThumbnail.useMutation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [failed, setFailed] = useState(null);
  const input = useRef(null);
  const hintId = useId();
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const image = file && preview?.file === file ? preview.url : resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const hasCover = Boolean(course.thumbnailUrl || course.thumbnail);
  const locked = disabled || result.isLoading;
  function clearSelection() {
    setFile(null); setError(""); setNotice("");
    if (input.current) input.current.value = "";
  }
  function selectFile(event) {
    const next = event.target.files?.[0];
    if (!next) return;
    setError(""); setNotice("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type) || next.size > 3 * 1024 * 1024 || next.size === 0) {
      setError("Choose a JPG, PNG, or WebP image up to 3 MB.");
      event.target.value = ""; setFile(null); return;
    }
    setFile(next);
  }
  async function save() {
    if (!file || result.isLoading || disabled) return;
    setError(""); setNotice(""); onBusy(true);
    try {
      await upload({ courseId: course._id, file }).unwrap();
      setNotice("Course cover updated."); setFile(null); if (input.current) input.current.value = "";
    } catch (failure) { setError(readableError(failure)); }
    finally { onBusy(false); }
  }
  return <section className="cw-card">
    <div className="cw-card-heading">
      <span className="cw-heading-icon"><Image size={21} aria-hidden="true" /></span>
      <div><h2>Course cover</h2><p className="cw-muted">Give your course a recognizable first impression.</p></div>
    </div>
    <div className="cw-thumbnail-layout">
      <figure className="cw-thumbnail-figure">
        <div className="cw-thumbnail-preview">
          {image && failed !== image ? <img src={image} alt={file ? "Selected course cover preview" : `${course.title} cover`} onError={() => setFailed(image)} /> : <div><Image size={34} strokeWidth={1.25} aria-hidden="true" /><span>{image ? "Preview unavailable" : "No cover uploaded"}</span></div>}
        </div>
        <figcaption className="cw-muted">{file ? "Preview · Not saved yet" : hasCover ? "Current course cover" : "Your cover will appear here"}</figcaption>
      </figure>
      <div className="cw-thumbnail-controls">
        <div>
          <h3>{file && failed === image ? "Choose a different image" : file ? "Ready to update your cover" : hasCover ? "Update your cover" : "Add a course cover"}</h3>
          <p id={hintId} className="cw-field-hint">JPG, PNG, or WebP, up to 3 MB. Use a 16:9 image for the best fit.</p>
        </div>
        <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" aria-label="Choose a cover image" aria-describedby={hintId} disabled={locked} onChange={selectFile} />
        {file && <div className="cw-thumbnail-selection" aria-live="polite"><Image size={18} aria-hidden="true" /><div><p className="cw-file">{file.name}</p><span className="cw-field-hint">{file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`} · Selected image</span></div></div>}
        <div className="cw-row cw-thumbnail-actions">
          <button type="button" className="cw-button" disabled={locked} onClick={() => input.current?.click()}><Image size={16} aria-hidden="true" />{file ? "Choose another" : "Choose image"}</button>
          {file && <>
            <AsyncButton className="cw-button cw-primary" loading={result.isLoading} loadingLabel="Uploading cover" disabled={disabled || failed === image} onClick={save}><Upload size={16} aria-hidden="true" />{hasCover ? "Replace cover" : "Upload cover"}</AsyncButton>
            <button type="button" className="cw-button" disabled={locked} onClick={clearSelection}><X size={16} aria-hidden="true" />Cancel</button>
          </>}
        </div>
        {file && <p className="cw-field-hint">{hasCover ? "Your current cover stays in place until the replacement is saved." : "Upload to save this image as your course cover."}</p>}
        {error && <p className="cw-error" role="alert">{error}</p>}
        {file && failed === image && <p className="cw-error" role="alert">This image could not be previewed. Choose another JPG, PNG, or WebP image.</p>}
        {notice && <p className="cw-notice" role="status">{notice}</p>}
      </div>
    </div>
  </section>;
}
