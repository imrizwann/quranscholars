import TableScroll from "@/components/ui/TableScroll.jsx";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, Inbox, RefreshCw, RotateCcw, Search, X, XCircle } from "lucide-react";
import { WorkspacePage } from "../../components/lms/WorkspaceUI.jsx";
import { DashboardMetrics } from "../../components/lms/DashboardParts.jsx";
import { useGetAdminInstructorApplicationsQuery } from "../../services/api/admin/instructorApplicationsApi.js";
import { ReviewStatus, ReviewError, ApplicantAvatar } from "./InstructorReviewUI.jsx";
import { reviewDate, reviewAge, yearsLabel } from "./review-format.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import "../admissions/admin-admissions.css";
import "./instructor-review.css";
import "./instructor-review-refresh.css";

export default function AdminInstructorApplications() {
  const [params, setParams] = useSearchParams();
  const requestedStatus = params.get("status");
  const status = requestedStatus === "all" ? "" : ["pending", "approved", "rejected"].includes(requestedStatus) ? requestedStatus : "pending";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.get("page"), 10) || 1));
  const search = (params.get("search") || "").slice(0, 100);
  const [input, setInput] = useState(search);
  useEffect(() => setInput(search), [search]);
  const query = useGetAdminInstructorApplicationsQuery({ page, limit: 15, status, search }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const data = query.currentData;
  function filter(changes) { setParams({ status: status || "all", search, page: "1", ...changes }); }
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
    <div className="review-toolbar">
      <nav className="review-tabs" aria-label="Application status">
        {[["pending", "Pending review"], ["approved", "Approved"], ["rejected", "Rejected"], ["all", "All applications"]].map(([value, label]) => <button key={value} type="button" aria-current={(status || "all") === value ? "page" : undefined} onClick={() => filter({ status: value })}>{label}</button>)}
      </nav>
      <form className="review-search-form" role="search" onSubmit={event => { event.preventDefault(); filter({ search: input.trim() }); }}>
        <label className="sr-only" htmlFor="instructor-search">Search applications</label>
        <div className="review-search-field">
          <Search size={16} aria-hidden="true" />
          <input id="instructor-search" name="search" type="search" value={input} maxLength={100} onChange={event => setInput(event.target.value)} placeholder="Search name, email or specialization" />
          {(input || search) && <button type="button" className="review-search-clear" aria-label="Clear search" onClick={() => { setInput(""); filter({ search: "" }); }}><X size={15} aria-hidden="true" /></button>}
        </div>
        <button type="submit" className="cw-button">Search</button>
      </form>
    </div>
    {search && data && <p className="review-search-note" role="status">{pagination.total} {pagination.total === 1 ? "result" : "results"} for “{search}”</p>}
    {query.isError ? <ReviewError error={query.error} retry={query.refetch} busy={query.isFetching} /> : !data ? <div className="studio-panel"><LoadingState variant="inline" label="Loading applications" /></div> : <section className="studio-panel admin-admissions review-list" aria-label="Instructor applications list" aria-busy={query.isFetching}>
      <TableScroll label="Instructor applications"><table className="admissions-table review-table"><thead><tr><th>Applicant</th><th>Teaching background</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>
        {data.items.map(item => {
          const waiting = item.status === "pending" ? reviewAge(item.submittedAt) : null;
          return <tr key={item.id} data-status={item.status}>
            <td data-label="Applicant"><div className="review-applicant-cell"><ApplicantAvatar name={item.fullName} /><div><strong>{item.fullName}</strong><p>{item.email}</p></div></div></td>
            <td data-label="Teaching background"><strong>{item.specialization}</strong><p>{yearsLabel(item.experienceYears)} &middot; {item.languages}</p>{Array.isArray(item.documents) && <p className="review-doc-count"><FileText size={13} aria-hidden="true" />{item.documents.length} {item.documents.length === 1 ? "certificate" : "certificates"}</p>}</td>
            <td data-label="Submitted"><span className="review-date">{reviewDate(item.submittedAt)}</span>{waiting && <p className="review-waiting" data-overdue={waiting.days >= 3 || undefined}>Waiting {waiting.label}</p>}</td>
            <td data-label="Status"><div className="review-status-cell"><ReviewStatus status={item.status} />{item.revision > 1 && <span className="review-resubmitted"><RotateCcw size={12} aria-hidden="true" />Resubmission</span>}</div></td>
            <td><Link className={`cw-button${item.status === "pending" ? " cw-primary" : ""}`} to={item.id} state={{ from: `/admin/instructor-applications?${params}` }} aria-label={`View application from ${item.fullName}`}>{item.status === "pending" ? "Review" : "View details"}<ArrowRight size={15} aria-hidden="true" /></Link></td>
          </tr>;
        })}
        {!data.items.length && <tr><td colSpan={5} className="admissions-empty"><h2>{status === "pending" && !search ? "No applications waiting for review" : "No applications found"}</h2><p>{search ? "Try a different search or clear your search." : status === "pending" ? "You're up to date. New submissions will appear here." : "Applications with this status will appear here."}</p></td></tr>}
      </tbody></table></TableScroll>
      <div className="review-pagination"><span>{pagination.total} matching {pagination.total === 1 ? "application" : "applications"}</span><nav aria-label="Application pages"><button className="cw-button" aria-label="Previous page" disabled={page <= 1 || query.isFetching} onClick={() => filter({ page: String(page - 1) })}><ChevronLeft size={16} /></button><span>Page {page} of {pagination.totalPages}</span><button className="cw-button" aria-label="Next page" disabled={page >= pagination.totalPages || query.isFetching} onClick={() => filter({ page: String(page + 1) })}><ChevronRight size={16} /></button></nav></div>
    </section>}
  </WorkspacePage>;
}
