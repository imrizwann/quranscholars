import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import LearnerLibrary from "@/features/recorded-courses/components/LearnerLibrary.jsx";

export default function MyLearning() {
  // Live-class tabs and classroom pages remain in source for a later release.
  // Older ?type=live-classes links open the working recorded-course library.
  // Restore useSearchParams, Radio, WorkspaceEmpty and WorkspaceGuide with it.
  return <WorkspacePage eyebrow="Your library" title="My learning" description="Your enrolled courses, saved progress, and next lessons in one place." action={<Link to="/courses" className="cw-button">Browse courses <ArrowRight size={16} aria-hidden="true" /></Link>}>
    {/* Post-MVP live-class switcher:
    <div className="studio-tabs" aria-label="Learning type">{[[false, "Recorded courses"], [true, "Live classes"]].map(([value, label]) => <button key={label} type="button" aria-pressed={live === value} onClick={() => setParams({ type: value ? "live-classes" : "courses" })}>{label}</button>)}</div>
    {live ? <div className="studio-split"><WorkspaceEmpty icon={Radio} badge="Coming soon" title="Your classrooms, together" description="Your enrolled live classes will be available here when classroom enrollment is connected." to="/live-classes" action="Explore live classes" /><WorkspaceGuide title="Find the right course" items={[["Explore the curriculum", "See the sections and lesson titles before joining."], ["Meet your instructor", "Use the public trailer to get a feel for their teaching."], ["Learn at your pace", "Choose a course that fits your schedule and experience."]]} /></div> : <LearnerLibrary />}
    */}
    <LearnerLibrary />
  </WorkspacePage>;
}
