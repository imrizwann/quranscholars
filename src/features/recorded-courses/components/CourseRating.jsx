import { Star } from "lucide-react";
import "./course-rating.css";

const numberFormatter = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const score = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(5, Number(value))) : 0;

export function RatingStars({ rating = 0, decorative = false }) {
  const value = score(rating);
  return <span className="course-review-stars" role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `${value.toFixed(1)} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, index) => <span className="course-rating-star" key={index}><Star aria-hidden="true" /><span className="course-rating-star-fill" style={{ width: `${Math.max(0, Math.min(1, value - index)) * 100}%` }}><Star aria-hidden="true" /></span></span>)}
  </span>;
}

export default function CourseRating({ rating = 0, reviews = 0, showReviews = true, light = false }) {
  const count = Number.isSafeInteger(Number(reviews)) && Number(reviews) > 0 ? Number(reviews) : 0;
  const value = count ? score(rating) : 0;
  const rated = count > 0 && value > 0;
  return <span className={`course-rating${light ? " course-rating--light" : ""}`} role="img" aria-label={rated ? `${value.toFixed(1)} out of 5 stars from ${count} ${count === 1 ? "review" : "reviews"}` : "No reviews yet"}>
    <span aria-hidden="true" className="course-rating-content"><RatingStars rating={rated ? value : 0} decorative />{rated ? <><strong>{value.toFixed(1)}</strong>{showReviews && <span>({numberFormatter.format(count)} {count === 1 ? "review" : "reviews"})</span>}</> : <span>No reviews yet</span>}</span>
  </span>;
}
