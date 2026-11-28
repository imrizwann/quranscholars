import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Languages, Mail, Star, UsersRound } from "lucide-react";
import { useGetPublicInstructorQuery } from "@/services/api/courses/instructorsApi.js";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import CourseDescription from "@/features/recorded-courses/components/CourseDescription.jsx";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import "./instructors.css";

// Ratings and learners come only from this instructor's real courses, and only when
// every course is loaded on this page, so the figures are never partial or invented.
function courseTotals(list) {
  const pagination = list?.pagination;
  if (!list || pagination?.hasNextPage || (pagination?.totalPages ?? 1) > 1) return null;
  const reviews = list.courses.reduce((sum, course) => sum + (course.totalReviews || 0), 0);
  const weighted = list.courses.reduce((sum, course) => sum + (course.rating || 0) * (course.totalReviews || 0), 0);
  const learners = list.courses.reduce((sum, course) => sum + (course.totalStudents || 0), 0);
  return { reviews, rating: reviews ? weighted / reviews : 0, learners };
}

export default function InstructorProfile() {
  const { slug: id } = useParams();
  const [params, setParams] = useSearchParams();
  const valid = /^[a-f\d]{24}$/i.test(id || "");
  const page = Math.max(1, Math.min(1000, Math.floor(Number(params.get("page"))) || 1));
  const profile = useGetPublicInstructorQuery(id, { skip: !valid, refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const item = profile.currentData;
  const courses = useGetRecordedCoursesQuery({ instructor: id, page, limit: 12 }, { skip: !item, refetchOnMountOrArgChange: true });
  if (!valid || profile.error?.status === 404) return <main className="public-page instructor-empty"><GraduationCap size={32} aria-hidden="true" /><h1>Instructor not found</h1><p>This profile may no longer be available. Explore the current instructor directory.</p><Link to="/instructors" className="cw-button">All instructors</Link></main>;
  if (!item) return <main className="public-page">{profile.error ? <QueryMessage query={{ error: profile.error, refresh: profile.refetch }} /> : <LoadingState label="Loading instructor profile" />}</main>;
  const list = !courses.error ? courses.currentData : null;
  const totals = courseTotals(list);
  const stats = [
    item.courseCount > 0 && { icon: BookOpen, value: item.courseCount, label: item.courseCount === 1 ? "Course" : "Courses" },
    item.experienceYears !== null && { icon: GraduationCap, value: item.experienceYears, label: item.experienceYears === 1 ? "Year teaching" : "Years teaching" },
    totals?.reviews > 0 && { icon: Star, value: totals.rating.toFixed(1), label: `Rating from ${totals.reviews} ${totals.reviews === 1 ? "review" : "reviews"}` },
    totals?.learners > 0 && { icon: UsersRound, value: totals.learners.toLocaleString(), label: totals.learners === 1 ? "Learner" : "Learners" },
  ].filter(Boolean);

  return <main className="instructor-profile-page">
    <section className="instructor-hero" aria-labelledby="instructor-name">
      <div className="instructor-hero-inner">
        <Link to="/instructors" className="instructor-back"><ArrowLeft size={16} aria-hidden="true" />All instructors</Link>
        <div className="instructor-hero-main">
          <ProfileAvatar name={item.name} src={item.avatar} size={112} />
          <div className="instructor-hero-copy">
            <p className="instructor-eyebrow">DarsLearn instructor</p>
            <h1 id="instructor-name">{item.name}</h1>
            {item.title && <p className="instructor-hero-title">{item.title}</p>}
            {item.languages.length > 0 && <ul className="instructor-languages" aria-label="Teaching languages"><li className="instructor-languages-label"><Languages size={15} aria-hidden="true" />Teaches in</li>{item.languages.map(language => <li key={language}>{language}</li>)}</ul>}
            <div className="instructor-hero-actions">
              {item.courseCount > 0 && <a href="#instructor-courses" className="cw-button cw-primary">Browse courses<ArrowRight size={16} aria-hidden="true" /></a>}
              <Link to="/contact" className="cw-button instructor-contact"><Mail size={16} aria-hidden="true" />Contact us</Link>
            </div>
          </div>
        </div>
        {stats.length > 0 && <dl className="instructor-stats">{stats.map(({ icon: Icon, value, label }) => <div key={label}><dt><Icon size={16} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl>}
      </div>
    </section>

    <div className="instructor-profile-body">
      {item.bio && <section className="public-panel instructor-about" aria-labelledby="instructor-about-title">
        <h2 id="instructor-about-title">About {item.name}</h2>
        <CourseDescription key={item.id} text={item.bio} textClassName="instructor-biography" buttonClassName="cw-button cw-button-compact instructor-read-more" />
      </section>}

      <section id="instructor-courses" className="instructor-courses" aria-labelledby="instructor-courses-title">
        <div className="instructor-courses-head">
          <div><h2 id="instructor-courses-title">Courses by {item.name}</h2><p>Explore the course outlines, previews, and learning outcomes.</p></div>
        </div>
        <QueryMessage query={{ data: courses.currentData, error: courses.error, loading: courses.isFetching, refresh: courses.refetch }} label="Loading instructor courses" />
        {list && <>{list.courses.length ? <div className="instructors-grid">{list.courses.map(course => <RecordedCourseCard key={course.id} course={course} />)}</div> : <div className="public-panel instructor-empty"><BookOpen size={28} aria-hidden="true" /><h3>Courses are being prepared</h3><p>Courses from {item.name} will appear here when available.</p><Link to="/courses" className="cw-button">Explore all courses</Link></div>}<Pagination pagination={list.pagination} page={page} onPage={next => setParams({ page: String(next) })} loading={courses.isFetching} /></>}
      </section>
    </div>
  </main>;
}
