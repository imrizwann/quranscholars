// Connect the local upload cancellation signal to an RTK Query mutation.
// Files, AbortSignals and progress callbacks never enter Redux state.
export async function unwrapAbortable(request, signal) {
  const abort = () => request.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  try {
    return await request.unwrap();
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

const types = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
};

export function videoMetadata(file) {
  if (!file || !Number.isSafeInteger(file.size) || file.size <= 0)
    throw new Error("Choose a non-empty video file.");
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const contentType = types[extension];
  if (
    !contentType ||
    (file.type &&
      file.type !== contentType &&
      file.type !== "application/octet-stream")
  )
    throw new Error(
      "Choose an MP4, MOV, WebM, or MKV file with a matching video type.",
    );
  if (
    file.name.length > 255 ||
    /[/\\]/.test(file.name) ||
    [...file.name].some((character) => character.charCodeAt(0) < 32)
  )
    throw new Error(
      "Rename the file using a simple name of at most 255 characters.",
    );
  return { fileName: file.name, contentType, size: file.size };
}

export function localVideoSource(file, url) {
  // Use a real MIME type: Vidstack passes it to the browser's <source> element.
  return { src: url, type: videoMetadata(file).contentType };
}

export function uploadVideoFile(
  url,
  file,
  contentType,
  { signal, onProgress = () => {} } = {},
) {
  const target = new URL(url);
  if (target.protocol !== "https:" || target.username || target.password)
    throw new Error("The server returned an invalid storage URL.");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const finish = (error) => {
      signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    xhr.open("PUT", url);
    xhr.withCredentials = false;
    xhr.timeout = 30 * 60_000;
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      finish(
        xhr.status >= 200 && xhr.status < 300
          ? null
          : new Error(
              `Storage upload failed (${xhr.status}). Choose the file and upload again.`,
            ),
      );
    xhr.onerror = () =>
      finish(
        new Error(
          "Upload could not reach storage. Check your connection and the storage CORS settings, then upload again.",
        ),
      );
    xhr.ontimeout = () =>
      finish(new Error("Upload timed out. Choose the file and upload again."));
    xhr.onabort = () =>
      finish(
        Object.assign(
          new Error(
            "Upload cancelled. The server may still show Waiting for upload. Upload again or remove the video.",
          ),
          { name: "AbortError" },
        ),
      );
    if (signal?.aborted) {
      finish(
        Object.assign(new Error("Upload cancelled."), { name: "AbortError" }),
      );
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    xhr.send(file);
  });
}

export const processingWasAccepted = (video, uploadId) =>
  Boolean(
    uploadId &&
    video?.uploadId === uploadId &&
    ["QUEUED", "PROCESSING", "PROCESSED", "COMPLETED"].includes(video.status),
  );

export const videoIsPending = (video) =>
  [
    "UPLOADING",
    "UPLOADED",
    "QUEUED",
    "PROCESSING",
    "PROCESSED",
    "DELETING",
  ].includes(video?.status);
export const courseIsPending = (data) =>
  videoIsPending(data?.course?.trailerVideo);
export const lessonsArePending = (data) =>
  data?.items?.some((lesson) => videoIsPending(lesson.video));
export const deletionIsPending = (data) =>
  data?.storageCleanupPending === true && data.status !== "blocked";
export function readableError(error) {
  if (error?.name === "AbortError" || error?.status === "TIMEOUT_ERROR")
    return "The request was interrupted or timed out. Refresh to check the server before trying again.";
  if (error?.status === "FETCH_ERROR")
    return "Could not reach the server. Check your connection and try again.";
  return (
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Something went wrong. Please try again."
  );
}
