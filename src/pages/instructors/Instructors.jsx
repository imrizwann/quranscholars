import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import { instructors } from "@/data/lmsData.js";

export const InstructorCard = ({ item }) => (
  <article className="rounded-2xl border border-border bg-white p-6 shadow-sm">
    <div className="flex items-start gap-4">
      <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#0a3b35] font-display text-lg font-black text-white">
        {item.initials}
      </span>
      <div>
        <h2 className="font-display text-xl font-black">{item.name}</h2>
        <p className="mt-1 text-sm font-bold text-primary">{item.title}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <Star className="size-4 fill-[#f4c95d] text-[#d7aa35]" />
          {item.rating} · {item.students.toLocaleString()} students
        </p>
      </div>
    </div>
    <p className="mt-5 text-sm font-medium leading-6 text-muted-foreground">
      {item.bio}
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
      {item.specializations.map((skill) => (
        <span
          key={skill}
          className="rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary"
        >
          {skill}
        </span>
      ))}
    </div>
    <Link
      to={`/instructors/${item.slug}`}
      className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary no-underline"
    >
      View instructor <ArrowRight className="size-4" />
    </Link>
  </article>
);

export default function Instructors() {
  return (
    <main className="min-h-screen bg-[#f7f9f7]">
      <section className="border-b border-border bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.15em] text-primary">
            Learn from trusted educators
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.8rem,6vw,5rem)] font-black leading-none tracking-[-.05em]">
            Guidance grounded in knowledge and care.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
            Discover instructors across Quran, Arabic and Islamic studies, then
            choose the learning format that fits you.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {instructors.map((item) => (
            <InstructorCard key={item.slug} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
