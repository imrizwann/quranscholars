import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, Clock3, Languages, Users } from "lucide-react";
import CourseCardMedia from "./CourseCardMedia.jsx";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import CourseRating from "./CourseRating.jsx";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";
import "./course-card.css";

const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const listed = value => value && value !== "Not specified";

// Course card used across the catalogue, home page, instructor profiles and related courses.
// `featured` switches to a wide horizontal layout for small catalogues.
const RecordedCourseCard = ({ course, featured = false, action }) => {
  const location = useLocation();
  const courseCatalog = location.pathname === "/courses"
    ? { url: location.pathname + location.search, key: location.key }
    : location.state?.courseCatalog;
  const linkState = courseCatalog ? { courseCatalog } : undefined;
  const coursePath = `/courses/${course.slug}`;

  return (
    <article className={`course-card${featured ? " recorded-course-card--featured" : ""}`}>
      <div className="course-card-media">
        <CourseCardMedia course={course} to={coursePath} linkState={linkState} />
      </div>

      <div className="course-card-body recorded-course-card-content">
        <div className="course-card-meta">
          <span className="course-card-category">{course.category}</span>
          {listed(course.level) && <span className="course-card-level">{course.level}</span>}
        </div>

        <h3 className="course-card-title">
          <Link to={coursePath} state={linkState}>{course.title}</Link>
        </h3>
        <div className="course-card-byline"><InstructorByline instructor={course.instructor} /></div>
        {course.shortDescription && <p className="course-card-description">{course.shortDescription}</p>}

        <div className="course-card-social">
          <Link className="course-rating-link" to={`/courses/${encodeURIComponent(course.slug)}#course-reviews`} state={linkState} aria-label={`Read reviews for ${course.title}`}>
            <CourseRating rating={course.rating} reviews={course.totalReviews} />
          </Link>
          {course.totalStudents > 0 && (
            <span className="course-card-learners"><Users size={14} aria-hidden="true" />{compactNumber.format(course.totalStudents)} learners</span>
          )}
        </div>

        <ul className="course-card-facts" aria-label="Course details">
          <li><Clock3 size={14} aria-hidden="true" />{course.durationLabel}</li>
          <li><BookOpen size={14} aria-hidden="true" />{course.totalLessons == null ? "See course details" : `${course.totalLessons} ${course.totalLessons === 1 ? "lesson" : "lessons"}`}</li>
          {featured && listed(course.language) && <li><Languages size={14} aria-hidden="true" />{course.language}</li>}
        </ul>

        <div className="course-card-footer">
          <CoursePrice price={course.price} size={featured ? "large" : "default"} />
          {action || (
            <Link to={coursePath} state={linkState} aria-label={`View details for ${course.title}`} className="course-card-cta">
              View course<ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default RecordedCourseCard;
