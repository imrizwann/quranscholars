import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookHeart,
  BrainCircuit,
  Check,
  Compass,
  GraduationCap,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import SectionIntro from "@/components/marketing/SectionIntro.jsx";

const commitments = [
  {
    title: "Preserve depth",
    description: "Present Islamic knowledge with care, context, and respect for qualified scholarship.",
    icon: BookHeart,
  },
  {
    title: "Improve access",
    description: "Use technology to make structured learning reachable across schedules and locations.",
    icon: BrainCircuit,
  },
  {
    title: "Develop character",
    description: "Connect what students learn with worship, conduct, family life, and service.",
    icon: Compass,
  },
  {
    title: "Build confidence",
    description: "Help learners participate in modern life while staying grounded in their faith.",
    icon: GraduationCap,
  },
];

const focusAreas = [
  "A coherent path from beginner foundations to deeper study",
  "Teacher-led learning where interaction and correction matter",
  "Self-paced access for students with changing schedules",
  "Family and youth experiences designed for their real context",
  "A platform that keeps progress, expectations, and next steps clear",
];

const Mission = () => (
  <main className="bg-[#fbfcfa] text-[#172b24]">
    <MarketingHero
      eyebrow="Our mission"
      title="Help Muslims learn with depth, confidence, and continuity."
      description="We exist to make trustworthy Islamic learning easier to begin, easier to understand, and easier to carry into daily life—wherever a student lives and whatever pace they can sustain."
      urdu={{
        title: "مسلمانوں کو علم، عمل اور اعتماد کے ساتھ آگے بڑھانا",
        description: "ہمارا مقصد معتبر اسلامی تعلیم کو ایسا قابلِ رسائی اور قابلِ فہم بنانا ہے کہ ہر طالب علم اسے اپنی رفتار سے سیکھ سکے اور اپنی روزمرہ زندگی میں اختیار کر سکے۔",
      }}
      icon={Sparkles}
      primaryAction={{ to: "/courses", label: "Start learning" }}
      secondaryAction={{ to: "/about", label: "About QuranScholar" }}
      highlights={[
        { label: "Grounded in", value: "Quran, authentic Sunnah, scholarship, and good character" },
        { label: "Enabled by", value: "Clear curriculum, thoughtful technology, and human guidance" },
        { label: "Measured by", value: "Understanding, consistency, conduct, and beneficial action" },
      ]}
      labelledBy="mission-title"
    />

    <section className="px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="mission-belief-title">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,.85fr)_minmax(22rem,1.15fr)] lg:items-start">
        <SectionIntro
          id="mission-belief-title"
          eyebrow="What we believe"
          title="Beneficial knowledge should shape how a person lives."
          description="Access alone is not enough. Learners need trustworthy material, good sequencing, capable teachers, meaningful practice, and the confidence to keep going."
        />
        <div className="rounded-2xl bg-[#0b3e38] p-7 text-white sm:p-9">
          <HeartHandshake className="size-6 text-[#f4c95d]" />
          <blockquote className="mt-5 text-balance font-display text-2xl font-black leading-tight tracking-[-0.03em] sm:text-3xl">
            “Build an LMS that respects sacred knowledge and the realities of modern learners.”
          </blockquote>
          <p className="mt-5 text-sm font-medium leading-7 text-white/68">That principle guides how we design courses, support families, and decide what belongs on the platform.</p>
        </div>
      </div>
    </section>

    <section className="border-y border-[#e1e7e3] bg-white px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="commitments-title">
      <div className="mx-auto max-w-7xl">
        <SectionIntro id="commitments-title" eyebrow="Our commitments" title="Four principles behind every learning experience." align="center" />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {commitments.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-[#dfe6e2] bg-[#fbfcfa] p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-[#e5f2ed] text-primary"><Icon className="size-5" /></span>
              <h3 className="mt-5 text-lg font-black tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-7 text-[#687970]">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="focus-title">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(22rem,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="rounded-2xl border border-[#dfe6e2] bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">What we are building toward</p>
          <ul className="mt-5 grid gap-3.5">
            {focusAreas.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm font-bold leading-6 text-[#53665e]"><Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={3} />{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <SectionIntro
            id="focus-title"
            eyebrow="The long view"
            title="A learning ecosystem that grows with its students."
            description="QuranScholar is designed to expand carefully: stronger curriculum, better learning tools, broader language support, and more pathways for individuals, families, and communities. Growth should improve trust and clarity—not weaken them."
          />
          <Link to="/services" className="group mt-6 inline-flex items-center gap-2 text-sm font-black text-primary no-underline">Explore our learner services <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </div>
    </section>

    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl bg-[#0b3e38] p-7 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.15em] text-[#9ed6c8]">Take part</p><h2 className="mt-3 font-display text-3xl font-black tracking-[-0.04em]">Turn the intention to learn into a steady path.</h2></div>
        <div className="flex flex-wrap gap-3"><Link to="/courses" className="group inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#f4c95d] px-5 text-sm font-black text-[#11342e] no-underline">Explore courses <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link><Link to="/donate" className="inline-flex min-h-12 items-center rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-black text-white no-underline">Support the mission</Link></div>
      </div>
    </section>
  </main>
);

export default Mission;
