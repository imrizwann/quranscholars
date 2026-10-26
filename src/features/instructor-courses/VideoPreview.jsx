import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Video } from "lucide-react";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { localVideoSource } from "./courseApi.js";

const VideoPlayer = lazy(
  () => import("@/components/video-player/VideoPlayer.jsx"),
);

// playbackSource accepts { src, type } from the playback API.
// Keep storage keys and URL generation outside this presentation component.
export default function VideoPreview({
  file,
  hasUploadedVideo,
  status,
  playbackSource = null,
  title = "Video preview",
}) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // Never show a previous selection while its replacement is being initialized.
  const url = preview?.file === file ? preview?.url : null;
  // Blob URLs have no extension; supply the file's actual media type.
  const source = useMemo(
    () => (file ? (url ? localVideoSource(file, url) : null) : playbackSource),
    [file, url, playbackSource],
  );

  return (
    <section className="cw-video-preview" aria-label="Video preview">
      <div className="cw-row cw-between cw-preview-heading">
        <h3>Video preview</h3>
        {(file || playbackSource) && (
          <span className="cw-preview-badge">
            {file ? "Preview from your device" : "Uploaded video"}
          </span>
        )}
      </div>
      <div className="cw-preview-stage">
        {file || playbackSource ? (
          <Suspense
            fallback={
              <div className="cw-preview-placeholder">
                <LoadingState label="Opening preview" />
              </div>
            }
          >
            {source ? (
              <VideoPlayer
                key={source.src}
                src={source}
                title={file?.name || title}
                className="cw-preview-player"
                errorMessage={
                  file
                    ? "Your browser cannot preview this file. You can still upload it for preparation."
                    : "Check your connection and try again. If the problem continues, refresh the page."
                }
              />
            ) : (
              <div className="cw-preview-placeholder">
                <LoadingState label="Opening preview" />
              </div>
            )}
          </Suspense>
        ) : (
          <div className="cw-preview-placeholder" role="status">
            <Video size={32} strokeWidth={1.5} aria-hidden="true" />
            <strong>{status === "FAILED" ? "Video preparation failed" : status === "DELETING" ? "Video is being removed" : ["UPLOADING", "UPLOADED", "QUEUED", "PROCESSING", "PROCESSED"].includes(status) ? "Video is not ready yet" : "No video preview available"}</strong>
            <p>
              {status === "FAILED"
                ? "Try preparing the video again or upload a replacement."
                : status === "DELETING"
                  ? "The preview will be available after you upload a new video."
                  : ["UPLOADING", "UPLOADED", "QUEUED", "PROCESSING", "PROCESSED"].includes(status)
                    ? "Follow the upload and preparation status here. The preview will appear when your video is ready."
                    : hasUploadedVideo
                      ? "Playback is temporarily unavailable. Refresh to check again."
                      : "Choose a video to preview it here before uploading."}
            </p>
          </div>
        )}
      </div>
      <p className="cw-field-hint cw-preview-caption">
        {file
          ? "Previewing the file on your device. Selecting a file does not upload or replace your video."
          : playbackSource
            ? "Previewing your uploaded video."
            : "Review your video before uploading. Some formats may not play in your browser."}
      </p>
    </section>
  );
}
