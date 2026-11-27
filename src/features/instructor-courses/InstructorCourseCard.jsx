import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Clock3, ExternalLink, Layers, PlayCircle, Star, Tag, Users } from "lucide-react";
import { resolveCourseImage, formatDuration } from "@/features/recorded-courses/model/recordedCourseAdapter.js";
import { courseStatusLabel } from "@/lib/user-messages.js";
import { VideoStatus } from "./WorkspaceParts.jsx";

const count = new Intl.NumberFormat("en-IN");
const updatedFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

// Course prices are stored in major units ({ original, sale, currency }).
function priceLabel(price) {
  if (!price) return "Not set";
  const current = price.sale ?? price.original;
  const amount = Number(current);
  if (!Number.isFinite(amount)) return "Not set";
  if (amount === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: price.currency || "INR", maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${price.currency || ""} ${amount}`.trim();
  }
}

function updatedLabel(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `Updated ${updatedFormat.format(date)}` : null;
}

// enrollments: confirmed enrollments from useCourseEnrollments; undefined while unknown.
export default function InstructorCourseCard({ course, enrollments }) {
  const image = resolveCourseImage(course.thumbnailUrl || course.thumbnail);
  const [failedImage, setFailedImage] = useState(null);
  const to = `/instructor/courses/${course._id}`;
  const status = courseStatusLabel(course.status);
  const live = course.published === true && course.status === "Published";
  const rating = Number(course.averageRating) || 0;
  const reviews = Number(course.totalReviews) || 0;
  const updated = updatedLabel(course.updatedAt);
  return (
    <article className="studio-course-card">
      <Link
        to={to}
        className="studio-course-cover"
        aria-label={`Manage ${course.title}`}
      >
        {image && image !== failedImage ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedImage(image)}
          />
        ) : (
          <div className="studio-course-placeholder">
            <BookOpen size={42} strokeWidth={1.25} aria-hidden="true" />
            <span>DARSLEARN</span>
            <small>Course cover</small>
          </div>
        )}
        <span
          className="studio-course-status studio-course-publication"
          data-published={live}
          data-status={status}
        >
          {status}
        </span>
      </Link>
      <div className="studio-course-body">
        <div className="studio-course-content">
          <p className="studio-label">
            {course.category?.name || "Recorded course"}
            {course.level ? ` · ${course.level}` : ""}
          </p>
          <h2>
            <Link to={to}>{course.title}</Link>
          </h2>
          {course.shortDescription && <p className="studio-course-description">{course.shortDescription}</p>}
          <div className="studio-course-meta">
            <span>
              <Layers size={15} aria-hidden="true" />
              {course.stats?.totalSections ?? 0} sections
            </span>
            <span>
              <PlayCircle size={15} aria-hidden="true" />
              {course.stats?.totalLessons ?? 0} lessons
            </span>
            <span>
              <Clock3 size={15} aria-hidden="true" />
              {course.totalDuration > 0 ? formatDuration(course.totalDuration) : "Duration not listed"}
            </span>
          </div>
          <dl className="studio-course-stats">
            <div>
              <dt><Users size={14} aria-hidden="true" />Enrollments</dt>
              <dd title={enrollments === undefined ? "See Analytics for enrollment numbers" : undefined}>{enrollments === undefined ? "-" : count.format(enrollments)}</dd>
            </div>
            <div>
              <dt><Star size={14} aria-hidden="true" />Rating</dt>
              <dd>{reviews > 0 ? <>{rating.toFixed(1)}<small> ({count.format(reviews)})</small></> : <small>No reviews</small>}</dd>
            </div>
            <div>
              <dt><Tag size={14} aria-hidden="true" />Price</dt>
              <dd>{priceLabel(course.price)}</dd>
            </div>
          </dl>
          {updated && <p className="studio-course-updated">{updated}</p>}
        </div>
        <div className="studio-course-footer">
          {course.status === "Published" && course.enrollmentOpen === false && <span className="cw-status">Enrollment paused</span>}
          <span className="studio-course-trailer">
            Trailer <VideoStatus video={course.trailerVideo} />
          </span>
          <div className="studio-course-actions">
            {live && course.slug && (
              <Link to={`/courses/${encodeURIComponent(course.slug)}`} className="studio-course-live" aria-label={`View ${course.title} as learners see it`} title="View course page">
                <ExternalLink size={16} aria-hidden="true" />
              </Link>
            )}
            <Link to={to} className="cw-button">
              Manage <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
