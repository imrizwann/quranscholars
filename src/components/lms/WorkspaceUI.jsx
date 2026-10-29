import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, BookOpen, CircleHelp, ShieldCheck, UserRound } from "lucide-react";
import { DashboardHeading } from "./DashboardParts.jsx";
import "./workspace-ui.css";

export function WorkspacePage({ eyebrow, title, description, action, children }) {
  return <main className="dashboard-page studio-page"><DashboardHeading eyebrow={eyebrow} title={title} description={description}>{action}</DashboardHeading>{children}</main>;
}

export function WorkspaceEmpty({ icon: Icon = BookOpen, title, description, to, action, badge }) {
  return <section className="studio-empty"><span className="studio-empty-icon"><Icon size={28} strokeWidth={1.5} aria-hidden="true" /></span>{badge && <span className="studio-label">{badge}</span>}<h2>{title}</h2><p>{description}</p>{to && <Link className="cw-button cw-primary" to={to}>{action}<ArrowRight size={16} aria-hidden="true" /></Link>}</section>;
}

export function WorkspaceGuide({ title = "Make the most of your workspace", items }) {
  return <aside className="studio-guide"><div className="studio-section-title"><CircleHelp size={20} aria-hidden="true" /><h2>{title}</h2></div><ol>{items.map(([heading, text], index) => <li key={heading}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{heading}</h3><p>{text}</p></div></li>)}</ol></aside>;
}

export function WorkspaceAccount({ instructor = false, settings = false }) {
  const user = useSelector((state) => state.user.user);
  return <WorkspacePage eyebrow="Your account" title={settings ? "Account settings" : "Your profile"} description="Keep your account details up to date and your learning experience personal.">
    <div className="studio-split"><section className="studio-panel"><div className="studio-profile-header"><span className="studio-profile-avatar" aria-hidden="true">{user?.name?.trim()?.[0] || <UserRound />}</span><div><h2>{user?.name || "Your account"}</h2><p>{instructor ? "Instructor" : "Learner"} workspace</p></div></div><dl className="studio-account-fields"><div><dt>Name</dt><dd>{user?.name || "Not provided"}</dd></div><div><dt>Email address</dt><dd>{user?.email || "Not provided"}</dd></div><div><dt>Account role</dt><dd>{user?.role || "Learner"}</dd></div></dl><Link to="/profile" className="cw-button cw-primary">Manage account <ArrowRight size={16} aria-hidden="true" /></Link></section><section className="studio-panel studio-soft"><ShieldCheck size={28} aria-hidden="true" /><h2>One account, all your learning</h2><p>Your account details are shared across your courses and classrooms. Open account management to update your profile photo or manage your account.</p><p>Notification and language preferences are not available yet.</p></section></div>
  </WorkspacePage>;
}
