import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CircleHelp } from "lucide-react";
import { DashboardHeading } from "./DashboardParts.jsx";
import "./workspace-ui.css";

export function WorkspacePage({
  eyebrow,
  title,
  description,
  action,
  children,
}) {
  return (
    <main className="dashboard-page studio-page">
      <DashboardHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      >
        {action}
      </DashboardHeading>
      {children}
    </main>
  );
}

export function WorkspaceEmpty({
  icon: Icon = BookOpen,
  title,
  description,
  to,
  action,
  badge,
}) {
  return (
    <section className="studio-empty">
      <span className="studio-empty-icon">
        <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
      </span>
      {badge && <span className="studio-label">{badge}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      {to && (
        <Link className="cw-button cw-primary" to={to}>
          {action}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

export function WorkspaceGuide({
  title = "Make the most of your workspace",
  items,
}) {
  return (
    <aside className="studio-guide">
      <div className="studio-section-title">
        <CircleHelp size={20} aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <ol>
        {items.map(([heading, text], index) => (
          <li key={heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{heading}</h3>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
