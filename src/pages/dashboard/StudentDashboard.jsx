import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ClipboardCheck, Play, Radio } from "lucide-react";
import { DashboardAssignments, DashboardHeading, DashboardMetrics, DashboardPreviewNote, DashboardSchedule, DashboardSection } from "@/components/lms/DashboardParts.jsx";
import { assignments, liveClasses } from "@/data/lmsData.js";

export default function StudentDashboard() {
  const nextClass = liveClasses[0];
  return <main className="dashboard-page">
    <DashboardHeading eyebrow="Your learning journey" title="A little progress, every day." description="Make time for what matters. Your next lesson is waiting.">
      <Link to="/dashboard/learning" className="dashboard-button dashboard-button-outline">My learning <ArrowRight size={16} aria-hidden="true" /></Link>
    </DashboardHeading>
    <DashboardPreviewNote />
    <div className="dashboard-feature-grid">
      <section className="dashboard-study-card">
        <div className="dashboard-study-art" aria-hidden="true"><BookOpen strokeWidth={1} /></div>
        <div className="dashboard-study-content">
          <p className="dashboard-eyebrow">Pick up where you left off</p>
          <span className="dashboard-course-label">Recorded course · Tajweed</span>
          <h2>Tajweed<br />Foundations</h2>
          <p className="dashboard-study-lesson">Lesson 8 · Noon Sakinah and Tanween</p>
          <div className="dashboard-progress-label"><span>Your course progress</span><strong>38%</strong></div>
          <progress className="dashboard-progress" value="38" max="100" aria-label="Tajweed Foundations course progress">38%</progress>
          <Link to="/courses/tajweed-foundations" className="dashboard-button dashboard-button-light"><Play size={15} fill="currentColor" aria-hidden="true" />Continue course <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
      <section className="dashboard-next-class">
        <div className="dashboard-card-kicker"><span className="dashboard-eyebrow">Your next live class</span><Radio size={19} aria-hidden="true" /></div>
        <div className="dashboard-session-day"><span className="dashboard-calendar-label" aria-hidden="true"><span>Weekly</span><strong>TUE</strong></span><span>{nextClass.schedule}<small>{nextClass.time} · {nextClass.timezone}</small></span></div>
        <h2>{nextClass.title}</h2>
        <p className="dashboard-intro">Practice reading with guidance, one letter at a time.</p>
        <div className="dashboard-teacher"><span className="dashboard-teacher-avatar" aria-hidden="true">AA</span><span>{nextClass.instructor}<small>{nextClass.duration} live session</small></span></div>
        <Link to={`/classroom/${nextClass.slug}`} className="dashboard-button dashboard-button-outline">Open classroom <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </div>
    <DashboardMetrics items={[
      { icon: BookOpen, label: "Recorded courses", value: "3", note: "Learn at your own pace" },
      { icon: Radio, label: "Live classes", value: "2", note: "Learn together, in real time" },
      { icon: ClipboardCheck, label: "Open assignments", value: String(assignments.filter((item) => item.status !== "Submitted").length), note: "A chance to put learning into practice" },
    ]} />
    <div className="dashboard-detail-grid">
      <DashboardSection title="On your study list" subtitle="Small steps towards deeper understanding." to="/dashboard/assignments">
        <DashboardAssignments items={assignments.slice(0, 2)} />
      </DashboardSection>
      <DashboardSection title="Class schedule" subtitle="Build a rhythm that works for you.">
        <DashboardSchedule classes={liveClasses.slice(0, 2)} />
      </DashboardSection>
    </div>
  </main>;
}
