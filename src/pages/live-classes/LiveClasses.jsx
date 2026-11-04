import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Radio,
  Search,
  Users,
  X,
} from "lucide-react";

import { liveClasses } from "@/data/lmsData.js";

import { StatusBadge } from "@/components/lms/LmsComponents.jsx";
import CatalogueHero from "@/components/marketing/CatalogueHero.jsx";

export const LiveClassCard = ({ item }) => (
  <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-white transition-colors hover:border-primary/30">
    <div className="bg-[#0a3b35] p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#a8dace]">
          <Radio className="size-4" />
          Instructor-led
        </span>
        <StatusBadge status={item.status} />
      </div>
      <h2 className="mt-8 font-display text-2xl font-black leading-tight">
        {item.title}
      </h2>
      <p className="mt-2 text-sm font-semibold text-white/60">
        Instructor details will be confirmed.
      </p>
    </div>
    <div className="flex flex-1 flex-col p-5">
      <p className="text-sm font-medium leading-6 text-muted-foreground">
        {item.shortDescription}
      </p>
      <dl className="mt-5 grid gap-3 text-sm font-bold">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          {item.schedule}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-primary" />
          {item.time} · {item.timezone}
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          {item.capacity - item.students} places available
        </div>
      </dl>
      <div className="mt-6 flex items-end justify-between gap-3 border-t border-border pt-5">
        <div>
          <p className="text-xs font-bold text-muted-foreground">
            Enrollment fee SAR {item.admissionFee}
          </p>
          <p className="font-display text-xl font-black">
            SAR {item.monthlyTuition}
            <span className="text-xs font-bold text-muted-foreground">
              {" "}
              / month
            </span>
          </p>
        </div>
        <Link
          to={`/live-classes/${item.slug}`}
          className="grid size-11 place-items-center rounded-xl bg-primary text-white no-underline transition group-hover:bg-primary-hover"
          aria-label={`View ${item.title}`}
        >
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </div>
  </article>
);

export default function LiveClasses() {
  const [params, setParams] = useSearchParams();
  const searchInput = useRef(null);
  const query = params.get("search") || "";
  const filtered = liveClasses.filter((item) =>
    `${item.title} ${item.category} ${item.instructor}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const updateSearch = value => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set("search", value);
    else next.delete("search");
    return next;
  }, { replace: true });
  const clearSearch = () => {
    updateSearch("");
    searchInput.current?.focus();
  };

  return (
    <main className="catalogue-page bg-[#f7f9f7] text-foreground">
      <CatalogueHero id="live-class-catalogue-title" eyebrow="Live classes" title="Learn with an instructor." description="Compare class topics, schedules, and fees. Choose guided study that fits your goals and availability." icon={Radio} highlights={["Scheduled sessions", "Instructor guidance", "Class time zones"]}>
        <Link to="/courses" className="cw-button">Video courses<ArrowRight size={15} aria-hidden="true" /></Link>
      </CatalogueHero>
      <section className="catalogue-results mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="live-class-results-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-primary">
              Scheduled learning
            </p>
            <h2 id="live-class-results-title" className="mt-2 font-display text-3xl font-black">
              Find your live class
            </h2>
          </div>
        </div>
        <div className="live-class-search-row">
          <label className="live-class-search qs-search-field"><Search size={17} aria-hidden="true" /><span className="sr-only">Search live classes</span><input name="search" ref={searchInput} type="search" value={query} onChange={event => updateSearch(event.target.value)} placeholder="Search topics or instructors" maxLength={100} />{query && <button type="button" aria-label="Clear live class search" onClick={clearSearch}><X size={16} aria-hidden="true" /></button>}</label>
          <p role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? "class" : "classes"} · Times shown in each class timezone</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {!filtered.length && <div className="public-panel live-class-empty"><Search size={24} aria-hidden="true" /><div><h3>No matching classes</h3><p>Try another topic or instructor name.</p></div><button className="cw-button" type="button" onClick={clearSearch}>Clear search</button></div>}
          {filtered.map((item) => (
            <LiveClassCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
