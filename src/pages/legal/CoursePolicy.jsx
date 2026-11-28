import { Link } from "react-router-dom";
import { CalendarDays, CirclePlay, ReceiptText, RotateCcw } from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import LegalDocument from "@/components/legal/LegalDocument.jsx";
import { useGetCoursePolicyQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import "@/components/lms/workspace-ui.css";

const summaryIcons = [CalendarDays, CirclePlay, RotateCcw];

// The policy text comes from the API so every purchase can record the version it was made under.
export default function CoursePolicy() {
  const query = useGetCoursePolicyQuery();
  const policy = query.currentData;
  const email = policy?.contactEmail || "contact@darslearn.com";
  return <main className="bg-[#fbfcfa]">
    <MarketingHero
      eyebrow="Before you enroll"
      title={policy?.title || "Refund & cancellation policy"}
      description={policy?.introduction || "What you get when you buy a course, when you can ask for a refund, and how we handle your request."}
      icon={ReceiptText}
      primaryAction={{ to: "/dashboard/purchases", label: "Find your payment reference" }}
      secondaryAction={{ to: "/contact", label: "Contact our team" }}
      highlights={policy ? [
        { label: "Effective date", value: policy.effectiveDate },
        { label: "Refund window", value: `${policy.refundDays} calendar days, course not started` },
        { label: "Refund help", value: email },
      ] : []}
      labelledBy="course-policy-title"
    />
    {!policy && !query.isError ? <div className="page-container py-14"><LoadingState label="Loading course policy" /></div>
      : query.isError && !policy ? <div className="page-container py-14"><div className="studio-panel mx-auto max-w-2xl" role="alert"><h2 className="text-xl font-semibold">The policy is temporarily unavailable</h2><p className="mt-2 text-muted-foreground">Please try again before enrolling, or contact our team for help.</p><button type="button" className="cw-button mt-4" disabled={query.isFetching} onClick={query.refetch}>Try again</button></div></div>
      : <LegalDocument
        summary={(policy.summary || []).map((item, index) => ({ ...item, icon: summaryIcons[index] }))}
        sections={policy.sections}
        contact={{ title: "Need help with a purchase?", text: "Email us from your registered address with the course name and payment reference. You can find the reference under Purchases in your dashboard.", email }}
      >
        <p className="text-sm text-muted-foreground">Policy version {policy.version} · See also our <Link to="/privacy" className="cw-text-link">privacy policy</Link></p>
      </LegalDocument>}
  </main>;
}
