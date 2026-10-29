import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import MarketingHero from "@/components/marketing/MarketingHero.jsx";
import SectionIntro from "@/components/marketing/SectionIntro.jsx";

const contactMethods = [
  {
    label: "Email learner support",
    value: "contact@quranscholar.in",
    href: "mailto:contact@quranscholar.in",
    detail: "Best for admissions, courses, accounts, and general questions.",
    icon: Mail,
  },
  {
    label: "Call or WhatsApp",
    value: "+91 80571 21113",
    href: "tel:+918057121113",
    detail: "For time-sensitive guidance during published support hours.",
    icon: Phone,
  },
  {
    label: "Location",
    value: "Moradabad, Uttar Pradesh, India",
    detail: "Our learning platform serves students online across regions.",
    icon: MapPin,
  },
];

const helpTopics = [
  { title: "Choosing a course", detail: "Tell us your goal, level, and preferred study format.", icon: BookOpenCheck },
  { title: "Admissions", detail: "Ask about eligibility, schedules, fees, or your application status.", icon: CheckCircle2 },
  { title: "Learning support", detail: "Get help with access, progress, or an active learning experience.", icon: Headphones },
];

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#d8e2dd] bg-white px-4 text-sm font-semibold text-[#1f392f] outline-none transition placeholder:text-[#9aa7a1] focus:border-primary focus:ring-4 focus:ring-[#0f766e]/10";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [notice, setNotice] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (notice) setNotice("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(form.subject || "QuranScholar support request");
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:contact@quranscholar.in?subject=${subject}&body=${body}`;
    setNotice("Your email app should open with this message. If it does not, email contact@quranscholar.in directly.");
  };

  return (
    <main className="bg-[#fbfcfa] text-[#172b24]">
      <MarketingHero
        eyebrow="Contact QuranScholar"
        title="Get the right answer from the right team."
        description="Whether you are choosing a course, completing admission, or need support with your account, send us the context and we’ll help you find the next step."
        urdu={{
          title: "اپنا سوال بتائیے، ہم درست اگلا قدم تلاش کرنے میں مدد کریں گے",
          description: "کورس کے انتخاب، داخلے، اکاؤنٹ یا تعلیمی معاونت سے متعلق ضروری تفصیل ہمیں بھیجیں، ہماری ٹیم آپ کی رہنمائی کرے گی۔",
        }}
        icon={MessageSquareText}
        primaryAction={{ to: "/courses", label: "Explore courses" }}
        secondaryAction={{ to: "/services", label: "View learner services" }}
        highlights={[
          { label: "Typical response", value: "Within one business day" },
          { label: "Support coverage", value: "Courses, admission, accounts, and learner services" },
          { label: "Helpful context", value: "Include your course name and registered email when relevant" },
        ]}
        labelledBy="contact-title"
      />

      <section className="px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="contact-form-title">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,.72fr)_minmax(26rem,1.28fr)] lg:items-start">
          <div>
            <SectionIntro
              id="contact-options-title"
              eyebrow="Contact options"
              title="Reach us in the way that works for you."
              description="Email gives us the clearest record of your request. Add your registered email and course name to help us respond faster."
            />
            <div className="mt-7 grid gap-3">
              {contactMethods.map(({ label, value, href, detail, icon: Icon }) => (
                <article key={label} className="rounded-2xl border border-[#dfe6e2] bg-white p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6f2ed] text-primary"><Icon className="size-4.5" /></span>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#718078]">{label}</p>
                      {href ? <a href={href} className="mt-1 block break-words font-black text-[#173b31] no-underline hover:text-primary">{value}</a> : <p className="mt-1 font-black text-[#173b31]">{value}</p>}
                      <p className="mt-1.5 text-xs font-medium leading-5 text-[#6b7b73]">{detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#eaf3ef] p-5 text-sm font-semibold leading-6 text-[#476057]">
              <Clock3 className="mt-0.5 size-4.5 shrink-0 text-primary" />
              Support availability can vary across time zones. Email is monitored on business days.
            </div>
          </div>

          <div className="rounded-2xl border border-[#dfe6e2] bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Send a message</p>
            <h2 id="contact-form-title" className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">How can we help?</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-[#687970]">Complete the form and your email app will open with the message prepared.</p>

            <form className="mt-7 grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-black text-[#29443a]">Full name
                  <input className={inputClass} name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Your full name" required />
                </label>
                <label className="text-sm font-black text-[#29443a]">Email address
                  <input className={inputClass} type="email" name="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@example.com" required />
                </label>
              </div>
              <label className="text-sm font-black text-[#29443a]">Subject
                <input className={inputClass} name="subject" value={form.subject} onChange={updateField} placeholder="Course, admission, account…" required />
              </label>
              <label className="text-sm font-black text-[#29443a]">Message
                <textarea className={`${inputClass} min-h-36 resize-y py-3.5`} name="message" value={form.message} onChange={updateField} placeholder="Share enough detail for us to understand the request." required />
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex max-w-sm items-start gap-2 text-xs font-semibold leading-5 text-[#718078]"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />Do not include passwords, payment details, or other sensitive information.</p>
                <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-5 text-sm font-black text-white transition hover:bg-[#0b665f] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary">Prepare email <Send className="size-4" /></button>
              </div>
              {notice && <p className="rounded-xl border border-[#bcd8cd] bg-[#edf7f3] px-4 py-3 text-sm font-bold leading-6 text-[#245e50]" role="status">{notice}</p>}
            </form>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e1e7e3] bg-white px-4 py-14 sm:px-6 sm:py-18" aria-labelledby="contact-help-title">
        <div className="mx-auto max-w-7xl">
          <SectionIntro id="contact-help-title" eyebrow="Help us route your request" title="Include the detail that matters." align="center" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {helpTopics.map(({ title, detail, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-[#dfe6e2] bg-[#fbfcfa] p-6 text-center"><Icon className="mx-auto size-5 text-primary" /><h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-[#687970]">{detail}</p></article>
            ))}
          </div>
          <div className="mt-8 text-center"><Link to="/courses" className="group inline-flex items-center gap-2 text-sm font-black text-primary no-underline">Browse the course catalog first <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
