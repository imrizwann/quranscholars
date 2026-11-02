export function videoProgressState({ status = "NOT_UPLOADED", phase = "", progress = 0, hasFile = false, unconfirmed = false, accepted = false }) {
  const percent = Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
  if (phase === "Starting upload") return { stage: 0, active: true, title: "Starting your upload", description: "Getting a secure upload ready.", indeterminate: true };
  if (phase === "Uploading") return { stage: 0, active: true, title: percent === 100 ? "Finishing your upload" : "Uploading your video", description: "Keep this page open until the file finishes uploading.", percent };
  if (phase) return { stage: 1, active: true, title: "Starting video preparation", description: "Your upload is complete. Confirming that preparation can begin.", indeterminate: true };
  if (hasFile && !["QUEUED", "PROCESSING", "PROCESSED", "DELETING"].includes(status)) return { stage: 0, title: "Ready to upload", description: "Review your selection, then upload your video." };
  if (status === "COMPLETED") return { stage: 2, complete: true, title: "Ready to preview", description: "Your video has been prepared for playback." };
  if (status === "FAILED") return { stage: 1, failed: true, title: "Preparation needs attention" };
  if (["PROCESSING", "PROCESSED"].includes(status)) return { stage: 1, active: true, title: status === "PROCESSED" ? "Finishing preparation" : "Preparing your video", description: "Creating playback versions. You can keep working while we finish.", indeterminate: true };
  if (status === "QUEUED" || accepted) return { stage: 1, active: true, title: "Waiting to prepare", description: "Your file is uploaded. Preparation will start automatically.", indeterminate: true };
  if (unconfirmed) return { stage: 1, title: "Your file has uploaded", description: "Select Prepare video to continue without uploading again." };
  if (status === "UPLOADED") return { stage: 1, title: "Ready to prepare", description: "Select Prepare video to create the playback versions." };
  if (status === "UPLOADING") return { stage: 0, title: "Upload not confirmed", description: "If the file finished uploading, select Prepare video. Otherwise, choose the file again." };
  if (status === "DELETING") return { stage: 0, active: true, removing: true, title: "Removing video", description: "Your video is being removed in the background.", indeterminate: true };
  return null;
}

export function videoFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
