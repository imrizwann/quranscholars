import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CircleDollarSign, Plus, Radio, Users } from "lucide-react";
import { DashboardAssignments, DashboardHeading, DashboardMetrics, DashboardPreviewNote, DashboardSchedule, DashboardSection } from "@/components/lms/DashboardParts.jsx";
import { assignments, liveClasses } from "@/data/lmsData.js";

export default function InstructorDashboard() {
  return <main className="dashboard-page">
    <DashboardHeading eyebrow="Your teaching workspace" title="Share knowledge. Inspire growth." description="A thoughtful space to manage your courses and support your learners.">
      <Link to="/instructor/courses/new" className="dashboard-button dashboard-button-primary"><Plus size={17} aria-hidden="true" />Create course</Link>
    </DashboardHeading>
    <DashboardPreviewNote />
    <DashboardMetrics items={[
      { icon: Users, label: "Total learners", value: "1,284", note: "Across your courses and classes" },
      { icon: BookOpen, label: "Active courses", value: "4", note: "1 additional course in draft" },
      { icon: Radio, label: "Live classes", value: "2", note: "Recurring weekly sessions" },
      { icon: CircleDollarSign, label: "Monthly earnings", value: "SAR 8,420", note: "After platform fees" },
    ]} />
    <div className="dashboard-teaching-grid">
      <section className="dashboard-teaching-card">
        <div className="dashboard-teaching-copy"><p className="dashboard-eyebrow">From your knowledge to their journey</p>
          <h2>Your next lesson<br />starts here.</h2>
          <p>Shape your curriculum, upload your lessons, and build a course that learners can return to.</p>
          <Link to="/instructor/courses" className="dashboard-button dashboard-button-light">Manage courses <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="dashboard-book-art" aria-hidden="true"><div className="dashboard-book-spine" /><BookOpen size={46} strokeWidth={1} /><span>KNOWLEDGE<br /><i>with purpose</i></span><span className="dashboard-book-rule" /></div>
      </section>
      <section className="dashboard-quick-links">
        <p className="dashboard-eyebrow">Your workspace</p><h2>Ready for your next step?</h2>
        <Link to="/instructor/courses/new"><span className="dashboard-row-icon"><BookOpen size={19} aria-hidden="true" /></span><span><strong>Create a course</strong><small>Turn a subject into a learning journey</small></span><ArrowRight size={17} aria-hidden="true" /></Link>
        <Link to="/instructor/resources"><span className="dashboard-row-icon dashboard-row-icon-neutral"><Plus size={19} aria-hidden="true" /></span><span><strong>Learning resources</strong><small>Keep your teaching materials together</small></span><ArrowRight size={17} aria-hidden="true" /></Link>
        <Link to="/instructor/live-classes"><span className="dashboard-row-icon"><Radio size={19} aria-hidden="true" /></span><span><strong>Live classes</strong><small>See your scheduled sessions</small></span><ArrowRight size={17} aria-hidden="true" /></Link>
      </section>
    </div>
    <div className="dashboard-detail-grid">
      <DashboardSection title="Teaching schedule" subtitle="Your recurring sessions, at a glance." to="/instructor/live-classes">
        <DashboardSchedule classes={liveClasses.slice(0, 2)} instructor />
      </DashboardSection>
      <DashboardSection title="Assignments" subtitle="Keep track of practice and coursework." to="/instructor/assignments">
        <DashboardAssignments items={assignments.slice(0, 2)} instructor />
      </DashboardSection>
    </div>
  </main>;
}
