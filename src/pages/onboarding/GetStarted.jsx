import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, BookOpenCheck, Check, Presentation, Radio, Users } from "lucide-react";

const paths = [
  { title: "Start learning", description: "Find a subject, study format, and pace that work for you.", to: "/get-started/student", cta: "Explore learning", icon: BookOpenCheck, points: ["Self-paced recorded courses", "Guidance through admissions", "Your course library in one place"] },
  { title: "Explore teaching", description: "Share your knowledge through structured courses and lessons.", to: "/get-started/instructor", cta: "Explore teaching", icon: Presentation, points: ["A dedicated instructor workspace", "Course and curriculum management", "Lesson video uploads and previews"] },
];

export default function GetStarted() {
  return <main className="public-page">
    <header className="public-heading"><p className="public-eyebrow">Get started</p><h1>Make room for your next chapter.</h1><p>Discover ways to learn and teach on QuranScholar. You can explore both with the same account.</p></header>
    <div className="public-grid">{paths.map(({ icon: Icon, ...path }) => <article key={path.title} className="public-panel flex flex-col">
      <span className="public-icon"><Icon size={22} aria-hidden="true" /></span>
      <h2 className="mt-5">{path.title}</h2><p className="mt-3">{path.description}</p>
      <ul className="my-5 grid gap-3 text-sm text-muted-foreground">{path.points.map(point => <li key={point} className="flex items-start gap-2"><Check size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" />{point}</li>)}</ul>
      <div className="mt-auto"><Link to={path.to} className="cw-button cw-primary">{path.cta}<ArrowRight size={16} aria-hidden="true" /></Link></div>
    </article>)}</div>
    <p className="mt-6 text-sm leading-6 text-muted-foreground">Need guidance choosing where to start? <Link to="/admission" className="text-primary underline underline-offset-4">Explore admission</Link>.</p>
  </main>;
}

export function StudentStart() {
  const user = useSelector(state => state.user.user);
  return <JourneyPage eyebrow="Learning on QuranScholar" title="One place for every way you learn." intro="Find your starting point, explore the curriculum, and return to your learning library whenever you are ready." sections={[
    { icon: BookOpenCheck, title: "Learn at your own pace", text: "Explore recorded courses, watch trailers, and review lesson outlines before you decide." },
    { icon: Radio, title: "Find guided learning", text: "Share your goals and study preferences with our admissions team." },
    { icon: Users, title: "Keep your learning together", text: "Find the courses you have access to in your learning library." },
  ]} action={user ? "Open my learning" : "Create an account"} to={user ? "/dashboard/learning" : "/register"} secondary={{ label: "Explore courses", to: "/courses" }} />;
}

export function InstructorStart() {
  const instructor = useSelector(state => state.user.user?.role === "instructor");
  return <JourneyPage eyebrow="Teaching on QuranScholar" title="A workspace built around your teaching." intro="Organize your knowledge into courses, create a clear curriculum, and prepare your lessons for learners." sections={[
    { icon: Presentation, title: "Build your curriculum", text: "Organize course details, sections, and lessons in Course Studio." },
    { icon: BookOpenCheck, title: "Prepare your course media", text: "Manage your cover, trailer, and lesson videos, with upload and processing progress in one place." },
  ]} action={instructor ? "Open Course Studio" : "Become an instructor"} to={instructor ? "/instructor/courses" : "/instructor/application"} secondary={{ label: instructor ? "Instructor overview" : "Preview instructor workspace", to: "/instructor/dashboard" }}>
    <p className="mt-4 text-sm leading-6 text-muted-foreground">The instructor workspace requires instructor access. Exploring teaching won’t change your current account.</p>
  </JourneyPage>;
}

function JourneyPage({ eyebrow, title, intro, sections, action, to, secondary, children }) {
  return <main className="public-page">
    <header className="public-heading"><p className="public-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></header>
    <div className="public-grid">{sections.map(({ icon: Icon, title: heading, text }) => <article key={heading} className="public-panel"><span className="public-icon"><Icon size={22} aria-hidden="true" /></span><h2 className="mt-5">{heading}</h2><p className="mt-3">{text}</p></article>)}</div>
    <div className="public-actions"><Link to={to} className="cw-button cw-primary">{action}<ArrowRight size={16} aria-hidden="true" /></Link>{secondary && <Link to={secondary.to} className="cw-button">{secondary.label}</Link>}</div>
    {children}
  </main>;
}
