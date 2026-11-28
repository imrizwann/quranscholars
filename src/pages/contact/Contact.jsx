import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  GraduationCap,
  HelpCircle,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  MonitorPlay,
  Phone,
  ReceiptText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { contactDetails } from "@/data/contactDetails.js";
import "./contact.css";

const MESSAGE_LIMIT = 2000;

// Each topic tells people exactly what to include, so we can help on the first reply.
const topics = [
  { id: "course", label: "Choosing a course", icon: BookOpen, hint: "Tell us what you would like to learn and your current level, and we will suggest where to begin." },
  { id: "payment", label: "Enrollment or payment", icon: CreditCard, hint: "Include the course title, your payment reference and the date you paid. If money was debited but you were not enrolled, please do not pay again while we check." },
  { id: "access", label: "Accessing my lessons", icon: MonitorPlay, hint: "Tell us the course, the device and browser you use, and what happens when you try to watch." },
  { id: "refund", label: "Refund request", icon: ReceiptText, hint: "Include the course title, payment reference and purchase date. Refunds are available within 7 days of purchase if you have not started the course or downloaded its resources.", link: { to: "/course-policy", label: "Read the refund policy" } },
  { id: "teaching", label: "Teaching on DarsLearn", icon: GraduationCap, hint: "Tell us about your subject and teaching experience, or apply directly with your certificates.", link: { to: "/get-started/instructor", label: "How teaching works" } },
  { id: "other", label: "Something else", icon: HelpCircle, hint: "Tell us how we can help. The more detail you share, the faster we can reply." },
];

const quickAnswers = [
  {
    question: "I paid but cannot see my course",
    icon: CreditCard,
    answer: "Open My learning while signed in to the account you paid with. If the course is still missing, contact us with your payment reference. Please do not pay again while we check.",
    link: { to: "/dashboard/learning", label: "Open My learning" },
  },
  {
    question: "How do refunds work?",
    icon: ReceiptText,
    answer: "You can request a refund within 7 days of purchase if you have not started the course: no lesson played and no resource opened or downloaded. Approved refunds return to your original payment method.",
    link: { to: "/course-policy", label: "Access and refund policy" },
  },
  {
    question: "I forgot my password",
    icon: KeyRound,
    answer: "Reset it yourself in a minute. We will email a reset link to the address registered to your account.",
    link: { to: "/forgot-password", label: "Reset your password" },
  },
];

const emptyForm = { name: "", email: "", topic: "", message: "" };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!form.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address, like name@example.com.";
  if (!form.topic) errors.topic = "Choose what your message is about.";
  if (!form.message.trim()) errors.message = "Write your message.";
  return errors;
}

export default function Contact() {
  const id = useId();
  const formRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [prepared, setPrepared] = useState(null);
  const [copied, setCopied] = useState("");
  const topic = topics.find(item => item.id === form.topic);

  const update = (name, value) => {
    setForm(current => ({ ...current, [name]: value }));
    if (errors[name]) setErrors(current => ({ ...current, [name]: undefined }));
    setPrepared(null);
  };

  const handleSubmit = event => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstError = ["name", "email", "topic", "message"].find(name => nextErrors[name]);
    if (firstError) {
      formRef.current?.querySelector(`[data-field="${firstError}"]`)?.focus();
      return;
    }
    const subject = `${topic.label} - ${form.name.trim()}`;
    const body = `Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\nTopic: ${topic.label}\n\n${form.message.trim()}`;
    setPrepared({ subject, body });
    setCopied("");
    window.location.href = `mailto:${contactDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied("unavailable");
    }
  };

  const fieldError = name => errors[name] && <p id={`${id}-${name}-error`} className="contact-error" role="alert">{errors[name]}</p>;
  const describedBy = (name, extra) => [errors[name] && `${id}-${name}-error`, extra].filter(Boolean).join(" ") || undefined;

  return (
    <main className="contact-page">
      {/* Hero */}
      <section className="contact-hero" aria-labelledby="contact-title">
        <span className="contact-hero-pattern" aria-hidden="true" />
        <div className="contact-shell contact-hero-grid">
          <div>
            <nav className="contact-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Contact</span>
            </nav>
            <p className="contact-hero-eyebrow">Contact us</p>
            <h1 id="contact-title">How can we <span>help you?</span></h1>
            <p className="contact-hero-lead">Questions about a course, enrolling, payments or your account? Our team is here to help, whether you are choosing your first course or getting back to a lesson.</p>
            <ul className="contact-hero-points">
              <li><Clock3 size={16} aria-hidden="true" />We aim to reply within 48 hours</li>
            </ul>
          </div>

          <aside className="contact-channels" aria-labelledby="contact-channels-title">
            <h2 id="contact-channels-title">Reach us directly</h2>
            <a className="contact-channel contact-channel--whatsapp" href={contactDetails.whatsappHref} target="_blank" rel="noopener noreferrer">
              <span className="contact-channel-icon"><MessageCircle size={20} aria-hidden="true" /></span>
              <span><strong>Chat on WhatsApp</strong><small>Quick questions and help choosing a course</small></span>
              <ArrowRight size={17} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a className="contact-channel" href={`mailto:${contactDetails.email}`}>
              <span className="contact-channel-icon"><Mail size={20} aria-hidden="true" /></span>
              <span><strong>{contactDetails.email}</strong><small>Best for payments, refunds and account help</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="contact-channel" href={contactDetails.phoneHref}>
              <span className="contact-channel-icon"><Phone size={20} aria-hidden="true" /></span>
              <span><strong>{contactDetails.phone}</strong><small>Call us</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <p className="contact-location"><MapPin size={15} aria-hidden="true" />{contactDetails.location} · Learning online, worldwide</p>
          </aside>
        </div>
      </section>

      {/* Form */}
      <section className="contact-section" aria-labelledby="contact-form-title">
        <div className="contact-shell contact-form-grid">
          <div className="contact-form-intro">
            <p className="contact-eyebrow">Send a message</p>
            <h2 id="contact-form-title">Write to our team</h2>
            <p>Choose a topic and we will tell you what to include, so we can help you on the first reply.</p>
            <ul className="contact-tips">
              <li><CheckCircle2 size={17} aria-hidden="true" />Use the email address registered to your DarsLearn account</li>
              <li><CheckCircle2 size={17} aria-hidden="true" />Mention the course title and any payment reference</li>
              <li><ShieldCheck size={17} aria-hidden="true" />Never share passwords, card details, PINs or one-time passwords</li>
            </ul>
          </div>

          <div className="contact-card">
            <form ref={formRef} className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-row">
                <div className="contact-field">
                  <label htmlFor={`${id}-name`}>Your name</label>
                  <input className="contact-input" id={`${id}-name`} data-field="name" name="name" value={form.name} onChange={e => update("name", e.target.value)} autoComplete="name" placeholder="Your full name" maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} />
                  {fieldError("name")}
                </div>
                <div className="contact-field">
                  <label htmlFor={`${id}-email`}>Email address</label>
                  <input className="contact-input" id={`${id}-email`} data-field="email" type="email" name="email" value={form.email} onChange={e => update("email", e.target.value)} autoComplete="email" placeholder="you@example.com" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} />
                  {fieldError("email")}
                </div>
              </div>

              <fieldset className="contact-field contact-topics" aria-describedby={describedBy("topic")}>
                <legend>What is your message about?</legend>
                <div className="contact-topic-grid">
                  {topics.map(({ id: topicId, label, icon: Icon }, index) => (
                    <label key={topicId} className="contact-topic" data-selected={form.topic === topicId}>
                      <input type="radio" name="topic" value={topicId} checked={form.topic === topicId} onChange={() => update("topic", topicId)} data-field={index === 0 ? "topic" : undefined} />
                      <Icon size={17} aria-hidden="true" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {fieldError("topic")}
              </fieldset>

              {topic && (
                <div className="contact-hint" id={`${id}-hint`}>
                  <p><strong>Helpful to include:</strong> {topic.hint}</p>
                  {topic.link && <Link to={topic.link.to}>{topic.link.label}<ArrowRight size={14} aria-hidden="true" /></Link>}
                </div>
              )}

              <div className="contact-field">
                <label htmlFor={`${id}-message`}>Your message</label>
                <textarea className="contact-input" id={`${id}-message`} data-field="message" name="message" rows={6} value={form.message} onChange={e => update("message", e.target.value)} placeholder="Include your course name and what you need help with." maxLength={MESSAGE_LIMIT} aria-invalid={Boolean(errors.message)} aria-describedby={describedBy("message", `${id}-count ${topic ? `${id}-hint` : ""}`.trim())} />
                <div className="contact-field-foot">
                  {fieldError("message") || <span />}
                  <span id={`${id}-count`} className="contact-count">{form.message.length.toLocaleString()} / {MESSAGE_LIMIT.toLocaleString()}</span>
                </div>
              </div>

              <div className="contact-submit">
                <button type="submit" className="contact-button contact-button--primary">Send with your email app<Send size={16} aria-hidden="true" /></button>
                <p>Your email app opens with the message ready. Review it and press send.</p>
              </div>

              {prepared && (
                <div className="contact-prepared" role="status">
                  <p className="contact-prepared-title"><CheckCircle2 size={18} aria-hidden="true" />Your message is ready in your email app.</p>
                  <p>Did nothing open? Copy your message and send it to <strong>{contactDetails.email}</strong> from any email account.</p>
                  <div className="contact-prepared-actions">
                    <button type="button" className="contact-button" onClick={() => copy(`Subject: ${prepared.subject}\n\n${prepared.body}`, "message")}><Copy size={15} aria-hidden="true" />{copied === "message" ? "Message copied" : "Copy message"}</button>
                    <button type="button" className="contact-button" onClick={() => copy(contactDetails.email, "email")}><Copy size={15} aria-hidden="true" />{copied === "email" ? "Email copied" : "Copy email address"}</button>
                  </div>
                  {copied === "unavailable" && <p className="contact-copy-note">Copying is not available in this browser. Please select and copy the text manually.</p>}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Quick answers */}
      <section className="contact-section contact-answers" aria-labelledby="contact-answers-title">
        <div className="contact-shell">
          <p className="contact-eyebrow">Quick answers</p>
          <h2 id="contact-answers-title">You might not need to wait for us.</h2>
          <ul className="contact-answer-grid">
            {quickAnswers.map(({ question, answer, link, icon: Icon }) => (
              <li key={question}>
                <h3><span className="contact-answer-icon"><Icon size={18} aria-hidden="true" /></span>{question}</h3>
                <p>{answer}</p>
                <Link to={link.to} className="contact-link">{link.label}<ArrowRight size={15} aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
