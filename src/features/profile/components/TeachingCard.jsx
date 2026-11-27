import { Link } from "react-router-dom";
import { ArrowRight, Presentation } from "lucide-react";
import { useGetMyInstructorApplicationQuery } from "@/services/api/user/instructorApplicationApi.js";

// Shown on /profile and the learner workspace profile. Styles live in pages/account/profile.css.
export default function TeachingCard({ user }) {
  const learner = user?.role === "user";
  const query = useGetMyInstructorApplicationQuery(undefined, { skip: !learner, refetchOnMountOrArgChange: true });
  const application = query.currentData?.application;

  let card = {
    badge: null,
    title: "Teach on DarsLearn",
    text: "Share your knowledge with learners everywhere. Apply with your teaching background and certificates, and our team will review your application.",
    primary: { to: "/instructor/application", label: "Apply to teach" },
    secondary: { to: "/get-started/instructor", label: "How teaching works" },
  };
  if (user?.role === "admin") card = {
    title: "Instructor applications",
    text: "Review teaching backgrounds and certificates before approving instructor access.",
    primary: { to: "/admin/instructor-applications", label: "Review applications" },
  };
  else if (user?.role === "instructor") card = {
    badge: { tone: "approved", label: "Instructor" },
    title: "Your teaching workspace",
    text: "Create courses, organise your lessons and follow how your learners are progressing.",
    primary: { to: "/instructor/courses", label: "Open Course Studio" },
    secondary: { to: "/instructor/dashboard", label: "Instructor dashboard" },
  };
  else if (application?.status === "pending") card = {
    badge: { tone: "pending", label: "Under review" },
    title: "Your teaching application",
    text: "Our team is reviewing your background and certificates. You can keep learning while you wait.",
    primary: { to: "/instructor/application", label: "View application" },
  };
  else if (application?.status === "rejected") card = {
    badge: { tone: "rejected", label: "Changes requested" },
    title: "Your teaching application",
    text: "Read the team's feedback, update your details or certificates and submit your application again.",
    primary: { to: "/instructor/application", label: "Revise application" },
  };
  else if (application?.status === "approved") card = {
    badge: { tone: "approved", label: "Approved" },
    title: "Your teaching application",
    text: "Your application has been approved. Open your application to see the next steps.",
    primary: { to: "/instructor/application", label: "View application" },
  };

  return (
    <section className="public-panel profile-teach" aria-labelledby="profile-teach-title" aria-busy={(learner && query.isLoading) || undefined}>
      <div className="profile-teach-head">
        <span className="profile-teach-icon"><Presentation size={20} aria-hidden="true" /></span>
        {card.badge && <span className="profile-badge" data-tone={card.badge.tone}>{card.badge.label}</span>}
      </div>
      <h2 id="profile-teach-title" className="profile-card-title">{card.title}</h2>
      <p>{learner && query.isLoading ? "Checking your teaching application…" : card.text}</p>
      <div className="profile-actions">
        <Link to={card.primary.to} className="cw-button cw-primary">{card.primary.label}<ArrowRight size={16} aria-hidden="true" /></Link>
        {card.secondary && <Link to={card.secondary.to} className="profile-text-link">{card.secondary.label}</Link>}
      </div>
    </section>
  );
}
