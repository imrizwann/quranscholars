import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { useGetCoursePolicyQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import "@/components/lms/workspace-ui.css";

export default function CoursePolicy() {
  const query = useGetCoursePolicyQuery();
  const policy = query.currentData;
  return <main>
    <MarketingHero eyebrow="Before you enroll" title="Course access & refunds" description="Clear information about your enrollment, access to lessons, and how to request help or a refund." icon={ShieldCheck} primaryAction={{ to: "/courses", label: "Explore courses" }} secondaryAction={{ to: "/contact", label: "Contact our team" }} labelledBy="course-policy-title" />
    <div className="page-container py-10 sm:py-14">
      {!policy && !query.isError ? <LoadingState label="Loading course policy" /> : query.isError ? <div className="studio-panel" role="alert"><h2>The policy is temporarily unavailable</h2><p>Please try again before enrolling, or contact our team for help.</p><button type="button" className="cw-button mt-4" disabled={query.isFetching} onClick={query.refetch}>Try again</button></div> : <div className="mx-auto grid max-w-4xl gap-6">
        <p className="text-sm text-muted-foreground">Effective {policy.effectiveDate} · Policy version {policy.version}</p>
        <nav aria-label="Policy sections" className="flex flex-wrap gap-3">{policy.sections.map(section => <a key={section.id} href={`#${section.id}`} className="cw-button">{section.title}</a>)}</nav>
        {policy.sections.map(section => <section key={section.id} id={section.id} className="studio-panel scroll-mt-24"><h2 className="text-xl font-semibold">{section.title}</h2>{section.paragraphs.map((paragraph, index) => <p key={index} className="mt-4 leading-7 text-muted-foreground">{paragraph}</p>)}</section>)}
        <p>Need help with a specific purchase? <Link to="/dashboard/purchases" className="cw-text-link">Find your payment reference</Link> or <Link to="/contact" className="cw-text-link">contact our team</Link>.</p>
      </div>}
    </div>
  </main>;
}
