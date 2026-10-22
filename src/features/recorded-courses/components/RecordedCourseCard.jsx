import { Link, useLocation } from "react-router-dom";
import { BookOpen, Clock3, PlayCircle, Users } from "lucide-react";
import CoursePrice from "@/features/recorded-courses/components/CoursePrice.jsx";
import CourseRating from "@/features/recorded-courses/components/CourseRating.jsx";

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
  <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white shadow-[0_8px_30px_rgba(21,54,44,.055)] transition duration-300 hover:-translate-y-1 hover:border-[#bfd1c9] hover:shadow-[0_20px_48px_rgba(21,54,44,.11)]">
    <Link
      to={`/courses/${course.slug}`} state={linkState}
      className="relative block aspect-16/10 overflow-hidden bg-[#e5f0eb] no-underline"
      aria-label={`View self-paced course: ${course.title}`}
    >
      {course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={`${course.title} course thumbnail`}
          className="size-full object-contain p-5 transition duration-500 group-hover:scale-[1.035]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="grid size-full place-items-center text-primary">
          <BookOpen className="size-12" />
        </span>
      )}
      <span
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(4,29,25,.5)_100%)]"
        aria-hidden="true"
      />
      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.11em] text-[#23453c] backdrop-blur">
        <PlayCircle className="size-3.5" /> Self-paced
      </span>
      {(course.bestseller || course.featured) && (
        <span className="absolute bottom-4 left-4 rounded-md bg-[#f4c95d] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-[#17372f]">
          {course.bestseller ? "Bestseller" : "Featured"}
        </span>
      )}
    </Link>

    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-primary">
          {course.category}
        </p>
        <span className="text-xs font-bold text-[#77847e]">{course.level}</span>
      </div>
      <Link to={`/courses/${course.slug}`} state={linkState} className="no-underline">
        <h3 className="mt-3 line-clamp-2 font-display text-xl font-black leading-tight tracking-tight text-[#192e27] transition group-hover:text-primary">
          {course.title}
        </h3>
      </Link>
      <p className="mt-2 text-sm font-semibold text-[#718079]">
        By {course.instructor.name}
      </p>
      <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-[#6a7872]">
        {course.shortDescription}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <CourseRating rating={course.rating} reviews={course.totalReviews} />
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#718079]">
          <Users className="size-3.5 text-primary" />
          {compactNumber.format(course.totalStudents)} learners
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#edf1ef] pt-4 text-xs font-bold text-[#68766f]">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5 text-primary" />
          {course.durationLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-primary" />
          {course.totalLessons == null ? "See course details" : `${course.totalLessons} lessons`}
        </span>
      </div>
      <div className="mt-auto pt-5">
        <CoursePrice price={course.price} />
      </div>
    </div>
  </article>
  );
};

export default RecordedCourseCard;
