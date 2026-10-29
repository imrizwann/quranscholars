import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { useGetLearningLibraryQuery } from "@/services/api/user/paymentApi.js";
import { resolveCourseImage } from "../model/recordedCourseAdapter.js";
import { WorkspaceEmpty } from "@/components/lms/WorkspaceUI.jsx";
import { Pagination, QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";

function LibraryCard({ course }) {
  const image = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const [failed, setFailed] = useState(null);
  return <article className="studio-course-card"><Link to={`/learn/${course.slug}`} className="studio-course-cover" aria-label={`Open ${course.title}`}>{image && failed !== image ? <img src={image} alt="" loading="lazy" onError={() => setFailed(image)} /> : <div className="studio-course-placeholder"><BookOpen size={42} strokeWidth={1.25} aria-hidden="true" /><span>QURANSCHOLAR</span></div>}<span className="studio-course-status">In your library</span></Link><div className="studio-course-body"><p className="studio-label">{course.level || "Recorded course"}</p><h2><Link to={`/learn/${course.slug}`}>{course.title}</Link></h2><p className="studio-course-description">{course.totalLessons ?? 0} lessons{course.language ? ` · ${course.language}` : ""}</p><div className="studio-course-footer"><Link className="cw-button cw-primary" to={`/learn/${course.slug}`}>Open course <ArrowRight size={16} aria-hidden="true" /></Link></div></div></article>;
}
export default function LearnerLibrary({ compact = false }) {
  const [page, setPage] = useState(1);
  const query = useGetLearningLibraryQuery({ page, limit: compact ? 3 : 12 }, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const data = query.currentData;
  return <><QueryMessage query={{ data, error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading your learning library" />{!query.error && data?.courses?.length === 0 && <WorkspaceEmpty title="Your next chapter starts here" description="Courses with an active purchase appear in your library. Explore the catalog and find a subject you would love to learn." to="/courses" action="Explore courses" />}<div className="studio-course-grid">{data?.courses?.map((course) => <LibraryCard key={course._id} course={course} />)}</div>{!compact && <Pagination pagination={data?.pagination} page={page} onPage={setPage} loading={query.isFetching} />}</>;
}
