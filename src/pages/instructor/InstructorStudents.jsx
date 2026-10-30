import SelectField from "@/components/ui/SelectField.jsx";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Users, Search, RefreshCw } from "lucide-react";
import { WorkspacePage, WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import api from "@/services/api/instructor/recordedCoursesApi.js";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import "../admissions/admin-admissions.css";

export default function InstructorStudents() {
  const [params, setParams] = useSearchParams();
  const courseId = params.get("courseId");
  const [page, setPage] = useState(1), [input, setInput] = useState(""), [search, setSearch] = useState(""), [status, setStatus] = useState("");
  const query = api.endpoints.getStudents.useQuery({ page, limit: 20, ...(courseId ? { courseId } : {}), ...(search ? { search } : {}), ...(status ? { status } : {}) }, { refetchOnMountOrArgChange: true });
  const data = query.currentData;
  return <WorkspacePage eyebrow="Teaching workspace" title="Your learners" description="See who has enrolled in your courses and review their access status." action={<button className="cw-button" disabled={query.isFetching} onClick={query.refetch}><RefreshCw size={16} />Refresh</button>}>
    <form className="cw-row studio-search" onSubmit={event => { event.preventDefault(); setSearch(input.trim()); setPage(1); }}><label><span className="sr-only">Find a learner</span><Search size={18} aria-hidden="true" /><input value={input} onChange={event => setInput(event.target.value)} maxLength={100} placeholder="Search by name or email" type="search" /></label><button className="cw-button" type="submit">Search</button><SelectField aria-label="Enrollment status" value={status || "all"} onChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }} options={[{ value: "all", label: "All enrollments" }, { value: "active", label: "Active" }, { value: "expired", label: "Expired" }, { value: "cancelled", label: "Cancelled" }, { value: "refunded", label: "Refunded" }]} className="w-full sm:w-48" /></form>
    <QueryMessage query={{ data, loading: query.isFetching, error: query.error, refresh: query.refetch }} label="Loading your learners" />
    {courseId && <div className="cw-row cw-between mt-5"><p className="cw-muted">Enrollments for {data?.course?.title || "the selected course"}</p><button type="button" className="cw-button" onClick={() => { setParams({}); setPage(1); }}>Show all courses</button></div>}
    {!query.error && data?.items.length === 0 && <WorkspaceEmpty icon={Users} title={search || status ? "No matching learners" : "Your learners will appear here"} description={search || status ? "Try another name or choose all enrollments." : "When someone enrolls in one of your courses, you can find their details here."} />}
    {Boolean(data?.items.length) && <div className="admin-admissions studio-panel mt-5"><p className="cw-muted">{data.pagination.total} {data.pagination.total === 1 ? "enrollment" : "enrollments"}. A learner may be enrolled in more than one course.</p><div className="admissions-results"><table className="admissions-table w-full text-left text-sm" aria-label="Course enrollments"><thead><tr>{["Learner", "Course", "Enrolled", "Access"].map(label => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{data.items.map(item => <tr key={item._id}><td className="px-4 py-4" data-label="Learner"><strong>{item.name || "Learner"}</strong><p className="cw-muted break-all">{item.email}</p></td><td className="px-4 py-4" data-label="Course"><Link className="cw-text-link" to={`/instructor/courses/${item.courseId}`}>{item.courseTitle}</Link></td><td className="px-4 py-4" data-label="Enrolled">{item.enrolledAt && Number.isFinite(Date.parse(item.enrolledAt)) ? new Date(item.enrolledAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not recorded"}</td><td className="px-4 py-4" data-label="Access"><span className="cw-status">{({ active: "Active", expired: "Expired", cancelled: "Cancelled", refunded: "Refunded" })[item.status]}</span></td></tr>)}</tbody></table></div></div>}
    <Pagination pagination={data?.pagination} page={page} onPage={setPage} loading={query.isFetching} />
  </WorkspacePage>;
}
