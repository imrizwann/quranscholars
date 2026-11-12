import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { useGetCourseAccessQuery } from "@/services/api/user/paymentApi.js";

const defaultClass = "inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

function CourseLink({ course, className, allowed = false }) {
  const label = allowed ? "Continue learning" : "View course";
  // The classroom restores the latest server-backed lesson and playback position.
  return <Link className={className || defaultClass} to={`/${allowed ? "learn" : "courses"}/${encodeURIComponent(course.slug)}`} aria-label={`${label}: ${course.title}`}>{label}<ArrowRight size={16} aria-hidden="true" /></Link>;
}

function AccountCourseLink({ course, className }) {
  const query = useGetCourseAccessQuery(course.id, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  return <CourseLink course={course} className={className} allowed={!query.isFetching && !query.error && query.currentData?.canAccessCourse === true} />;
}

export default function CourseLearningLink({ course, className }) {
  const accountId = useSelector(state => state.user?.user?._id);
  return accountId ? <AccountCourseLink key={`${accountId}/${course.id}`} course={course} className={className} /> : <CourseLink course={course} className={className} />;
}
