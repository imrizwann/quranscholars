import { HandHeart, ShieldCheck, SlidersHorizontal, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import LegalDocument from "@/components/legal/LegalDocument.jsx";

const LAST_UPDATED = "27 November 2026";
const EMAIL = "contact@darslearn.com";

const summary = [
  { icon: HandHeart, title: "Only what we need", text: "We collect what is needed to run your account, deliver your courses, and process payments." },
  { icon: LockKeyhole, title: "Never sold", text: "We do not sell your personal information or use advertising trackers." },
  { icon: SlidersHorizontal, title: "You stay in control", text: "Update your details at any time, or ask us for a copy or deletion." },
];

const sections = [
  { id: "information", title: "Information we collect", paragraphs: [
    "Depending on how you use DarsLearn, we collect:",
  ], items: [
    "Account details: your name, email address, and password (stored only as a secure hash), or your Google account if you sign in with Google, plus a profile photo if you add one.",
    "Profile details you choose to add, such as gender, city, state, country, and preferred language.",
    "Learning activity: your enrollments, the lessons you watch and your progress, quiz attempts and results, private notes, and course reviews.",
    "Purchase records: the course, amount, payment status, and the payment reference from our payment provider. Card and bank details are entered with the payment provider, not stored by DarsLearn.",
    "Messages you send us through the contact form or by email.",
    "For instructors: application details (name, email, teaching background, languages) and documents submitted for review, course content, and earnings and payout records.",
    "Technical information such as device and browser type, IP address, sign-in sessions, and error logs.",
  ] },
  { id: "use", title: "How we use your information", items: [
    "Create and secure your account, including email verification and password resets.",
    "Give you access to the courses you enroll in, save your progress, and let you continue where you left off.",
    "Process payments, send receipts, and handle refund requests. Your viewing activity is used to check refund eligibility.",
    "Send essential emails, such as purchase confirmations and important account notices.",
    "Review instructor applications and pay instructors their earnings.",
    "Prevent fraud, account sharing, and misuse, and meet our legal obligations.",
    "Improve reliability, accessibility, and the learning experience.",
  ] },
  { id: "visibility", title: "What others can see", items: [
    "The instructor of a course you enroll in can see your name, email address, profile photo, enrollment date, progress, and quiz results for that course.",
    "Reviews you post (rating, comment, and your first name and last initial) are public on the course page.",
    "Instructor profiles (name, photo, biography, and teaching details) are shown publicly on course pages.",
    "Your notes are private to you.",
  ] },
  { id: "providers", title: "Service providers", paragraphs: [
    "We use trusted providers to run DarsLearn. Each receives only the information it needs to provide its service:",
  ], items: [
    "Payments: Razorpay",
    "Video and file storage and delivery: Cloudflare",
    "Database hosting: MongoDB Atlas",
    "Background processing: Redis Cloud",
    "Email delivery: Resend",
    "Sign-in with Google, if you choose it: Google",
  ], note: "We do not sell personal information. We may disclose information when the law requires it, or when needed to protect learners, instructors, or the platform." },
  { id: "retention", title: "How long we keep information", paragraphs: [
    "We keep your account and learning information while your account is active. Purchase and payment records are kept for as long as accounting, tax, and other legal requirements need them, even after an account is deleted.",
    "Some records may also be kept to resolve disputes or prevent misuse. When information is no longer needed, we delete or anonymise it.",
  ] },
  { id: "security", title: "How we protect it", items: [
    "Passwords are stored only as secure hashes, never in readable form.",
    "Course videos and files are delivered through protected, time-limited links.",
    "Access to personal records is limited to people who need it for their role.",
  ], note: "No online service can promise perfect security. If you notice anything suspicious on your account, change your password and contact us." },
  { id: "children", title: "Children", paragraphs: [
    "If a learner is under 18, a parent or guardian should create or supervise the account. Parents and guardians can contact us to see, correct, or delete their child's information.",
  ] },
  { id: "rights", title: "Your choices and rights", paragraphs: [
    "Depending on where you live and the laws that apply, you can:",
  ], items: [
    "See and correct your details. Most can be updated yourself in Profile and Settings.",
    "Ask for a copy of the personal information we hold about you.",
    "Ask us to delete your information, where the law allows it.",
    "Withdraw consent for optional communications.",
    "Raise a concern about how your information is handled.",
  ], note: `To make a request, email ${EMAIL} from your registered email address so we can verify it is you.` },
  { id: "cookies", title: "Cookies and browser storage", paragraphs: [
    "We use essential cookies and browser storage to keep you signed in, protect your account, and remember your preferences. We do not use advertising cookies. If you block them, signing in and some features will stop working.",
  ] },
  { id: "changes", title: "Changes to this policy", paragraphs: [
    `We may update this policy as DarsLearn grows. The date at the top shows when it last changed. If a change is significant, we will let you know by email or on the website.`,
  ] },
];

export default function PrivacyPolicy() {
  return <main className="bg-[#fbfcfa] text-[#172b24]">
    <MarketingHero
      eyebrow="Privacy and data protection"
      title="Your information, explained clearly."
      description="How DarsLearn collects, uses, shares, and protects personal information when you browse our website, create an account, learn, teach, or contact us."
      icon={ShieldCheck}
      primaryAction={{ to: "/contact", label: "Contact us about privacy" }}
      secondaryAction={{ to: "/course-policy", label: "Refund policy" }}
      highlights={[
        { label: "Last updated", value: LAST_UPDATED },
        { label: "Applies to", value: "The DarsLearn website, accounts, courses, and support" },
        { label: "Privacy contact", value: EMAIL },
      ]}
      labelledBy="privacy-title"
    />
    <LegalDocument summary={summary} sections={sections} contact={{ title: "Questions about your information?", text: "For access, correction, or deletion requests, or any privacy question, contact us with enough detail to identify your account.", email: EMAIL }}>
      <p className="text-sm text-muted-foreground">See also our <Link to="/course-policy" className="cw-text-link">refund and cancellation policy</Link></p>
    </LegalDocument>
  </main>;
}
