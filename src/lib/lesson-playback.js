export function lessonPlaybackSource(data) {
  try {
    const url = new URL(data?.playbackUrl);
    if (url.protocol !== "https:" || url.username || url.password || !url.searchParams.get("token") || Date.parse(data.expiresAt) <= Date.now() || !Number.isFinite(Date.parse(data.expiresAt))) return null;
    return { src: url.toString(), type: "application/x-mpegurl" };
  } catch { return null; }
}

// Refresh only URLs inside this lesson's exact rendition directory.
export function renewLessonRequest(requestUrl, playbackUrl) {
  const request = new URL(requestUrl);
  const grant = new URL(playbackUrl);
  const directory = grant.pathname.slice(0, grant.pathname.lastIndexOf("/") + 1);
  if (request.origin !== grant.origin || !request.pathname.startsWith(directory)) throw new Error("Unexpected lesson media URL");
  request.searchParams.set("token", grant.searchParams.get("token"));
  return request.toString();
}
