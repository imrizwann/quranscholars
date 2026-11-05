import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, RotateCcw } from "lucide-react";
import { useGetSectionQuizQuery, useSubmitSectionQuizMutation } from "@/services/api/user/learnerApi.js";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { userMessage } from "@/lib/user-messages.js";

export default function SectionQuizPanel({ courseId, sectionId, onDone }) {
  const query = useGetSectionQuizQuery({ courseId, sectionId }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  if (query.error || !query.currentData) return <div className="learning-quiz"><QueryMessage query={{ error: query.error, data: query.currentData, loading: query.isFetching, refresh: query.refetch }} label="Checking section quiz access" /></div>;
  return <QuizForm key={`${courseId}/${sectionId}/${query.currentData.version}`} quiz={query.currentData} courseId={courseId} sectionId={sectionId} onDone={onDone} refreshing={query.isFetching} />;
}
function QuizForm({ quiz, courseId, sectionId, onDone, refreshing }) {
  const [submit, sending] = useSubmitSectionQuizMutation();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [review, setReview] = useState(false);
  const attempt = useRef(null);
  const pending = useRef(false);
  const heading = useRef(null);
  const focusQuestion = useRef(false);
  const answeredCount = quiz.questions.filter(question => Object.hasOwn(answers, question.id)).length;
  const allAnswered = quiz.questions.length > 0 && answeredCount === quiz.questions.length;
  const blocked = locked || sending.isLoading || refreshing;
  const question = quiz.questions[questionIndex];
  const result = submitted || (!retaking ? quiz.latestAttempt || (quiz.passed ? { passed: true, attemptsRemaining: quiz.attemptsRemaining } : null) : null);
  useEffect(() => {
    if (focusQuestion.current) { heading.current?.focus({ preventScroll: true }); focusQuestion.current = false; }
  }, [questionIndex, review]);
  function goTo(index) {
    if (blocked) return;
    focusQuestion.current = true; setQuestionIndex(index); setReview(false);
  }
  function advance() {
    if (blocked) return;
    if (questionIndex < quiz.questions.length - 1) goTo(questionIndex + 1);
    else { focusQuestion.current = true; setReview(true); }
  }
  async function finish(event) {
    event.preventDefault();
    if (pending.current || result || !review || !allAnswered || quiz.attemptsRemaining === 0 || refreshing) return;
    pending.current = true; setError(""); setLocked(true);
    attempt.current ||= { idempotencyKey: crypto.randomUUID(), answers: quiz.questions.map(question => ({ questionId: question.id, optionIndex: Number(answers[question.id]) })) };
    try { setSubmitted(await submit({ courseId, sectionId, version: quiz.version, ...attempt.current }).unwrap()); setRetaking(false); }
    catch (failure) { setError(userMessage(failure)); }
    finally { pending.current = false; }
  }
  if (result) return <SubmittedQuiz quiz={quiz} result={result} refreshing={refreshing} onDone={onDone} onRetake={() => {
    focusQuestion.current = true; setSubmitted(null); setRetaking(true); setAnswers({}); setError(""); setLocked(false); setQuestionIndex(0); setReview(false); attempt.current = null;
  }} />;
  return <form className="learning-quiz" onSubmit={finish}>
    <div className="learning-quiz-heading"><ClipboardCheck size={22} aria-hidden="true" /><div><h2>{quiz.title}</h2><p>{quiz.questions.length} questions · {quiz.passingPercent}% to pass · {quiz.attemptsRemaining} attempts remaining</p></div><button type="button" className="cw-text-link learning-quiz-exit" disabled={sending.isLoading} onClick={onDone}>{attempt.current || quiz.attemptsRemaining === 0 ? "Back to lessons" : "Skip quiz"}</button></div>
    <p className="learning-quiz-note">Optional knowledge check. You can continue learning without taking or passing this quiz.</p>
    {quiz.attemptsRemaining === 0 ? <p>All five attempts have been used. You can continue learning or ask your instructor for guidance.</p> : !question ? <p>This quiz is being prepared. Please return to your lessons.</p> : <>
      <div className="learning-quiz-progress"><div><span role="status">{review ? "Review your quiz" : `Question ${questionIndex + 1} of ${quiz.questions.length}`}</span><span>{answeredCount} of {quiz.questions.length} answered</span></div><progress value={answeredCount} max={quiz.questions.length} aria-label="Questions answered" /></div>
      {review ? <section className="learning-quiz-review" aria-labelledby="quiz-review-title"><h3 id="quiz-review-title" tabIndex={-1} ref={heading}>Review before submitting</h3><p>{allAnswered ? "Every question is answered. You can review an answer or submit your quiz." : `${quiz.questions.length - answeredCount} ${quiz.questions.length - answeredCount === 1 ? "question still needs an answer" : "questions still need answers"}. Choose a question below to finish.`}</p><div className="learning-quiz-question-list" role="group" aria-label="Review quiz questions">{quiz.questions.map((item, index) => <button type="button" className="cw-button" key={item.id} data-answered={Object.hasOwn(answers, item.id)} aria-label={`Question ${index + 1}: ${Object.hasOwn(answers, item.id) ? "answered" : "not answered"}`} disabled={blocked} onClick={() => goTo(index)}>{index + 1}{Object.hasOwn(answers, item.id) && <CheckCircle2 size={13} aria-hidden="true" />}</button>)}</div></section> : <fieldset className="learning-quiz-question" key={question.id} disabled={blocked}><legend tabIndex={-1} ref={heading}>{question.prompt}</legend><div className="learning-quiz-options">{question.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" name={`question-${question.id}`} value={optionIndex} checked={answers[question.id] === String(optionIndex)} onChange={event => setAnswers(previous => ({ ...previous, [question.id]: event.target.value }))} /><span>{option}</span></label>)}</div>{!Object.hasOwn(answers, question.id) && <button type="button" className="cw-text-link learning-quiz-skip" onClick={advance}>Skip for now</button>}</fieldset>}
      <nav className="learning-quiz-navigation" aria-label="Quiz question navigation"><button type="button" className="cw-button" disabled={blocked || (!review && questionIndex === 0)} onClick={() => goTo(review ? quiz.questions.length - 1 : questionIndex - 1)}><ArrowLeft size={16} aria-hidden="true" />Previous</button>{review ? <AsyncButton className="cw-button cw-primary" type="submit" loading={sending.isLoading} loadingLabel="Checking answers" disabled={!allAnswered || refreshing}>{error ? "Retry submission" : "Submit answers"}</AsyncButton> : <button type="button" className="cw-button cw-primary" disabled={blocked || !Object.hasOwn(answers, question.id)} aria-label={questionIndex === quiz.questions.length - 1 ? "Review answers" : "Next question"} onClick={advance}>{questionIndex === quiz.questions.length - 1 ? "Review" : "Next"}<ArrowRight size={16} aria-hidden="true" /></button>}</nav>
    </>}
    {error && <p className="cw-error" role="alert">{error} Retry here to check the same submission.</p>}
  </form>;
}

function SubmittedQuiz({ quiz, result, refreshing, onDone, onRetake }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const heading = useRef(null);
  const focusQuestion = useRef(false);
  const answers = new Map(result.answers?.map(answer => [answer.questionId, answer.optionIndex]) || []);
  const question = quiz.questions[questionIndex];
  const remaining = Math.min(result.attemptsRemaining, quiz.attemptsRemaining);
  function goTo(index) { focusQuestion.current = true; setQuestionIndex(index); }
  useEffect(() => { if (focusQuestion.current) { heading.current?.focus({ preventScroll: true }); focusQuestion.current = false; } }, [questionIndex]);
  return <div className="learning-quiz learning-quiz-result">
    <div role="status">{result.passed ? <CheckCircle2 size={30} aria-hidden="true" /> : <RotateCcw size={30} aria-hidden="true" />}
      <h2>{result.passed ? "Section quiz passed" : "Keep practicing"}</h2>
      {Number.isFinite(result.scorePercent) && <p><strong>{result.scorePercent}%</strong> · {result.correctCount} of {quiz.questions.length} correct</p>}
      <p>{result.passed ? "You’ve completed this section’s knowledge check." : `The pass mark is ${quiz.passingPercent}%. Revisit the lessons before trying again.`} Your section and course completion are unchanged.</p>
      {!result.passed && quiz.passed && <p>A previous attempt passed. Your passed status is kept.</p>}
      {result.submittedAt && <p>Submitted on <time dateTime={result.submittedAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.submittedAt))}</time></p>}
    </div>
    {question && result.answers?.length > 0 ? <section aria-label="Submitted answers" className="learning-quiz-submitted">
      <div className="learning-quiz-progress"><span>Submitted answer · Question {questionIndex + 1} of {quiz.questions.length}</span></div>
      <fieldset className="learning-quiz-question" key={question.id} disabled><legend tabIndex={-1} ref={heading}>{question.prompt}</legend><div className="learning-quiz-options">{question.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" name={`submitted-${question.id}`} value={optionIndex} checked={answers.get(question.id) === optionIndex} readOnly /><span>{option}</span></label>)}</div></fieldset>
      <nav className="learning-quiz-navigation" aria-label="Submitted question navigation"><button type="button" className="cw-button" disabled={questionIndex === 0} onClick={() => goTo(questionIndex - 1)}><ArrowLeft size={16} aria-hidden="true" />Previous</button><button type="button" className="cw-button" disabled={questionIndex === quiz.questions.length - 1} onClick={() => goTo(questionIndex + 1)}>Next<ArrowRight size={16} aria-hidden="true" /></button></nav>
    </section> : <p>Answer choices aren’t available for this earlier submission. Your saved result is shown above.</p>}
    <div className="cw-row learning-quiz-result-actions"><button type="button" className="cw-button cw-primary" onClick={onDone}>Back to lessons</button>{remaining > 0 && <button type="button" className="cw-button" disabled={refreshing} onClick={onRetake}><RotateCcw size={15} aria-hidden="true" />Retake quiz ({remaining} left)</button>}</div>
    {remaining === 0 && <p>All five attempts have been used. You can continue learning or ask your instructor for guidance.</p>}
  </div>;
}
