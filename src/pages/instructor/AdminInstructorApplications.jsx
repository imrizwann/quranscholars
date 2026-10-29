import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Inbox, RefreshCw, Search, XCircle } from "lucide-react";
import { WorkspacePage } from "../../components/lms/WorkspaceUI.jsx";
import { DashboardMetrics } from "../../components/lms/DashboardParts.jsx";
import { useGetAdminInstructorApplicationsQuery } from "../../services/api/admin/instructorApplicationsApi.js";
import { ReviewStatus, ReviewError } from "./InstructorReviewUI.jsx";
import { reviewDate } from "./review-format.js";
import "../admissions/admin-admissions.css";
import "./instructor-review.css";

export default function AdminInstructorApplications() {
  const [params, setParams] = useSearchParams();
  const status = ["pending", "approved", "rejected"].includes(params.get("status")) ? params.get("status") : "";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.get("page"), 10) || 1));
  const search = (params.get("search") || "").slice(0, 100);
  const [input, setInput] = useState(search);
  useEffect(() => setInput(search), [search]);
  const query = useGetAdminInstructorApplicationsQuery({ page, limit: 15, status, search }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const data = query.currentData;
  function filter(changes) { setParams({ status, search, page: "1", ...changes }); }
  const counts = data?.counts;
  const loadingCounts = !data && !query.isError;
  const unavailable = query.isError ? "Unavailable" : undefined;
  const total = counts ? counts.pending + counts.approved + counts.rejected : unavailable;
  const pagination = data?.pagination;
  return <WorkspacePage eyebrow="Administration" title="Instructor applications" description="Review teaching backgrounds and qualifications before granting instructor access." action={<button type="button" className="cw-button" disabled={query.isFetching} onClick={query.refetch}><RefreshCw size={16} aria-hidden="true" />Refresh</button>}>
    <DashboardMetrics items={[
      { label: "All applications", value: total, icon: Inbox, loading: loadingCounts, note: "Across all statuses" },
      { label: "Pending review", value: counts?.pending ?? unavailable, icon: Clock3, loading: loadingCounts, note: "Awaiting a decision" },
      { label: "Approved", value: counts?.approved ?? unavailable, icon: CheckCircle2, loading: loadingCounts, note: "Instructor access granted" },
      { label: "Rejected", value: counts?.rejected ?? unavailable, icon: XCircle, loading: loadingCounts, note: "Decision recorded" },
    ]} />
    <section className="studio-panel review-filters" aria-label="Filter instructor applications">
      <form onSubmit={event => { event.preventDefault(); filter({ search: input.trim() }); }}>
        <label htmlFor="instructor-search">Search applications</label><div className="review-search"><input id="instructor-search" value={input} maxLength={100} onChange={event => setInput(event.target.value)} placeholder="Name, email or specialization" /><button type="submit" className="cw-button"><Search size={16} aria-hidden="true" />Search</button></div>
      </form>
      <label htmlFor="instructor-status">Status<select id="instructor-status" value={status} onChange={event => filter({ status: event.target.value })}><option value="">All statuses</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
      {(status || search) && <button className="cw-button" type="button" onClick={() => { setInput(""); setParams({}); }}>Clear filters</button>}
    </section>
    {query.isError ? <ReviewError error={query.error} retry={query.refetch} busy={query.isFetching} /> : !data ? <div className="studio-panel" role="status">Loading applications...</div> : <section className="studio-panel admin-admissions review-list" aria-label="Instructor applications list" aria-busy={query.isFetching}>
      <table className="admissions-table review-table"><thead><tr><th>Applicant</th><th>Teaching background</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>
        {data.items.map(item => <tr key={item.id}><td data-label="Applicant"><strong>{item.fullName}</strong><p>{item.email}</p></td><td data-label="Teaching background"><strong>{item.specialization}</strong><p>{item.experienceYears} years &middot; {item.languages}</p></td><td data-label="Submitted">{reviewDate(item.submittedAt)}</td><td data-label="Status"><ReviewStatus status={item.status} /></td><td><Link className="cw-button" to={item.id} state={{ from: `/admin/instructor-applications?${params}` }} aria-label={`View application from ${item.fullName}`}>{item.status === "pending" ? "Review" : "View details"}<ArrowRight size={15} aria-hidden="true" /></Link></td></tr>)}
        {!data.items.length && <tr><td colSpan={5} className="admissions-empty"><h2>No applications found</h2><p>{status || search ? "Try a different search or clear the filters." : "Submitted instructor applications will appear here."}</p></td></tr>}
      </tbody></table>
      <div className="review-pagination"><span>{pagination.total} matching {pagination.total === 1 ? "application" : "applications"}</span><nav aria-label="Application pages"><button className="cw-button" aria-label="Previous page" disabled={page <= 1 || query.isFetching} onClick={() => filter({ page: String(page - 1) })}><ChevronLeft size={16} /></button><span>Page {page} of {pagination.totalPages}</span><button className="cw-button" aria-label="Next page" disabled={page >= pagination.totalPages || query.isFetching} onClick={() => filter({ page: String(page + 1) })}><ChevronRight size={16} /></button></nav></div>
    </section>}
  </WorkspacePage>;
}
