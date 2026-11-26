import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { subjects } from "../homeContent.js";
import { Reveal, SectionIntro } from "./HomeShared.jsx";

// MVP only: shows that DarsLearn is a multi-subject platform while only one subject is open.
// In the full catalogue, replace this with real categories from the API.
export default function HomeSubjects({ course }) {
  const availableLink = course ? `/courses/${course.slug}` : "/courses";
  return (
    <section className="home-section home-subjects" aria-labelledby="home-subjects-title">
      <div className="home-shell home-subjects-grid">
        <Reveal>
          <SectionIntro id="home-subjects-title" eyebrow="Subjects" title="Starting with the Quran. More subjects on the way.">
            DarsLearn is a growing learning platform. Quran recitation is open now, with computer science, English, mathematics and science coming soon.
          </SectionIntro>
        </Reveal>
        <ul className="home-subject-list">
          {subjects.map(({ icon: Icon, name, available }, index) => (
            <Reveal as="li" key={name} delay={index * 0.05} className={available ? "home-subject home-subject--available" : "home-subject"}>
              <span className="home-subject-icon"><Icon size={22} aria-hidden="true" /></span>
              <h3>{name}</h3>
              {available ? (
                <Link to={availableLink} className="home-subject-link">
                  <span className="home-subject-status">Available now</span>
                  <span className="home-subject-cta">Explore<ArrowRight size={15} aria-hidden="true" /></span>
                  <span className="sr-only">: {name} course</span>
                </Link>
              ) : <span className="home-subject-status">Coming soon</span>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
