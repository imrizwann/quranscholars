import { useLocation } from "react-router-dom";
import { ClipboardCheck, Heart, ReceiptText } from "lucide-react";
import { WorkspaceAccount, WorkspaceEmpty, WorkspaceGuide, WorkspacePage } from "@/components/lms/WorkspaceUI.jsx";

const pages = {
  assignments: ["Assignments", "Practice, reflect, and build on what you learn.", ClipboardCheck, "A space for your coursework", "Assignments and instructor feedback will appear here when coursework is available."],
  wishlist: ["Wishlist", "Keep your next learning goal in sight.", Heart, "Discover what inspires you", "Course saving is not available yet. Explore the catalog to find subjects you would like to study."],
  purchases: ["Purchases", "Your course orders and receipts, in one place.", ReceiptText, "Your purchase history", "Purchase history is not available here yet. No example transactions or payment details are shown."],
};
export default function StudentSectionPage() {
  const key = useLocation().pathname.split("/").pop();
  if (["profile", "settings"].includes(key)) return <WorkspaceAccount settings={key === "settings"} />;
  const [title, description, Icon, emptyTitle, emptyDescription] = pages[key] || pages.assignments;
  return <WorkspacePage eyebrow="Learner workspace" title={title} description={description}><div className="studio-split"><WorkspaceEmpty icon={Icon} badge="Coming soon" title={emptyTitle} description={emptyDescription} to="/courses" action="Explore courses" /><WorkspaceGuide title="Your learning, thoughtfully organized" items={[["Explore with confidence", "Review course details, instructor information, and the complete lesson outline."], ["Keep your account current", "Your profile brings your learning activity together under one account."], ["Return to your library", "Use My learning to find your course and classroom workspace."]]} /></div></WorkspacePage>;
}
