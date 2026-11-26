import { Link } from "react-router-dom";
import { ArrowRight, Check, CirclePlay, Clock3, Languages, Layers3, PlayCircle, Signal } from "lucide-react";
import CourseLearningLink from "@/features/recorded-courses/components/CourseLearningLink.jsx";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { instructorProfileUrl } from "@/features/profile/instructor-link.js";
import { useGetRecordedCourseBySlugQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";

const MAX_OUTCOMES = 5;
const listed = value => value && value !== "Not specified";

// One-course launch: sits beside the course card and answers "what is in it for me?"
// using the course's real outcomes, structure and teacher.
export default function CourseSpotlight({ course }) {
  const { data: details } = useGetRecordedCourseBySlugQuery(course.slug);
  const outcomes = (details?.outcomes || []).filter(Boolean).slice(0, MAX_OUTCOMES);
  const sections = details?.sections?.filter(section => section.lessons.length).length || course.totalSections;
  const { instructor } = course;
  const hasTeacher = instructor?.name && instructor.name !== "Instructor not listed";
  const profile = hasTeacher ? instructorProfileUrl(instructor) : null;
  const summary = course.shortDescription || details?.description;

  const stats = [
    course.totalLessons > 0 && { icon: PlayCircle, value: course.totalLessons, label: course.totalLessons === 1 ? "Video lesson" : "Video lessons" },
    sections > 0 && { icon: Layers3, value: sections, label: sections === 1 ? "Section" : "Sections" },
    course.totalDurationSeconds > 0 && { icon: Clock3, value: course.durationLabel, label: "Total length" },
    listed(course.level) && { icon: Signal, value: course.level, label: "Level" },
    listed(course.language) && { icon: Languages, value: course.language, label: "Language" },
  ].filter(Boolean).slice(0, 4);

  return (
    <section className="course-spotlight" aria-labelledby="course-spotlight-title">
      <p className="courses-eyebrow">About this course</p>
      <h3 id="course-spotlight-title">{outcomes.length ? "What you will learn" : "Course overview"}</h3>

      {outcomes.length > 0 ? (
        <ul className="course-spotlight-outcomes">
          {outcomes.map(outcome => <li key={outcome}><span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>{outcome}</li>)}
        </ul>
      ) : summary && <p className="course-spotlight-summary">{summary}</p>}

      {stats.length > 0 && (
        <dl className="course-spotlight-stats">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd><Icon size={17} aria-hidden="true" />{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {hasTeacher && (
        <div className="course-spotlight-teacher">
          <ProfileAvatar name={instructor.name} src={instructor.avatar} size={48} />
          <div>
            <p>Your teacher</p>
            <strong>{instructor.name}</strong>
            {listed(instructor.title) && instructor.title !== "Instructor" && <span>{instructor.title}</span>}
          </div>
          {profile && <Link to={profile} className="course-spotlight-profile">View profile<ArrowRight size={15} aria-hidden="true" /></Link>}
        </div>
      )}

      <div className="course-spotlight-actions">
        <CourseLearningLink course={course} label="Explore the course" className="course-spotlight-button course-spotlight-button--primary" />
        {course.trailerVideo && (
          <Link to={`/courses/${course.slug}#course-preview`} className="course-spotlight-button">
            <CirclePlay size={17} aria-hidden="true" />Watch the preview
          </Link>
        )}
      </div>
    </section>
  );
}
