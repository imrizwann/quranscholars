import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  HeartHandshake,
  Laptop2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import SectionIntro from "@/components/marketing/SectionIntro.jsx";
import learningIllustration from "@/assets/images/seeking-knowledge.svg";
import "./about.css";

const principles = [
  {
    title: "Faithful foundations",
    description: "Learning is rooted in the Quran, authentic Sunnah, sound scholarship, and respectful student conduct.",
    icon: BookOpenCheck,
  },
  {
    title: "Clear teaching",
    description: "Complex subjects are organised into understandable lessons, practice, and practical next steps.",
    icon: Sparkles,
  },
  {
    title: "Human support",
    description: "Ask for help choosing a course and finding a learning approach that suits you.",
    icon: HeartHandshake,
  },
  {
    title: "Safe learning",
    description: "Respectful conduct, learner privacy, and clear expectations guide our learning environment.",
    icon: ShieldCheck,
  },
];

const journey = [
  { step: "01", title: "Choose a goal", detail: "Explore the catalog or ask our learner-support team for guidance." },
  { step: "02", title: "Enroll in a course", detail: "Review the curriculum and enroll directly from the course page." },
  { step: "03", title: "Build consistency", detail: "Follow a clear sequence, keep progress visible, and use support when needed." },
];

const About = () => (
  <main className="about-page">
    <MarketingHero
      eyebrow="About QuranScholar"
      title="Islamic learning designed for real life."
      description="QuranScholar is an online learning platform for students and families who want trustworthy Islamic education with modern structure, flexible access, and meaningful teacher support."
      icon={BookOpenCheck}
      primaryAction={{ to: "/courses", label: "Explore courses" }}
      secondaryAction={{ to: "/mission", label: "Read our mission" }}
      highlights={[
        { label: "Before you enroll", value: "Review the lesson outline, course level, instructor, and price" },
        { label: "As you learn", value: "Follow video lessons and track your progress in My learning" },
        { label: "Need guidance?", value: "Ask our team about course levels or help with your learning account" },
      ]}
      labelledBy="about-title"
    />

    <section className="public-page about-section" aria-labelledby="about-platform-title">
      <div className="about-platform">
        <div className="about-illustration"><img src={learningIllustration} alt="Student learning online" width="480" height="400" loading="lazy" decoding="async" /></div>
        <div>
          <SectionIntro id="about-platform-title" eyebrow="The platform" title="A focused place to learn, practise, and progress." description="Build your knowledge one lesson at a time. Find courses that match your level, study at your own pace, and return to the topics you want to practise." />
          <div className="about-formats">
            <article className="public-panel"><span className="public-icon"><Laptop2 size={20} aria-hidden="true" /></span><h3>Self-paced courses</h3><p>Follow structured video lessons, keep track of your progress, and learn around your schedule.</p><Link to="/courses" className="about-text-link">Explore courses<ArrowRight size={15} aria-hidden="true" /></Link></article>
            <article className="public-panel"><span className="public-icon"><GraduationCap size={20} aria-hidden="true" /></span><h3>Support when you need it</h3><p>Get help choosing a course, understanding its requirements, or accessing your lessons.</p><Link to="/contact" className="about-text-link">Talk to our team<ArrowRight size={15} aria-hidden="true" /></Link></article>
          </div>
        </div>
      </div>
    </section>

    <section className="about-values" aria-labelledby="principles-title">
      <div className="public-page about-section">
        <SectionIntro id="principles-title" eyebrow="What guides us" title="Thoughtful teaching. Purposeful learning." description="Our approach centres on sound knowledge, clear lessons, and care for the people learning with us." />
        <div className="about-principles">{principles.map(({ title, description, icon: Icon }) => <article className="public-panel" key={title}><span className="public-icon"><Icon size={20} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </div>
    </section>

    <section className="public-page about-section" aria-labelledby="journey-title">
      <SectionIntro id="journey-title" eyebrow="From intention to routine" title="Start with a simple next step." description="You do not have to plan your whole learning journey today. Begin with a subject that matters to you." />
      <ol className="about-journey">{journey.map(({ step, title, detail }) => <li className="public-panel" key={step}><span className="about-step" aria-hidden="true">{step}</span><h3>{title}</h3><p>{detail}</p></li>)}</ol>
      <div className="public-panel about-next-step">
        <div><p className="public-eyebrow"><UsersRound size={16} aria-hidden="true" />Learn with purpose</p><h2>Find a learning path that fits your life.</h2><p>Explore the courses, or ask our team for help choosing where to begin.</p></div>
        <div className="public-actions"><Link to="/courses" className="cw-button cw-primary">Explore courses<ArrowRight size={16} aria-hidden="true" /></Link><Link to="/contact" className="cw-button">Contact us</Link></div>
      </div>
    </section>
  </main>
);

export default About;
