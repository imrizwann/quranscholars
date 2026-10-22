import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronRight, ClipboardCheck } from "lucide-react";

export function DashboardHeading({ eyebrow, title, description, children }) {
  return <div className="dashboard-heading">
    <div><p className="dashboard-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="dashboard-intro">{description}</p></div>
    {children && <div className="dashboard-actions">{children}</div>}
  </div>;
}

export function DashboardMetrics({ items }) {
  return <dl className="dashboard-metrics">{items.map(({ icon: Icon, label, value, note }) => (
    <div className="dashboard-metric" key={label}>
      <dt><span>{label}</span><Icon size={18} aria-hidden="true" /></dt>
      <dd>{value}</dd><p>{note}</p>
    </div>
  ))}</dl>;
}

export function DashboardSection({ title, subtitle, to, linkLabel = "View all", children }) {
  return <section className="dashboard-panel">
    <div className="dashboard-section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {to && <Link to={to} className="dashboard-text-link">{linkLabel}<ArrowRight size={15} aria-hidden="true" /></Link>}
    </div>{children}
  </section>;
}

export function DashboardSchedule({ classes, instructor = false }) {
  return <div className="dashboard-list">{classes.map((item) => (
    <Link className="dashboard-list-row" to={instructor ? "/instructor/live-classes" : `/classroom/${item.slug}`} key={item.id}>
      <span className="dashboard-row-icon"><CalendarDays size={21} aria-hidden="true" /></span>
      <div className="dashboard-row-copy"><h3>{item.title}</h3><p>{item.schedule} &middot; {item.time}</p>
        <span className="dashboard-row-detail">{instructor ? `${item.students} learners` : item.instructor} &middot; {item.timezone}</span></div>
      <ChevronRight size={17} className="dashboard-row-arrow" aria-hidden="true" />
    </Link>
  ))}</div>;
}

export function DashboardAssignments({ items, instructor = false }) {
  return <div className="dashboard-list">{items.map((item) => (
    <Link className="dashboard-list-row" key={item.id} to={instructor ? "/instructor/assignments" : "/dashboard/assignments"}>
      <span className="dashboard-row-icon dashboard-row-icon-neutral"><ClipboardCheck size={20} aria-hidden="true" /></span>
      <div className="dashboard-row-copy"><h3>{item.title}</h3><p>{item.context}</p><span className="dashboard-row-detail">Due {item.due}</span></div>
      <span className={`dashboard-status${item.status === "Due soon" ? " dashboard-status-amber" : ""}`}>{item.status}</span>
    </Link>
  ))}</div>;
}

export function DashboardPreviewNote() {
  return <p className="dashboard-preview-note"><span aria-hidden="true" />Preview data · Activity, schedules and figures shown here are examples.</p>;
}
