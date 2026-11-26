import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { instructorProfileUrl } from "@/features/profile/instructor-link.js";
import { Reveal } from "./HomeShared.jsx";
import { hasInstructor } from "./homeUtils.js";

// Introduces the teacher of the featured course. Hidden when no teacher is listed.
export default function HomeInstructor({ course }) {
  if (!hasInstructor(course)) return null;
  const { instructor } = course;
  const profile = instructorProfileUrl(instructor);
  return (
    <section className="home-section home-instructor" aria-labelledby="home-instructor-title">
      <div className="home-shell">
        <Reveal className="home-instructor-card">
          <div className="home-instructor-photo"><ProfileAvatar name={instructor.name} src={instructor.avatar} size={160} /></div>
          <div className="home-instructor-copy">
            <p className="home-eyebrow">Meet your teacher</p>
            <h2 id="home-instructor-title">{instructor.name}</h2>
            {instructor.title && <p className="home-instructor-role">{instructor.title}</p>}
            {instructor.bio && <p className="home-instructor-bio">{instructor.bio}</p>}
            <div className="home-instructor-footer">
              <p className="home-instructor-teaches"><BookOpen size={16} aria-hidden="true" />Teaches <Link to={`/courses/${course.slug}`}>{course.title}</Link></p>
              {profile && <Link to={profile} className="home-text-link">View full profile<ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
