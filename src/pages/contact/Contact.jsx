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
import { contactDetails } from "@/data/contactDetails.js";
import "./contact.css";

const contactMethods = [
  {
    label: "Email learner support",
    value: contactDetails.email,
    href: `mailto:${contactDetails.email}`,
    detail: "Best for courses, enrollment, accounts, and teaching applications.",
    icon: Mail,
  },
  {
    label: "Call us",
    value: contactDetails.phone,
    href: contactDetails.phoneHref,
    detail: "Speak with our team about your learning needs.",
    icon: Phone,
  },
  {
    label: "Location",
    value: contactDetails.location,
    detail: "Our learning platform serves students online across regions.",
    icon: MapPin,
  },
];

const helpTopics = [
  { title: "Find a course", detail: "Compare subjects, course levels, and learning formats.", to: "/courses", icon: BookOpenCheck },
  { title: "Teach on QuranScholar", detail: "Learn how to apply and have your qualifications reviewed.", to: "/get-started/instructor", icon: CheckCircle2 },
  { title: "Continue learning", detail: "Open your courses and see your saved progress.", to: "/dashboard/learning", icon: Headphones },
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
    const emptyField = ["name", "subject", "message"].find(name => !form[name].trim());
    if (emptyField) {
      event.currentTarget.elements.namedItem(emptyField)?.focus();
      setNotice("Please complete each field before preparing your email.");
      return;
    }
    const subject = encodeURIComponent(form.subject.trim());
    const body = encodeURIComponent(`Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\n${form.message.trim()}`);
    window.location.href = `mailto:${contactDetails.email}?subject=${subject}&body=${body}`;
    setNotice(`Review and send the message in your email app. If it does not open, email ${contactDetails.email} directly.`);
  };

  return (
    <main className="contact-page">
      <MarketingHero
        eyebrow="Contact QuranScholar"
        title="Get the right answer from the right team."
        description="Ask about a course, enrollment, your account, or an instructor application. Share the context and we’ll help you find the next step."
        icon={MessageSquareText}
        primaryAction={{ to: "/courses", label: "Explore courses" }}
        secondaryAction={{ to: "/services", label: "View learner services" }}
        highlights={[
          { label: "Course questions", value: "Include the course title and what you would like to know" },
          { label: "Account or application", value: "Use your registered email and include a reference if available" },
          { label: "Something went wrong?", value: "Describe what happened and the message shown on your screen" },
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
            <a className="cw-button contact-whatsapp" href={contactDetails.whatsappHref} target="_blank" rel="noopener noreferrer"><MessageSquareText size={16} aria-hidden="true" />Message on WhatsApp<span className="sr-only"> (opens in a new tab)</span><ArrowRight size={15} aria-hidden="true" /></a>
          </div>

          <div className="public-panel contact-form-panel">
            <p className="public-eyebrow">Send a message</p>
            <h2 id="contact-form-title" className="contact-form-title">How can we help?</h2>
            <p id="contact-form-help" className="contact-form-description">Prepare a message in your email app, then review and send it there.</p>

            <form className="contact-form" onSubmit={handleSubmit} aria-describedby="contact-form-help">
              <div className="contact-field-row">
                <label className="contact-field">Full name
                  <input className={inputClass} name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Your full name" maxLength={100} required />
                </label>
                <label className="contact-field">Email address
                  <input className={inputClass} type="email" name="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@example.com" maxLength={254} required />
                </label>
              </div>
              <label className="contact-field">Subject
                <input className={inputClass} name="subject" value={form.subject} onChange={updateField} placeholder="Course, enrollment, account…" maxLength={150} required />
              </label>
              <label className="contact-field">Message
                <textarea className={inputClass} name="message" value={form.message} onChange={updateField} placeholder="Include your course name and what you need help with." maxLength={2000} aria-describedby="contact-message-count" required />
                <span id="contact-message-count" className="contact-message-count">{form.message.length.toLocaleString()} / 2,000 characters</span>
              </label>
              <div className="contact-form-actions">
                <p className="contact-privacy"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />Do not include passwords, payment details, or other sensitive information.</p>
                <button type="submit" className="cw-button cw-primary">Prepare email <Send className="size-4" aria-hidden="true" /></button>
              </div>
              {notice && <p className="contact-notice" role="status" aria-live="polite">{notice}</p>}
            </form>
          </div>
        </div>
      </section>

      <section className="contact-help" aria-labelledby="contact-help-title">
        <div className="public-page contact-section">
          <SectionIntro id="contact-help-title" eyebrow="Helpful places to start" title="Your next step may be right here." />
          <div className="contact-help-grid">
            {helpTopics.map(({ title, detail, to, icon: Icon }) => (
              <Link key={title} to={to} className="public-panel contact-help-card"><span className="public-icon"><Icon size={20} aria-hidden="true" /></span><div><h3 className="contact-help-heading">{title}</h3><p className="contact-help-description">{detail}</p></div><ArrowRight size={17} aria-hidden="true" /></Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
