import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, FileEdit, Plus, UserRound } from "lucide-react";
import { WorkspacePage, WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import { DashboardMetrics } from "@/components/lms/DashboardParts.jsx";
import useCourseQuery from "@/features/instructor-courses/useCourseQuery.js";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import InstructorCourseCard from "@/features/instructor-courses/InstructorCourseCard.jsx";

export default function InstructorDashboard() {
  const query = useCourseQuery("getCourses", { limit: 3 });
  const drafts = useCourseQuery("getCourses", { limit: 1, status: "Draft" });
  const published = useCourseQuery("getCourses", { limit: 1, status: "Published" });
  const count = (result) => result.error ? "Unavailable" : result.data?.pagination?.totalCourses;
  const loadingCount = result => !result.data && !result.error;
  return <WorkspacePage eyebrow="Teaching workspace" title="Good teaching starts here." description="A clear view of your courses, with room to build something meaningful." action={<Link to="/instructor/courses/new" className="cw-button cw-primary"><Plus size={16} aria-hidden="true" />Create course</Link>}>
    <DashboardMetrics items={[{ icon: BookOpen, label: "Your courses", value: count(query), loading: loadingCount(query), note: "All recorded courses" }, { icon: FileEdit, label: "In draft", value: count(drafts), loading: loadingCount(drafts), note: "Keep shaping your next course" }, { icon: BookOpen, label: "Published", value: count(published), loading: loadingCount(published), note: "Available in the course catalog" }]} />
    <div className="studio-split"><section className="studio-hero"><div><span className="studio-label">Your knowledge. Their next step.</span><h2>Bring your next lesson to life.</h2><p>Organize your curriculum, add lesson videos, and preview the experience before learners arrive.</p><Link to="/instructor/courses" className="cw-button">Open course studio <ArrowRight size={16} aria-hidden="true" /></Link></div><div className="studio-hero-art" aria-hidden="true"><BookOpen strokeWidth={1} /></div></section><section className="studio-panel"><span className="studio-label">Quick access</span><h2>Keep your teaching moving</h2><div className="studio-shortcuts"><Link to="/instructor/courses/new"><Plus /><span><strong>Create a course</strong><small>Start with a simple draft</small></span><ArrowRight /></Link><Link to="/instructor/courses"><BookOpen /><span><strong>Manage your curriculum</strong><small>Sections, lessons and video</small></span><ArrowRight /></Link><Link to="/instructor/profile"><UserRound /><span><strong>Your profile</strong><small>Review your account details</small></span><ArrowRight /></Link></div></section></div>
    <div className="studio-section-heading"><div><h2>Recently updated courses</h2><p>Pick up right where you left off.</p></div><Link to="/instructor/courses">View all courses →</Link></div>
    <QueryMessage query={query} label="Loading your courses" />
    {!query.error && query.data?.courses?.length === 0 && <WorkspaceEmpty title="A new chapter starts with one course" description="Create your first draft and build your curriculum at your own pace." to="/instructor/courses/new" action="Create a course" />}
    <div className="studio-course-grid">{query.data?.courses?.map((course) => <InstructorCourseCard key={course._id} course={course} />)}</div>
  </WorkspacePage>;
}
