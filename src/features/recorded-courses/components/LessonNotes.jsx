import { useId, useRef, useState } from "react";
import { Clock3, Download, RefreshCw, Save, Trash2 } from "lucide-react";
import FileTypeIcon from "@/components/files/FileTypeIcon.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import useLessonNotes from "../useLessonNotes.js";
import { NOTE_LIMIT, lessonTime } from "../services/lessonStudyStorage.js";

const statusText = state => !state.loaded ? "Loading your notes…" : ({
  pending: "Unsaved changes", saving: "Saving notes…", error: "Changes haven’t been saved. Please retry.",
  conflict: "Your draft is kept in this browser. Load the latest notes to continue.", deleting: "Deleting notes…", deleteError: "Deletion could not be confirmed. Your copy has been kept.", loadingLatest: "Loading the latest notes…",
}[state.status] || (state.deleted ? "Notes deleted from your account" : state.revision ? "Saved to your account" : "Notes save automatically as you write"));

function NotesEditor({ userId, courseId, lesson, getTime, active = true }) {
  const [confirmation, setConfirmation] = useState(null);
  const notes = useLessonNotes({ userId, courseId, lesson, active, paused: Boolean(confirmation) });
  const input = useRef(null), decisionRevision = useRef(null), id = useId();
  const confirm = action => { decisionRevision.current = notes.revision; setConfirmation(action); };
  const timestamp = () => {
    const start = input.current?.selectionStart ?? notes.content.length, end = input.current?.selectionEnd ?? start;
    const stamp = `[${lessonTime(getTime?.())}] `;
    const content = notes.content.slice(0, start) + stamp + notes.content.slice(end);
    if (content.length > NOTE_LIMIT) return;
    notes.change(content);
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(start + stamp.length, start + stamp.length); });
  };
  const download = content => {
    const url = URL.createObjectURL(new Blob([`${lesson.title}\n\n${content}`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `${lesson.title.replace(/[^a-z0-9 -]/gi, "").slice(0, 70) || "lesson"}-notes.txt`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const dialogs = {
    delete: ["Delete your lesson notes?", "Delete these notes from your account and clear the copy in this browser? This applies only to your notes for this lesson.", "Delete notes"],
    latest: ["Load the latest account notes?", "Your unsaved changes will be replaced. Download your draft first if you want to keep a separate copy.", "Load latest notes"],
    recover: ["Use the browser copy?", "Use this recovered text in place of the account copy shown here? It will be saved to your account. Newer account changes will still be checked before saving.", "Use browser copy"],
    discard: ["Discard the browser copy?", "Remove the recovered draft from this browser and keep your account notes. Download the browser copy first if you want to keep it.", "Keep account notes"],
  };
  const selected = dialogs[confirmation];
  return <div className="learning-notes">
    <div className="learning-notes-heading"><div><h2><FileTypeIcon kind="notes" size="sm" />Your lesson notes</h2><p>Capture a key idea or something to practice.</p></div><button type="button" className="cw-button" disabled={!notes.canEdit} onClick={timestamp}><Clock3 size={15} aria-hidden="true" />Add timestamp</button></div>
    <QueryMessage query={{ data: notes.loaded, error: notes.query.error, loading: false, refresh: notes.query.refetch }} compact />
    {notes.loaded && notes.recovery && <section className="learning-note-recovery" aria-labelledby={`${id}-recovery-title`}><h3 id={`${id}-recovery-title`}>Browser notes found</h3><p>{notes.deleted ? "Your account notes were deleted. This browser copy will only be restored if you choose to use it." : "Choose which copy to keep before editing. Your browser notes have not replaced your account notes."}</p><label className="sr-only" htmlFor={`${id}-recovery`}>Recovered browser notes</label><textarea id={`${id}-recovery`} value={notes.recovery.content} readOnly rows={4} /><div className="learning-note-actions"><button className="cw-button" disabled={notes.busy} onClick={() => confirm("recover")}>Use browser copy</button><button className="cw-button" disabled={notes.busy} onClick={() => confirm("discard")}>Keep account notes</button><button className="cw-button" onClick={() => download(notes.recovery.content)}><Download size={15} aria-hidden="true" />Download browser copy</button></div></section>}
    <label className="sr-only" htmlFor={id}>Notes for {lesson.title}</label><textarea ref={input} id={id} name="lesson-notes" value={notes.content} onChange={event => notes.change(event.target.value)} onBlur={event => { if (!event.relatedTarget?.closest("[data-notes-delete]")) void notes.save(); }} disabled={!notes.canEdit} maxLength={NOTE_LIMIT} placeholder="Write your notes here…" aria-describedby={`${id}-privacy`} rows={7} />
    <div className="learning-notes-footer"><p role="status">{notes.query.isError && !notes.loaded ? "Your notes could not be loaded. Please try again." : statusText(notes)}</p><span>{notes.content.length.toLocaleString()} / {NOTE_LIMIT.toLocaleString()}</span></div>
    {notes.error && <p className="cw-error" role="alert">{notes.error}</p>}
    <div className="learning-note-actions">
      <AsyncButton className="cw-button cw-primary" loading={notes.status === "saving"} loadingLabel="Saving notes" disabled={!notes.canEdit || !notes.dirty || notes.busy || notes.status === "conflict"} onClick={() => void notes.save()}><Save size={15} aria-hidden="true" />{notes.status === "error" ? "Retry save" : "Save now"}</AsyncButton>
      {["conflict", "deleteError"].includes(notes.status) && <button className="cw-button" disabled={notes.busy} onClick={() => confirm("latest")}><RefreshCw size={15} aria-hidden="true" />Load latest notes</button>}
      <button type="button" className="cw-button" disabled={!notes.content.trim()} onClick={() => download(notes.content)}><Download size={15} aria-hidden="true" />Download notes</button>
      <button type="button" className="cw-button cw-danger" data-notes-delete disabled={!notes.loaded || notes.busy || !(notes.content || notes.recovery || notes.revision && !notes.deleted)} onClick={() => confirm("delete")}><Trash2 size={15} aria-hidden="true" />Delete notes</button>
    </div>
    {!notes.localSaved && <p className="learning-device-note" role="status">{notes.deleted ? "Your account notes are deleted, but the browser copy could not be cleared. Clear this site’s storage on this device if you need to remove it." : "A browser backup is unavailable. Keep this tab open until saving completes, or download a copy."}</p>}
    <p id={`${id}-privacy`} className="learning-device-note">Private to you. Saved notes are available from your account on other devices.</p>
    <ConfirmationModal open={Boolean(selected)} title={selected?.[0] || "Your lesson notes"} description={selected?.[1] || ""} confirmLabel={selected?.[2]} danger={["delete", "discard"].includes(confirmation)} busy={notes.busy} busyLabel={confirmation === "delete" ? "Deleting notes" : "Updating notes"} onCancel={() => setConfirmation(null)} onConfirm={async () => {
      if (confirmation === "delete" && !await notes.deleteNote(decisionRevision.current)) return;
      if (confirmation === "latest" && !await notes.loadLatest()) return;
      if (confirmation === "recover" && !notes.useRecovery(decisionRevision.current)) { setConfirmation(null); return; }
      if (confirmation === "discard") notes.discardRecovery();
      setConfirmation(null);
    }}>{notes.error && <p className="qs-confirm-error" role="alert">{notes.error}</p>}</ConfirmationModal>
  </div>;
}
export default function LessonNotes(props) {
  return <NotesEditor key={`${props.userId}/${props.courseId}/${props.lesson.id}`} {...props} />;
}
