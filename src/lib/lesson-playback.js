export function lessonPlaybackSource(data, now = Date.now()) {
  try {
    const url = new URL(data?.playbackUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
        !url.pathname.endsWith("/master.m3u8") || /[%\\]/.test(url.pathname) ||
        typeof data.playbackToken !== "string" || data.playbackToken.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data.playbackToken) ||
        !Number.isFinite(Date.parse(data.expiresAt)) || Date.parse(data.expiresAt) <= now) return null;
    return { src: url.toString(), type: "application/x-mpegurl" };
  } catch { return null; }
}

// Never attach a playback credential to another origin or processing generation.
export function renewLessonRequest(requestUrl, playbackUrl) {
  const request = new URL(requestUrl);
  const grant = new URL(playbackUrl);
  const directory = grant.pathname.slice(0, grant.pathname.lastIndexOf("/") + 1);
  if (request.origin !== grant.origin || request.username || request.password || request.search || request.hash ||
      /[%\\]/.test(request.pathname) || !request.pathname.startsWith(directory)) throw new Error("Unexpected lesson media URL");
  return request.toString();
}

// A single refresh serves simultaneous playlist/segment requests. Checking at
// request time also handles background tabs and resuming after a long pause.
export function createPlaybackSession({ getGrant, refresh, now = Date.now }) {
  let pending, disposed = false, retryAfter = 0;
  return {
    dispose() { disposed = true; },
    async authorize(requestUrl) {
      if (disposed) throw new Error("Playback closed");
      let grant = getGrant();
      renewLessonRequest(requestUrl, grant?.playbackUrl);
      if (!lessonPlaybackSource(grant, now()) || (Date.parse(grant.expiresAt) - now() < 30_000 && now() >= retryAfter)) {
        if (!pending) pending = Promise.resolve().then(refresh).finally(() => { pending = null; });
        try { grant = await pending; retryAfter = 0; }
        catch (error) {
          if ([401, 403, 404].includes(error?.status) || !lessonPlaybackSource(grant, now() + 5000)) throw error;
          retryAfter = now() + 5000;
        }
      }
      if (disposed || !lessonPlaybackSource(grant, now())) throw new Error("Playback authorization expired");
      return { url: renewLessonRequest(requestUrl, grant.playbackUrl), authorization: `Bearer ${grant.playbackToken}` };
    },
  };
}
