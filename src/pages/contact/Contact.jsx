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
import "./contact.css";

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

const inputClass = "contact-input";

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
    <main className="contact-page">
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

      <section className="public-page contact-section" aria-labelledby="contact-form-title">
        <div className="contact-layout">
          <div>
            <SectionIntro
              id="contact-options-title"
              eyebrow="Contact options"
              title="Reach us in the way that works for you."
              description="Email gives us the clearest record of your request. Add your registered email and course name to help us respond faster."
            />
            <div className="contact-methods">
              {contactMethods.map(({ label, value, href, detail, icon: Icon }) => (
                <article key={label} className="contact-method">
                  <div className="contact-method-content">
                    <span className="public-icon"><Icon className="size-4.5" aria-hidden="true" /></span>
                    <div className="contact-method-details">
                      <p className="contact-method-label">{label}</p>
                      {href ? <a href={href} className="contact-method-value">{value}</a> : <p className="contact-method-value">{value}</p>}
                      <p className="contact-method-description">{detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="contact-availability">
              <Clock3 className="mt-0.5 size-4.5 shrink-0 text-primary" />
              Support availability can vary across time zones. Email is monitored on business days.
            </div>
          </div>

          <div className="public-panel contact-form-panel">
            <p className="public-eyebrow">Send a message</p>
            <h2 id="contact-form-title" className="contact-form-title">How can we help?</h2>
            <p className="contact-form-description">Complete the form and your email app will open with the message prepared.</p>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-field-row">
                <label className="contact-field">Full name
                  <input className={inputClass} name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Your full name" required />
                </label>
                <label className="contact-field">Email address
                  <input className={inputClass} type="email" name="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@example.com" required />
                </label>
              </div>
              <label className="contact-field">Subject
                <input className={inputClass} name="subject" value={form.subject} onChange={updateField} placeholder="Course, admission, account…" required />
              </label>
              <label className="contact-field">Message
                <textarea className={inputClass} name="message" value={form.message} onChange={updateField} placeholder="Share enough detail for us to understand the request." required />
              </label>
              <div className="contact-form-actions">
                <p className="contact-privacy"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />Do not include passwords, payment details, or other sensitive information.</p>
                <button type="submit" className="cw-button cw-primary">Prepare email <Send className="size-4" /></button>
              </div>
              {notice && <p className="contact-notice" role="status" aria-live="polite">{notice}</p>}
            </form>
          </div>
        </div>
      </section>

      <section className="contact-help" aria-labelledby="contact-help-title">
        <div className="public-page contact-section">
          <SectionIntro id="contact-help-title" eyebrow="Help us route your request" title="Include the detail that matters." align="center" />
          <div className="contact-help-grid">
            {helpTopics.map(({ title, detail, icon: Icon }) => (
              <article key={title} className="public-panel contact-help-card"><Icon className="size-5 text-primary" /><h3 className="contact-help-heading">{title}</h3><p className="contact-help-description">{detail}</p></article>
            ))}
          </div>
          <div className="contact-help-actions"><Link to="/courses" className="cw-button">Browse the course catalog first <ArrowRight className="size-4" /></Link></div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
