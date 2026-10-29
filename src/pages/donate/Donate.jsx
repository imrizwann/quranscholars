import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Check,
  HandHeart,
  HeartHandshake,
  Landmark,
  Mail,
  ShieldCheck,
} from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import SectionIntro from "@/components/marketing/SectionIntro.jsx";

const causes = [
  {
    title: "Learning access",
    description: "Help eligible students access structured Islamic courses and essential learning resources.",
    icon: BookOpenCheck,
  },
  {
    title: "Madrasa support",
    description: "Strengthen teaching environments with appropriate resources, teacher support, and learning materials.",
    icon: Building2,
  },
  {
    title: "Community spaces",
    description: "Support carefully reviewed educational and worship-space needs in underserved communities.",
    icon: Landmark,
  },
  {
    title: "Family relief",
    description: "Contribute to approved initiatives that address essential needs with dignity and care.",
    icon: HandHeart,
  },
];

const safeguards = [
  "Confirm the current campaign and intended use before contributing",
  "Use only payment details shared through an official QuranScholar channel",
  "Keep your receipt or transaction reference for follow-up",
  "Contact us directly if you need allocation or eligibility information",
];

const Donate = () => (
  <main className="bg-[#fbfcfa] text-[#172b24]">
    <MarketingHero
      eyebrow="Support the mission"
      title="Help make beneficial learning more accessible."
      description="Your support can help students learn, teachers serve, and communities build stronger educational foundations. Contact us for the current verified campaigns and contribution options."
      urdu={{
        title: "علمِ نافع کو زیادہ لوگوں تک پہنچانے میں حصہ لیجیے",
        description: "آپ کا تعاون طلبہ کے لیے تعلیم تک رسائی، اساتذہ کی خدمت اور مضبوط علمی ماحول کی تشکیل میں مدد دے سکتا ہے۔ موجودہ تصدیق شدہ مہمات کی معلومات کے لیے ہم سے رابطہ کریں۔",
      }}
      icon={HeartHandshake}
      primaryAction={{ to: "/contact", label: "Request donation details" }}
      secondaryAction={{ to: "/mission", label: "Read our mission" }}
      highlights={[
        { label: "Before donating", value: "Ask for the current campaign, purpose, and payment instructions" },
        { label: "For sponsorship", value: "Tell us whether you want to support a student or a wider program" },
        { label: "Need a record?", value: "Keep your transaction reference and request confirmation" },
      ]}
      labelledBy="donate-title"
    />

    <section className="px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="causes-title">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          id="causes-title"
          eyebrow="Areas of support"
          title="Give toward a clear, current need."
          description="Campaign availability changes. We confirm the active purpose and contribution route before accepting support for a specific area."
        />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {causes.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-[#dfe6e2] bg-white p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-[#e6f2ed] text-primary"><Icon className="size-5" /></span>
              <h2 className="mt-5 text-lg font-black tracking-[-0.02em]">{title}</h2>
              <p className="mt-2 text-sm font-medium leading-7 text-[#687970]">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="border-y border-[#e1e7e3] bg-white px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="responsible-giving-title">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,.78fr)_minmax(22rem,1.22fr)] lg:items-center">
        <div>
          <SectionIntro
            id="responsible-giving-title"
            eyebrow="Give responsibly"
            title="Verify the campaign before you send funds."
            description="This page intentionally does not publish permanent account or payment details. Contact us for the current verified route and the information relevant to your contribution."
          />
          <a href="mailto:contact@quranscholar.in?subject=Donation%20details" className="group mt-6 inline-flex items-center gap-2 text-sm font-black text-primary no-underline">Email the support team <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
        </div>
        <div className="rounded-2xl bg-[#0b3e38] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white/10 text-[#f4c95d]"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#9ed6c8]">Contribution checklist</p><h2 className="mt-1 text-xl font-black">Four things to confirm</h2></div></div>
          <ul className="mt-6 grid gap-3">
            {safeguards.map((item) => <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-semibold leading-6 text-white/80"><Check className="mt-1 size-4 shrink-0 text-[#f4c95d]" strokeWidth={3} />{item}</li>)}
          </ul>
        </div>
      </div>
    </section>

    <section className="px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#dfe6e2] bg-white p-6 lg:col-span-2 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">Sponsor learning</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">Want to help a student access a course?</h2>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-[#687970]">Ask about current sponsorship needs, student eligibility, and how support is assigned. We’ll share the available options before you decide.</p>
          <Link to="/contact" className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-black text-white no-underline">Discuss sponsorship <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
        </article>
        <article className="rounded-2xl border border-[#cfe0d8] bg-[#edf6f2] p-6 sm:p-8">
          <Mail className="size-5 text-primary" />
          <h2 className="mt-4 text-xl font-black">Need written confirmation?</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-[#587067]">Email your transaction reference through the official contact address and state the campaign you intended to support.</p>
          <a href="mailto:contact@quranscholar.in" className="mt-5 block break-words text-sm font-black text-primary no-underline">contact@quranscholar.in</a>
        </article>
      </div>
    </section>
  </main>
);

export default Donate;
