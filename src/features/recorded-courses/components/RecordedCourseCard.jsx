import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, Clock3, Users } from "lucide-react";
import CourseCardMedia from "./CourseCardMedia.jsx";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
// import CourseRating from "@/features/recorded-courses/components/CourseRating.jsx";
import InstructorByline from "@/features/profile/components/InstructorByline.jsx";

const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const RecordedCourseCard = ({ course }) => {
  const location = useLocation();
  const courseCatalog = location.pathname === "/courses"
    ? { url: location.pathname + location.search, key: location.key }
    : location.state?.courseCatalog;
  const linkState = courseCatalog ? { courseCatalog } : undefined;
  return (
  <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200 hover:border-primary/30">
    <CourseCardMedia course={course} to={`/courses/${course.slug}`} linkState={linkState} />

    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-xs font-black uppercase tracking-[0.12em] text-primary">
          {course.category}
        </p>
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{course.level}</span>
      </div>
      <Link to={`/courses/${course.slug}`} state={linkState} className="no-underline">
        <h3 className="mt-3 line-clamp-2 break-words font-display text-xl font-black leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {course.title}
        </h3>
      </Link>
      <p className="mt-2 text-sm font-semibold text-[#718079]">
        <InstructorByline instructor={course.instructor} />
      </p>
      {course.shortDescription && <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-muted-foreground">
        {course.shortDescription}
      </p>}

      {course.totalStudents > 0 && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Ratings stay hidden until the review workflow is released. */}
        {course.totalStudents > 0 && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Users className="size-3.5 text-primary" aria-hidden="true" />
          {compactNumber.format(course.totalStudents)} learners
        </span>}
      </div>}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5 text-primary" aria-hidden="true" />
          {course.durationLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-primary" aria-hidden="true" />
          {course.totalLessons == null ? "See course details" : `${course.totalLessons} lessons`}
        </span>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <CoursePrice price={course.price} />
        <Link to={`/courses/${course.slug}`} state={linkState} aria-label={`View details for ${course.title}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">View course <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>
  </article>
  );
};

export default RecordedCourseCard;
