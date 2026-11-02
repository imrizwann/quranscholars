import { useRef, useState } from "react";
import { CheckCircle2, ClipboardCheck, RotateCcw } from "lucide-react";
import { useGetSectionQuizQuery, useSubmitSectionQuizMutation } from "@/services/api/user/learnerApi.js";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function SectionQuizPanel({ courseId, sectionId, onDone }) {
  const query = useGetSectionQuizQuery({ courseId, sectionId }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  if (query.error || !query.currentData) return <div className="learning-quiz"><QueryMessage query={{ error: query.error, data: query.currentData, loading: query.isFetching, refresh: query.refetch }} label="Checking section quiz access" /></div>;
  return <QuizForm key={query.currentData.version} quiz={query.currentData} courseId={courseId} sectionId={sectionId} onDone={onDone} refreshing={query.isFetching} />;
}
function QuizForm({ quiz, courseId, sectionId, onDone, refreshing }) {
  const [submit, sending] = useSubmitSectionQuizMutation();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const attempt = useRef(null);
  const pending = useRef(false);
  async function finish(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setError(""); setLocked(true);
    attempt.current ||= { idempotencyKey: crypto.randomUUID(), answers: quiz.questions.map(question => ({ questionId: question.id, optionIndex: Number(answers[question.id]) })) };
    try { setResult(await submit({ courseId, sectionId, version: quiz.version, ...attempt.current }).unwrap()); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  if (result || quiz.passed) return <div className="learning-quiz learning-quiz-result" role="status"><CheckCircle2 size={30} aria-hidden="true" /><h2>{(result?.passed ?? quiz.passed) ? "Section quiz passed" : "Keep practicing"}</h2>{result && <p><strong>{result.scorePercent}%</strong> · {result.correctCount} of {quiz.questions.length} correct</p>}<p>{(result?.passed ?? quiz.passed) ? "You’ve completed this section’s knowledge check." : `You need ${quiz.passingPercent}% to pass. Revisit the lessons before trying again.`}</p><div className="cw-row"><button type="button" className="cw-button cw-primary" onClick={onDone}>Back to lessons</button>{result && !result.passed && result.attemptsRemaining > 0 && <button type="button" className="cw-button" onClick={() => { setResult(null); setAnswers({}); setLocked(false); attempt.current = null; }}><RotateCcw size={15} aria-hidden="true" />Try again ({result.attemptsRemaining} left)</button>}</div>{result?.attemptsRemaining === 0 && !result.passed && <p>All five attempts have been used. Contact your instructor for guidance.</p>}</div>;
  return <form className="learning-quiz" onSubmit={finish}>
    <div className="learning-quiz-heading"><ClipboardCheck size={22} aria-hidden="true" /><div><h2>{quiz.title}</h2><p>{quiz.questions.length} questions · {quiz.passingPercent}% to pass · {quiz.attemptsRemaining} attempts remaining</p></div></div>
    {quiz.attemptsRemaining === 0 ? <p>All five attempts have been used. Please contact your instructor for guidance.</p> : <>
      {quiz.questions.map((question, index) => <fieldset key={question.id} disabled={locked || sending.isLoading || refreshing}><legend>{index + 1}. {question.prompt}</legend><div className="learning-quiz-options">{question.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" required name={`question-${question.id}`} value={optionIndex} checked={answers[question.id] === String(optionIndex)} onChange={event => setAnswers(previous => ({ ...previous, [question.id]: event.target.value }))} /><span>{option}</span></label>)}</div></fieldset>)}
      <div className="learning-quiz-actions"><span>{Object.keys(answers).length} of {quiz.questions.length} answered</span><AsyncButton className="cw-button cw-primary" type="submit" loading={sending.isLoading} loadingLabel="Checking answers" disabled={Object.keys(answers).length !== quiz.questions.length || refreshing}>{error ? "Retry submission" : "Submit answers"}</AsyncButton></div>
    </>}
    {error && <p className="cw-error" role="alert">{error} Retry here to check the same submission.</p>}
  </form>;
}
