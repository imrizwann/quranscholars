import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Languages } from "lucide-react";
import { useGetPublicInstructorQuery } from "@/services/api/courses/instructorsApi.js";
import { useGetRecordedCoursesQuery } from "@/features/recorded-courses/services/recordedCoursesRepository.js";
import RecordedCourseCard from "@/features/recorded-courses/components/RecordedCourseCard.jsx";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import "./instructors.css";

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
  return <main className="public-page instructor-profile-page">
    <Link to="/instructors" className="public-back"><ArrowLeft size={16} aria-hidden="true" />All instructors</Link>
    <header className="public-heading instructor-profile-heading"><ProfileAvatar name={item.name} src={item.avatar} size={88} /><div><p className="public-eyebrow">QuranScholar instructor</p><h1>{item.name}</h1><p>{item.title}</p></div></header>
    <div className="instructor-profile-layout"><section className="public-panel"><h2>Teaching background</h2><p className="instructor-biography">{item.bio || "Explore this instructor's courses to learn more about their teaching and subjects."}</p></section><aside className="public-panel instructor-profile-facts" aria-label="Instructor details"><h2>At a glance</h2><p><BookOpen size={17} aria-hidden="true" />{item.courseCount} {item.courseCount === 1 ? "course" : "courses"}</p>{item.languages.length > 0 && <p><Languages size={17} aria-hidden="true" />{item.languages.join(", ")}</p>}{item.experienceYears !== null && <p><GraduationCap size={17} aria-hidden="true" />{item.experienceYears} {item.experienceYears === 1 ? "year" : "years"} of teaching experience</p>}<Link to="/contact" className="cw-button">Ask about learning<ArrowRight size={16} aria-hidden="true" /></Link></aside></div>
    <section className="instructor-courses" aria-labelledby="instructor-courses-title"><h2 id="instructor-courses-title">Courses by {item.name}</h2><p className="instructors-count">Explore the course outlines, previews, and learning outcomes.</p><QueryMessage query={{ data: courses.currentData, error: courses.error, loading: courses.isFetching, refresh: courses.refetch }} label="Loading instructor courses" />{!courses.error && courses.currentData && <>{courses.currentData.courses.length ? <div className="instructors-grid">{courses.currentData.courses.map(course => <RecordedCourseCard key={course.id} course={course} />)}</div> : <div className="public-panel instructor-empty"><BookOpen size={28} aria-hidden="true" /><h3>Courses are being prepared</h3><p>Courses from this instructor will appear here when available.</p><Link to="/courses" className="cw-button">Explore all courses</Link></div>}<Pagination pagination={courses.currentData.pagination} page={page} onPage={next => setParams({ page: String(next) })} loading={courses.isFetching} /></>}</section>
  </main>;
}
