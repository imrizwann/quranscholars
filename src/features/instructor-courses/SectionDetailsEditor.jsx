import { useState } from "react";
import { Check, X } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";

export default function SectionDetailsEditor({ section, editing, disabled, saving, onSave, onEditing }) {
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || "");

  function close() { onEditing(false); }
  if (!editing) return section.description ? <div className="cw-section-details"><p className="cw-muted">{section.description}</p></div> : null;

  return <form className="cw-section-editor cw-stack" onSubmit={async (event) => {
    event.preventDefault();
    if (disabled || saving) return;
    if (await onSave({ title: title.trim(), description: description.trim() })) close();
  }}>
    <label>Section title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={150} disabled={disabled} autoFocus /></label>
    <label>Description<textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={2} disabled={disabled} /><span className="cw-field-hint">Optional, up to 300 characters.</span></label>
    <div className="cw-row">
      <AsyncButton type="submit" className="cw-button cw-primary" loading={saving} loadingLabel="Saving section" disabled={disabled || title.trim().length < 3}><Check size={16} aria-hidden="true" />Save section</AsyncButton>
      <button type="button" className="cw-button" disabled={saving} onClick={() => { setTitle(section.title); setDescription(section.description || ""); close(); }}><X size={16} aria-hidden="true" />Cancel</button>
    </div>
  </form>;
}
