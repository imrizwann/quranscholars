import { NavLink } from "react-router-dom";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { InstructorAnalytics } from "@/components/lms/DashboardAnalytics.jsx";
import RevenueDashboard from "@/features/revenue/RevenueDashboard.jsx";

export default function InstructorReports({ kind }) {
  const earnings = kind === "earnings";
  if (earnings) return <RevenueDashboard />;
  return <WorkspacePage eyebrow="Teaching workspace" title={earnings ? "Earnings" : "Course analytics"} description={earnings ? "Review your verified recorded-course sales and revenue." : "Understand your course portfolio and see where learners are enrolling."} action={<nav className="analytics-report-navigation" aria-label="Instructor reports"><NavLink className="cw-button" to="/instructor/analytics">Analytics</NavLink><NavLink className="cw-button" to="/instructor/earnings">Earnings</NavLink></nav>}>
    <InstructorAnalytics key={kind} view={kind} />
  </WorkspacePage>;
}
