// Playback URLs come from the API. Never construct them from private storage keys.
export function trailerPlaybackSource(course, playbackUrl = undefined) {
  const status = course?.trailerVideo?.status;
  if (status && status !== "COMPLETED") return null;

  const value = playbackUrl !== undefined
    ? playbackUrl
    : course?.trailerPlaybackUrl !== undefined
      ? course.trailerPlaybackUrl
      : course?.trailerVideo?.playbackUrl ?? course?.trailerVideo;
  if (typeof value !== "string" || !/^https?:\/\//i.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    if (!url.hostname || url.username || url.password) return null;
    return { src: value.trim(), type: "application/x-mpegurl" };
  } catch {
    return null;
  }
}
