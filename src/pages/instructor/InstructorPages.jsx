import InstructorStudents from "./InstructorStudents.jsx";
import InstructorReports from "./InstructorReports.jsx";
import { useLocation } from "react-router-dom";
import { ClipboardCheck, Library, MessageSquareText, Radio } from "lucide-react";
import { WorkspaceAccount, WorkspaceEmpty, WorkspaceGuide, WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";
export { default as InstructorDashboard } from "./InstructorDashboard.jsx";

const pages = {
  "live-classes": { title: "Live classes", intro: "A dedicated space for teaching and learning together.", icon: Radio, empty: "Bring your classroom online", description: "Live teaching is coming soon. You can create recorded courses and support your learners today.", steps: [["Plan your sessions", "Choose a topic and a clear outcome for each meeting."], ["Set a steady rhythm", "Consider session length, time zones, and time for practice."], ["Prepare your materials", "Keep your teaching notes and exercises ready for your learners."]] },
  assignments: { title: "Assignments", intro: "Turn understanding into practice, one activity at a time.", icon: ClipboardCheck, empty: "Give learning room to grow", description: "Assignments are coming soon. For now, include practice activities and clear instructions in your lessons.", steps: [["Start with an outcome", "Decide what learners should be able to demonstrate."], ["Keep instructions clear", "Give practical steps and realistic expectations."], ["Plan helpful feedback", "Look for opportunities to guide the next attempt."]] },
  resources: { title: "Learning resources", intro: "Make room for the materials that support your teaching.", icon: Library, empty: "Your teaching toolkit", description: "Your resource library is coming soon. Continue building your curriculum in the course studio.", steps: [["Organize by topic", "Keep related notes and exercises together."], ["Choose useful formats", "Prepare readable documents and accessible materials."], ["Connect to a lesson", "Give each resource a clear purpose in the learning journey."]] },
  reviews: { title: "Learner reviews", intro: "Listen, reflect, and keep improving your courses.", icon: MessageSquareText, empty: "A space for learner feedback", description: "Learner reviews are coming soon. Clear course descriptions and thoughtful lessons help set the right expectations.", steps: [["Set clear expectations", "Help learners choose a course that fits their goals."], ["Teach with consistency", "Give each lesson a clear structure and purpose."], ["Stay open to feedback", "Use learner perspectives to improve your teaching."]] },
};

export function InstructorSectionPage() {
  const key = useLocation().pathname.split("/").pop();
  if (key === "students") return <InstructorStudents />;
  if (["earnings", "analytics"].includes(key)) return <InstructorReports kind={key} />;
  if (["profile", "settings"].includes(key)) return <WorkspaceAccount instructor settings={key === "settings"} />;
  const page = pages[key] || pages["live-classes"];
  return <WorkspacePage eyebrow="Teaching workspace" title={page.title} description={page.intro}><div className="studio-split"><WorkspaceEmpty icon={page.icon} badge="Coming soon" title={page.empty} description={page.description} to="/instructor/courses" action="Open course studio" /><WorkspaceGuide title="Prepare for your next step" items={page.steps} /></div></WorkspacePage>;
}

export function CreationWizard() {
  return <WorkspacePage eyebrow="Live teaching" title="Create a live class" description="A new way to bring your learners together."><WorkspaceEmpty icon={Radio} badge="Coming soon" title="Live-class creation is being prepared" description="Scheduling and enrollment are not available yet. You can create and manage recorded courses now." to="/instructor/courses/new" action="Create a recorded course" /></WorkspacePage>;
}
