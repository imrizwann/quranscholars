import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, BookOpen, Compass, UserRound } from "lucide-react";
import { WorkspacePage, WorkspaceGuide } from "@/components/lms/WorkspaceUI.jsx";
import LearnerLibrary from "@/features/recorded-courses/components/LearnerLibrary.jsx";

export default function StudentDashboard() {
  const user = useSelector((state) => state.user.user);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  return <WorkspacePage eyebrow="Learning workspace" title={firstName ? `Welcome back, ${firstName}.` : "Welcome to your learning space."} description="Make space for a little learning every day. Your next chapter starts here." action={<Link to="/courses" className="cw-button cw-primary"><Compass size={16} aria-hidden="true" />Explore courses</Link>}>
    <section className="studio-hero"><div><span className="studio-label">Learn with intention</span><h2>A deeper understanding, one lesson at a time.</h2><p>Explore Quran, Tajweed, and Islamic studies. Find a course that fits your level and learn at your own pace.</p><Link to="/courses" className="cw-button">Find your next course <ArrowRight size={16} aria-hidden="true" /></Link></div><div className="studio-hero-art" aria-hidden="true"><BookOpen strokeWidth={1} /></div></section>
    <div className="studio-split"><section className="studio-panel"><span className="studio-label">Your learning essentials</span><h2>A place for every step</h2><div className="studio-shortcuts"><Link to="/dashboard/learning"><BookOpen /><span><strong>My learning</strong><small>Your course and classroom library</small></span><ArrowRight /></Link><Link to="/courses"><Compass /><span><strong>Discover a course</strong><small>View the curriculum and watch a trailer</small></span><ArrowRight /></Link><Link to="/dashboard/profile"><UserRound /><span><strong>Your profile</strong><small>Review and manage your account</small></span><ArrowRight /></Link></div></section><WorkspaceGuide title="Build a learning routine" items={[["Find your starting point", "Choose a subject and level that match your goals."], ["Look inside the course", "Watch the trailer and review the lesson outline before you decide."], ["Make time to return", "A short, regular study session can help you build lasting understanding."]]} /></div>
    <div className="studio-section-heading"><div><h2>Your learning library</h2><p>Courses you have access to, ready when you are.</p></div><Link to="/dashboard/learning">View library →</Link></div><LearnerLibrary compact />
  </WorkspacePage>;
}
