import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { WorkspaceEmpty, WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import InstructorCourseCard from "@/features/instructor-courses/InstructorCourseCard.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import useCourseEnrollments from "@/features/instructor-courses/useCourseEnrollments.js";
import "./instructor-courses.css";

// Tab counts and card enrollments come from one analytics request (useCourseEnrollments).
const STATUS_TABS = [
  { value: "", label: "All courses", countKey: "totalCourses" },
  { value: "Draft", label: "Drafts", countKey: "draftCourses" },
  { value: "Published", label: "Published", countKey: "publishedCourses" },
  { value: "Archived", label: "Archived" },
];

export default function InstructorCourses() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const query = useCourseQuery("getCourses", { page, search: filter, status });
  const { counts: enrollments, summary } = useCourseEnrollments();
  const showEmptyCreate = !query.error && !filter && !status && query.data?.courses?.length === 0;
  const total = query.data?.pagination?.totalCourses ?? query.data?.pagination?.total;

  function submit(event) {
    event.preventDefault();
    setAction("search");
    setPage(1);
    setFilter(search.trim());
    if (page === 1 && filter === search.trim()) query.refresh();
  }
  function clearSearch() {
    setSearch("");
    setFilter("");
    setPage(1);
  }

  return <WorkspacePage eyebrow="Course studio" title="Your recorded courses" description="Create, organize, and refine your learning experiences." action={!showEmptyCreate && <Link className="cw-button cw-primary" to="/instructor/courses/new"><Plus size={16} aria-hidden="true" />Create course</Link>}>
    <div className="courses-toolbar">
      <div className="studio-tabs courses-tabs" aria-label="Filter courses by status">
        {STATUS_TABS.map(tab => {
          const tabCount = tab.countKey ? summary?.[tab.countKey] : undefined;
          return <button type="button" key={tab.value} aria-pressed={status === tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}>
            {tab.label}{Number.isInteger(tabCount) && <span className="courses-tab-count">{tabCount}</span>}
          </button>;
        })}
      </div>
      <form className="courses-search" role="search" onSubmit={submit}>
        <label>
          <span className="sr-only">Find a course</span>
          <Search size={17} aria-hidden="true" />
          <input name="search" type="search" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your courses" />
          {(search || filter) && <button type="button" className="courses-search-clear" onClick={clearSearch} aria-label="Clear search"><X size={15} aria-hidden="true" /></button>}
        </label>
        <AsyncButton className="cw-button" type="submit" loading={query.loading && action === "search"} loadingLabel="Searching" disabled={query.loading}>Search</AsyncButton>
        <AsyncButton className="cw-button courses-refresh" loading={query.loading && action === "refresh"} loadingLabel="Refreshing" disabled={query.loading} onClick={() => { setAction("refresh"); query.refresh(); }} aria-label="Refresh courses" title="Refresh courses"><RefreshCw size={16} aria-hidden="true" /></AsyncButton>
      </form>
    </div>
    {filter && Number.isInteger(total) && <p className="courses-result-note" role="status">{total} {total === 1 ? "course" : "courses"} matching “{filter}”</p>}
    <QueryMessage query={query} label="Loading your courses" />
    {!query.error && query.data?.courses?.length === 0 && <WorkspaceEmpty title={filter || status ? "No matching courses" : "Your first course starts here"} description={filter || status ? "Try a different search or switch to All courses." : "Create a draft, plan your sections, and bring your lessons to life."} to={!filter && !status ? "/instructor/courses/new" : undefined} action="Create a course" />}
    <div className="studio-course-grid" aria-busy={query.loading}>{query.data?.courses?.map((course) => <InstructorCourseCard key={course._id} course={course} enrollments={enrollments?.get(String(course._id))} />)}</div>
    <Pagination pagination={query.data?.pagination} page={page} onPage={(value) => { setAction("page"); setPage(value); }} loading={query.loading} />
  </WorkspacePage>;
}
