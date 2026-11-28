import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ChevronRight,
  CirclePlay,
  LayoutDashboard,
  ListChecks,
  Lock,
  NotebookPen,
  Presentation,
  ReceiptText,
  RotateCcw,
  Scale,
} from "lucide-react";
import { contactDetails } from "@/data/contactDetails.js";
import "./about.css";

// Facts shown in the hero. Keep these accurate: they are what visitors use to judge us.
const glance = [
  { label: "What we are", value: "An online platform for structured, recorded video courses" },
  { label: "First subject", value: "Quran recitation (Tajweed) for beginners" },
  { label: "Coming next", value: "Computer science, English, mathematics and science" },
  { label: "Based in", value: contactDetails.location },
  { label: "Learn from", value: "Anywhere, on your phone, tablet or computer" },
];

const features = [
  { icon: ListChecks, title: "Structured video courses", text: "Every course is divided into sections of short lessons that build on each other, so you always know what comes next." },
  { icon: CirclePlay, title: "Preview before you enroll", text: "See the full lesson outline, your teacher and the price, and watch the introduction video where one is available." },
  { icon: RotateCcw, title: "Progress that follows you", text: "Your last lesson and video position are saved to your account and ready on any device." },
  { icon: NotebookPen, title: "Notes and lesson resources", text: "Write private notes while you watch and download the materials your teacher provides." },
];

const standards = [
  {
    icon: BadgeCheck,
    title: "Reviewed teachers",
    text: "Teachers apply with their background and supporting certificates. Every application is reviewed before a teacher can publish a course.",
    link: { to: "/get-started/instructor", label: "How teaching works" },
  },
  {
    icon: BookOpenCheck,
    title: "Honest course information",
    text: "Each course page shows its level, language, lessons, teacher and price before you pay, so you know exactly what you are enrolling in.",
    link: { to: "/courses", label: "Browse courses" },
  },
  {
    icon: Scale,
    title: "Fair access and refunds",
    text: "One payment gives you access to a course with no fixed expiry. If it is not right for you, you can request a refund within 7 days of purchase, as long as you have not started the course.",
    link: { to: "/course-policy", label: "Access and refund policy" },
  },
  {
    icon: Lock,
    title: "Privacy and secure payments",
    text: "Payments are handled by our secure payment provider, and we never see your card details. We will never ask for your password, card PIN or one-time passwords.",
    link: { to: "/privacy", label: "Privacy policy" },
  },
];

const teacherBenefits = [
  { icon: Presentation, text: "Build your course with sections, video lessons, resources and quizzes" },
  { icon: ReceiptText, text: "Set your price and follow your enrollments and earnings" },
  { icon: LayoutDashboard, text: "See how your learners are progressing from your instructor dashboard" },
];

export default function About() {
  return (
    <main className="about-page">
      {/* Hero */}
      <section className="about-hero" aria-labelledby="about-title">
        <span className="about-hero-pattern" aria-hidden="true" />
        <div className="about-shell about-hero-grid">
          <div className="about-hero-copy">
            <nav className="about-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">About</span>
            </nav>
            <p className="about-hero-eyebrow">About DarsLearn</p>
            <h1 id="about-title">Clear, structured learning, <span>one lesson at a time.</span></h1>
            <p className="about-hero-lead">
              DarsLearn is an online learning platform for recorded video courses. Every course is organised into short lessons, taught by a reviewed teacher, and saved to your account so you can learn at your own pace.
            </p>
            <div className="about-hero-actions">
              <Link to="/courses" className="about-btn about-btn--gold">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to="/mission" className="about-btn about-btn--ghost">Read our mission</Link>
            </div>
          </div>

          <aside className="about-glance" aria-labelledby="about-glance-title">
            <h2 id="about-glance-title">At a glance</h2>
            <dl>
              {glance.map(({ label, value }) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      {/* Story */}
      <section className="about-section about-story" aria-labelledby="about-story-title">
        <div className="about-shell about-story-grid">
          <div className="about-word" aria-hidden="true">
            <span className="about-word-arabic" lang="ar">درس</span>
            <span className="about-word-latin">dars</span>
            <span className="about-word-meaning">noun · a lesson</span>
          </div>
          <div className="about-story-copy">
            <p className="about-eyebrow">Our story</p>
            <h2 id="about-story-title">Dars means lesson.</h2>
            <p>
              In Arabic, Urdu and Persian, <em>dars</em> (<span lang="ar">درس</span>) means a lesson. It describes a teacher explaining one topic clearly, step by step, until students understand it. DarsLearn brings that idea online.
            </p>
            <p>
              Many people want to learn but struggle to find courses they can trust, that start at the right level, and that fit around work, study and family. We built DarsLearn to make that easier: carefully structured courses, honest information before you enroll, and progress that waits for you whenever you return.
            </p>
            <p>
              We are starting with a single course in Quran recitation so that we can get every detail right. New subjects will follow one at a time, each held to the same standard.
            </p>
          </div>
        </div>
      </section>

      {/* How learning works */}
      <section className="about-section about-features" aria-labelledby="about-features-title">
        <div className="about-shell">
          <div className="about-intro">
            <p className="about-eyebrow">How learning works</p>
            <h2 id="about-features-title">Everything you need to learn well, and nothing in the way.</h2>
            <p>DarsLearn is built around recorded courses you can follow at your own pace. Here is what every learner gets.</p>
          </div>
          <ul className="about-feature-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="about-icon"><Icon size={21} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Standards */}
      <section className="about-section about-standards" aria-labelledby="about-standards-title">
        <span className="about-standards-pattern" aria-hidden="true" />
        <div className="about-shell">
          <div className="about-intro about-intro--dark">
            <p className="about-eyebrow">Our standards</p>
            <h2 id="about-standards-title">Promises we keep to every learner.</h2>
            <p>Trust is earned through clear rules. These are the standards behind every course on DarsLearn.</p>
          </div>
          <ul className="about-standard-grid">
            {standards.map(({ icon: Icon, title, text, link }) => (
              <li key={title}>
                <span className="about-icon about-icon--gold"><Icon size={21} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to={link.to} className="about-link about-link--light">{link.label}<ArrowRight size={15} aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Teachers */}
      <section className="about-section about-teach" aria-labelledby="about-teach-title">
        <div className="about-shell about-teach-card">
          <div>
            <p className="about-eyebrow">For teachers</p>
            <h2 id="about-teach-title">Share your knowledge on DarsLearn.</h2>
            <p>Are you a qualified teacher? Apply to publish recorded courses. Once your application is approved, you can create your course and reach learners wherever they are.</p>
            <div className="about-teach-actions">
              <Link to="/instructor/application" className="about-btn about-btn--primary">Apply to teach<ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to="/get-started/instructor" className="about-link">How teaching works<ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </div>
          <ul className="about-teach-list">
            {teacherBenefits.map(({ icon: Icon, text }) => (
              <li key={text}><span className="about-icon"><Icon size={19} aria-hidden="true" /></span>{text}</li>
            ))}
          </ul>
        </div>
      </section>

    </main>
  );
}
