import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import {
  AssignmentCard,
  EmptyState,
  ResourceCard,
  StatusBadge,
} from "@/components/lms/LmsComponents.jsx";
import { assignments, liveClasses, resources } from "@/data/lmsData.js";

export { default as InstructorDashboard } from "./InstructorDashboard.jsx";

const pageInfo = {
  courses: [
    "Courses",
    "Create and manage professional self-paced learning.",
    "Create course",
    "/instructor/courses/new",
  ],
  "live-classes": [
    "Live Classes",
    "Teach a subject through scheduled sessions. Manage class topics, enrollment and pricing.",
    "Create live class",
    "/instructor/live-classes/new",
  ],
  students: [
    "Students",
    "See learners enrolled in your courses and live classes.",
  ],
  assignments: [
    "Assignments",
    "Create work, review submissions and share feedback.",
  ],
  resources: [
    "Resources",
    "Manage reusable learning materials across your teaching.",
  ],
  earnings: [
    "Earnings",
    "Track course sales, admission fees and monthly tuition.",
  ],
  analytics: [
    "Analytics",
    "Understand enrollment, engagement and completion trends.",
  ],
  reviews: ["Reviews", "Read learner feedback across your teaching."],
  profile: ["Public Profile", "Manage how learners discover you."],
  settings: ["Settings", "Control instructor preferences and notifications."],
};
export function InstructorSectionPage() {
  const key = useLocation().pathname.split("/").pop();
  const [title, intro, action, to] = pageInfo[key] || pageInfo.courses;
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black">{title}</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {intro}
            </p>
          </div>
          {action && (
            <Link
              to={to}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white no-underline"
            >
              <Plus className="size-4" />
              {action}
            </Link>
          )}
        </div>
        {key === "live-classes" && (
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {liveClasses.slice(0, 2).map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <div className="flex justify-between gap-3">
                  <StatusBadge status={item.status} />
                  <span className="text-xs font-bold text-muted-foreground">
                    {item.students}/{item.capacity} students
                  </span>
                </div>
                <h2 className="mt-5 font-display text-xl font-black">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  {item.schedule} · {item.time}
                </p>
                <Link
                  to={`/classroom/${item.slug}`}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-black text-primary no-underline"
                >
                  Manage classroom <ArrowRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        )}
        {key === "assignments" && (
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {assignments.map((item) => (
              <AssignmentCard key={item.id} assignment={item} />
            ))}
          </div>
        )}
        {key === "resources" && (
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {resources.map((item) => (
              <ResourceCard key={item.id} resource={item} />
            ))}
          </div>
        )}
        {!["live-classes", "assignments", "resources"].includes(key) && (
          <div className="mt-7">
            <EmptyState
              title={`${title} workspace is ready`}
              description="Your teaching activity will appear here as you create and manage your offerings."
            />
          </div>
        )}
      </div>
    </main>
  );
}

const courseSteps = [
  "Basics",
  "Course Details",
  "Media",
  "Curriculum",
  "Content",
  "Pricing",
  "Review",
];
const liveSteps = [
  "Basics",
  "Topics & Requirements",
  "Sessions & Schedule",
  "Class Resources",
  "Enrollment",
  "Pricing",
  "Review",
];
export function CreationWizard({ type = "course" }) {
  const steps = type === "course" ? courseSteps : liveSteps;
  const title = type === "course" ? "Create video course" : "Create live class";
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-primary">
              New draft
            </p>
            <h1 className="mt-2 font-display text-3xl font-black">{title}</h1>
          </div>
          <button className="min-h-11 rounded-xl border border-border bg-white px-4 text-sm font-black">
            Preview as student
          </button>
        </div>
        <ol className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <li
              key={step}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-black ${index === 0 ? "bg-primary text-white" : "border border-border bg-white text-muted-foreground"}`}
            >
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <form className="mt-6 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-black">
            Start with the basics
          </h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Give learners a clear first impression. You can save this as a draft
            at any time.
          </p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black sm:col-span-2">
              Title
              <input
                className="h-12 rounded-lg border border-input px-3 font-medium outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={
                  type === "course"
                    ? "e.g. Tajweed Foundations"
                    : "e.g. Quran Reading for Beginners"
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-black sm:col-span-2">
              Short description
              <textarea
                rows="4"
                className="rounded-lg border border-input p-3 font-medium outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="What will students learn and who is this for?"
              />
            </label>
            {["Category", "Level", "Language"].map((label) => (
              <label key={label} className="grid gap-2 text-sm font-black">
                {label}
                <select className="h-12 rounded-lg border border-input bg-white px-3 font-medium">
                  <option>Select {label.toLowerCase()}</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                </select>
              </label>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border pt-6">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border px-5 text-sm font-black"
            >
              Save draft
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white"
            >
              Continue to details <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
