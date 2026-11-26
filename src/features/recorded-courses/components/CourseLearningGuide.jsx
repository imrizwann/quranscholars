import { Link } from "react-router-dom";
import { ChevronDown, CirclePlay, Compass, GraduationCap } from "lucide-react";

const steps = [
  { icon: Compass, title: "Find your course", text: "Read what each course covers, see the full lesson outline and meet your teacher." },
  { icon: CirclePlay, title: "Preview before you enroll", text: "Watch the introduction video and any free preview lessons, then enroll when you are ready." },
  { icon: GraduationCap, title: "Learn at your own pace", text: "Follow the lessons in order. Your progress is saved, so you can continue on any device." },
];

const questions = [
  {
    question: "What does a course include?",
    answer: "Every course has its own outline of recorded video lessons. The course page lists what you will learn, any requirements, and the resources your teacher provides.",
  },
  {
    question: "How long can I access a course?",
    answer: <>Access terms can differ between courses, so check the access details on the course page before you enroll. You can also read our <Link to="/course-policy">access and refund policy</Link>.</>,
  },
  {
    question: "Where do I continue learning?",
    answer: <>Open <Link to="/dashboard/learning">My learning</Link> from your account to see your courses and pick up where you left off.</>,
  },
];

// "How courses work" section shown at the end of the course catalogue.
export default function CourseLearningGuide() {
  return (
    <section id="how-courses-work" aria-labelledby="how-courses-title" className="course-guide">
      <div className="courses-shell">
        <div className="course-guide-head">
          <p className="courses-eyebrow">How it works</p>
          <h2 id="how-courses-title">How courses work</h2>
        </div>

        <ol className="course-guide-steps">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title}>
              <div className="course-guide-step-top">
                <span className="course-guide-icon"><Icon size={21} aria-hidden="true" /></span>
                <span className="course-guide-number" aria-hidden="true">0{index + 1}</span>
              </div>
              <h3><span className="sr-only">Step {index + 1}: </span>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <div className="course-guide-faq">
          <h3>Common questions</h3>
          {questions.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
