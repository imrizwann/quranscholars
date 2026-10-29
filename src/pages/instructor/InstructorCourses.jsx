import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, Search } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { WorkspaceEmpty, WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import InstructorCourseCard from "@/features/instructor-courses/InstructorCourseCard.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";

export default function InstructorCourses() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const query = useCourseQuery("getCourses", { page, search: filter, status });
  return <WorkspacePage eyebrow="Course studio" title="Your recorded courses" description="Create, organize, and refine your learning experiences." action={<Link className="cw-button cw-primary" to="/instructor/courses/new"><Plus size={16} aria-hidden="true" />Create course</Link>}>
    <form className="cw-row studio-search" onSubmit={(event) => { event.preventDefault(); setAction("search"); setPage(1); setFilter(search.trim()); if (page === 1 && filter === search.trim()) query.refresh(); }}><label><span className="sr-only">Find a course</span><Search size={18} aria-hidden="true" /><input type="search" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your courses" /></label><AsyncButton className="cw-button" type="submit" loading={query.loading && action === "search"} loadingLabel="Searching" disabled={query.loading}>Search</AsyncButton><AsyncButton className="cw-button" loading={query.loading && action === "refresh"} loadingLabel="Refreshing" disabled={query.loading} onClick={() => { setAction("refresh"); query.refresh(); }}><RefreshCw size={16} aria-hidden="true" />Refresh</AsyncButton></form>
    <div className="studio-tabs" aria-label="Filter courses by status">{[["", "All courses"], ["Draft", "Drafts"], ["Published", "Published"]].map(([value, label]) => <button type="button" key={value} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>)}</div>
    <QueryMessage query={query} label="Loading your courses" />
    {!query.error && query.data?.courses?.length === 0 && <WorkspaceEmpty title={filter || status ? "No matching courses" : "Your first course starts here"} description={filter || status ? "Try a different search or switch to All courses." : "Create a draft, plan your sections, and bring your lessons to life."} to={!filter && !status ? "/instructor/courses/new" : undefined} action="Create a course" />}
    <div className="studio-course-grid" aria-busy={query.loading}>{query.data?.courses?.map((course) => <InstructorCourseCard key={course._id} course={course} />)}</div>
    <Pagination pagination={query.data?.pagination} page={page} onPage={(value) => { setAction("page"); setPage(value); }} loading={query.loading} />
  </WorkspacePage>;
}
