import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, Compass } from "lucide-react";
import { WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
import LearnerLibrary from "@/features/recorded-courses/components/LearnerLibrary.jsx";
import ContinueLearning from "@/features/recorded-courses/components/ContinueLearning.jsx";
import { LearnerAnalytics } from "@/components/lms/DashboardAnalytics.jsx";

export default function StudentDashboard() {
  const user = useSelector((state) => state.user.user);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  return (
    <WorkspacePage
      eyebrow="Overview"
      title={firstName ? `Welcome back, ${firstName}.` : "Welcome to your learning space."}
      description="Pick up where you left off. A short lesson today keeps your progress moving."
      action={
        <Link to="/courses" className="cw-button">
          <Compass size={16} aria-hidden="true" />
          Explore courses
        </Link>
      }
    >
      <ContinueLearning />
      <LearnerAnalytics emptyHint={false} />
      <div className="studio-section-heading">
        <div>
          <h2>Your courses</h2>
          <p>Everything you have enrolled in, ready when you are.</p>
        </div>
        <Link to="/dashboard/learning">
          Open My learning <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <LearnerLibrary compact />
    </WorkspacePage>
  );
}
