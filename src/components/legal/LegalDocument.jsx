import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Info, Mail, X } from "lucide-react";
import "./legal-document.css";

/**
 * Shared layout for policy pages: an "at a glance" strip, a sticky table of contents
 * that follows the reader, and numbered sections.
 * A section is { id, title, paragraphs?, items?, itemTone?: "positive" | "negative", note? }.
 */
export default function LegalDocument({ summary = [], sections, contact, children }) {
  const active = useActiveSection(sections.map(section => section.id));
  const links = <ol>
    {sections.map((section, index) => <li key={section.id}>
      <a href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.title}</a>
    </li>)}
  </ol>;
  return <div className="legal-body">
    <aside className="legal-toc">
      {/* Desktop: always visible and sticky. Phones: a collapsed list above the policy. */}
      <nav className="legal-toc-desktop" aria-label="On this page"><p>On this page</p>{links}</nav>
      <details className="legal-toc-mobile">
        <summary>On this page<ChevronDown size={16} aria-hidden="true" /></summary>
        <nav aria-label="On this page">{links}</nav>
      </details>
    </aside>

    <div className="legal-main">
      {children}
      {summary.length > 0 && <section className="legal-summary" aria-labelledby="legal-summary-title">
        <h2 id="legal-summary-title">At a glance</h2>
        <ul>{summary.map(({ title, text, icon: Icon }) => <li key={title}>
          {Icon && <span className="legal-summary-icon" aria-hidden="true"><Icon size={18} /></span>}
          <strong>{title}</strong>
          <p>{text}</p>
        </li>)}</ul>
      </section>}

      <article className="legal-document">
        {sections.map((section, index) => <section key={section.id} id={section.id} className="legal-section" aria-labelledby={`${section.id}-title`}>
          <h2 id={`${section.id}-title`}><span className="legal-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
          {section.paragraphs?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          {section.items?.length > 0 && <ul className="legal-list" data-tone={section.itemTone || "neutral"}>
            {section.items.map(item => <li key={item}>
              <span className="legal-list-mark" aria-hidden="true">{section.itemTone === "negative" ? <X size={14} strokeWidth={2.5} /> : section.itemTone === "positive" ? <Check size={14} strokeWidth={2.5} /> : null}</span>
              <span>{item}</span>
            </li>)}
          </ul>}
          {section.note && <p className="legal-note"><Info size={16} aria-hidden="true" /><span>{section.note}</span></p>}
        </section>)}
      </article>

      {contact && <section className="legal-contact" aria-labelledby="legal-contact-title">
        <div>
          <h2 id="legal-contact-title">{contact.title}</h2>
          <p>{contact.text}</p>
        </div>
        <div className="legal-contact-actions">
          <a href={`mailto:${contact.email}`} className="legal-contact-email"><Mail size={16} aria-hidden="true" />{contact.email}</a>
          <Link to="/contact" className="legal-contact-link">Open the contact page<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>}
    </div>
  </div>;
}

// Highlights the section currently being read in the table of contents.
function useActiveSection(ids) {
  const key = ids.join("|");
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const list = key.split("|");
    const elements = list.map(id => document.getElementById(id)).filter(Boolean);
    if (!elements.length || typeof IntersectionObserver === "undefined") return undefined;
    const visible = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
      const first = list.find(id => visible.get(id));
      if (first) setActive(first);
    }, { rootMargin: "-96px 0px -55% 0px" });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [key]);
  return active;
}
