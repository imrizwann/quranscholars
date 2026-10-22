import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
} from "lucide-react";

const statusClasses = {
  "Enrollment Open": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Few Seats": "bg-amber-50 text-amber-800 border-amber-200",
  "Due soon": "bg-amber-50 text-amber-800 border-amber-200",
  "In progress": "bg-blue-50 text-blue-800 border-blue-200",
  Submitted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Today: "bg-amber-50 text-amber-800 border-amber-200",
  Upcoming: "bg-slate-50 text-slate-700 border-slate-200",
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusClasses[status] || "border-slate-200 bg-slate-50 text-slate-700"}`}
  >
    {status}
  </span>
);

export const ResourceCard = ({ resource, dark = false }) => (
  <article
    className={`flex min-w-0 items-center gap-3 rounded-xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-border bg-white"}`}
  >
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-lg ${dark ? "bg-white/10 text-[#f4c95d]" : "bg-primary/10 text-primary"}`}
    >
      <FileText className="size-5" />
    </span>
    <div className="min-w-0 flex-1">
      <h3 className="truncate text-sm font-black">{resource.title}</h3>
      <p
        className={`mt-1 text-xs font-semibold ${dark ? "text-white/50" : "text-muted-foreground"}`}
      >
        {resource.type} · {resource.size}
      </p>
    </div>
    <button
      type="button"
      className={`grid size-11 shrink-0 place-items-center rounded-lg border ${dark ? "border-white/10 text-white hover:bg-white/10" : "border-border text-primary hover:bg-surface-alt"}`}
      aria-label={`Download ${resource.title}`}
    >
      <Download className="size-4" />
    </button>
  </article>
);

export const AssignmentCard = ({ assignment, compact = false }) => (
  <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-primary">
          {assignment.type} · {assignment.context}
        </p>
        <h3 className="mt-1 font-display text-lg font-black">
          {assignment.title}
        </h3>
      </div>
      <StatusBadge status={assignment.status} />
    </div>
    {!compact && (
      <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
        {assignment.instructions}
      </p>
    )}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <span className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Clock3 className="size-4" />
        Due {assignment.due}
      </span>
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-1 text-xs font-black text-primary"
      >
        Open <ArrowUpRight className="size-4" />
      </button>
    </div>
  </article>
);

export const ScheduleCard = ({
  title,
  date,
  time,
  topic,
  status = "Upcoming",
}) => (
  <article className="rounded-xl border border-border bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[.12em] text-primary">
          {date}
        </p>
        <h3 className="mt-2 font-display text-lg font-black">{title}</h3>
      </div>
      <StatusBadge status={status} />
    </div>
    <p className="mt-2 text-sm font-semibold text-muted-foreground">{topic}</p>
    <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold">
      <CalendarDays className="size-4 text-primary" />
      {time}
    </p>
  </article>
);

export const EmptyState = ({
  icon: Icon = CheckCircle2,
  title,
  description,
  action,
}) => (
  <section className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
    <span className="mx-auto grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-6" />
    </span>
    <h2 className="mt-5 font-display text-2xl font-black">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-muted-foreground">
      {description}
    </p>
    {action}
  </section>
);
