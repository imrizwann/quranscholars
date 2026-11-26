import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import CourseLearningLink from "@/features/recorded-courses/components/CourseLearningLink.jsx";
import { Reveal } from "./HomeShared.jsx";

export default function HomeCta({ course }) {
  const signedIn = useSelector(state => Boolean(state.user?.user?._id));
  return (
    <section id="join" className="home-section home-cta" aria-labelledby="home-cta-title">
      <div className="home-shell">
        <Reveal className="home-cta-card">
          <span className="home-cta-pattern" aria-hidden="true" />
          <div className="home-cta-copy">
            <p className="home-eyebrow">Begin today</p>
            <h2 id="home-cta-title">Your first lesson is only a few minutes away.</h2>
            <p>Create your free account and start learning today, at a pace that suits you.</p>
          </div>
          <div className="home-cta-actions">
            {course
              ? <CourseLearningLink course={course} label="Explore the course" className="home-btn home-btn--gold" />
              : <Link to="/courses" className="home-btn home-btn--gold">Browse courses<ArrowRight size={16} aria-hidden="true" /></Link>}
            {signedIn
              ? <Link to="/dashboard/learning" className="home-btn home-btn--ghost">Go to My learning</Link>
              : <Link to="/register" className="home-btn home-btn--ghost">Create a free account</Link>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
