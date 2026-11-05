import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCheck, CircleCheck, FileEdit, Play, Receipt, RefreshCw, Users } from "lucide-react";
import { DashboardMetrics } from "./DashboardParts.jsx";
import learnerApi from "@/services/api/user/learnerApi.js";
import instructorApi from "@/services/api/instructor/recordedCoursesApi.js";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import "./dashboard-analytics.css";

const options = { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true };
const count = value => Number(value).toLocaleString();
const courseStatus = course => course.status === "Archived" ? "Archived" : course.published && course.status === "Published" ? "Published" : "Draft";
const queryState = query => ({ data: query.currentData, error: query.error, refresh: query.refetch });

function Metrics({ query, items }) {
  const summary = query.currentData?.summary;
  return <div className="analytics-metrics" data-columns={items.length}><DashboardMetrics items={items.map(item => ({ ...item,
    value: query.isError ? "Unavailable" : summary ? count(summary[item.key]) : undefined,
    loading: !summary && !query.isError,
  }))} /></div>;
}

export function LearnerAnalytics({ detailed = false }) {
  const query = learnerApi.endpoints.getLearnerAnalytics.useQuery(undefined, options);
  const summary = query.isError ? undefined : query.currentData?.summary;
  const hasLessonTotals = Number.isSafeInteger(summary?.totalLessons) && summary.totalLessons >= 0;
  const totalLessons = hasLessonTotals ? summary.totalLessons : 0;
  const completedLessons = Math.max(0, Math.min(summary?.completedLessons || 0, totalLessons));
  const completion = totalLessons > 0 ? Math.round(completedLessons / totalLessons * 100) : 0;
  return <section aria-label="Your learning overview">
    {detailed && <ReportToolbar query={query} label="Your current learning activity" />}
    <Metrics query={query} items={[
      { key: "totalEnrolledCourses", label: "Enrolled courses", icon: BookOpen, note: "Courses you can access" },
      { key: "completedCourses", label: "Completed courses", icon: CircleCheck, note: "All current lessons completed" },
      { key: "completedLessons", label: "Completed lessons", icon: CheckCheck, note: "Your learning milestones" },
      { key: "coursesInProgress", label: "In progress", icon: Play, note: "Started and still learning" },
    ]} />
    <QueryMessage query={queryState(query)} />
    {detailed && summary?.totalEnrolledCourses > 0 && (hasLessonTotals ? <section className="studio-panel analytics-learning-progress"><div><h2>Your lesson progress</h2><p>{count(completedLessons)} of {count(totalLessons)} lessons completed across your enrolled courses.{totalLessons === 0 && " Your published lessons will appear here when available."}</p></div><span className="analytics-progress-value">{completion}%</span><progress max={Math.max(1, totalLessons)} value={completedLessons} aria-label="Completed lessons across enrolled courses" aria-valuetext={`${completedLessons} of ${totalLessons} lessons completed (${completion}%)`} /></section> : <AnalyticsSkeleton label="Updating lesson progress" />)}
    {!query.isError && query.currentData?.summary.totalEnrolledCourses === 0 && <p className="analytics-empty">Your learning journey starts with your first course. <Link to="/courses" className="cw-text-link">Explore courses</Link></p>}
    {!detailed && <div className="analytics-report-links"><Link className="cw-text-link" to="/dashboard/progress">View your progress</Link></div>}
  </section>;
}

export function InstructorAnalytics({ view = "overview" }) {
  const [page, setPage] = useState(1);
  const query = instructorApi.endpoints.getAnalytics.useQuery({ page, limit: view === "overview" ? 5 : 10 }, options);
  const data = query.isError ? undefined : query.currentData;
  const items = view === "earnings" ? [
    { key: "verifiedSales", label: "Verified sales", icon: Receipt, note: "Recorded paid sales, excluding refunds and test payments" },
    { key: "totalCourses", label: "Your courses", icon: BookOpen, note: "All your recorded courses" },
  ] : [
    ...(view === "analytics" ? [{ key: "totalCourses", label: "Your courses", icon: BookOpen, note: "All your recorded courses" }] : []),
    { key: "publishedCourses", label: "Published courses", icon: BookOpen, note: "Available in the course catalog" },
    { key: "draftCourses", label: "In draft", icon: FileEdit, note: "Your courses in preparation" },
    { key: "totalEnrollments", label: "Total enrollments", icon: Users, note: "Confirmed, including free and test" },
    ...(view === "overview" ? [{ key: "verifiedSales", label: "Verified sales", icon: Receipt, note: "Paid sales, excluding test payments" }] : []),
  ];
  return <section aria-label="Your teaching overview">
    {view !== "overview" && <ReportToolbar query={query} label="All-time recorded-course activity" />}
    <Metrics query={query} items={items} />
    {view === "overview" && <div className="analytics-report-links"><Link className="cw-text-link" to="/instructor/analytics">Course analytics</Link><Link className="cw-text-link" to="/instructor/earnings">View earnings</Link></div>}
    <QueryMessage query={queryState(query)} />
    {!query.isError && <div className={`analytics-panels${view === "analytics" ? " analytics-panels-single" : ""}`} aria-busy={query.isFetching}>
      {view !== "earnings" && <section className="studio-panel analytics-courses">
        <div className="analytics-heading"><div><h2>Enrollments by course</h2><p>{data ? `${count(data.summary.totalCourses)} courses · Confirmed enrollments, excluding refunds` : "Your recorded courses"}</p></div></div>
        {!data ? <AnalyticsSkeleton label="Loading course statistics" /> : data.courses.length ? <>
          <table className="analytics-table"><caption className="sr-only">Enrollment totals for your courses</caption><thead><tr><th scope="col">Course</th><th scope="col">Status</th><th scope="col">Enrollments</th></tr></thead><tbody>{data.courses.map(course => <tr key={course._id}>
            <th scope="row"><Link className="cw-text-link" to={`/instructor/courses/${course._id}`}>{course.title}</Link></th>
            <td data-label="Status"><span className="cw-status cw-publication-status" data-status={courseStatus(course)}>{courseStatus(course)}</span></td>
            <td data-label="Enrollments" className="analytics-count"><Link className="cw-text-link" aria-label={`View ${count(course.enrollments)} enrollments for ${course.title}`} to={`/instructor/students?courseId=${course._id}`}>{count(course.enrollments)}</Link></td>
          </tr>)}</tbody></table>
          <Pagination pagination={data.pagination} page={page} onPage={setPage} loading={query.isFetching} />
        </> : <p className="analytics-empty">{page > 1 ? "No courses on this page." : "Create a course to start tracking your enrollments."}{page > 1 && <button className="cw-button" onClick={() => setPage(1)}>Back to first page</button>}</p>}
      </section>}
      {view !== "analytics" && <section className="studio-panel analytics-revenue"><h2>Verified revenue</h2><p>Verified sales after refunds and disputes. Free enrollments are excluded.</p>
        {!data ? <AnalyticsSkeleton label="Loading verified revenue" /> : data.revenue.length ? <dl>{data.revenue.map(item => <div key={`${item.currency}-${item.currencyExponent}`}><dt>{item.currency}</dt><dd>{new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency }).format(item.amountMinor / 10 ** item.currencyExponent)}</dd><p>{count(item.sales)} verified {item.sales === 1 ? "sale" : "sales"}</p></div>)}</dl> : <div className="analytics-empty"><Receipt size={22} aria-hidden="true" /><strong>No verified revenue yet</strong><p>Verified payments will appear here when learners purchase your courses.</p></div>}
        <p className="analytics-footnote">Sales totals before provider fees and payouts. Currencies are shown separately.</p>
      </section>}
      {view === "earnings" && <aside className="studio-panel analytics-report-note"><Receipt size={22} aria-hidden="true" /><h2>Understanding your earnings</h2><p>Each currency is reported separately using verified payment records. Changes to a course price do not change earlier sales.</p><p>This report shows course sales before provider fees and any instructor revenue share. It is not an available payout balance.</p><p>Payouts and withdrawals are not configured yet.</p><Link className="cw-button" to="/instructor/analytics">View course analytics</Link></aside>}
    </div>}
  </section>;
}

function ReportToolbar({ query, label }) {
  return <div className="analytics-report-toolbar"><p>{label}</p><button type="button" className="cw-button" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw size={15} aria-hidden="true" className={query.isFetching ? "motion-safe:animate-spin" : undefined} />{query.isFetching ? "Refreshing…" : "Refresh"}</button></div>;
}

function AnalyticsSkeleton({ label }) {
  return <div className="analytics-skeleton" role="status"><span className="sr-only">{label}</span>{[1, 2, 3].map(row => <span key={row} className="bg-muted motion-safe:animate-pulse" />)}</div>;
}
