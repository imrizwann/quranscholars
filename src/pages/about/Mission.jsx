import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookHeart,
  ChevronRight,
  Compass,
  HeartHandshake,
  Layers3,
  Quote,
  RotateCcw,
  Sprout,
} from "lucide-react";
import "./about.css";
import "./mission.css";

const challenges = [
  {
    icon: Compass,
    challenge: "It is hard to know where to start.",
    answer: "Every course shows its level, lesson outline and teacher before you enroll, and begins with the basics it needs.",
  },
  {
    icon: BadgeCheck,
    challenge: "It is hard to know who to trust.",
    answer: "Teachers apply with their background and certificates, and every application is reviewed before a course is published.",
  },
  {
    icon: RotateCcw,
    challenge: "It is hard to keep going.",
    answer: "Short lessons and saved progress make it easy to return, even after a busy week, on any device.",
  },
];

const values = [
  { icon: Sprout, title: "Knowledge should be beneficial", text: "We teach to change how people understand, act and live, not simply to fill time with content." },
  { icon: Layers3, title: "Clarity over volume", text: "A short, well-ordered lesson is worth more than hours of unfocused video. Every course follows a clear path." },
  { icon: HeartHandshake, title: "Respect for every learner", text: "Patient teaching for beginners, privacy for everyone, and real help when someone gets stuck." },
];

const roadmap = [
  { stage: "Now", status: "Available now", tone: "live", title: "Quran recitation for beginners", text: "Our first course, built carefully so that every part of the learning experience is right before we grow." },
  { stage: "Next", status: "In preparation", tone: "next", title: "New subjects", text: "Courses in computer science, English, mathematics and science, held to the same standard as our first." },
  { stage: "Later", status: "Planned", tone: "planned", title: "More ways to learn", text: "Live classes with teachers, learning designed for families and young learners, and support for more languages." },
];


export default function Mission() {
  return (
    <main className="about-page mission-page">
      {/* Hero */}
      <section className="about-hero" aria-labelledby="mission-title">
        <span className="about-hero-pattern" aria-hidden="true" />
        <div className="about-shell about-hero-grid">
          <div className="about-hero-copy">
            <nav className="about-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Our mission</span>
            </nav>
            <p className="about-hero-eyebrow">Our mission</p>
            <h1 id="mission-title">Make beneficial knowledge <span>clear and within reach.</span></h1>
            <p className="about-hero-lead">
              We want anyone, anywhere, to be able to learn something that matters to them from a trustworthy teacher, in short, clear lessons that fit into real life.
            </p>
            <div className="about-hero-actions">
              <Link to="/courses" className="about-btn about-btn--gold">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link>
              <Link to="/about" className="about-btn about-btn--ghost">About DarsLearn</Link>
            </div>
          </div>

          <figure className="mission-quote">
            <Quote size={28} aria-hidden="true" />
            <blockquote>Make room for meaningful learning, one lesson at a time.</blockquote>
            <figcaption>The principle behind every course, feature and decision on DarsLearn.</figcaption>
          </figure>
        </div>
      </section>

      {/* Why it matters */}
      <section className="about-section" aria-labelledby="mission-why-title">
        <div className="about-shell">
          <div className="about-intro">
            <p className="about-eyebrow">Why it matters</p>
            <h2 id="mission-why-title">Wanting to learn is the easy part.</h2>
            <p>Most people who want to learn give up for the same few reasons. We designed DarsLearn around each one.</p>
          </div>
          <ol className="mission-challenges">
            {challenges.map(({ icon: Icon, challenge, answer }) => (
              <li key={challenge}>
                <div className="mission-challenge">
                  <span className="mission-label">The challenge</span>
                  <p>{challenge}</p>
                </div>
                <div className="mission-answer">
                  <span className="about-icon"><Icon size={20} aria-hidden="true" /></span>
                  <div>
                    <span className="mission-label mission-label--answer">Our answer</span>
                    <p>{answer}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section className="about-section about-features" aria-labelledby="mission-values-title">
        <div className="about-shell">
          <div className="about-intro">
            <p className="about-eyebrow">What we believe</p>
            <h2 id="mission-values-title">Three beliefs that shape how we teach.</h2>
          </div>
          <ul className="mission-values">
            {values.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="about-icon"><Icon size={21} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
          <aside className="mission-heritage" aria-label="How we teach faith subjects">
            <span className="about-icon about-icon--soft-gold"><BookHeart size={21} aria-hidden="true" /></span>
            <p>
              <strong>Teaching the Quran and Islamic subjects.</strong> When we teach faith subjects, we do so with care for authentic sources and respect for qualified scholarship. Our Quran courses are taught by teachers whose background we have reviewed.
            </p>
          </aside>
        </div>
      </section>

      {/* Roadmap */}
      <section className="about-section" aria-labelledby="mission-roadmap-title">
        <div className="about-shell">
          <div className="about-intro">
            <p className="about-eyebrow">Where we are going</p>
            <h2 id="mission-roadmap-title">Growing carefully, one subject at a time.</h2>
            <p>We add new courses only when they meet the same standard as our first. Growth should build trust, not weaken it.</p>
          </div>
          <ol className="mission-roadmap">
            {roadmap.map(({ stage, status, tone, title, text }) => (
              <li key={stage} data-tone={tone}>
                <div className="mission-roadmap-top">
                  <span className="mission-stage">{stage}</span>
                  <span className="mission-status">{status}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

    </main>
  );
}
