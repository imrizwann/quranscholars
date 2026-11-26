import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, MessageCircleQuestion } from "lucide-react";
import { faqs } from "../homeContent.js";
import { Reveal, SectionIntro } from "./HomeShared.jsx";

export default function HomeFaq() {
  const [open, setOpen] = useState(0);
  const id = useId();
  return (
    <section id="faq" className="home-section home-faq" aria-labelledby="home-faq-title">
      <div className="home-shell home-faq-grid">
        <Reveal className="home-faq-aside">
          <SectionIntro id="home-faq-title" eyebrow="Questions" title="Answers before you begin.">
            Everything you need to know about learning on DarsLearn.
          </SectionIntro>
          <div className="home-faq-help">
            <span><MessageCircleQuestion size={20} aria-hidden="true" /></span>
            <div>
              <strong>Still have a question?</strong>
              <p>Our team is happy to help you get started.</p>
              <Link to="/contact" className="home-text-link">Contact us<ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="home-faq-list">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div className="home-faq-item" data-open={isOpen} key={faq.question}>
                <h3>
                  <button
                    type="button"
                    id={`${id}-q-${index}`}
                    aria-controls={`${id}-a-${index}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                  >
                    <span>{faq.question}</span>
                    <span className="home-faq-icon"><ChevronDown size={18} aria-hidden="true" /></span>
                  </button>
                </h3>
                <div id={`${id}-a-${index}`} role="region" aria-labelledby={`${id}-q-${index}`} className="home-faq-panel" inert={!isOpen}>
                  <div><p>{faq.answer}</p></div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
