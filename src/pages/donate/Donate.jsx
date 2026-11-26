import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  HandHeart,
  Landmark,
  Mail,
  MessageCircle,
  ReceiptText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { contactDetails } from "@/data/contactDetails.js";
import "../about/about.css";
import "./donate.css";

// Donations are arranged directly with our team: this page never publishes payment details.
const enquiryBody = [
  "Assalamu alaikum,",
  "",
  "I would like to support DarsLearn.",
  "",
  "Name:",
  "Area I would like to support (learning access, madrasa support, community spaces, family relief, sponsoring a learner, or not sure yet):",
  "Approximate amount (optional):",
  "",
  "Please share the current verified campaign and payment details.",
].join("\n");
const enquiryHref = `mailto:${contactDetails.email}?subject=${encodeURIComponent("Donation enquiry")}&body=${encodeURIComponent(enquiryBody)}`;

const causes = [
  { icon: BookOpenCheck, title: "Learning access", text: "Help eligible learners access structured courses and essential learning resources." },
  { icon: Building2, title: "Madrasa support", text: "Strengthen teaching environments with resources, teacher support and learning materials." },
  { icon: Landmark, title: "Community spaces", text: "Support carefully reviewed educational and worship-space needs in underserved communities." },
  { icon: HandHeart, title: "Family relief", text: "Contribute to approved initiatives that address essential needs with dignity and care." },
];

const steps = [
  { icon: Send, title: "Tell us what you would like to support", text: "Email or message us with the area you have in mind, or ask us to suggest one." },
  { icon: ShieldCheck, title: "We confirm the campaign", text: "We reply with the current campaign, what it supports and how your contribution will be used." },
  { icon: HandHeart, title: "Give through the verified route", text: "Use only the payment details we share with you directly through an official DarsLearn channel." },
  { icon: ReceiptText, title: "Receive written confirmation", text: "Send us your transaction reference and we confirm your contribution in writing." },
];

const sponsorPoints = [
  "We share current sponsorship needs and how learners are chosen",
  "You can support one learner or a wider programme",
  "You decide after you have all the information",
];

const questions = [
  {
    question: "Can I donate online on this page?",
    answer: "Not on this page. To protect donors from fraud, we never publish permanent payment details. Contact us and we share the current verified details directly.",
  },
  {
    question: "How will my donation be used?",
    answer: "Before you give, we confirm the active campaign and its purpose with you, so you know exactly what your contribution supports.",
  },
  {
    question: "Will I receive a confirmation?",
    answer: "Yes. Keep your transaction reference and email it to us with the campaign you supported. We confirm your contribution in writing.",
  },
];

export default function Donate() {
  return (
    <main className="about-page donate-page">
      {/* Hero */}
      <section className="about-hero" aria-labelledby="donate-title">
        <span className="about-hero-pattern" aria-hidden="true" />
        <div className="about-shell about-hero-grid">
          <div className="about-hero-copy">
            <nav className="about-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Donate</span>
            </nav>
            <p className="about-hero-eyebrow">Support the mission</p>
            <h1 id="donate-title">Help make beneficial learning <span>reachable for more people.</span></h1>
            <p className="about-hero-lead">
              Your support helps learners access courses, helps teachers serve, and strengthens educational foundations in communities that need them most.
            </p>
            <div className="about-hero-actions">
              <a href={enquiryHref} className="about-btn about-btn--gold">Request donation details<ArrowRight size={16} aria-hidden="true" /></a>
              <Link to="/mission" className="about-btn about-btn--ghost">Read our mission</Link>
            </div>
          </div>

          <aside className="donate-trust" aria-labelledby="donate-trust-title">
            <span className="donate-trust-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
            <h2 id="donate-trust-title">Verified giving only</h2>
            <p>We never publish bank or payment details on this website. To keep your gift safe, we share the current verified details with you directly.</p>
            <div className="donate-trust-channels">
              <a href={enquiryHref}><Mail size={17} aria-hidden="true" /><span><strong>Email us</strong><small>{contactDetails.email}</small></span></a>
              <a href={contactDetails.whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true" /><span><strong>WhatsApp</strong><small>{contactDetails.phone}</small></span><span className="sr-only"> (opens in a new tab)</span></a>
            </div>
          </aside>
        </div>
      </section>

      {/* Causes */}
      <section className="about-section" aria-labelledby="donate-causes-title">
        <div className="about-shell">
          <div className="about-intro">
            <p className="about-eyebrow">Areas you can support</p>
            <h2 id="donate-causes-title">Give toward a clear, current need.</h2>
            <p>Campaigns change over time. We confirm the active purpose with you before accepting support for any area.</p>
          </div>
          <ul className="donate-causes">
            {causes.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="about-icon"><Icon size={21} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How giving works */}
      <section className="about-section about-features" aria-labelledby="donate-steps-title">
        <div className="about-shell">
          <div className="about-intro">
            <p className="about-eyebrow">How giving works</p>
            <h2 id="donate-steps-title">Four simple, safe steps.</h2>
          </div>
          <ol className="donate-steps">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title}>
                <div className="donate-step-top">
                  <span className="donate-step-number" aria-hidden="true">{index + 1}</span>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3><span className="sr-only">Step {index + 1}: </span>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sponsor a learner */}
      <section className="about-section about-standards" aria-labelledby="donate-sponsor-title">
        <span className="about-standards-pattern" aria-hidden="true" />
        <div className="about-shell donate-sponsor">
          <div className="about-intro about-intro--dark">
            <p className="about-eyebrow">Sponsor a learner</p>
            <h2 id="donate-sponsor-title">Help someone begin a course they could not afford.</h2>
            <p>Ask about current sponsorship needs. We explain who is eligible and how support is assigned before you decide.</p>
            <div className="about-hero-actions">
              <a href={enquiryHref} className="about-btn about-btn--gold">Discuss sponsorship<ArrowRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <ul className="donate-sponsor-points">
            <li className="donate-sponsor-head"><span className="about-icon about-icon--gold"><GraduationCap size={21} aria-hidden="true" /></span><strong>What to expect</strong></li>
            {sponsorPoints.map(point => <li key={point}><Check size={16} strokeWidth={2.5} aria-hidden="true" />{point}</li>)}
          </ul>
        </div>
      </section>

      {/* Questions */}
      <section className="about-section" aria-labelledby="donate-faq-title">
        <div className="about-shell donate-faq-grid">
          <div className="about-intro">
            <p className="about-eyebrow">Questions donors ask</p>
            <h2 id="donate-faq-title">Give with confidence.</h2>
            <p>Anything else? Email <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a> and we will be glad to help.</p>
          </div>
          <div className="donate-faq">
            {questions.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
            <p className="donate-safety"><ShieldCheck size={17} aria-hidden="true" />If anyone asks you to pay into an account we have not confirmed with you directly, please contact us before sending money.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
