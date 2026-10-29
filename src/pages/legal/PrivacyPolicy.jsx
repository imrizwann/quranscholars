import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Cookie,
  Database,
  FileText,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";

const sections = [
  {
    id: "information",
    title: "Information we collect",
    icon: Database,
    intro: "We collect information that is needed to operate accounts, deliver learning, provide support, and keep the platform reliable.",
    items: [
      "Account and contact details such as your name, email address, phone number, country, and city.",
      "Admissions, enrolment, course preferences, progress, attendance, and support history.",
      "Payment references and billing status supplied by payment providers; we do not ask you to send card details through support messages.",
      "Technical information such as device, browser, IP address, session activity, and error diagnostics.",
    ],
  },
  {
    id: "use",
    title: "How we use information",
    icon: UserRoundCheck,
    intro: "Personal information is used for defined educational and operational purposes.",
    items: [
      "Create and secure your account, process admissions, and provide course access.",
      "Track learning progress, attendance, and completion where those features apply.",
      "Respond to questions and send essential service or schedule updates.",
      "Improve accessibility, performance, safety, and the overall learning experience.",
      "Prevent fraud, enforce platform terms, and meet applicable legal obligations.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing and service providers",
    icon: KeyRound,
    intro: "We may use trusted providers to host the platform, deliver communications, process payments, and monitor reliability.",
    items: [
      "Providers receive only the information needed to perform their contracted service.",
      "Access is limited through operational controls and provider agreements where applicable.",
      "We may disclose information when legally required or necessary to protect learners, the platform, or others.",
      "We do not sell personal information as a business model.",
    ],
  },
  {
    id: "retention",
    title: "Retention and security",
    icon: ShieldCheck,
    intro: "We retain information only while it supports the purpose for which it was collected or a legitimate legal and operational need.",
    items: [
      "Reasonable technical and organisational safeguards are used to protect information.",
      "Access to sensitive records is restricted according to role and operational need.",
      "No online system can promise absolute security; report suspected account misuse promptly.",
      "Records may be retained to resolve disputes, maintain academic history, prevent misuse, or meet legal duties.",
    ],
  },
  {
    id: "children",
    title: "Children and family accounts",
    icon: UserRoundCheck,
    intro: "A parent or guardian should be involved when a minor uses QuranScholar.",
    items: [
      "We aim to collect only information needed to deliver and support the learning experience.",
      "Parents or guardians can contact us about access, correction, or deletion requests for a minor.",
      "Safeguarding concerns should be raised directly through our support contact.",
    ],
  },
  {
    id: "rights",
    title: "Your choices and rights",
    icon: FileText,
    intro: "Depending on your location and applicable law, you may have rights over the personal information we hold.",
    items: [
      "Request access to or correction of your personal information.",
      "Request deletion or restriction where the law allows it.",
      "Withdraw consent for optional communications.",
      "Ask how information is used or raise a privacy concern.",
    ],
  },
];

const PrivacyPolicy = () => (
  <main className="bg-[#fbfcfa] text-[#172b24]">
    <MarketingHero
      eyebrow="Privacy and data protection"
      title="Your information, explained clearly."
      description="This policy describes how QuranScholar collects, uses, shares, and protects personal information across our website, admissions, courses, communications, and learner support."
      icon={ShieldCheck}
      primaryAction={{ to: "/contact", label: "Contact us about privacy" }}
      secondaryAction={{ to: "/", label: "Return home" }}
      highlights={[
        { label: "Last updated", value: "3 September 2026" },
        { label: "Applies to", value: "QuranScholar accounts, learning services, and support" },
        { label: "Privacy contact", value: "contact@quranscholar.in" },
      ]}
      labelledBy="privacy-title"
    />

    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-24">
        <nav className="rounded-2xl border border-[#dfe6e2] bg-white p-3" aria-label="Privacy policy sections">
          <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#718078]">On this page</p>
          <ul className="mt-1 grid gap-1">
            {sections.map((section) => (
              <li key={section.id}><a href={`#${section.id}`} className="block rounded-lg px-3 py-2 text-sm font-bold text-[#53665e] no-underline transition hover:bg-[#edf4f1] hover:text-primary">{section.title}</a></li>
            ))}
            <li><a href="#cookies" className="block rounded-lg px-3 py-2 text-sm font-bold text-[#53665e] no-underline transition hover:bg-[#edf4f1] hover:text-primary">Cookies</a></li>
            <li><a href="#updates" className="block rounded-lg px-3 py-2 text-sm font-bold text-[#53665e] no-underline transition hover:bg-[#edf4f1] hover:text-primary">Updates and contact</a></li>
          </ul>
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="rounded-2xl border border-[#cfe0d8] bg-[#edf6f2] p-5 text-sm font-medium leading-7 text-[#405d52] sm:p-6">
          <strong className="font-black text-[#173b31]">Plain-language summary:</strong> we use personal information to provide and improve QuranScholar. We limit access, work with service providers where needed, and give you a way to ask questions or exercise applicable rights.
        </div>

        <div className="mt-8 grid gap-6">
          {sections.map(({ id, title, icon: Icon, intro, items }) => (
            <section key={id} id={id} className="scroll-mt-28 rounded-2xl border border-[#dfe6e2] bg-white p-6 sm:p-8" aria-labelledby={`${id}-title`}>
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e6f2ed] text-primary"><Icon className="size-5" /></span>
                <div><p className="text-xs font-black uppercase tracking-[0.13em] text-primary">Policy section</p><h2 id={`${id}-title`} className="mt-1 font-display text-2xl font-black tracking-[-0.035em] sm:text-3xl">{title}</h2></div>
              </div>
              <p className="mt-5 text-sm font-medium leading-7 text-[#5f7268] sm:text-base">{intro}</p>
              <ul className="mt-5 grid gap-3">
                {items.map((item) => <li key={item} className="flex items-start gap-3 text-sm font-medium leading-7 text-[#52655c]"><Check className="mt-1.5 size-4 shrink-0 text-primary" strokeWidth={3} />{item}</li>)}
              </ul>
            </section>
          ))}

          <section id="cookies" className="scroll-mt-28 rounded-2xl border border-[#dfe6e2] bg-white p-6 sm:p-8" aria-labelledby="cookies-title">
            <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e6f2ed] text-primary"><Cookie className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-[0.13em] text-primary">Browser data</p><h2 id="cookies-title" className="mt-1 font-display text-2xl font-black tracking-[-0.035em] sm:text-3xl">Cookies and similar technologies</h2></div></div>
            <p className="mt-5 text-sm font-medium leading-7 text-[#5f7268] sm:text-base">QuranScholar may use essential technologies to maintain sessions, remember preferences, protect accounts, and keep the service reliable. Where optional analytics or similar tools require consent, those choices should be provided through the relevant consent interface. Browser settings can also limit cookies, although some account features may stop working correctly.</p>
          </section>

          <section id="updates" className="scroll-mt-28 rounded-2xl bg-[#0b3e38] p-6 text-white sm:p-8" aria-labelledby="updates-title">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9ed6c8]">Updates and contact</p>
            <h2 id="updates-title" className="mt-2 font-display text-2xl font-black tracking-[-0.035em] sm:text-3xl">Questions about your information?</h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/70">This policy may change as the platform and applicable requirements evolve. Material changes will be reflected by the updated date. For access, correction, deletion, or privacy questions, contact us with enough detail to identify the relevant account or request.</p>
            <a href="mailto:contact@quranscholar.in" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f4c95d] px-4 text-sm font-black text-[#11342e] no-underline"><Mail className="size-4" />contact@quranscholar.in</a>
            <div className="mt-5"><Link to="/contact" className="group inline-flex items-center gap-2 text-sm font-black text-white no-underline">Open the contact page <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div>
          </section>
        </div>
      </div>
    </div>
  </main>
);

export default PrivacyPolicy;
