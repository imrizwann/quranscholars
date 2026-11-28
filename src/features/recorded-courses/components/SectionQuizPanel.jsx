import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCheck, Info, RotateCcw, X } from "lucide-react";
import { useGetSectionQuizQuery, useSubmitSectionQuizMutation } from "@/services/api/user/learnerApi.js";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "./section-quiz-panel.css";

const letter = index => String.fromCharCode(65 + index);
const MAX_ATTEMPTS = 5;
const ATTEMPTS_USED_UP = "All five attempts have been used. You can continue learning or ask your instructor for guidance.";

export default function SectionQuizPanel({ courseId, sectionId, onDone }) {
  const query = useGetSectionQuizQuery({ courseId, sectionId }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  if (query.error || !query.currentData) return <div className="learning-quiz"><QueryMessage query={{ error: query.error, data: query.currentData, loading: query.isFetching, refresh: query.refetch }} label="Checking section quiz access" /></div>;
  return <QuizForm key={`${courseId}/${sectionId}/${query.currentData.version}`} quiz={query.currentData} courseId={courseId} sectionId={sectionId} onDone={onDone} refreshing={query.isFetching} />;
}

function QuizHeader({ quiz, exit }) {
  return <div className="learning-quiz-heading">
    <span className="learning-quiz-heading-icon" aria-hidden="true"><ClipboardCheck size={20} /></span>
    <div>
      <h2>{quiz.title}</h2>
      <ul className="learning-quiz-facts" aria-label="Quiz details">
        <li>{quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}</li>
        <li>Pass mark {quiz.passingPercent}%</li>
        <li>{quiz.attemptsRemaining} {quiz.attemptsRemaining === 1 ? "attempt" : "attempts"} left</li>
        <li>Optional</li>
      </ul>
    </div>
    {exit}
  </div>;
}

/** Taking the quiz: one question at a time. Next unlocks once the question is answered. */
function QuizForm({ quiz, courseId, sectionId, onDone, refreshing }) {
  const [submit, sending] = useSubmitSectionQuizMutation();
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(null);
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const attempt = useRef(null);
  const pending = useRef(false);
  const heading = useRef(null);
  const moved = useRef(false);
  const total = quiz.questions.length;
  const question = quiz.questions[index];
  const isAnswered = item => Object.hasOwn(answers, item.id);
  const answeredCount = quiz.questions.filter(isAnswered).length;
  const firstOpen = quiz.questions.findIndex(item => !isAnswered(item));
  // A learner may revisit any answered question or the next open one, never skip ahead.
  const reachable = firstOpen === -1 ? total - 1 : firstOpen;
  const last = index === total - 1;
  const blocked = locked || sending.isLoading || refreshing;
  const result = submitted || (!retaking ? quiz.latestAttempt || (quiz.passed ? { passed: true, attemptsRemaining: quiz.attemptsRemaining } : null) : null);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    heading.current?.focus({ preventScroll: true });
  }, [index, retaking]);
  function goTo(next) {
    if (blocked || next < 0 || next >= total) return;
    moved.current = true; setIndex(next);
  }
  async function finish(event) {
    event.preventDefault();
    if (pending.current || result || quiz.attemptsRemaining === 0 || refreshing || !total) return;
    if (firstOpen >= 0) { if (firstOpen !== index) goTo(firstOpen); return; }
    pending.current = true; setError(""); setLocked(true);
    attempt.current ||= { idempotencyKey: crypto.randomUUID(), answers: quiz.questions.map(item => ({ questionId: item.id, optionIndex: Number(answers[item.id]) })) };
    try { setSubmitted(await submit({ courseId, sectionId, version: quiz.version, ...attempt.current }).unwrap()); setRetaking(false); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  if (result) return <SubmittedQuiz quiz={quiz} result={result} refreshing={refreshing} onDone={onDone} onRetake={() => {
    moved.current = true; setSubmitted(null); setRetaking(true); setAnswers({}); setIndex(0); setError(""); setLocked(false); attempt.current = null;
  }} />;
  const exit = <button type="button" className="cw-button cw-button-compact learning-quiz-exit" disabled={sending.isLoading} onClick={onDone}>{attempt.current || quiz.attemptsRemaining === 0 ? "Back to lessons" : "Skip quiz"}</button>;
  return <form className="learning-quiz" onSubmit={finish} noValidate>
    <QuizHeader quiz={quiz} exit={exit} />
    <p className="learning-quiz-note">Optional knowledge check. You can continue learning without taking or passing this quiz.</p>
    {quiz.attemptsRemaining === 0 ? <p className="learning-quiz-message">{ATTEMPTS_USED_UP}</p> : !question ? <p className="learning-quiz-message">This quiz is being prepared. Please return to your lessons.</p> : <>
      <div className="learning-quiz-track">
        <div className="learning-quiz-track-label"><span role="status">Question {index + 1} of {total}</span><span>{answeredCount} of {total} answered</span></div>
        <ol className="learning-quiz-steps" aria-label="Quiz questions">{quiz.questions.map((item, stepIndex) => {
          const done = isAnswered(item);
          return <li key={item.id}><button type="button" data-state={stepIndex === index ? "current" : done ? "answered" : "todo"} aria-current={stepIndex === index ? "step" : undefined} aria-label={`Question ${stepIndex + 1}${done ? ", answered" : ""}`} disabled={blocked || stepIndex > reachable} onClick={() => goTo(stepIndex)}>{done && stepIndex !== index ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : stepIndex + 1}</button></li>;
        })}</ol>
      </div>
      <fieldset className="learning-quiz-question" key={question.id} disabled={blocked}>
        <legend tabIndex={-1} ref={heading}><span className="learning-quiz-number">Question {index + 1}</span><span className="learning-quiz-prompt">{question.prompt}</span></legend>
        <div className="learning-quiz-options">{question.options.map((option, optionIndex) => <label key={optionIndex}>
          <input type="radio" name={`question-${question.id}`} value={optionIndex} checked={answers[question.id] === String(optionIndex)} onChange={event => setAnswers(previous => ({ ...previous, [question.id]: event.target.value }))} />
          <span className="learning-quiz-letter" aria-hidden="true">{letter(optionIndex)}</span>
          <span>{option}</span>
        </label>)}</div>
      </fieldset>
      <nav className="learning-quiz-navigation" aria-label="Quiz navigation">
        <button type="button" className="cw-button" disabled={blocked || index === 0} onClick={() => goTo(index - 1)}><ArrowLeft size={16} aria-hidden="true" />Back</button>
        {!isAnswered(question) && <span className="learning-quiz-hint">Choose an answer to continue</span>}
        {last
          ? <AsyncButton className="cw-button cw-primary" type="submit" loading={sending.isLoading} loadingLabel="Checking answers" disabled={sending.isLoading || refreshing || answeredCount < total}>{error ? "Retry submission" : "Submit answers"}</AsyncButton>
          : <button type="button" className="cw-button cw-primary" disabled={blocked || !isAnswered(question)} onClick={() => goTo(index + 1)}>Next question<ArrowRight size={16} aria-hidden="true" /></button>}
      </nav>
    </>}
    {error && <p className="cw-error" role="alert">{error} Retry here to check the same submission.</p>}
  </form>;
}

/** After submitting: the score, then every question marked correct or incorrect. */
function SubmittedQuiz({ quiz, result, refreshing, onDone, onRetake }) {
  const answers = new Map(result.answers?.map(answer => [answer.questionId, answer.optionIndex]) || []);
  const feedback = new Map(result.results?.map(item => [item.questionId, item]) || []);
  const remaining = Math.min(result.attemptsRemaining, quiz.attemptsRemaining);
  const total = quiz.questions.length;
  const marked = feedback.size > 0;
  const incorrect = marked ? [...feedback.values()].filter(item => !item.correct).length : null;
  const answersHidden = marked && [...feedback.values()].some(item => !item.correct && item.correctOption === undefined);
  return <div className="learning-quiz learning-quiz-result">
    <div role="status" className="learning-quiz-score" data-passed={result.passed || undefined}>
      {Number.isFinite(result.scorePercent) ? <span className="learning-quiz-score-value">{result.scorePercent}%</span> : <span className="learning-quiz-score-icon" aria-hidden="true">{result.passed ? <CheckCircle2 size={28} /> : <RotateCcw size={26} />}</span>}
      <div>
        <h2>{result.passed ? "Section quiz passed" : "Keep practicing"}</h2>
        {Number.isFinite(result.correctCount) && <p className="learning-quiz-tally">
          {incorrect !== null
            ? <><span data-tone="correct"><Check size={14} strokeWidth={3} aria-hidden="true" />{result.correctCount} correct</span><span data-tone="incorrect"><X size={14} strokeWidth={3} aria-hidden="true" />{incorrect} incorrect</span></>
            : <span>{result.correctCount} of {total} correct</span>}
          <span>Pass mark {quiz.passingPercent}%</span>
        </p>}
        <p>{result.passed ? "You’ve completed this section’s knowledge check." : "Review the questions marked incorrect and revisit the lessons before trying again."} Your section and course completion are unchanged.</p>
        {!result.passed && quiz.passed && <p>A previous attempt passed. Your passed status is kept.</p>}
        {result.submittedAt && <p className="learning-quiz-time">Submitted on <time dateTime={result.submittedAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.submittedAt))}</time></p>}
      </div>
    </div>
    <div className="learning-quiz-result-actions">
      {remaining > 0 && <button type="button" className="cw-button cw-primary" disabled={refreshing} onClick={onRetake}><RotateCcw size={15} aria-hidden="true" />Retake quiz ({remaining} left)</button>}
      <button type="button" className={`cw-button${remaining > 0 ? "" : " cw-primary"}`} onClick={onDone}>Back to lessons</button>
    </div>
    {remaining === 0 && <p className="learning-quiz-message">{ATTEMPTS_USED_UP}</p>}
    {total > 0 && result.answers?.length > 0 ? <section className="learning-quiz-answers" aria-label="Submitted answers">
      <h3>Your answers</h3>
      {answersHidden && <p className="learning-quiz-reveal"><Info size={15} aria-hidden="true" />Correct answers are shown once you pass or have used all {MAX_ATTEMPTS} attempts, so a retake still tests what you’ve learned.</p>}
      <ol className="learning-quiz-list">{quiz.questions.map((question, index) => {
        const chosen = answers.get(question.id);
        const outcome = feedback.get(question.id);
        const verdict = outcome ? (outcome.correct ? "correct" : "incorrect") : undefined;
        return <li key={question.id}>
          <fieldset className="learning-quiz-question" data-result={verdict} disabled>
            <legend>
              <span className="learning-quiz-review-head">
                <span className="learning-quiz-number">Question {index + 1} of {total}</span>
                {verdict && <span className="learning-quiz-verdict" data-tone={verdict}>{verdict === "correct" ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : <X size={13} strokeWidth={3} aria-hidden="true" />}{verdict === "correct" ? "Correct" : "Incorrect"}</span>}
              </span>
              <span className="learning-quiz-prompt">{question.prompt}</span>
            </legend>
            <div className="learning-quiz-options">{question.options.map((option, optionIndex) => {
              const mine = chosen === optionIndex;
              const rightAnswer = !mine && outcome?.correctOption === optionIndex && !outcome.correct;
              const tone = mine ? verdict || "chosen" : rightAnswer ? "correct" : undefined;
              const mark = mine && verdict ? (verdict === "correct" ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />) : rightAnswer ? <Check size={14} strokeWidth={3} /> : letter(optionIndex);
              return <label key={optionIndex} data-tone={tone}>
                <input type="radio" name={`submitted-${question.id}`} value={optionIndex} checked={mine} readOnly />
                <span className="learning-quiz-letter" aria-hidden="true">{mark}</span>
                <span>{option}</span>
                {mine && <span className="learning-quiz-chosen">Your answer</span>}
                {rightAnswer && <span className="learning-quiz-chosen">Correct answer</span>}
              </label>;
            })}</div>
          </fieldset>
        </li>;
      })}</ol>
    </section> : <p className="learning-quiz-message">Answer choices aren’t available for this earlier submission. Your saved result is shown above.</p>}
  </div>;
}
