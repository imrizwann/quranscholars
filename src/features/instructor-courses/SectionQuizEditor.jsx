import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { QueryMessage } from "./WorkspaceParts.jsx";
import { userMessage } from "@/lib/user-messages.js";
import { validateQuizDraft } from "./quiz-draft.js";
import "./section-quiz.css";

const MAX_QUESTIONS = 20, MAX_OPTIONS = 6;
const letter = index => String.fromCharCode(65 + index);
const question = () => ({ prompt: "", options: ["", "", "", ""], correctOption: 0 });

export default function SectionQuizEditor({ courseId, sectionId, open, onOpenChange, disabled, onEditing, onBusy }) {
  const [dirty, setDirty] = useState(false);
  if (!open) return null;
  return <section className="cw-section-quiz qz" aria-labelledby={`quiz-title-${sectionId}`}>
    <div className="qz-head">
      <span className="qz-head-icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
      <div className="qz-head-copy">
        <h3 id={`quiz-title-${sectionId}`}>Section quiz</h3>
        <p className="cw-field-hint">An optional knowledge check that unlocks after this section’s lessons. Taking or passing it is not required to complete the section or course.</p>
      </div>
      <button type="button" className="cw-button cw-button-compact" disabled={disabled || dirty} onClick={() => onOpenChange(false)}>Close quiz editor<ChevronDown size={15} aria-hidden="true" /></button>
    </div>
    <QuizEditor courseId={courseId} sectionId={sectionId} disabled={disabled} onBusy={onBusy} onEditing={value => { setDirty(value); onEditing(value); }} />
  </section>;
}

function QuizEditor({ courseId, sectionId, disabled, onEditing, onBusy }) {
  const query = api.endpoints.getSectionQuiz.useQuery({ courseId, sectionId }, { refetchOnMountOrArgChange: true });
  if (!query.currentData) return <QueryMessage query={{ error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading section quiz" />;
  // A background read failure must not unmount an instructor's unsaved questions.
  return <><QueryMessage query={{ error: query.error, refresh: query.refetch }} /><QuizFields initial={query.currentData} courseId={courseId} sectionId={sectionId} disabled={disabled} onEditing={onEditing} onBusy={onBusy} /></>;
}

function QuizFields({ initial, courseId, sectionId, disabled, onEditing, onBusy }) {
  const initialDraft = value => ({ ...value, questions: value.questions?.length ? value.questions.map(item => ({ ...item, options: [...item.options] })) : [question()] });
  const [draft, setDraft] = useState(() => initialDraft(initial));
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const errorId = useId(), formId = useId();
  const pending = useRef(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [save, saving] = api.endpoints.saveSectionQuiz.useMutation();
  const editing = useRef(onEditing);
  const baseline = useRef(initial);
  editing.current = onEditing;
  useEffect(() => () => editing.current(false), []);
  function change(update) { setDraft(previous => typeof update === "function" ? update(previous) : { ...previous, ...update }); setError(""); setInvalidField(""); setSaved(false); setDirty(true); onEditing(true); }
  function changeQuestion(index, field, value) { change(previous => ({ ...previous, questions: previous.questions.map((item, i) => i === index ? { ...item, [field]: value } : item) })); }
  function removeOption(index, optionIndex) {
    change(previous => ({ ...previous, questions: previous.questions.map((value, i) => i !== index ? value : { ...value, options: value.options.filter((_, n) => n !== optionIndex), correctOption: value.correctOption === optionIndex ? 0 : value.correctOption > optionIndex ? value.correctOption - 1 : value.correctOption }) }));
  }
  async function submit(event) {
    event.preventDefault(); if (pending.current || saving.isLoading || disabled) return;
    const invalid = validateQuizDraft(draft);
    if (invalid) {
      setError(invalid.message); setInvalidField(invalid.field);
      event.currentTarget.elements.namedItem(invalid.field)?.focus();
      return;
    }
    pending.current = true;
    onBusy(true); setError("");
    try {
      const quiz = { version: draft.version, title: draft.title, passingPercent: Number(draft.passingPercent), published: draft.published, questions: draft.questions.map(item => ({ prompt: item.prompt, options: item.options, correctOption: Number(item.correctOption) })) };
      const result = await save({ courseId, sectionId, quiz }).unwrap();
      baseline.current = result; setDraft(initialDraft(result)); setDirty(false); onEditing(false); setSaved(true);
    } catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; onBusy(false); }
  }
  function cancel() { baseline.current = initial; setDraft(initialDraft(initial)); setError(""); setInvalidField(""); setSaved(false); setDirty(false); onEditing(false); }
  const blocked = disabled || saving.isLoading;
  const inputError = name => ({ "aria-invalid": invalidField === name || undefined, "aria-describedby": invalidField === name ? errorId : undefined });
  const live = baseline.current.published;

  return <form id={formId} className="cw-quiz-form qz-form" onSubmit={submit} noValidate>
    <div className="qz-summary">
      <span className="qz-badge" data-state={live ? "published" : "draft"}>{live ? "Published" : "Draft"}</span>
      <span>{draft.questions.length} {draft.questions.length === 1 ? "question" : "questions"}</span>
      <span aria-hidden="true">·</span>
      <span>Pass mark {draft.passingPercent || "-"}%</span>
    </div>
    <p className={live ? "cw-notice" : "cw-field-hint qz-visibility"} role="status">{live ? "Published quiz. Enrolled learners can find it in their learning path." : "Draft quiz - hidden from learners. Select Publish quiz and save when it is ready. Publishing the course does not publish draft quizzes."}</p>
    {error && <p id={errorId} className="cw-error" role="alert">{error}</p>}

    <fieldset className="qz-settings" disabled={blocked}>
      <legend className="sr-only">Quiz settings</legend>
      <label className="qz-title">Quiz title<input name="title" {...inputError("title")} required minLength={3} maxLength={150} value={draft.title} onChange={event => change({ title: event.target.value })} /></label>
      <label className="qz-pass">Pass mark (%)<input name="passingPercent" {...inputError("passingPercent")} type="number" inputMode="numeric" required min={1} max={100} step={1} value={draft.passingPercent} onChange={event => change({ passingPercent: event.target.value })} /></label>
      <label className="cw-quiz-checkbox qz-switch">
        <input name="published" type="checkbox" role="switch" checked={draft.published} onChange={event => change({ published: event.target.checked })} />
        <span className="qz-switch-track" aria-hidden="true" />
        <span><strong>Publish quiz to enrolled learners</strong><small>{draft.published ? "Learners will see it after this section’s lessons." : "Hidden from learners while it is a draft."}</small></span>
      </label>
    </fieldset>

    <ol className="qz-questions">
      {draft.questions.map((item, index) => <li key={index}>
        <fieldset className="cw-quiz-question qz-question" disabled={blocked}>
          <legend className="sr-only">Question {index + 1}</legend>
          <div className="qz-question-head">
            <span className="qz-number" aria-hidden="true">{index + 1}</span>
            <label className="qz-prompt">Question {index + 1}<input name={`questions[${index}][prompt]`} {...inputError(`questions[${index}][prompt]`)} required minLength={3} maxLength={1000} value={item.prompt} placeholder="Type the question learners will answer" onChange={event => changeQuestion(index, "prompt", event.target.value)} /></label>
            {draft.questions.length > 1 && <button type="button" className="cw-button cw-danger cw-icon-button" aria-label={`Remove question ${index + 1}`} title="Remove question" onClick={() => change(previous => ({ ...previous, questions: previous.questions.filter((_, i) => i !== index) }))}><Trash2 size={15} aria-hidden="true" /></button>}
          </div>
          <div className="qz-options" role="group" aria-label={`Answer options for question ${index + 1}`}>
            <p className="qz-options-hint">Answer options · select the correct one</p>
            {item.options.map((option, optionIndex) => {
              const correct = Number(item.correctOption) === optionIndex;
              return <div className="cw-quiz-option qz-option" data-correct={correct || undefined} key={optionIndex}>
                <label className="qz-correct" title="Mark as the correct answer">
                  <input type="radio" name={`questions[${index}][correct]`} checked={correct} onChange={() => changeQuestion(index, "correctOption", optionIndex)} aria-label={`Option ${letter(optionIndex)} is the correct answer for question ${index + 1}`} />
                  <span aria-hidden="true">{correct ? <Check size={13} strokeWidth={3} /> : null}</span>
                </label>
                <span className="qz-letter" aria-hidden="true">{letter(optionIndex)}</span>
                <label className="qz-option-input"><span className="sr-only">Option {optionIndex + 1}</span><input name={`questions[${index}][options][${optionIndex}]`} {...inputError(`questions[${index}][options][${optionIndex}]`)} required maxLength={400} value={option} placeholder={`Option ${letter(optionIndex)}`} onChange={event => changeQuestion(index, "options", item.options.map((value, i) => i === optionIndex ? event.target.value : value))} /></label>
                {correct && <span className="qz-correct-tag">Correct</span>}
                {item.options.length > 2 && <button type="button" className="cw-button cw-icon-button cw-danger qz-remove-option" aria-label={`Remove option ${optionIndex + 1} from question ${index + 1}`} title="Remove option" onClick={() => removeOption(index, optionIndex)}><Trash2 size={15} aria-hidden="true" /></button>}
              </div>;
            })}
            <button type="button" className="cw-button cw-button-compact qz-add-option" disabled={blocked || item.options.length >= MAX_OPTIONS} onClick={() => changeQuestion(index, "options", [...item.options, ""])}><Plus size={15} aria-hidden="true" />Add option</button>
          </div>
        </fieldset>
      </li>)}
    </ol>

    <div className="qz-add-question">
      <button type="button" className="cw-button" disabled={blocked || draft.questions.length >= MAX_QUESTIONS} onClick={() => change(previous => ({ ...previous, questions: [...previous.questions, question()] }))}><Plus size={15} aria-hidden="true" />Add question</button>
      <span className="cw-field-hint">{draft.questions.length} of {MAX_QUESTIONS} questions. One correct answer per question, 2 to {MAX_OPTIONS} options.</span>
    </div>

    {saved && <p className="cw-notice" role="status">{draft.published ? "Quiz published. It unlocks after the section’s lessons and does not affect course completion." : "Draft saved. This quiz is not visible to learners."}</p>}
    <div className="qz-savebar">
      <p className="qz-save-state" data-dirty={dirty || undefined}>{dirty ? "Unsaved changes" : "All changes saved"}<small>Saving quiz changes gives learners five fresh attempts. Their lesson progress is kept.</small></p>
      <div className="qz-save-actions">
        <button type="button" className="cw-button" disabled={blocked || !dirty} onClick={cancel}>Cancel changes</button>
        <AsyncButton type="submit" className="cw-button cw-primary" loading={saving.isLoading} loadingLabel="Saving quiz" disabled={blocked || !dirty}>{draft.published ? "Save and publish quiz" : "Save draft"}</AsyncButton>
      </div>
    </div>
  </form>;
}
