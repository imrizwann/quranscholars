import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";

export default function SectionDetailsEditor({ section, disabled, saving, onSave, onEditing }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || "");

  function close() { setEditing(false); onEditing(false); }
  if (!editing) return <div className="cw-section-details cw-row cw-between">
    <p className="cw-muted">{section.description || "Add a description to introduce this section."}</p>
    <button type="button" className="cw-button cw-button-compact" disabled={disabled} onClick={() => {
      setTitle(section.title); setDescription(section.description || ""); setEditing(true); onEditing(true);
    }}><Pencil size={15} aria-hidden="true" />Edit section</button>
  </div>;

  return <form className="cw-section-editor cw-stack" onSubmit={async (event) => {
    event.preventDefault();
    if (disabled || saving) return;
    if (await onSave({ title: title.trim(), description: description.trim() })) close();
  }}>
    <label>Section title<input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={150} disabled={disabled} autoFocus /></label>
    <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={2} disabled={disabled} /><span className="cw-field-hint">Optional, up to 300 characters.</span></label>
    <div className="cw-row">
      <AsyncButton type="submit" className="cw-button cw-primary" loading={saving} loadingLabel="Saving section" disabled={disabled || title.trim().length < 3}><Check size={16} aria-hidden="true" />Save section</AsyncButton>
      <button type="button" className="cw-button" disabled={saving} onClick={close}><X size={16} aria-hidden="true" />Cancel</button>
    </div>
  </form>;
}
