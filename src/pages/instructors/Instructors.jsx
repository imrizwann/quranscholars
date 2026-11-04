import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Languages, Search, UsersRound, X } from "lucide-react";
import { useGetPublicInstructorsQuery } from "@/services/api/courses/instructorsApi.js";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import CatalogueHero from "@/components/marketing/CatalogueHero.jsx";
import "./instructors.css";

export function InstructorCard({ item }) {
  return <article className="public-panel instructor-card">
    <div className="instructor-card-heading"><ProfileAvatar name={item.name} src={item.avatar} size={56} /><div><h2><Link to={`/instructors/${item.id}`}>{item.name}</Link></h2><p>{item.title}</p></div></div>
    {item.bio && <p className="instructor-card-bio">{item.bio}</p>}
    <div className="instructor-card-facts"><span><BookOpen size={16} aria-hidden="true" />{item.courseCount} {item.courseCount === 1 ? "course" : "courses"}</span>{item.languages.length > 0 && <span><Languages size={16} aria-hidden="true" />{item.languages.join(", ")}</span>}{item.experienceYears !== null && <span>{item.experienceYears} {item.experienceYears === 1 ? "year" : "years"} of teaching</span>}</div>
    <Link to={`/instructors/${item.id}`} className="cw-button instructor-card-action">View instructor<ArrowRight size={16} aria-hidden="true" /></Link>
  </article>;
}

export default function Instructors() {
  const [params, setParams] = useSearchParams();
  const search = (params.get("search") || "").slice(0, 100);
  const page = Math.max(1, Math.min(1000, Math.floor(Number(params.get("page"))) || 1));
  const [input, setInput] = useState(search);
  const searchInput = useRef(null);
  useEffect(() => { setInput(search); }, [search]);
  const query = useGetPublicInstructorsQuery({ page, search }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const data = query.currentData;
  const update = value => setParams(value.trim() ? { search: value.trim() } : {});
  const clear = () => { setInput(""); update(""); searchInput.current?.focus(); };
  return <main className="catalogue-page instructors-page">
    <CatalogueHero id="instructor-directory-title" eyebrow="Our instructors" title="Find guidance for your learning." description="Meet QuranScholar instructors, learn about their teaching backgrounds, and explore their courses." icon={GraduationCap}><Link to="/get-started/instructor" className="cw-button">Become an instructor<ArrowRight size={16} aria-hidden="true" /></Link></CatalogueHero>
    <section className="instructors-results" aria-labelledby="instructors-results-title">
      <div className="instructors-toolbar"><h2 id="instructors-results-title">Meet our instructors</h2><form className="instructors-search" onSubmit={event => { event.preventDefault(); update(input); }}><label className="qs-search-field"><Search size={17} aria-hidden="true" /><span className="sr-only">Search instructors by name</span><input name="search" ref={searchInput} type="search" maxLength={100} value={input} onChange={event => setInput(event.target.value)} placeholder="Search by instructor name" />{(input || search) && <button type="button" aria-label="Clear instructor search" onClick={clear}><X size={16} aria-hidden="true" /></button>}</label><button type="submit" className="cw-button">Search</button></form></div>
      <QueryMessage query={{ data, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading instructors" />
      {!query.error && data && <><p className="instructors-count" role="status">{data.pagination.total} {data.pagination.total === 1 ? "instructor" : "instructors"}{search ? " found" : " on QuranScholar"}</p>{data.items.length ? <div className="instructors-grid">{data.items.map(item => <InstructorCard key={item.id} item={item} />)}</div> : <div className="public-panel instructor-empty"><UsersRound size={28} aria-hidden="true" /><h3>{search ? "No matching instructors" : "Meet your instructors soon"}</h3><p>{search ? "Try another name or clear your search." : "Instructor profiles will appear here as teachers join QuranScholar."}</p>{search ? <button type="button" className="cw-button" onClick={clear}>Clear search</button> : <Link to="/courses" className="cw-button">Explore courses</Link>}</div>}<Pagination pagination={data.pagination} page={page} onPage={next => setParams({ ...(search && { search }), page: String(next) })} loading={query.isFetching} /></>}
    </section>
  </main>;
}
