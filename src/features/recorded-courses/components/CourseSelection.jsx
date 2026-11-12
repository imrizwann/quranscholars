import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import RecordedCourseCard from "./RecordedCourseCard.jsx";
import RecordedCourseSkeleton from "./RecordedCourseSkeleton.jsx";
import "./course-selection.css";

export default function CourseSelection({ courses, loading, error, fetching, retry, featured = false }) {
  return <div className={`course-selection${featured ? " course-selection--featured" : ""}`} data-course-count={courses.length} aria-busy={loading || fetching}>
    {loading ? <>
      <span className="sr-only" role="status">Loading courses</span>
      {Array.from({ length: featured ? 1 : 3 }, (_, index) => <RecordedCourseSkeleton key={index} />)}
    </> : error ? <div className="course-selection-state" role="alert">
      <BookOpen size={24} aria-hidden="true" />
      <div><h3>Courses are temporarily unavailable</h3><p>Please try again in a moment.</p></div>
      <button type="button" onClick={retry} disabled={fetching} className="cw-button">{fetching ? "Trying again…" : "Try again"}</button>
    </div> : !courses.length ? <div className="course-selection-state" role="status">
      <BookOpen size={24} aria-hidden="true" />
      <div><h3>New courses are on the way</h3><p>Contact our team for help finding your next learning opportunity.</p></div>
      <Link to="/contact" className="cw-button">Contact us<ArrowRight size={15} aria-hidden="true" /></Link>
    </div> : courses.map(course => <RecordedCourseCard key={course.id} course={course} featured={featured && courses.length === 1} />)}
  </div>;
}
