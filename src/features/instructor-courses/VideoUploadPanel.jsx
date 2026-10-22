import { useEffect, useRef, useState } from "react";
import {
  unwrapAbortable,
  readableError,
  uploadVideoFile,
  videoMetadata,
  processingWasAccepted,
} from "./courseApi.js";
import { VideoStatus } from "./WorkspaceParts.jsx";
import VideoPreview from "./VideoPreview.jsx";
import AsyncButton from "@/components/ui/AsyncButton.jsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.jsx";
import LoadingState from "@/components/feedback/LoadingState.jsx";
import { Upload, RefreshCw, Trash2 } from "lucide-react";
import {
  usePrepareVideoUploadMutation,
  useProcessVideoMutation,
} from "@/services/api/instructor/recordedCoursesApi.js";

export default function VideoUploadPanel({
  path,
  target,
  video,
  playbackSource = null,
  disabled,
  deleting = false,
  onBusy,
  onChanged,
  onDelete,
}) {
  const [prepareUpload, { reset: resetUpload }] =
    usePrepareVideoUploadMutation();
  const [processVideo] = useProcessVideoMutation();
  const [file, setFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [phase, setPhase] = useState("");
  const [action, setAction] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [unconfirmedUploadId, setUnconfirmedUploadId] = useState(null);
  const controller = useRef(null);
  const mounted = useRef(true);
  const input = useRef(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  const status = video?.status || "NOT_UPLOADED";
  const savedPlaybackSource = status === "COMPLETED" ? playbackSource : null;
  const previewFile =
    file ||
    (!savedPlaybackSource &&
    uploadedPreview?.uploadId === video?.uploadId &&
    !["NOT_UPLOADED", "DELETING"].includes(status)
      ? uploadedPreview?.file
      : null);
  const processingConfirmed = processingWasAccepted(video, unconfirmedUploadId);
  const busy = Boolean(phase);
  const locked = disabled || busy;
  const serverBusy = ["QUEUED", "PROCESSING", "PROCESSED", "DELETING"].includes(
    status,
  );

  async function upload() {
    if (controller.current || locked || serverBusy) return;
    let metadata;
    try {
      metadata = videoMetadata(file);
    } catch (failure) {
      setError(failure.message);
      return;
    }
    controller.current = new AbortController();
    const signal = controller.current.signal;
    onBusy(true);
    setError("");
    setNotice("");
    setUnconfirmedUploadId(null);
    setProgress(0);
    setAction("upload");
    setPhase("Starting upload");
    let uploaded = false;
    let uploadId;
    try {
      const reservation = await unwrapAbortable(
        prepareUpload({ ...target, metadata }),
        signal,
      );
      uploadId = reservation.uploadId;
      resetUpload();
      if (signal.aborted) return;
      setPhase("Uploading");
      await uploadVideoFile(reservation.uploadUrl, file, metadata.contentType, {
        signal,
        onProgress: setProgress,
      });
      uploaded = true;
      setPhase("Preparing video");
      await unwrapAbortable(
        processVideo({ ...target, uploadId: reservation.uploadId }),
        signal,
      );
      if (mounted.current) {
        setNotice(
          "Upload complete. Your video is being prepared for playback.",
        );
        setUploadedPreview({ file, uploadId: reservation.uploadId });
        setFile(null);
        if (input.current) input.current.value = "";
      }
    } catch (failure) {
      if (mounted.current) {
        if (
          uploaded &&
          ["FETCH_ERROR", "TIMEOUT_ERROR"].includes(failure.status)
        )
          setUnconfirmedUploadId(uploadId);
        onChanged();
        setError(
          uploaded
            ? `The file reached storage, but processing could not be confirmed. Checking status automatically; retry only if it stays waiting for upload. ${readableError(failure)}`
            : readableError(failure),
        );
      }
    } finally {
      controller.current = null;
      resetUpload();
      if (mounted.current) {
        setPhase("");
        setAction("");
        onBusy(false);
      }
    }
  }

  async function process() {
    if (
      controller.current ||
      locked ||
      !video?.uploadId ||
      !["UPLOADING", "UPLOADED", "FAILED"].includes(status)
    )
      return;
    controller.current = new AbortController();
    onBusy(true);
    setAction("process");
    setPhase("Preparing video");
    setError("");
    setNotice("");
    setUnconfirmedUploadId(null);
    try {
      await unwrapAbortable(
        processVideo({ ...target, uploadId: video.uploadId }),
        controller.current.signal,
      );
      if (mounted.current)
        setNotice("Your video is being prepared for playback.");
    } catch (failure) {
      if (mounted.current) {
        if (["FETCH_ERROR", "TIMEOUT_ERROR"].includes(failure.status))
          setUnconfirmedUploadId(video.uploadId);
        setError(readableError(failure));
        onChanged();
      }
    } finally {
      controller.current = null;
      if (mounted.current) {
        setPhase("");
        setAction("");
        onBusy(false);
      }
    }
  }

  return (
    <div className="cw-video">
      <div className="cw-row cw-between">
        <VideoStatus video={video} />
        {video?.originalFileName && (
          <span className="cw-muted cw-file">
            {video.originalFileName}
            {video.fileSize
              ? ` · ${(video.fileSize / 1024 / 1024).toFixed(1)} MB`
              : ""}
          </span>
        )}
      </div>
      {video?.lastError?.message && (
        <p className="cw-error" style={{ marginTop: 12 }}>
          We could not prepare this video: {video.lastError.message}
        </p>
      )}
      {status === "COMPLETED" && (
        <p className="cw-muted">
          Your video is ready
          {video?.hls?.qualities?.length
            ? ` · ${video.hls.qualities.map((item) => item.quality).join(", ")}`
            : ""}
          .
        </p>
      )}
      {status === "UPLOADING" && !busy && (
        <p className="cw-muted">
          If your file has finished uploading, select Prepare video. Otherwise,
          choose the file and upload it again.
        </p>
      )}
      <div className="cw-video-layout">
        <div className="cw-stack cw-video-upload">
          {!serverBusy && (
            <label className="cw-video-file">
              Choose a video
              <input
                ref={input}
                type="file"
                accept=".mp4,.mov,.webm,.mkv"
                disabled={locked}
                onChange={(event) => {
                  setError("");
                  setNotice("");
                  setUnconfirmedUploadId(null);
                  const selectedFile = event.target.files?.[0];
                  if (!selectedFile) return;
                  try {
                    videoMetadata(selectedFile);
                    setFile(selectedFile);
                    setUploadedPreview(null);
                  } catch (failure) {
                    setError(failure.message);
                    event.target.value = "";
                    setFile(null);
                  }
                }}
              />
              <span className="cw-field-hint">
                MP4, MOV, WebM or MKV. Your video is prepared for playback
                automatically after upload.
              </span>
            </label>
          )}
          {busy && (
            <div>
              <LoadingState
                variant="inline"
                label={`${phase}${phase === "Uploading" ? ` · ${progress}%` : ""}`}
              />
              {phase === "Uploading" && (
                <progress
                  value={progress}
                  max="100"
                  aria-label="File upload progress"
                />
              )}
            </div>
          )}
          {error && !processingConfirmed && (
            <p className="cw-error" role="alert">
              {error}
            </p>
          )}
          {(notice || processingConfirmed) && status !== "COMPLETED" && (
            <p className="cw-notice" role="status">
              {processingConfirmed
                ? "Your video is being prepared for playback."
                : notice}
            </p>
          )}
          <div className="cw-row">
            {(!serverBusy || action === "upload") && (
              <AsyncButton
                className="cw-button cw-primary"
                loading={action === "upload"}
                loadingLabel={phase}
                disabled={locked || !file}
                onClick={() => {
                  try {
                    videoMetadata(file);
                    setConfirmation("upload");
                  } catch (failure) {
                    setError(failure.message);
                  }
                }}
              >
                <Upload size={16} aria-hidden="true" />
                {video?.uploadId ? "Replace video" : "Upload video"}
              </AsyncButton>
            )}
            {video?.uploadId &&
              (["UPLOADING", "UPLOADED", "FAILED"].includes(status) ||
                action === "process") && (
                <AsyncButton
                  className="cw-button"
                  loading={action === "process"}
                  loadingLabel="Preparing video"
                  disabled={locked}
                  onClick={() => setConfirmation("process")}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  {status === "FAILED" ? "Try again" : "Prepare video"}
                </AsyncButton>
              )}
            {phase === "Uploading" && (
              <button
                className="cw-button"
                onClick={() => setConfirmation("cancel")}
              >
                Cancel upload
              </button>
            )}
            {status !== "NOT_UPLOADED" && (
              <AsyncButton
                className="cw-button cw-danger cw-button-compact"
                aria-label={
                  target.lessonId ? "Remove lesson video" : "Remove trailer"
                }
                title={
                  target.lessonId ? "Remove lesson video" : "Remove trailer"
                }
                loading={deleting}
                loadingLabel="Removing"
                disabled={locked}
                onClick={() => onDelete(path, "video", target)}
              >
                <Trash2 size={15} aria-hidden="true" />
                Remove
              </AsyncButton>
            )}
          </div>
        </div>
        <VideoPreview
          file={previewFile}
          hasUploadedVideo={status !== "NOT_UPLOADED"}
          playbackSource={savedPlaybackSource}
          title={video?.originalFileName || "Video preview"}
        />
      </div>
      <ConfirmationModal
        open={confirmation !== null}
        title={
          confirmation === "cancel"
            ? "Cancel this upload?"
            : confirmation === "process"
              ? "Prepare this video?"
              : video?.uploadId
                ? "Replace this video?"
                : "Upload this video?"
        }
        description={
          confirmation === "cancel"
            ? "The file transfer will stop. You can select the file again to restart the upload."
            : confirmation === "process"
              ? "We will prepare your uploaded video for playback. You can follow its progress here."
              : video?.uploadId
                ? "The current video will be replaced. Keep this page open until the new file finishes uploading. We will then prepare it for playback."
                : "Keep this page open until the file finishes uploading. We will then prepare it for playback."
        }
        confirmLabel={
          confirmation === "cancel"
            ? "Cancel upload"
            : confirmation === "process"
              ? "Prepare video"
              : video?.uploadId
                ? "Replace video"
                : "Upload video"
        }
        cancelLabel={confirmation === "cancel" ? "Keep uploading" : "Cancel"}
        danger={
          confirmation === "cancel" ||
          (confirmation === "upload" && Boolean(video?.uploadId))
        }
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          setConfirmation(null);
          if (confirmation === "upload") void upload();
          else if (confirmation === "process") void process();
          else if (confirmation === "cancel" && phase === "Uploading")
            controller.current?.abort();
        }}
      >
        {confirmation === "upload" && file && (
          <p className="mt-4 break-words rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
            {file.name}{" "}
            <span className="text-muted-foreground">
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </p>
        )}
      </ConfirmationModal>
    </div>
  );
}
