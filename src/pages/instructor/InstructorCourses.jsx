import { courseStatusLabel } from "@/lib/user-messages.js";
import { useState } from "react";
import { Link } from "react-router-dom";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import { Plus, RefreshCw, Search } from "lucide-react";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import { Pagination, QueryMessage, VideoStatus } from "@/features/instructor-courses/WorkspaceParts.jsx";
import "@/features/instructor-courses/course-workspace.css";

export default function InstructorCourses() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const query = useCourseQuery("getCourses", { page, search: filter });
  return <main className="course-workspace">
    <div className="cw-heading cw-row cw-between"><div><p className="cw-eyebrow">Course studio</p><h1>Your recorded courses</h1><p className="cw-muted">Manage your curriculum, upload videos, and follow their progress.</p></div><Link className="cw-button cw-primary" to="/instructor/courses/new"><Plus size={16} aria-hidden="true" />Create course</Link></div>
    <form className="cw-row cw-card cw-search-form" onSubmit={(event) => { event.preventDefault(); setAction("search"); setPage(1); setFilter(search.trim()); if (page === 1 && filter === search.trim()) query.refresh(); }}><label>Find a course<input type="search" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your courses" /></label><AsyncButton className="cw-button" type="submit" loading={query.loading && action === "search"} loadingLabel="Searching" disabled={query.loading}><Search size={16} aria-hidden="true" />Search</AsyncButton><AsyncButton className="cw-button" loading={query.loading && action === "refresh"} loadingLabel="Refreshing" disabled={query.loading} onClick={() => { setAction("refresh"); query.refresh(); }}><RefreshCw size={16} aria-hidden="true" />Refresh</AsyncButton></form>
    <QueryMessage query={query} label="Loading your courses" />
    {query.data?.courses?.length === 0 && <section className="cw-card"><h2>No courses found</h2><p>Create a draft course to begin uploading videos.</p></section>}
    {query.data?.courses?.map((course) => <article className="cw-card cw-row cw-between" key={course._id}><div><h2><Link to={`/instructor/courses/${course._id}`}>{course.title}</Link></h2><p className="cw-muted">{courseStatusLabel(course.status)} · {course.stats?.totalSections || 0} sections · {course.stats?.totalLessons || 0} lessons</p><span className="cw-muted">Trailer: </span><VideoStatus video={course.trailerVideo} /></div><Link className="cw-button" to={`/instructor/courses/${course._id}`}>Edit course</Link></article>)}
    <Pagination pagination={query.data?.pagination} page={page} onPage={(page) => { setAction("page"); setPage(page); }} loading={query.loading} />
  </main>;
}
