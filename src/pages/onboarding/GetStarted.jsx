import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, BookOpenCheck, Check, Clock3, FileCheck2, Presentation, ShieldCheck } from "lucide-react";
import { useGetMyInstructorApplicationQuery } from "@/services/api/user/instructorApplicationApi.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "./onboarding.css";

const applicationReturn = { from: "/instructor/application" };

export default function GetStarted() {
  const user = useSelector(state => state.user.user);
  const instructor = user?.role === "instructor";
  const admin = user?.role === "admin";
  const paths = [
    { title: "Start learning", description: "Find a course, review its curriculum, and enroll directly from the course page.", to: user ? "/dashboard/learning" : "/courses", cta: user ? "Open My learning" : "Explore courses", icon: BookOpenCheck, points: ["Preview courses before enrolling", "Learn through structured video lessons", "Keep your courses and progress in My learning"] },
    { title: admin ? "Support our instructors" : instructor ? "Continue teaching" : "Become an instructor", description: admin ? "Review teaching applications and supporting qualifications." : instructor ? "Open your teaching workspace to build courses and support your learners." : "Apply with your teaching background and qualifications. Start creating courses after approval.", to: admin ? "/admin/instructor-applications" : instructor ? "/instructor/courses" : "/get-started/instructor", cta: admin ? "Review applications" : instructor ? "Open Course Studio" : "Explore teaching", icon: Presentation, points: admin ? ["Review instructor applications", "Access certificates securely", "Approve eligible instructors"] : ["One account for learning and teaching", "A clear application and review process", "Course, lesson, and video management"] },
  ];
  return <main className="public-page onboarding-page">
    <header className="public-heading"><p className="public-eyebrow">Get started</p><h1>Your next step starts here.</h1><p>Explore a course or share your knowledge as an instructor. You can learn and teach with the same account.</p></header>
    <div className="onboarding-paths">{paths.map(({ icon: Icon, ...path }) => <article key={path.title} className="public-panel onboarding-path">
      <span className="public-icon"><Icon size={22} aria-hidden="true" /></span><h2>{path.title}</h2><p>{path.description}</p>
      <ul className="onboarding-points">{path.points.map(point => <li key={point}><Check size={16} aria-hidden="true" />{point}</li>)}</ul>
      <div className="onboarding-card-actions"><Link to={path.to} className="cw-button cw-primary">{path.cta}<ArrowRight size={16} aria-hidden="true" /></Link>{path.title === "Start learning" && user && <Link to="/courses" className="cw-button">Explore courses</Link>}</div>
    </article>)}</div>
    <p className="onboarding-help">Not sure where to begin? <Link to="/contact">Contact our team</Link>. You can explore courses before creating an account.</p>
  </main>;
}

// Retain existing bookmarks without adding an extra step before the catalogue.
export function StudentStart() {
  return <Navigate to="/courses" replace />;
}

export function InstructorStart() {
  const user = useSelector(state => state.user.user);
  const instructor = user?.role === "instructor";
  const admin = user?.role === "admin";
  const eligible = user?.role === "user";
  const query = useGetMyInstructorApplicationQuery(undefined, { skip: !eligible, refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const application = query.currentData?.application;
  let entry = { title: "Ready to introduce yourself?", text: "Prepare your teaching background and at least one certificate. Your application is reviewed before instructor access is granted.", label: "Start instructor application", to: "/instructor/application" };
  if (instructor) entry = { title: "Your teaching workspace is ready", text: "Create and manage courses, organize lessons, and follow your video preparation in Course Studio.", label: "Open Course Studio", to: "/instructor/courses" };
  else if (admin) entry = { title: "Manage instructor applications", text: "Review submitted teaching backgrounds and certificates before approving instructor access.", label: "Review applications", to: "/admin/instructor-applications" };
  else if (!user) entry = { title: "One account for learning and teaching", text: "Create an account or log in to submit your instructor application. Use the same account for your courses and teaching application.", label: "Create an account to apply", to: "/register", state: applicationReturn };
  else if (query.isLoading) entry = { title: "Checking your application", text: "Loading your latest application status before showing the next step.", label: "Open application", to: "/instructor/application" };
  else if (query.isError) entry = { title: "Check your instructor application", text: "Open your application or retry the status check below.", label: "Open application", to: "/instructor/application" };
  else if (query.currentData?.submissionInProgress) entry = { title: "Your submission is in progress", text: "Open your application to check the current submission before trying again.", label: "Check submission", to: "/instructor/application" };
  else if (application) entry = { title: ({ pending: "Your application is under review", approved: "Your application has been approved", rejected: "You can revise your application" })[application.status] || "Your instructor application", text: application.status === "pending" ? "You can keep learning while the team reviews your qualifications. Check your application for updates." : application.status === "rejected" ? "Read the team's feedback, update your teaching details or certificates, and submit again for review." : "Open your application to see the decision and any feedback from the team.", label: application.status === "rejected" ? "Review and revise application" : "View application status", to: "/instructor/application" };
  else if (query.currentData && !query.currentData.submissionEnabled) entry = { title: "Applications are temporarily unavailable", text: "Please check back later or contact our team about teaching opportunities.", label: "Contact the team", to: "/contact" };

  const steps = instructor ? [
    { title: "Create your course", text: "Set the course details, outcomes, and pricing.", icon: Presentation },
    { title: "Build your lessons", text: "Add sections, lessons, and prepared course videos.", icon: BookOpenCheck },
    { title: "Review and publish", text: "Complete the course readiness checks before publishing.", icon: FileCheck2 },
  ] : [
    { title: "Prepare your background", text: "Share what you teach, your experience, and your teaching languages.", icon: Presentation },
    { title: "Submit your qualifications", text: "Upload supporting certificates with your application. Documents are stored privately.", icon: ShieldCheck },
    { title: "Create courses after approval", text: "The team reviews your application before you receive instructor access.", icon: FileCheck2 },
  ];
  return <main className="public-page onboarding-page">
    <Link to="/get-started" className="public-back">Get started</Link>
    <header className="public-heading"><p className="public-eyebrow">Teaching on QuranScholar</p><h1>{instructor ? "Bring your next course to life." : admin ? "Help qualified instructors get started." : "Share your knowledge. Help others learn."}</h1><p>{instructor ? "Your courses and lessons are together in Course Studio." : "A simple application, a review of your qualifications, and a dedicated workspace for your teaching."}</p></header>
    <section className="public-panel onboarding-entry" aria-labelledby="teaching-entry-title">
      <div><h2 id="teaching-entry-title">{entry.title}</h2><p>{entry.text}</p></div>
      <div className="onboarding-card-actions">{eligible && query.isLoading ? <LoadingState variant="inline" label="Checking your application" /> : <Link to={entry.to} state={entry.state} className="cw-button cw-primary">{entry.label}<ArrowRight size={16} aria-hidden="true" /></Link>}{!user ? <Link to="/login" state={applicationReturn} className="cw-button">Log in</Link> : <Link to="/dashboard/learning" className="cw-button">My learning</Link>}</div>
      {query.isError && <div className="onboarding-error" role="alert"><p>{userMessage(query.error, "We could not check your application. Please try again.")}</p><button type="button" className="cw-button" disabled={query.isFetching} onClick={query.refetch}>{query.isFetching ? "Checking..." : "Try again"}</button></div>}
    </section>
    {!admin && <ol className="onboarding-steps">{steps.map(({ title, text, icon: Icon }, index) => <li className="public-panel" key={title}><span className="onboarding-step-label"><Icon size={18} aria-hidden="true" />Step {index + 1}</span><h2>{title}</h2><p>{text}</p></li>)}</ol>}
    <p className="onboarding-help"><Clock3 size={16} aria-hidden="true" />{instructor ? "You can continue learning with the same account." : "Instructor access is granted after approval. You can continue exploring courses at any time."} <Link to="/courses">Explore courses</Link></p>
  </main>;
}
