import { useId, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, MessageSquare, Save, Shield, Star, Trash2 } from "lucide-react";
import learnerApi from "@/services/api/user/learnerApi.js";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import ProfileAvatar from "@/features/profile/components/ProfileAvatar.jsx";
import { QueryMessage } from "@/features/instructor-courses/WorkspaceParts.jsx";
import { userMessage } from "@/lib/user-messages.js";
import "./course-reviews.css";

const date = value => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "";
const ratings = ["Poor", "Fair", "Good", "Very good", "Excellent"];
function Stars({ rating }) {
  return <span className="course-review-stars" role="img" aria-label={`${rating} out of 5 stars`}>{ratings.map((label, index) => <Star key={label} size={16} fill={index < Math.round(rating) ? "currentColor" : "none"} aria-hidden="true" />)}</span>;
}

export function CourseReviewEditor({ courseId }) {
  const query = learnerApi.endpoints.getMyCourseReview.useQuery(courseId, { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true });
  if (!query.currentData) return <div className="course-review-editor"><QueryMessage query={{ error: query.error, loading: query.isFetching, refresh: query.refetch }} label="Loading your review" /></div>;
  return <ReviewForm courseId={courseId} query={query} />;
}
function ReviewForm({ courseId, query }) {
  const initial = query.currentData;
  const [rating, setRating] = useState(initial.review?.rating || 0);
  const [comment, setComment] = useState(initial.review?.comment || "");
  const [revision, setRevision] = useState(initial.revision);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [save, saving] = learnerApi.endpoints.saveCourseReview.useMutation();
  const [remove, deleting] = learnerApi.endpoints.deleteCourseReview.useMutation();
  const pending = useRef(false), id = useId();
  const busy = saving.isLoading || deleting.isLoading;
  const changedElsewhere = conflict || revision !== initial.revision;
  const dirty = rating !== (initial.review?.rating || 0) || comment.trim() !== (initial.review?.comment || "");
  const load = data => { setRating(data.review?.rating || 0); setComment(data.review?.comment || ""); setRevision(data.revision); setError(""); setConflict(false); };
  async function submit(event) {
    event.preventDefault();
    if (pending.current || busy || changedElsewhere) return;
    if (!rating) { setError("Choose a star rating before saving your review."); return; }
    if (comment.trim().length === 1) { setError("Write at least two characters, or leave your comment empty."); return; }
    pending.current = true; setError("");
    try { load(await save({ courseId, rating, comment: comment.trim(), revision }).unwrap()); }
    catch (failure) { setError(userMessage(failure)); if (failure.status === 409) setConflict(true); }
    finally { pending.current = false; }
  }
  return <div className="course-review-editor">
    <header><h3>Your course review</h3><p>Share what worked well and what could be better. You can update your review as you learn.</p></header>
    {initial.review?.hidden && <p className="course-review-notice">Your review is currently hidden from the course page. Contact our team if you need help.</p>}
    <form onSubmit={submit} aria-busy={busy || undefined}>
      <fieldset className="course-review-rating" disabled={busy || changedElsewhere}><legend>Your rating</legend><div>{ratings.map((label, index) => <label key={label} className={index < rating ? "is-selected" : ""}>
        <input type="radio" name={`${id}-rating`} value={index + 1} checked={rating === index + 1} onChange={() => setRating(index + 1)} aria-label={`${index + 1} ${index === 0 ? "star" : "stars"}: ${label}`} />
        <Star size={25} fill={index < rating ? "currentColor" : "none"} aria-hidden="true" />
      </label>)}<span>{rating ? ratings[rating - 1] : "Choose a rating"}</span></div></fieldset>
      <label htmlFor={`${id}-comment`} className="course-review-label">Your experience <span>(optional)</span></label>
      <textarea id={`${id}-comment`} name="comment" value={comment} onChange={event => setComment(event.target.value)} maxLength={3000} rows={4} disabled={busy || changedElsewhere} placeholder="How have the lessons helped you? What would you tell another learner?" aria-describedby={`${id}-privacy ${id}-length`} />
      <div className="course-review-help"><p id={`${id}-privacy`}>Your rating, comment, first name and last initial appear on the course page. Keep personal and contact details out of your review.</p><span id={`${id}-length`}>{comment.length}/3,000</span></div>
      {(error || changedElsewhere || query.error) && <div className="course-review-error" role="alert"><p>{changedElsewhere ? "Your review changed on another device. Your draft is kept here; load the latest review before saving." : error || userMessage(query.error)}</p>{changedElsewhere && <button type="button" className="cw-button" onClick={() => setDialog("reload")} disabled={busy}>Load latest review</button>}</div>}
      <div className="course-review-actions"><AsyncButton type="submit" className="cw-button cw-primary" loading={saving.isLoading} loadingLabel="Saving review" disabled={busy || changedElsewhere || !dirty}><Save size={16} aria-hidden="true" />{initial.review ? "Save changes" : "Publish review"}</AsyncButton>
        {initial.review && <button type="button" className="cw-button" onClick={() => { setError(""); setDialog("delete"); }} disabled={busy || changedElsewhere}><Trash2 size={16} aria-hidden="true" />Delete review</button>}
        {initial.review && <span className="course-review-saved">Saved {date(initial.review.updatedAt)}</span>}
      </div>
    </form>
    <ConfirmationModal open={Boolean(dialog)} title={dialog === "reload" ? "Load your latest review?" : "Delete your course review?"} description={dialog === "reload" ? "Replace your unsaved changes in this tab with the latest review from your account?" : "Remove your rating and comment from the course page? You can write another review later."} confirmLabel={dialog === "reload" ? "Load latest review" : "Delete review"} danger={dialog === "delete"} busy={busy || query.isFetching} onCancel={() => setDialog(null)} onConfirm={async () => {
      if (pending.current) return;
      pending.current = true;
      try {
        if (dialog === "reload") load(await query.refetch().unwrap());
        else load(await remove({ courseId, revision, confirm: true }).unwrap());
        setDialog(null);
      } catch (failure) { setError(userMessage(failure)); if (failure.status === 409) setConflict(true); }
      finally { pending.current = false; }
    }}>{error && <p className="qs-confirm-error" role="alert">{error}</p>}</ConfirmationModal>
  </div>;
}

export default function CourseReviews({ course }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const id = useId();
  const admin = useSelector(state => state.user.user?.role === "admin");
  const query = learnerApi.endpoints.getCourseReviews.useQuery({ slug: course.slug, page }, { refetchOnMountOrArgChange: true });
  const [moderate, moderating] = learnerApi.endpoints.moderateCourseReview.useMutation();
  const data = query.currentData;
  return <div className="course-reviews" aria-busy={query.isFetching || undefined}>
    <div className="course-review-summary"><div><h2 id="reviews-heading">Learner reviews</h2><p>Experiences shared by learners enrolled in this course.</p></div>{data?.summary.count > 0 && <div className="course-review-score"><strong>{data.summary.average.toFixed(1)}<span>/5</span></strong><Stars rating={data.summary.average} /><span>{data.summary.count} {data.summary.count === 1 ? "review" : "reviews"}</span></div>}</div>
    <QueryMessage query={{ error: query.error, data, loading: query.isFetching && !data, refresh: query.refetch }} label="Loading learner reviews" />
    {data && !query.error && <>{data.reviews.length ? <ul className="course-review-list">{data.reviews.map(review => <li key={review.id}><article>
      <header><ProfileAvatar name={review.name} size={36} /><div><h3>{review.name}</h3><time dateTime={review.createdAt}>{date(review.createdAt)}</time></div><Stars rating={review.rating} /></header>
      {review.comment && <p>{review.comment}</p>}
      {admin && <button type="button" className="cw-button" onClick={() => { setSelected(review); setReason(""); setError(""); }}><Shield size={15} aria-hidden="true" />Hide review</button>}
    </article></li>)}</ul> : <div className="course-review-empty"><MessageSquare size={23} aria-hidden="true" /><div><h3>{data.summary.count ? "No reviews on this page" : "No reviews yet"}</h3><p>Enrolled learners can share their experience from the Reviews tab inside their course.</p></div></div>}
    {(page > 1 || data.pagination.totalPages > 1) && <nav className="course-review-pagination" aria-label="Review pages"><button type="button" className="cw-button" disabled={page <= 1 || query.isFetching} onClick={() => setPage(page - 1)}><ArrowLeft size={16} aria-hidden="true" />Previous</button><span>Page {page} of {Math.max(page, data.pagination.totalPages)}</span><button type="button" className="cw-button" disabled={page >= data.pagination.totalPages || query.isFetching} onClick={() => setPage(page + 1)}>Next<ArrowRight size={16} aria-hidden="true" /></button></nav>}</>}
    <ConfirmationModal open={Boolean(selected)} title="Hide this review?" description="Hide this review from the course page and exclude its rating. The learner retains their copy. Use this for inappropriate content, not negative feedback." confirmLabel="Hide review" danger busy={moderating.isLoading} confirmDisabled={reason.trim().length < 5} onCancel={() => setSelected(null)} onConfirm={async () => {
      try { await moderate({ reviewId: selected.id, revision: selected.revision, hidden: true, reason: reason.trim() }).unwrap(); setSelected(null); }
      catch (failure) { setError(userMessage(failure)); }
    }}><label className="course-review-label" htmlFor={`${id}-reason`}>Reason for hiding</label><textarea id={`${id}-reason`} className="course-review-reason" name="moderationReason" value={reason} onChange={event => setReason(event.target.value)} rows={3} minLength={5} maxLength={500} disabled={moderating.isLoading} />{error && <p className="qs-confirm-error" role="alert">{error}</p>}</ConfirmationModal>
  </div>;
}
