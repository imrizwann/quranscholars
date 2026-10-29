import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Layers, PlayCircle } from "lucide-react";
import { resolveCourseImage } from "@/features/recorded-courses/model/recordedCourseAdapter.js";
import { courseStatusLabel } from "@/lib/user-messages.js";
import { VideoStatus } from "./WorkspaceParts.jsx";

export default function InstructorCourseCard({ course }) {
  const image = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const [failedImage, setFailedImage] = useState(null);
  const to = `/instructor/courses/${course._id}`;
  return <article className="studio-course-card">
    <Link to={to} className="studio-course-cover" aria-label={`Manage ${course.title}`}>
      {image && image !== failedImage ? <img src={image} alt="" loading="lazy" decoding="async" onError={() => setFailedImage(image)} /> : <div className="studio-course-placeholder"><BookOpen size={42} strokeWidth={1.25} aria-hidden="true" /><span>QURANSCHOLAR</span><small>Course cover</small></div>}
      <span className="studio-course-status" data-published={course.published === true}>{courseStatusLabel(course.status)}</span>
    </Link>
    <div className="studio-course-body"><p className="studio-label">{course.category?.name || "Recorded course"}{course.level ? ` · ${course.level}` : ""}</p><h2><Link to={to}>{course.title}</Link></h2><p className="studio-course-description">{course.shortDescription || "Build your curriculum and prepare your lessons for learners."}</p><div className="studio-course-meta"><span><Layers size={15} aria-hidden="true" />{course.stats?.totalSections ?? 0} sections</span><span><PlayCircle size={15} aria-hidden="true" />{course.stats?.totalLessons ?? 0} lessons</span></div><div className="studio-course-footer"><span className="studio-course-trailer">Trailer <VideoStatus video={course.trailerVideo} /></span><Link to={to} className="cw-button">Manage <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div>
  </article>;
}
