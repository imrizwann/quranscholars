import { readableError } from "./courseApi.js";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import Spinner from "@/components/feedback/Spinner.jsx";
import { useEffect, useState } from "react";

export function QueryMessage({ query, label = "Loading course content", compact = false }) {
  if (query.error) return <div className="cw-error" role="alert">{readableError(query.error)} <AsyncButton className="cw-button" onClick={query.refresh}>Try again</AsyncButton></div>;
  if (query.loading) return <LoadingState label={query.data ? "Updating content" : label} variant={query.data || compact ? "inline" : "content"} className="cw-loading" />;
  return null;
}

export function Pagination({ pagination, page, onPage, disabled, loading = false }) {
  const [direction, setDirection] = useState(null);
  useEffect(() => { if (!loading) setDirection(null); }, [loading]);
  if (!pagination || (!pagination.hasNextPage && page === 1)) return null;
  return <nav className="cw-pages" aria-label="Pagination"><AsyncButton className="cw-button" loading={loading && direction === "previous"} disabled={disabled || loading || page <= 1} onClick={() => { setDirection("previous"); onPage(page - 1); }}>Previous</AsyncButton><span>Page {page}</span><AsyncButton className="cw-button" loading={loading && direction === "next"} disabled={disabled || loading || !pagination.hasNextPage} onClick={() => { setDirection("next"); onPage(page + 1); }}>Next</AsyncButton></nav>;
}

const labels = { NOT_UPLOADED: "No video", UPLOADING: "Waiting for upload", UPLOADED: "Ready to prepare", QUEUED: "Waiting to prepare", PROCESSING: "Preparing video", PROCESSED: "Finalizing", COMPLETED: "Ready", FAILED: "Needs attention", DELETING: "Deleting" };
export function VideoStatus({ video, activity }) {
  const status = video?.status || "NOT_UPLOADED";
  const working = Boolean(activity) || ["QUEUED", "PROCESSING", "PROCESSED", "DELETING"].includes(status);
  const label = activity ? activity.phase === "Uploading" ? `Uploading ${Math.max(0, Math.min(100, Math.round(activity.progress)))}%` : activity.phase === "Starting upload" ? "Starting upload" : "Confirming preparation" : status === "QUEUED" && video?.waitingForQueue ? "Waiting to prepare" : labels[status] || "Updating video";
  return <span className="cw-status cw-video-status" data-status={activity ? "UPLOADING" : status}>{working && <Spinner size={12} decorative />}<span className="cw-video-status-label">{label}</span></span>;
}
