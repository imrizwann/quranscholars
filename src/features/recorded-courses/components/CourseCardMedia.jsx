import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { resolveCourseImage } from "../model/recordedCourseAdapter.js";
import "./course-card-media.css";

export default function CourseCardMedia({ course, to, linkState }) {
  const [failedImage, setFailedImage] = useState(null);
  const thumbnail = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  return <div className="catalogue-course-media">
    <Link to={to} state={linkState} className="catalogue-cover" aria-label={`View course: ${course.title}`}>
      {thumbnail && thumbnail !== failedImage ? <img src={thumbnail} alt="" width={640} height={360} loading="lazy" decoding="async" onError={() => setFailedImage(thumbnail)} /> : <span className="catalogue-cover-placeholder"><BookOpen size={38} strokeWidth={1.25} aria-hidden="true" /><strong>Explore this course</strong><span>View lessons and course details</span></span>}
      {(course.bestseller || course.featured) && <span className="catalogue-media-featured">{course.bestseller ? "Bestseller" : "Featured"}</span>}
    </Link>
  </div>;
}
