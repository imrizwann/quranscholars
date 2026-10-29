import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, ClipboardCheck, Presentation } from "lucide-react";

const actionClassName =
  "cw-button cw-primary";

export default function WelcomeActions({ name, hasAdmission, formOpen, onStartAdmission }) {
  const firstName = name?.trim().split(/\s+/)[0];
  const actions = [
    {
      title: "Explore Courses",
      description: "Discover Quran, Tajweed, and Islamic studies courses. Watch trailers and find your starting point.",
      icon: BookOpenCheck,
      to: "/courses",
      label: "Browse courses",
    },
    {
      title: "Apply for Admission",
      description: "Looking for guided learning? Share your goals and preferences with our admissions team.",
      icon: ClipboardCheck,
      label: hasAdmission ? "Review application" : formOpen ? "Continue application" : "Start application",
    },
    {
      title: "Become an Instructor",
      description: "Share your knowledge with others. Learn about teaching on QuranScholar and how to get started.",
      icon: Presentation,
      to: "/get-started/instructor",
      label: "Explore teaching",
    },
  ];

  return (
    <section className="public-page" aria-labelledby="welcome-title">
      <header className="public-heading">
        <p className="public-eyebrow">Your dashboard</p>
        <h1 id="welcome-title">
          {firstName ? `Welcome, ${firstName}.` : "Welcome to QuranScholar."}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          Learn, find guided support, or share your knowledge. Start wherever feels right for you.
        </p>
      </header>

      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        {actions.map(({ title, description, icon: Icon, to, label }) => (
          <article key={title} className="public-panel flex flex-col">
            <span className="public-icon">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
            <div className="mt-auto pt-5">
              {to ? (
                <Link to={to} className={actionClassName}>
                  {label}<ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : (
                <button type="button" onClick={onStartAdmission} aria-expanded={formOpen} aria-controls={formOpen ? "admission-form" : undefined} className={actionClassName}>
                  {label}<ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        One account, all three options. You can return here anytime without choosing a permanent role.
      </p>
    </section>
  );
}
