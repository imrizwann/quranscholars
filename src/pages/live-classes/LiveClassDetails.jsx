import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getLiveClass } from "@/data/lmsData.js";
import { StatusBadge } from "@/components/lms/LmsComponents.jsx";

export default function LiveClassDetails() {
  const { slug } = useParams();
  const item = getLiveClass(slug);
  if (!item)
    return (
      <main className="grid min-h-[70vh] place-items-center px-4 text-center">
        <div>
          <h1 className="font-display text-3xl font-black">
            Live class not found
          </h1>
          <Link to="/live-classes" className="mt-5 inline-flex text-primary">
            Browse live classes
          </Link>
        </div>
      </main>
    );
  return (
    <main className="bg-[#f8faf8] text-foreground">
      <section className="bg-[#082f2b] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_23rem]">
          <div>
            <nav className="text-xs font-bold text-white/55">
              <Link to="/live-classes" className="text-[#b2dfd4] no-underline">
                Live Classes
              </Link>{" "}
              / {item.category}
            </nav>
            <div className="mt-6 flex gap-2">
              <span className="rounded-full bg-[#f4c95d] px-3 py-1 text-xs font-black text-[#183a32]">
                Instructor-led
              </span>
              <StatusBadge status={item.status} />
            </div>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,5vw,4.7rem)] font-black leading-none tracking-[-.05em]">
              {item.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-white/68">
              {item.shortDescription}
            </p>
            <p className="mt-6 text-sm font-bold text-white/70">
              Instructor details will be confirmed before enrollment.{" "}
              <Link
                to="/instructors"
                className="text-white"
              >
                Meet our instructors
              </Link>{" "}
            </p>
          </div>
          <aside className="rounded-2xl border border-white/15 bg-white/[.08] p-6 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#a6dace]">
              Class schedule
            </p>
            <div className="mt-5 grid gap-4 text-sm font-bold">
              <p className="flex gap-3">
                <CalendarDays className="size-5 text-[#f4c95d]" />
                {item.schedule}
                <br />
                Starts {item.startDate}
              </p>
              <p className="flex gap-3">
                <Clock3 className="size-5 text-[#f4c95d]" />
                {item.time} · {item.duration}
              </p>
              <p className="flex gap-3">
                <Globe2 className="size-5 text-[#f4c95d]" />
                {item.timezone}
              </p>
              <p className="flex gap-3">
                <Users className="size-5 text-[#f4c95d]" />
                {item.capacity - item.students} places remaining
              </p>
            </div>
          </aside>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-10">
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="font-display text-2xl font-black">
              What you will learn
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {item.outcomes.map((text) => (
                <li
                  key={text}
                  className="flex gap-3 text-sm font-semibold leading-6 text-muted-foreground"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display text-2xl font-black">
              Topics covered
            </h2>
            <div className="mt-5 grid gap-3">
              {item.outline.map((week) => (
                <article
                  key={week.week}
                  className="rounded-xl border border-border bg-white p-5"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.12em] text-primary">
                        {week.week}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-black">
                        {week.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    {week.topics.join(" · ")}
                  </p>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl font-black">
              Before you join
            </h2>
            <ul className="mt-4 grid gap-2">
              {item.requirements.map((text) => (
                <li
                  key={text}
                  className="flex gap-2 text-sm font-semibold text-muted-foreground"
                >
                  <Check className="size-4 text-primary" />
                  {text}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-[0_16px_45px_rgba(18,48,40,.09)] lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">
            Enrollment fee
          </p>
          <p className="mt-1 font-display text-2xl font-black">
            SAR {item.admissionFee}
          </p>
          <div className="my-5 border-t border-border" />
          <p className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">
            Monthly tuition
          </p>
          <p className="mt-1 font-display text-3xl font-black">
            SAR {item.monthlyTuition}
            <span className="text-sm text-muted-foreground"> / month</span>
          </p>
          <Link
            to="/contact"
            className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white no-underline"
          >
            Ask about this class <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 flex gap-2 text-xs font-semibold leading-5 text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            Private class access is shared only with enrolled students.
          </p>
        </aside>
      </div>
    </main>
  );
}
