import { useEffect, useRef, useState } from "react";
import { ChevronDown, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import SelectField from "@/components/ui/SelectField.jsx";
import { QueryMessage } from "./WorkspaceParts.jsx";
import { userMessage } from "@/lib/user-messages.js";

const question = () => ({ prompt: "", options: ["", "", "", ""], correctOption: 0 });
export default function SectionQuizEditor({ courseId, sectionId, open, onOpenChange, disabled, onEditing, onBusy }) {
  const [dirty, setDirty] = useState(false);
  if (!open) return null;
  return <section className="cw-section-quiz"><div className="cw-row cw-between"><div className="cw-row"><ClipboardCheck size={18} aria-hidden="true" /><h3>Section quiz</h3></div><button type="button" className="cw-button cw-button-compact" disabled={disabled || dirty} onClick={() => onOpenChange(false)}>Close quiz editor<ChevronDown size={15} aria-hidden="true" /></button></div><p className="cw-field-hint">Add a knowledge check. Learners unlock it after completing every lesson in this section.</p><QuizEditor courseId={courseId} sectionId={sectionId} disabled={disabled} onBusy={onBusy} onEditing={value => { setDirty(value); onEditing(value); }} /></section>;
}
function QuizEditor({ courseId, sectionId, disabled, onEditing, onBusy }) {
  const query = api.endpoints.getSectionQuiz.useQuery({ courseId, sectionId }, { refetchOnMountOrArgChange: true });
  if (!query.currentData || query.error) return <QueryMessage query={{ data: query.currentData, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading section quiz" />;
  return <QuizFields initial={query.currentData} courseId={courseId} sectionId={sectionId} disabled={disabled} onEditing={onEditing} onBusy={onBusy} />;
}
function QuizFields({ initial, courseId, sectionId, disabled, onEditing, onBusy }) {
  const initialDraft = value => ({ ...value, questions: value.questions.length ? value.questions.map(item => ({ ...item, options: [...item.options] })) : [question()] });
  const [draft, setDraft] = useState(() => initialDraft(initial));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [save, saving] = api.endpoints.saveSectionQuiz.useMutation();
  const editing = useRef(onEditing);
  const baseline = useRef(initial);
  editing.current = onEditing;
  useEffect(() => () => editing.current(false), []);
  function change(update) { setDraft(previous => typeof update === "function" ? update(previous) : { ...previous, ...update }); setSaved(false); setDirty(true); onEditing(true); }
  function changeQuestion(index, field, value) { change(previous => ({ ...previous, questions: previous.questions.map((item, i) => i === index ? { ...item, [field]: value } : item) })); }
  async function submit(event) {
    event.preventDefault(); if (saving.isLoading || disabled) return;
    onBusy(true); setError("");
    try {
      const quiz = { version: draft.version, title: draft.title, passingPercent: Number(draft.passingPercent), published: draft.published, questions: draft.questions.map(item => ({ prompt: item.prompt, options: item.options, correctOption: Number(item.correctOption) })) };
      const result = await save({ courseId, sectionId, quiz }).unwrap();
      baseline.current = result; setDraft(initialDraft(result)); setDirty(false); onEditing(false); setSaved(true);
    } catch (failure) { setError(userMessage(failure)); }
    finally { onBusy(false); }
  }
  const blocked = disabled || saving.isLoading;
  return <form className="cw-quiz-form cw-stack" onSubmit={submit}>
    <label>Quiz title<input name="title" required minLength={3} maxLength={150} value={draft.title} disabled={blocked} onChange={event => change({ title: event.target.value })} /></label>
    <div className="cw-quiz-settings"><label>Pass mark (%)<input name="passingPercent" type="number" required min={1} max={100} step={1} value={draft.passingPercent} disabled={blocked} onChange={event => change({ passingPercent: event.target.value })} /></label><label className="cw-quiz-checkbox"><input name="published" type="checkbox" checked={draft.published} disabled={blocked} onChange={event => change({ published: event.target.checked })} /><span>Make quiz available after section completion</span></label></div>
    {draft.questions.map((item, index) => <fieldset className="cw-quiz-question" key={index} disabled={blocked}><legend>Question {index + 1}</legend><div className="cw-row cw-between"><label>Question<input name={`questions[${index}][prompt]`} required minLength={3} maxLength={1000} value={item.prompt} onChange={event => changeQuestion(index, "prompt", event.target.value)} /></label>{draft.questions.length > 1 && <button type="button" className="cw-button cw-danger cw-icon-button" aria-label={`Remove question ${index + 1}`} onClick={() => change(previous => ({ ...previous, questions: previous.questions.filter((_, i) => i !== index) }))}><Trash2 size={15} aria-hidden="true" /></button>}</div><div className="cw-quiz-options">{item.options.map((option, optionIndex) => <label key={optionIndex}>Option {optionIndex + 1}<input name={`questions[${index}][options][${optionIndex}]`} required maxLength={400} value={option} onChange={event => changeQuestion(index, "options", item.options.map((value, i) => i === optionIndex ? event.target.value : value))} /></label>)}</div><SelectField label="Correct answer" value={String(item.correctOption)} onChange={value => changeQuestion(index, "correctOption", Number(value))} options={item.options.map((_, i) => ({ value: String(i), label: `Option ${i + 1}` }))} disabled={blocked} required /></fieldset>)}
    <div className="cw-row"><button type="button" className="cw-button" disabled={blocked || draft.questions.length >= 20} onClick={() => change(previous => ({ ...previous, questions: [...previous.questions, question()] }))}><Plus size={15} aria-hidden="true" />Add question</button><span className="cw-field-hint">Up to 20 questions. One correct answer per question.</span></div>
    {error && <p className="cw-error" role="alert">{error}</p>}{saved && <p className="cw-notice" role="status">{draft.published ? "Quiz saved. It will unlock after learners complete this section." : "Quiz saved as a draft."}</p>}
    <div className="cw-row"><AsyncButton type="submit" className="cw-button cw-primary" loading={saving.isLoading} loadingLabel="Saving quiz" disabled={blocked || !dirty}>Save quiz</AsyncButton><button type="button" className="cw-button" disabled={blocked} onClick={() => { setDraft(initialDraft(baseline.current)); setError(""); setSaved(false); setDirty(false); onEditing(false); }}>Cancel changes</button></div><p className="cw-field-hint">Saving quiz changes starts a new version with five attempts per learner.</p>
  </form>;
}
