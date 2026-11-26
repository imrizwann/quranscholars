import { steps } from "../homeContent.js";
import { Reveal, SectionIntro } from "./HomeShared.jsx";

export default function HomeSteps() {
  return (
    <section id="how-it-works" className="home-section home-steps" aria-labelledby="home-steps-title">
      <div className="home-shell">
        <Reveal>
          <SectionIntro id="home-steps-title" eyebrow="How it works" title="Start learning in three simple steps." align="center">
            No complicated setup. Choose a course, enroll, and begin your first lesson today.
          </SectionIntro>
        </Reveal>
        <ol className="home-steps-list">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <Reveal as="li" key={title} delay={index * 0.08} className="home-step">
              <div className="home-step-top">
                <span className="home-step-icon"><Icon size={22} aria-hidden="true" /></span>
                <span className="home-step-number" aria-hidden="true">0{index + 1}</span>
              </div>
              <h3><span className="sr-only">Step {index + 1}: </span>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
