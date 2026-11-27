import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronRight,
  ChevronDown,
  FileCheck2,
  MonitorPlay,
  Presentation,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { useGetMyInstructorApplicationQuery } from "@/services/api/user/instructorApplicationApi.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "./onboarding.css";

const applicationReturn = { from: "/instructor/application" };

function Breadcrumb({ trail }) {
  return (
    <nav className="start-breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {trail.map(({ to, label }) => (
        <span key={label} className="start-breadcrumb-item">
          <ChevronRight size={14} aria-hidden="true" />
          {to ? <Link to={to}>{label}</Link> : <span aria-current="page">{label}</span>}
        </span>
      ))}
    </nav>
  );
}

/* ==========================================================================
   /get-started - choose to learn or to teach
   ========================================================================== */

export default function GetStarted() {
  const user = useSelector((state) => state.user.user);
  const instructor = user?.role === "instructor";
  const admin = user?.role === "admin";
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const paths = [
    {
      key: "learn",
      eyebrow: "For learners",
      title: "I want to learn",
      description: "Find a course, preview its lessons and teacher, and enroll when you are ready.",
      icon: BookOpenCheck,
      points: [
        "Preview every course before you enroll",
        "Learn through short, structured video lessons",
        "Your courses and progress stay in My learning",
      ],
      primary: user ? { to: "/dashboard/learning", label: "Open My learning" } : { to: "/courses", label: "Explore courses" },
      secondary: user ? { to: "/courses", label: "Explore courses" } : { to: "/register", label: "Create a free account" },
    },
    {
      key: "teach",
      eyebrow: admin ? "For administrators" : "For teachers",
      title: admin ? "Support our instructors" : instructor ? "Continue teaching" : "I want to teach",
      description: admin
        ? "Review teaching applications and supporting qualifications."
        : instructor
          ? "Open your teaching workspace to build courses and support your learners."
          : "Apply with your teaching background and qualifications, then create courses after approval.",
      icon: Presentation,
      points: admin
        ? ["Review instructor applications", "Access certificates securely", "Approve eligible instructors"]
        : ["One account for learning and teaching", "A clear application and review process", "Build courses with lessons, resources and quizzes"],
      primary: admin
        ? { to: "/admin/instructor-applications", label: "Review applications" }
        : instructor
          ? { to: "/instructor/courses", label: "Open Course Studio" }
          : { to: "/get-started/instructor", label: "Explore teaching" },
    },
  ];

  const learnerSteps = [
    { icon: UserRoundPlus, title: "Create a free account", text: "Sign up in a minute. Your account is free; you only pay for the courses you choose." },
    { icon: BookOpen, title: "Choose your course", text: "Read the outline, meet your teacher and watch the preview." },
    { icon: MonitorPlay, title: "Learn at your own pace", text: "Watch short lessons. Your progress is saved on every device." },
  ];

  return (
    <main className="start-page">
      <section className="start-hero" aria-labelledby="start-title">
        <span className="start-hero-pattern" aria-hidden="true" />
        <div className="start-shell">
          <Breadcrumb trail={[{ label: "Get started" }]} />
          <h1 id="start-title">{firstName ? `Welcome back, ${firstName}.` : "How would you like to start?"}</h1>
          <p className="start-lead">Learn something new, or share what you know with others. One DarsLearn account works for both.</p>
        </div>
      </section>

      <section className="start-section" aria-label="Choose how to start">
        <div className="start-shell start-paths">
          {paths.map(({ key, eyebrow, title, description, icon: Icon, points, primary, secondary }) => (
            <article key={key} className="start-path" data-path={key}>
              <div className="start-path-head">
                <span className="start-path-icon"><Icon size={24} aria-hidden="true" /></span>
                <p className="start-eyebrow">{eyebrow}</p>
              </div>
              <h2>{title}</h2>
              <p className="start-path-text">{description}</p>
              <ul className="start-points">
                {points.map((point) => <li key={point}><Check size={16} strokeWidth={2.5} aria-hidden="true" />{point}</li>)}
              </ul>
              <div className="start-actions">
                <Link to={primary.to} className="start-btn start-btn--primary">{primary.label}<ArrowRight size={16} aria-hidden="true" /></Link>
                {secondary && <Link to={secondary.to} className="start-btn">{secondary.label}</Link>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {!user && (
        <section className="start-section start-section--soft" aria-labelledby="start-how-title">
          <div className="start-shell">
            <p className="start-eyebrow">New here?</p>
            <h2 id="start-how-title" className="start-section-title">How learning on DarsLearn works</h2>
            <ol className="start-steps">
              {learnerSteps.map(({ icon: Icon, title, text }, index) => (
                <li key={title}>
                  <span className="start-step-number" aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3><Icon size={18} aria-hidden="true" />{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}

// Retain existing bookmarks without adding an extra step before the catalogue.
export function StudentStart() {
  return <Navigate to="/courses" replace />;
}

/* ==========================================================================
   /get-started/instructor - how teaching works and the application status
   ========================================================================== */

const statusBadges = {
  pending: { label: "Under review", tone: "pending" },
  approved: { label: "Approved", tone: "approved" },
  rejected: { label: "Changes requested", tone: "rejected" },
};

// Answers taken from the application form and teaching workspace. Keep them in sync.
// Requirements and the review process are covered by the steps, so they are not repeated here.
const teacherQuestions = [
  {
    question: "Who can apply to teach?",
    answer: "Anyone with a DarsLearn account who has experience teaching their subject and at least one certificate that supports it.",
  },
  {
    question: "How do I get paid?",
    answer: "You set the price of your course. Your dashboard shows your sales and earnings, and payouts are made monthly by bank transfer.",
  },
  {
    question: "Which subjects are you looking for?",
    answer: "We are starting with Quran recitation and preparing courses in computer science, English, mathematics and science.",
  },
  {
    question: "Can I keep learning while I apply?",
    answer: "Yes. You use the same account for learning and teaching, so your courses and progress stay where they are.",
  },
];

export function InstructorStart() {
  const user = useSelector((state) => state.user.user);
  const instructor = user?.role === "instructor";
  const admin = user?.role === "admin";
  const eligible = user?.role === "user";
  const query = useGetMyInstructorApplicationQuery(undefined, {
    skip: !eligible,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const application = query.currentData?.application;
  let entry = {
    title: "Ready to introduce yourself?",
    text: "Prepare your teaching background and at least one certificate. Your application is reviewed before instructor access is granted.",
    label: "Start instructor application",
    to: "/instructor/application",
  };
  if (instructor)
    entry = {
      title: "Your teaching workspace is ready",
      text: "Create and manage courses, organize lessons, and follow your video preparation in Course Studio.",
      label: "Open Course Studio",
      to: "/instructor/courses",
    };
  else if (admin)
    entry = {
      title: "Manage instructor applications",
      text: "Review submitted teaching backgrounds and certificates before approving instructor access.",
      label: "Review applications",
      to: "/admin/instructor-applications",
    };
  else if (!user)
    entry = {
      title: "One account for learning and teaching",
      text: "Create an account or log in to submit your instructor application. Use the same account for your courses and teaching application.",
      label: "Create an account to apply",
      to: "/register",
      state: applicationReturn,
    };
  else if (query.isLoading)
    entry = {
      title: "Checking your application",
      text: "Loading your latest application status before showing the next step.",
      label: "Open application",
      to: "/instructor/application",
    };
  else if (query.isError)
    entry = {
      title: "Check your instructor application",
      text: "Open your application or retry the status check below.",
      label: "Open application",
      to: "/instructor/application",
    };
  else if (query.currentData?.submissionInProgress)
    entry = {
      title: "Your submission is in progress",
      text: "Open your application to check the current submission before trying again.",
      label: "Check submission",
      to: "/instructor/application",
    };
  else if (application)
    entry = {
      title:
        {
          pending: "Your application is under review",
          approved: "Your application has been approved",
          rejected: "You can revise your application",
        }[application.status] || "Your instructor application",
      text:
        application.status === "pending"
          ? "You can keep learning while the team reviews your qualifications. Check your application for updates."
          : application.status === "rejected"
            ? "Read the team's feedback, update your teaching details or certificates, and submit again for review."
            : "Open your application to see the decision and any feedback from the team.",
      label:
        application.status === "rejected"
          ? "Review and revise application"
          : "View application status",
      to: "/instructor/application",
    };
  else if (query.currentData && !query.currentData.submissionEnabled)
    entry = {
      title: "Applications are temporarily unavailable",
      text: "Please check back later or contact our team about teaching opportunities.",
      label: "Contact the team",
      to: "/contact",
    };

  const badge = !instructor && !admin && application ? statusBadges[application.status] : null;

  const steps = instructor
    ? [
        { title: "Create your course", text: "Set the course details, outcomes, and pricing.", icon: Presentation },
        { title: "Build your lessons", text: "Add sections, lessons, and prepared course videos.", icon: BookOpenCheck },
        { title: "Review and publish", text: "Complete the course readiness checks before publishing.", icon: FileCheck2 },
      ]
    : [
        { title: "Apply", text: "Share your subjects, experience, teaching languages and a short bio, with 1 to 3 certificates (PDF, JPG, PNG or WebP, up to 5 MB each). Documents are stored privately.", icon: Presentation },
        { title: "Get reviewed", text: "Our team reviews your application. If changes are needed, you will get feedback and can submit again.", icon: ShieldCheck },
        { title: "Build and publish", text: "Once approved, create your course with lessons, resources and quizzes, set your price and publish.", icon: FileCheck2 },
      ];

  return (
    <main className="start-page">
      <section className="start-hero" aria-labelledby="teach-title">
        <span className="start-hero-pattern" aria-hidden="true" />
        <div className="start-shell">
          <Breadcrumb trail={[{ to: "/get-started", label: "Get started" }, { label: "Teaching" }]} />
          <p className="start-eyebrow start-eyebrow--hero">Teaching on DarsLearn</p>
          <h1 id="teach-title">
            {instructor
              ? "Bring your next course to life."
              : admin
                ? "Help qualified instructors get started."
                : "Share your knowledge. Help others learn."}
          </h1>
          <p className="start-lead">
            {instructor
              ? "Your courses and lessons are together in Course Studio."
              : "A simple application, a review of your qualifications, and a dedicated workspace for your teaching."}
          </p>
        </div>
      </section>

      <section className="start-section start-section--tight" aria-labelledby="teaching-entry-title">
        <div className="start-shell">
          <div className="start-status" data-tone={badge?.tone}>
            <div className="start-status-copy">
              {badge && <span className="start-badge" data-tone={badge.tone}>{badge.label}</span>}
              <h2 id="teaching-entry-title">{entry.title}</h2>
              <p>{entry.text}</p>
            </div>
            <div className="start-actions start-actions--status">
              {eligible && query.isLoading ? (
                <LoadingState variant="inline" label="Checking your application" />
              ) : (
                <Link to={entry.to} state={entry.state} className="start-btn start-btn--primary">
                  {entry.label}<ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
              {!user ? (
                <Link to="/login" state={applicationReturn} className="start-btn">Log in</Link>
              ) : (
                <Link to="/dashboard/learning" className="start-btn">My learning</Link>
              )}
            </div>
            {query.isError && (
              <div className="start-error" role="alert">
                <p>{userMessage(query.error, "We could not check your application. Please try again.")}</p>
                <button type="button" className="start-btn" disabled={query.isFetching} onClick={query.refetch}>
                  {query.isFetching ? "Checking..." : "Try again"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {!admin && (
        <section className="start-section start-section--tight" aria-labelledby="teach-steps-title">
          <div className="start-shell">
            <p className="start-eyebrow">{instructor ? "Your next steps" : "How it works"}</p>
            <h2 id="teach-steps-title" className="start-section-title">{instructor ? "From idea to published course" : "Three steps to teaching"}</h2>
            <ol className="start-steps start-steps--cards">
              {steps.map(({ title, text, icon: Icon }, index) => (
                <li key={title}>
                  <span className="start-step-number" aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3><Icon size={18} aria-hidden="true" />{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {!admin && !instructor && (
        <section className="start-section start-section--soft" aria-labelledby="teach-faq-title">
          <div className="start-shell start-faq-grid">
            <div>
              <p className="start-eyebrow">Questions</p>
              <h2 id="teach-faq-title" className="start-section-title">Common questions</h2>
              <p className="start-faq-intro">Something else? <Link to="/contact">Contact our team</Link> and choose “Teaching on DarsLearn”.</p>
            </div>
            <div className="start-faq">
              {teacherQuestions.map(({ question, answer }) => (
                <details key={question}>
                  <summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
