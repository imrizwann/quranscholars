import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import { LearnerAnalytics } from "@/components/lms/DashboardAnalytics.jsx";
import LearnerLibrary from "@/features/recorded-courses/components/LearnerLibrary.jsx";

export default function LearnerProgress() {
  return <WorkspacePage eyebrow="Learner workspace" title="Your progress" description="See the lessons you have completed and the courses you are continuing.">
    <LearnerAnalytics detailed />
    <div className="studio-section-heading"><div><h2>Continue your learning</h2><p>Open a course to review individual lesson progress and pick up where you left off.</p></div></div>
    <LearnerLibrary />
  </WorkspacePage>;
}
