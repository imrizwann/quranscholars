import { useEffect, useId, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import FileTypeIcon, { FileTypeLabel } from "@/components/files/FileTypeIcon.jsx";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "./lesson-resources.css";

const sizeLabel = size => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
export default function LessonResources({ target, manage = false, active = true, disabled = false, onBusy }) {
  const query = api.endpoints.getLessonResources.useQuery(target, { skip: !active, refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  const [upload, uploading] = api.endpoints.uploadLessonResource.useMutation();
  const [remove, removing] = api.endpoints.removeLessonResource.useMutation();
  const [download, downloading] = api.endpoints.downloadLessonResource.useMutation();
  const [file, setFile] = useState(null), [title, setTitle] = useState(""), [error, setError] = useState(""), [message, setMessage] = useState(""), [confirmation, setConfirmation] = useState(null), [downloadId, setDownloadId] = useState(null);
  const input = useRef(null), pending = useRef(false), mounted = useRef(true), request = useRef(null);
  const id = useId();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  const data = query.currentData;
  const busy = uploading.isLoading || removing.isLoading;
  const canManage = manage && data?.canManage === true;
  const blocked = disabled || busy || Boolean(query.error);
  async function save(event) {
    event.preventDefault();
    if (pending.current || blocked || !file || !canManage || !data.available) return;
    pending.current = true; onBusy?.(true); setError(""); setMessage("");
    try { await upload({ ...target, file, title }).unwrap(); setFile(null); setTitle(""); if (input.current) input.current.value = ""; setMessage("Your resource is ready for learners with course access."); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; onBusy?.(false); }
  }
  async function downloadFile(resource) {
    if (request.current) return;
    setError(""); setDownloadId(resource.id);
    try {
      request.current = download({ ...target, resourceId: resource.id });
      const { url } = await request.current.unwrap();
      if (!mounted.current) { URL.revokeObjectURL(url); return; }
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = resource.name; document.body.append(anchor); anchor.click(); anchor.remove();
    } catch (failure) { if (mounted.current) setError(userMessage(failure)); }
    finally { request.current = null; if (mounted.current) { setDownloadId(null); downloading.reset(); } }
  }
  if (!active || (!manage && !query.error && data?.items.length === 0)) return null;
  return <section className="lesson-resources" aria-labelledby={`${id}-title`}>
    <div className="lesson-resources-heading"><FileTypeIcon kind="pdf" size="sm" /><div><h3 id={`${id}-title`}>Lesson resources</h3><p>Notes, worksheets, and practice materials for this lesson.</p></div></div>
    <QueryMessage query={{ data, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading lesson resources" compact />
    {error && <p className="cw-error" role="alert">{error}</p>}{message && <p className="cw-notice" role="status">{message}</p>}
    {!query.error && data?.items.length > 0 && <ul className="lesson-resource-list">{data.items.map(resource => <li key={resource.id} className="qs-file-surface" data-file-kind="pdf">
      <FileTypeIcon kind="pdf" /><div><strong>{resource.title}</strong><p><FileTypeLabel kind="pdf" /> · {sizeLabel(resource.size)}</p></div>
      <div className="lesson-resource-actions"><AsyncButton className="cw-button cw-icon-button" aria-label={`Download ${resource.title}`} loading={downloadId === resource.id} disabled={!data.available || downloading.isLoading} onClick={() => downloadFile(resource)}><Download size={16} aria-hidden="true" /></AsyncButton>
        {canManage && <button type="button" className="cw-button cw-icon-button cw-danger" aria-label={`Remove ${resource.title}`} disabled={blocked} onClick={() => { setError(""); setConfirmation(resource); }}><Trash2 size={16} aria-hidden="true" /></button>}</div>
    </li>)}</ul>}
    {data && !data.available && <p className="cw-muted">Lesson downloads are unavailable. Please contact our team for help.</p>}
    {canManage && data.available && (data.items.length >= data.maxFiles ? <p className="cw-muted">This lesson has five resources. Remove a resource before adding another.</p> : <form className="lesson-resource-form" onSubmit={save}>
      <label htmlFor={`${id}-file`}>Add a PDF<input id={`${id}-file`} name="file" type="file" accept="application/pdf,.pdf" ref={input} disabled={blocked} aria-describedby={`${id}-help`} onChange={event => {
        const selected = event.target.files?.[0]; setMessage(""); setError(""); setFile(null);
        if (!selected) return;
        if (selected.type !== "application/pdf" || !/\.pdf$/i.test(selected.name) || selected.size <= 0 || selected.size > data.maxBytes) { setError("Choose a PDF up to 3 MB."); event.target.value = ""; return; }
        setFile(selected);
      }} /></label><p id={`${id}-help`} className="cw-field-hint">PDF files up to 3 MB. Up to five resources per lesson. Downloads require course access.</p>
      {file && <label htmlFor={`${id}-name`}>Resource title (optional)<input id={`${id}-name`} name="title" value={title} onChange={event => setTitle(event.target.value)} maxLength={150} placeholder={file.name.replace(/\.pdf$/i, "")} disabled={blocked} /></label>}
      <AsyncButton type="submit" className="cw-button" loading={uploading.isLoading} loadingLabel="Uploading PDF" disabled={blocked || !file}><Upload size={16} aria-hidden="true" />Upload PDF</AsyncButton>
    </form>)}
    <ConfirmationModal open={Boolean(confirmation)} title="Remove lesson resource?" description={`Remove “${confirmation?.title || "this PDF"}” from the lesson? Enrolled learners will lose access to this resource.`} danger confirmLabel="Remove resource" busy={removing.isLoading} busyLabel="Removing resource" onCancel={() => setConfirmation(null)} onConfirm={async () => {
      if (pending.current || !confirmation || blocked) return;
      pending.current = true; onBusy?.(true); setMessage("");
      try { await remove({ ...target, resourceId: confirmation.id }).unwrap(); setConfirmation(null); setMessage("Resource removed from this lesson."); }
      catch (failure) { setError(userMessage(failure)); setConfirmation(null); }
      finally { pending.current = false; onBusy?.(false); }
    }} />
  </section>;
}
